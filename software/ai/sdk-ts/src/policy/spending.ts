import type { Address } from "viem";
import type { SpendingLimit } from "../types/policy.js";
import { validateAddress, validateAmount } from "../utils/validation.js";

export interface SpendingLimitParams {
  tokenAddress: Address;
  maxPerTransaction: bigint;
  maxDaily: bigint;
  maxWeekly: bigint;
}

export function createSpendingLimit(params: SpendingLimitParams): SpendingLimit {
  validateAddress(params.tokenAddress);
  validateAmount(params.maxPerTransaction, "maxPerTransaction");
  validateAmount(params.maxDaily, "maxDaily");
  validateAmount(params.maxWeekly, "maxWeekly");

  if (params.maxPerTransaction > params.maxDaily) {
    throw new Error("maxPerTransaction cannot exceed maxDaily");
  }

  if (params.maxDaily > params.maxWeekly) {
    throw new Error("maxDaily cannot exceed maxWeekly");
  }

  return {
    type: "spending",
    maxPerTransaction: params.maxPerTransaction,
    maxDaily: params.maxDaily,
    maxWeekly: params.maxWeekly,
    tokenAddress: params.tokenAddress,
  };
}

export function createEthSpendingLimit(
  maxPerTransaction: bigint,
  maxDaily: bigint,
  maxWeekly: bigint
): SpendingLimit {
  return createSpendingLimit({
    tokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    maxPerTransaction,
    maxDaily,
    maxWeekly,
  });
}

export function createUsdcSpendingLimit(
  maxPerTransaction: bigint,
  maxDaily: bigint,
  maxWeekly: bigint,
  chainUsdcAddress: Address
): SpendingLimit {
  return createSpendingLimit({
    tokenAddress: chainUsdcAddress,
    maxPerTransaction,
    maxDaily,
    maxWeekly,
  });
}
