# x402 Mock System

[Back to README](./README.md) | [Previous: Helpers](./helpers.md) | [Next: Configuration](./configuration.md)

---

The `src/x402/` directory implements a complete mock of the [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402) payment protocol as used by Sigloop agents. It consists of three files: type definitions, a mock HTTP server, and a fetch wrapper client.

---

## Table of Contents

- [types.ts -- Type Definitions](#typests---type-definitions)
- [mock-server.ts -- Mock 402 HTTP Server](#mock-serverts---mock-402-http-server)
- [client.ts -- x402 Fetch Wrapper](#clientts---x402-fetch-wrapper)
- [Protocol Flow Diagram](#protocol-flow-diagram)

---

## types.ts -- Type Definitions

**File:** `src/x402/types.ts`

Defines the data structures exchanged during the x402 payment handshake.

### `PaymentRequirement`

Describes what the server requires for payment.

```typescript
export interface PaymentRequirement {
  scheme: string;            // Payment scheme (e.g., "exact")
  network: string;           // Target blockchain network (e.g., "base-sepolia")
  maxAmountRequired: string; // Amount in smallest unit (e.g., "1000000")
  resource: string;          // The URL of the protected resource
  description: string;       // Human-readable description of the charge
  mimeType: string;          // MIME type of the response body
}
```

### `PaymentRequirementsResponse`

The JSON body returned by the server in a 402 response.

```typescript
export interface PaymentRequirementsResponse {
  paymentRequirements: PaymentRequirement;
}
```

### `PaymentHeader`

The structure encoded into the `X-PAYMENT` header by the client on retry.

```typescript
export interface PaymentHeader {
  version: string;    // Protocol version (always "1")
  scheme: string;     // Payment scheme from the requirement
  network: string;    // Network from the requirement
  payload: string;    // The ECDSA signature
  resource: string;   // The protected resource URL
  amount: string;     // The payment amount
  signature: string;  // The ECDSA signature (same as payload)
}
```

---

## mock-server.ts -- Mock 402 HTTP Server

**File:** `src/x402/mock-server.ts`

Implements a minimal Node.js HTTP server that simulates a real x402-enabled API endpoint.

### How It Works

The server has a single request handler that branches on the presence of the `X-PAYMENT` header:

1. **Without `X-PAYMENT` header** -- returns HTTP 402 with payment requirements:
   ```json
   {
     "paymentRequirements": {
       "scheme": "exact",
       "network": "base-sepolia",
       "maxAmountRequired": "1000000",
       "resource": "https://api.example.com/data",
       "description": "API access fee",
       "mimeType": "application/json"
     }
   }
   ```

2. **With `X-PAYMENT` header** -- returns HTTP 200 with success payload:
   ```json
   {
     "data": { "result": "success", "message": "Payment accepted" },
     "paymentVerified": true
   }
   ```

The server does not validate the payment header contents -- any non-empty string is accepted. This is by design for testing the client-side payment flow rather than server-side verification.

### Hardcoded Payment Requirements

```typescript
const PAYMENT_REQUIREMENTS: PaymentRequirementsResponse = {
  paymentRequirements: {
    scheme: "exact",
    network: "base-sepolia",
    maxAmountRequired: "1000000",
    resource: "https://api.example.com/data",
    description: "API access fee",
    mimeType: "application/json",
  },
};
```

### API

#### `createMockX402Server(port: number): Promise<Server>`

Starts the mock server on the specified port, bound to `127.0.0.1`.

```typescript
const server = await createMockX402Server(18402);
// Server is now listening on http://127.0.0.1:18402
```

Returns a `Promise<Server>` that resolves when the server is ready to accept connections.

#### `closeMockX402Server(server: Server): Promise<void>`

Gracefully shuts down the server.

```typescript
await closeMockX402Server(server);
```

### Port Allocation

The test suites use different ports to avoid conflicts when running sequentially:

| Test Suite | Port |
|---|---|
| `x402-payment.test.ts` | `18402` |
| `full-flow.test.ts` | `18403` |

---

## client.ts -- x402 Fetch Wrapper

**File:** `src/x402/client.ts`

Implements the client side of the x402 protocol: make a request, handle a 402 response by signing a payment authorization, and retry with the payment header.

### `X402PaymentResult`

The return type of `x402Fetch`:

```typescript
export interface X402PaymentResult {
  response: Response;      // The final HTTP response (200 on success)
  paymentMade: boolean;    // Whether a 402->retry cycle occurred
  amountPaid: string;      // The maxAmountRequired from the 402 response
}
```

### `x402Fetch(url, walletClient, options?): Promise<X402PaymentResult>`

The main entry point. Performs a standard `fetch`, handles 402 responses automatically.

```typescript
export async function x402Fetch(
  url: string,
  walletClient: WalletClient<Transport, Chain, Account>,
  options: RequestInit = {}
): Promise<X402PaymentResult>
```

**Flow:**

1. Make an initial `fetch(url, options)`.
2. If the response is **not 402**, return immediately with `paymentMade: false`.
3. If the response **is 402**:
   a. Parse the JSON body as `PaymentRequirementsResponse`.
   b. Extract `requirements.resource` and `requirements.maxAmountRequired`.
   c. Sign a payment authorization using the wallet client.
   d. Build a base64-encoded `X-PAYMENT` header containing the signature.
   e. Retry the request with the `X-PAYMENT` header added.
   f. Return with `paymentMade: true` and `amountPaid` set to the required amount.

### `signPaymentAuthorization(walletClient, resource, amount): Promise<string>`

Internal function that creates an ECDSA signature over the payment data.

```typescript
async function signPaymentAuthorization(
  walletClient: WalletClient<Transport, Chain, Account>,
  resource: string,
  amount: string
): Promise<string> {
  const message = encodePacked(["string", "string", "string"], [resource, ":", amount]);
  const hash = keccak256(message);
  const signature = await walletClient.signMessage({ message: { raw: hash } });
  return signature;
}
```

The signed message is `keccak256(abi.encodePacked(resource, ":", amount))`.

### `buildPaymentHeader(signature, resource, amount, network, scheme): string`

Internal function that constructs the base64-encoded header value.

```typescript
function buildPaymentHeader(
  signature: string,
  resource: string,
  amount: string,
  network: string,
  scheme: string
): string {
  const header: PaymentHeader = {
    version: "1",
    scheme,
    network,
    payload: signature,
    resource,
    amount,
    signature,
  };
  return Buffer.from(JSON.stringify(header)).toString("base64");
}
```

### Usage Example

```typescript
import { x402Fetch } from "../x402/client.js";
import { getWalletClient } from "../helpers/anvil.js";
import { agent } from "../helpers/accounts.js";

const agentClient = getWalletClient(agent.privateKey);
const result = await x402Fetch("http://127.0.0.1:18402/api/data", agentClient);

if (result.paymentMade) {
  console.log(`Paid ${result.amountPaid} for access`);
  const body = await result.response.json();
  console.log(body.paymentVerified); // true
}
```

---

## Protocol Flow Diagram

```
Client (x402Fetch)                       Mock Server (mock-server.ts)
      |                                          |
      |--- GET /api/data ----------------------->|
      |                                          |
      |<--- 402 Payment Required ----------------|
      |    Body: { paymentRequirements: {         |
      |      scheme: "exact",                     |
      |      network: "base-sepolia",             |
      |      maxAmountRequired: "1000000",        |
      |      resource: "https://api.example.com"  |
      |    }}                                     |
      |                                          |
      |  [sign keccak256(resource:amount)]        |
      |  [build base64 PaymentHeader]             |
      |                                          |
      |--- GET /api/data ----------------------->|
      |    Header: X-PAYMENT: <base64>            |
      |                                          |
      |<--- 200 OK -----------------------------|
      |    Body: { data: { result: "success" },   |
      |            paymentVerified: true }         |
      |                                          |
```

---

[Back to README](./README.md) | [Previous: Helpers](./helpers.md) | [Next: Configuration](./configuration.md)
