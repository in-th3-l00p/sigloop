import { type Address, type Hex, toFunctionSelector } from "viem";
import type { ContractAllowlist, FunctionAllowlist } from "../types/policy.js";
import { validateAddress } from "../utils/validation.js";

export function createContractAllowlist(addresses: Address[]): ContractAllowlist {
  if (addresses.length === 0) {
    throw new Error("Contract allowlist must contain at least one address");
  }

  const uniqueAddresses = [...new Set(addresses.map((a) => a.toLowerCase()))] as Address[];
  uniqueAddresses.forEach(validateAddress);

  return {
    type: "contract-allowlist",
    addresses: uniqueAddresses,
  };
}

export function createFunctionAllowlist(
  contract: Address,
  signatures: string[]
): FunctionAllowlist {
  validateAddress(contract);

  if (signatures.length === 0) {
    throw new Error("Function allowlist must contain at least one signature");
  }

  const selectors: Hex[] = signatures.map((sig) => {
    if (sig.startsWith("0x") && sig.length === 10) {
      return sig as Hex;
    }
    return toFunctionSelector(sig);
  });

  const uniqueSelectors = [...new Set(selectors)] as Hex[];

  return {
    type: "function-allowlist",
    contract,
    selectors: uniqueSelectors,
  };
}

export function mergeContractAllowlists(...allowlists: ContractAllowlist[]): ContractAllowlist {
  const allAddresses = allowlists.flatMap((a) => a.addresses);
  return createContractAllowlist(allAddresses);
}

export function mergeContractAndFunctionAllowlists(
  contracts: ContractAllowlist,
  functions: FunctionAllowlist[]
): { contracts: ContractAllowlist; functions: FunctionAllowlist[] } {
  const functionContracts = functions.map((f) => f.contract);
  const allContracts = [...contracts.addresses, ...functionContracts];
  return {
    contracts: createContractAllowlist(allContracts),
    functions,
  };
}
