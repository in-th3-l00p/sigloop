import {
  type Address,
  type Hex,
  type LocalAccount,
  toHex,
  keccak256,
  encodePacked,
} from "viem";
import type { PaymentRequirement, X402Config, PaymentRecord } from "../types/x402.js";
import { signEIP3009Authorization, buildPaymentHeader } from "./payment.js";
import { BudgetTracker } from "./budget.js";
import { generateNonce } from "../utils/encoding.js";

export interface X402MiddlewareOptions {
  account: LocalAccount;
  walletAddress: Address;
  chainId: number;
  config: X402Config;
  onPayment?: (record: PaymentRecord) => void;
  onPaymentRejected?: (requirement: PaymentRequirement, reason: string) => void;
}

export function createX402Middleware(options: X402MiddlewareOptions): typeof fetch {
  const budgetTracker = new BudgetTracker({
    maxPerRequest: options.config.maxPaymentPerRequest,
    maxDaily: options.config.maxTotalPayment,
    allowedDomains: options.config.allowedDomains ?? [],
    allowedAssets: options.config.allowedAssets ?? [],
  });

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);

    if (response.status !== 402) {
      return response;
    }

    const requirementsHeader = response.headers.get("X-Payment-Requirements");
    if (!requirementsHeader) {
      return response;
    }

    let requirements: PaymentRequirement[];
    try {
      requirements = JSON.parse(requirementsHeader);
    } catch {
      return response;
    }

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return response;
    }

    const requirement = requirements[0]!;

    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const domain = new URL(url).hostname;

    const amount = BigInt(requirement.maxAmountRequired);

    if (!budgetTracker.canSpend(amount, requirement.asset, domain)) {
      const reason = "Payment exceeds budget policy";
      options.onPaymentRejected?.(requirement, reason);
      return response;
    }

    if (!options.config.autoApprove) {
      return response;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    const validBefore = now + BigInt(requirement.maxTimeoutSeconds);

    const { authorization, signature } = await signEIP3009Authorization(
      options.account,
      {
        tokenAddress: requirement.asset,
        from: options.walletAddress,
        to: requirement.payTo,
        value: amount,
        validAfter: now,
        validBefore,
        chainId: options.chainId,
      }
    );

    const paymentHeader = buildPaymentHeader(authorization, signature, requirement);

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set("X-PAYMENT", paymentHeader);

    const retryResponse = await fetch(input, {
      ...init,
      headers: retryHeaders,
    });

    const paymentRecord: PaymentRecord = {
      id: keccak256(encodePacked(["bytes32"], [generateNonce()])),
      url,
      amount,
      asset: requirement.asset,
      payTo: requirement.payTo,
      timestamp: Math.floor(Date.now() / 1000),
      authorization: signature,
    };

    budgetTracker.recordPayment(paymentRecord);
    options.onPayment?.(paymentRecord);

    return retryResponse;
  };
}
