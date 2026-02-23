import { encodePacked, keccak256, type WalletClient, type Transport, type Chain, type Account } from "viem";
import type { PaymentRequirementsResponse, PaymentHeader } from "./types.js";

export interface X402PaymentResult {
  response: Response;
  paymentMade: boolean;
  amountPaid: string;
}

async function signPaymentAuthorization(
  walletClient: WalletClient<Transport, Chain, Account>,
  resource: string,
  amount: string
): Promise<string> {
  const message = encodePacked(
    ["string", "string", "string"],
    [resource, ":", amount]
  );
  const hash = keccak256(message);
  const signature = await walletClient.signMessage({
    message: { raw: hash as `0x${string}` },
  });
  return signature;
}

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

export async function x402Fetch(
  url: string,
  walletClient: WalletClient<Transport, Chain, Account>,
  options: RequestInit = {}
): Promise<X402PaymentResult> {
  const initialResponse = await fetch(url, options);

  if (initialResponse.status !== 402) {
    return { response: initialResponse, paymentMade: false, amountPaid: "0" };
  }

  const body: PaymentRequirementsResponse = await initialResponse.json();
  const requirements = body.paymentRequirements;

  const signature = await signPaymentAuthorization(
    walletClient,
    requirements.resource,
    requirements.maxAmountRequired
  );

  const paymentHeaderValue = buildPaymentHeader(
    signature,
    requirements.resource,
    requirements.maxAmountRequired,
    requirements.network,
    requirements.scheme
  );

  const retryResponse = await fetch(url, {
    ...options,
    headers: {
      ...((options.headers as Record<string, string>) || {}),
      "X-PAYMENT": paymentHeaderValue,
    },
  });

  return {
    response: retryResponse,
    paymentMade: true,
    amountPaid: requirements.maxAmountRequired,
  };
}
