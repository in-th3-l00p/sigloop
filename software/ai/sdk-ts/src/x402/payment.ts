import {
  type Address,
  type Hex,
  type LocalAccount,
  encodePacked,
  keccak256,
  toHex,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import type { EIP3009Authorization, PaymentRequirement } from "../types/x402.js";
import { generateNonce } from "../utils/encoding.js";

const EIP3009_TYPEHASH = keccak256(
  encodePacked(
    ["string"],
    ["TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"]
  )
);

export async function signEIP3009Authorization(
  account: LocalAccount,
  params: {
    tokenAddress: Address;
    from: Address;
    to: Address;
    value: bigint;
    validAfter: bigint;
    validBefore: bigint;
    chainId: number;
  }
): Promise<{ authorization: EIP3009Authorization; signature: Hex }> {
  const nonce = generateNonce();

  const authorization: EIP3009Authorization = {
    from: params.from,
    to: params.to,
    value: params.value,
    validAfter: params.validAfter,
    validBefore: params.validBefore,
    nonce,
  };

  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: params.chainId,
    verifyingContract: params.tokenAddress,
  } as const;

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  } as const;

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message: {
      from: authorization.from,
      to: authorization.to,
      value: authorization.value,
      validAfter: authorization.validAfter,
      validBefore: authorization.validBefore,
      nonce: authorization.nonce,
    },
  });

  return { authorization, signature };
}

export function buildPaymentHeader(
  authorization: EIP3009Authorization,
  signature: Hex,
  requirement: PaymentRequirement
): string {
  const payload = {
    x402Version: 1,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        validAfter: authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        nonce: authorization.nonce,
      },
    },
  };

  return btoa(JSON.stringify(payload));
}

export function parsePaymentHeader(header: string): {
  authorization: EIP3009Authorization;
  signature: Hex;
  scheme: string;
  network: string;
} {
  const decoded = JSON.parse(atob(header));

  return {
    authorization: {
      from: decoded.payload.authorization.from as Address,
      to: decoded.payload.authorization.to as Address,
      value: BigInt(decoded.payload.authorization.value),
      validAfter: BigInt(decoded.payload.authorization.validAfter),
      validBefore: BigInt(decoded.payload.authorization.validBefore),
      nonce: decoded.payload.authorization.nonce as Hex,
    },
    signature: decoded.payload.signature as Hex,
    scheme: decoded.scheme,
    network: decoded.network,
  };
}
