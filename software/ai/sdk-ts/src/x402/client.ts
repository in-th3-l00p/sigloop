import type { Address, Hex, LocalAccount } from "viem";
import type { X402Config, PaymentRecord } from "../types/x402.js";
import { createX402Middleware } from "./middleware.js";
import { BudgetTracker } from "./budget.js";

export interface X402ClientOptions {
  account: LocalAccount;
  walletAddress: Address;
  chainId: number;
  config: X402Config;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  onPayment?: (record: PaymentRecord) => void;
  onPaymentRejected?: (reason: string) => void;
}

export interface X402Client {
  fetch: typeof fetch;
  get: (url: string, headers?: Record<string, string>) => Promise<Response>;
  post: (url: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
  put: (url: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
  delete: (url: string, headers?: Record<string, string>) => Promise<Response>;
  getBudgetTracker: () => BudgetTracker;
}

export function createX402Client(options: X402ClientOptions): X402Client {
  const budgetTracker = new BudgetTracker({
    maxPerRequest: options.config.maxPaymentPerRequest,
    maxDaily: options.config.maxTotalPayment,
    allowedDomains: options.config.allowedDomains ?? [],
    allowedAssets: options.config.allowedAssets ?? [],
  });

  const x402Fetch = createX402Middleware({
    account: options.account,
    walletAddress: options.walletAddress,
    chainId: options.chainId,
    config: options.config,
    onPayment: options.onPayment,
    onPaymentRejected: (requirement, reason) => {
      options.onPaymentRejected?.(reason);
    },
  });

  function resolveUrl(url: string): string {
    if (options.baseUrl && !url.startsWith("http")) {
      return `${options.baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
    }
    return url;
  }

  function mergeHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      ...options.defaultHeaders,
      ...extra,
    };
  }

  async function get(url: string, headers?: Record<string, string>): Promise<Response> {
    return x402Fetch(resolveUrl(url), {
      method: "GET",
      headers: mergeHeaders(headers),
    });
  }

  async function post(url: string, body: unknown, headers?: Record<string, string>): Promise<Response> {
    return x402Fetch(resolveUrl(url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...mergeHeaders(headers),
      },
      body: JSON.stringify(body),
    });
  }

  async function put(url: string, body: unknown, headers?: Record<string, string>): Promise<Response> {
    return x402Fetch(resolveUrl(url), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...mergeHeaders(headers),
      },
      body: JSON.stringify(body),
    });
  }

  async function del(url: string, headers?: Record<string, string>): Promise<Response> {
    return x402Fetch(resolveUrl(url), {
      method: "DELETE",
      headers: mergeHeaders(headers),
    });
  }

  return {
    fetch: x402Fetch,
    get,
    post,
    put,
    delete: del,
    getBudgetTracker: () => budgetTracker,
  };
}
