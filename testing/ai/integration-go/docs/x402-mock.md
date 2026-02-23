# x402 Mock System

[<< Back to README](README.md) | [Helpers](helpers.md) | [Configuration >>](configuration.md)

Documentation of the `x402` package, which implements a mock HTTP 402 payment server and an auto-paying HTTP client transport for testing the x402 payment protocol.

---

## Package Structure

```
x402/
├── types.go    # PaymentRequirement and PaymentHeader data types
├── server.go   # MockX402Server -- HTTP server that enforces payment
└── client.go   # X402Transport and NewX402Client -- auto-paying HTTP client
```

## Overview

The x402 protocol enables machine-to-machine payments over HTTP. When a client requests a resource, the server responds with `402 Payment Required` and a set of payment requirements. The client signs and submits a payment, then retries the request with an `X-PAYMENT` header.

This package provides both sides of the protocol for testing:

```
                         1. GET /resource
   X402Client ─────────────────────────────> MockX402Server
                         2. 402 + requirements
   X402Client <───────────────────────────── MockX402Server
                         3. GET /resource + X-PAYMENT header
   X402Client ─────────────────────────────> MockX402Server
                         4. 200 OK
   X402Client <───────────────────────────── MockX402Server
```

---

## types.go

### PaymentRequirement

```go
type PaymentRequirement struct {
    Scheme    string `json:"scheme"`
    Network   string `json:"network"`
    MaxAmount string `json:"maxAmountRequired"`
    Resource  string `json:"resource"`
    Address   string `json:"address"`
}
```

Describes what the server requires for payment.

| Field | JSON Key | Description |
|-------|----------|-------------|
| `Scheme` | `scheme` | Payment scheme (e.g., `"exact"`) |
| `Network` | `network` | Blockchain network (e.g., `"base-sepolia"`) |
| `MaxAmount` | `maxAmountRequired` | Amount required as a string |
| `Resource` | `resource` | The resource path being accessed |
| `Address` | `address` | Payment recipient address |

### PaymentHeader

```go
type PaymentHeader struct {
    Signature string `json:"signature"`
    Sender    string `json:"sender"`
    Amount    string `json:"amount"`
    Resource  string `json:"resource"`
}
```

The payment payload sent by the client in the `X-PAYMENT` header.

| Field | JSON Key | Description |
|-------|----------|-------------|
| `Signature` | `signature` | Hex-encoded ECDSA signature of the payment message |
| `Sender` | `sender` | Ethereum address of the payer |
| `Amount` | `amount` | Amount being paid as a string |
| `Resource` | `resource` | The resource being paid for |

---

## server.go

### MockX402Server

```go
type MockX402Server struct {
    Server       *http.Server
    URL          string
    Payments     []PaymentHeader
    mu           sync.Mutex
    Requirements []PaymentRequirement
}
```

An HTTP server that simulates x402 payment-gated endpoints.

| Field | Type | Description |
|-------|------|-------------|
| `Server` | `*http.Server` | Underlying HTTP server |
| `URL` | `string` | Full URL of the server (e.g., `http://127.0.0.1:54321`) |
| `Payments` | `[]PaymentHeader` | All recorded payments (thread-safe) |
| `mu` | `sync.Mutex` | Protects the Payments slice |
| `Requirements` | `[]PaymentRequirement` | Payment requirements returned on 402 |

### NewMockX402Server

```go
func NewMockX402Server(requirements []PaymentRequirement) (*MockX402Server, error)
```

Creates and starts a mock x402 server on a random available port.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `requirements` | `[]PaymentRequirement` | Payment requirements to advertise |

**Implementation details:**
- Binds to `127.0.0.1:0` (OS assigns a random port)
- Registers a single catch-all handler at `/`
- Starts serving in a background goroutine
- The `URL` field is set to the actual bound address

**Usage:**

```go
requirements := []x402.PaymentRequirement{
    {
        Scheme:    "exact",
        Network:   "base-sepolia",
        MaxAmount: "1000",
        Resource:  "/api/data",
        Address:   "0x0000000000000000000000000000000000000000",
    },
}

server, err := x402.NewMockX402Server(requirements)
if err != nil {
    t.Fatal(err)
}
defer server.Close()
```

### handler (internal)

```go
func (m *MockX402Server) handler(w http.ResponseWriter, r *http.Request)
```

The HTTP handler implements the x402 protocol:

**Without `X-PAYMENT` header:**
1. Returns `402 Payment Required`
2. Response body: `{"accepts": [<requirements>]}`
3. Content-Type: `application/json`

**With `X-PAYMENT` header:**
1. Parses the JSON payment header
2. Appends payment to `m.Payments` (thread-safe with mutex)
3. Returns `200 OK`
4. Response body: `{"status": "paid"}`

### GetPayments

```go
func (m *MockX402Server) GetPayments() []PaymentHeader
```

Returns a thread-safe copy of all recorded payments.

```go
payments := server.GetPayments()
fmt.Println("Total payments:", len(payments))
fmt.Println("First payment amount:", payments[0].Amount)
```

### Close

```go
func (m *MockX402Server) Close()
```

Shuts down the HTTP server.

---

## client.go

### X402Transport

```go
type X402Transport struct {
    Base    http.RoundTripper
    Key     *ecdsa.PrivateKey
    Address common.Address
}
```

An `http.RoundTripper` that wraps a base transport and automatically handles x402 payment negotiation.

| Field | Type | Description |
|-------|------|-------------|
| `Base` | `http.RoundTripper` | Underlying transport (typically `http.DefaultTransport`) |
| `Key` | `*ecdsa.PrivateKey` | ECDSA key used to sign payments |
| `Address` | `common.Address` | Ethereum address derived from the key |

### NewX402Client

```go
func NewX402Client(key *ecdsa.PrivateKey) *http.Client
```

Creates an `http.Client` with the `X402Transport` installed.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `*ecdsa.PrivateKey` | Agent's private key for signing payments |

**Implementation:**

```go
func NewX402Client(key *ecdsa.PrivateKey) *http.Client {
    addr := crypto.PubkeyToAddress(key.PublicKey)
    return &http.Client{
        Transport: &X402Transport{
            Base:    http.DefaultTransport,
            Key:     key,
            Address: addr,
        },
    }
}
```

**Usage:**

```go
agent := helpers.GetAccount(6)
client := x402.NewX402Client(agent.Key)
resp, err := client.Get(server.URL + "/api/data")
```

### RoundTrip

```go
func (t *X402Transport) RoundTrip(req *http.Request) (*http.Response, error)
```

Implements `http.RoundTripper`. Performs the full x402 payment negotiation transparently.

**Flow:**

```
1. Buffer the request body (needed for retry)
2. Forward the request to the base transport
3. If response is NOT 402 --> return response as-is
4. If response IS 402:
   a. Read and parse the 402 response body
   b. Extract payment requirements from {"accepts": [...]}
   c. Take the first requirement
   d. Construct payment message: "x402 payment: <maxAmount> <resource>"
   e. Keccak256 hash the message
   f. ECDSA sign the hash with the agent's private key
   g. Build a PaymentHeader with signature, sender, amount, resource
   h. JSON-marshal the payment header
   i. Clone the original request
   j. Set "X-PAYMENT" header to the JSON payment string
   k. Retry the request with the base transport
   l. Return the retry response
```

**Signing details:**

```go
paymentMsg := fmt.Sprintf("x402 payment: %s %s", requirement.MaxAmount, requirement.Resource)
hash := crypto.Keccak256Hash([]byte(paymentMsg))
sig, err := crypto.Sign(hash.Bytes(), t.Key)
```

The signature is formatted as a `0x`-prefixed hex string:

```go
payment := PaymentHeader{
    Signature: fmt.Sprintf("0x%x", sig),
    Sender:    t.Address.Hex(),
    Amount:    requirement.MaxAmount,
    Resource:  requirement.Resource,
}
```

---

## End-to-End Example

Combining the server and client in a test:

```go
func TestX402Flow(t *testing.T) {
    // 1. Define what the server requires
    requirements := []x402.PaymentRequirement{
        {
            Scheme:    "exact",
            Network:   "base-sepolia",
            MaxAmount: "1000",
            Resource:  "/api/data",
            Address:   "0x0000000000000000000000000000000000000000",
        },
    }

    // 2. Start the mock server
    server, _ := x402.NewMockX402Server(requirements)
    defer server.Close()

    // 3. Create an auto-paying client
    agent := helpers.GetAccount(6)
    client := x402.NewX402Client(agent.Key)

    // 4. Make a request -- payment happens automatically
    resp, _ := client.Get(server.URL + "/api/data")
    defer resp.Body.Close()

    // 5. Verify
    assert(resp.StatusCode == 200)
    payments := server.GetPayments()
    assert(len(payments) == 1)
    assert(payments[0].Amount == "1000")
    assert(payments[0].Sender == agent.Address.Hex())
}
```

---

[<< Helpers](helpers.md) | [Configuration >>](configuration.md)
