import type { Address, Hex } from "viem"
import { toHex } from "viem"
import type { X402Config, X402PaymentRequirement, BudgetTracker } from "./types.js"
import { createBudgetTracker } from "./budget.js"
import { signEIP3009Authorization, buildPaymentHeader, generateNonce } from "./payment.js"
import {
  HTTP_STATUS_PAYMENT_REQUIRED,
  X402_PAYMENT_REQUIRED_HEADER,
  X402_PAYMENT_HEADER,
  USDC_ADDRESSES,
  DEFAULT_MAX_PER_REQUEST,
  DEFAULT_DAILY_BUDGET,
  DEFAULT_TOTAL_BUDGET,
} from "./constants.js"

export function createX402Fetch(config: X402Config): typeof fetch {
  const budget = createBudgetTracker({
    maxPerRequest: config.maxPerRequest ?? DEFAULT_MAX_PER_REQUEST,
    dailyBudget: config.dailyBudget ?? DEFAULT_DAILY_BUDGET,
    totalBudget: config.totalBudget ?? DEFAULT_TOTAL_BUDGET,
    allowedDomains: config.allowedDomains,
  })

  return async function x402Fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(input, init)

    if (response.status !== HTTP_STATUS_PAYMENT_REQUIRED) {
      return response
    }

    const requirement = await parseX402Response(response)
    if (!requirement) {
      return response
    }

    const amount = BigInt(requirement.maxAmountRequired)
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const domain = new URL(url).hostname

    if (!budget.canSpend(amount, domain)) {
      throw new Error(`x402: budget exceeded for ${domain} (amount: ${amount})`)
    }

    const token = requirement.asset || USDC_ADDRESSES[config.chainId]
    if (!token) {
      throw new Error(`x402: no USDC address for chain ${config.chainId}`)
    }

    const now = BigInt(Math.floor(Date.now() / 1000))
    const nonce = generateNonce()

    const signerAddress = config.signer.address || config.signer.account?.address
    if (!signerAddress) {
      throw new Error("x402: signer must have an address")
    }

    const { authorization, signature } = await signEIP3009Authorization(config.signer, {
      token,
      from: signerAddress,
      to: requirement.payTo,
      value: amount,
      validAfter: 0n,
      validBefore: now + BigInt(requirement.maxTimeoutSeconds || 120),
      nonce,
    })

    const paymentHeader = buildPaymentHeader(authorization, signature)

    const retryInit: RequestInit = {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        [X402_PAYMENT_HEADER]: paymentHeader,
      },
    }

    const retryResponse = await fetch(input, retryInit)

    budget.recordPayment({
      url,
      domain,
      amount,
      asset: token,
      timestamp: Math.floor(Date.now() / 1000),
    })

    return retryResponse
  }
}

export async function parseX402Response(
  response: Response,
): Promise<X402PaymentRequirement | null> {
  const header = response.headers.get(X402_PAYMENT_REQUIRED_HEADER)

  if (header) {
    try {
      const parsed = JSON.parse(header)
      return normalizeRequirement(parsed)
    } catch {
      // fall through
    }
  }

  try {
    const body = await response.clone().json()
    if (body && (body.maxAmountRequired || body.payTo)) {
      return normalizeRequirement(body)
    }
  } catch {
    // fall through
  }

  return null
}

function normalizeRequirement(data: any): X402PaymentRequirement {
  return {
    scheme: data.scheme ?? "exact",
    network: data.network ?? "base",
    maxAmountRequired: String(data.maxAmountRequired ?? "0"),
    resource: data.resource ?? "",
    description: data.description ?? "",
    payTo: data.payTo as Address,
    maxTimeoutSeconds: Number(data.maxTimeoutSeconds ?? 120),
    asset: (data.asset ?? "0x0000000000000000000000000000000000000000") as Address,
    extra: data.extra,
  }
}
