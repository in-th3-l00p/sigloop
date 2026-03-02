import { describe, it, expect, vi, beforeEach } from "vitest"
import { createKmsKey, getKmsPublicKey } from "../../src/kms/client.js"

const mockSend = vi.fn()
const mockKmsClient = { send: mockSend } as any

beforeEach(() => {
  mockSend.mockReset()
})

describe("createKmsKey", () => {
  it("creates a key with correct params", async () => {
    mockSend.mockResolvedValueOnce({
      KeyMetadata: { KeyId: "test-key-id-123" },
    })

    const keyId = await createKmsKey({ kmsClient: mockKmsClient })

    expect(keyId).toBe("test-key-id-123")
    expect(mockSend).toHaveBeenCalledOnce()

    const command = mockSend.mock.calls[0][0]
    expect(command.input.KeySpec).toBe("ECC_SECG_P256K1")
    expect(command.input.KeyUsage).toBe("SIGN_VERIFY")
  })

  it("creates an alias when provided", async () => {
    mockSend
      .mockResolvedValueOnce({
        KeyMetadata: { KeyId: "test-key-id-456" },
      })
      .mockResolvedValueOnce({})

    const keyId = await createKmsKey({
      kmsClient: mockKmsClient,
      alias: "my-wallet",
    })

    expect(keyId).toBe("test-key-id-456")
    expect(mockSend).toHaveBeenCalledTimes(2)

    const aliasCommand = mockSend.mock.calls[1][0]
    expect(aliasCommand.input.AliasName).toBe("alias/my-wallet")
    expect(aliasCommand.input.TargetKeyId).toBe("test-key-id-456")
  })

  it("does not double-prefix alias/ when already present", async () => {
    mockSend
      .mockResolvedValueOnce({
        KeyMetadata: { KeyId: "test-key-id-789" },
      })
      .mockResolvedValueOnce({})

    await createKmsKey({
      kmsClient: mockKmsClient,
      alias: "alias/my-wallet",
    })

    const aliasCommand = mockSend.mock.calls[1][0]
    expect(aliasCommand.input.AliasName).toBe("alias/my-wallet")
  })

  it("passes description, tags, and policy", async () => {
    mockSend.mockResolvedValueOnce({
      KeyMetadata: { KeyId: "tagged-key" },
    })

    await createKmsKey({
      kmsClient: mockKmsClient,
      description: "Agent wallet key",
      tags: { env: "production", agent: "alpha" },
      policy: '{"Version":"2012-10-17"}',
      multiRegion: true,
    })

    const command = mockSend.mock.calls[0][0]
    expect(command.input.Description).toBe("Agent wallet key")
    expect(command.input.Policy).toBe('{"Version":"2012-10-17"}')
    expect(command.input.MultiRegion).toBe(true)
    expect(command.input.Tags).toEqual([
      { TagKey: "env", TagValue: "production" },
      { TagKey: "agent", TagValue: "alpha" },
    ])
  })
})

describe("getKmsPublicKey", () => {
  it("returns the public key bytes", async () => {
    const fakeKey = new Uint8Array([0x30, 0x56, 0x01, 0x02])
    mockSend.mockResolvedValueOnce({ PublicKey: fakeKey.buffer })

    const result = await getKmsPublicKey({
      kmsClient: mockKmsClient,
      keyId: "test-key",
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(mockSend).toHaveBeenCalledOnce()
  })

  it("throws when no public key returned", async () => {
    mockSend.mockResolvedValueOnce({ PublicKey: undefined })

    await expect(
      getKmsPublicKey({ kmsClient: mockKmsClient, keyId: "bad-key" }),
    ).rejects.toThrow("No public key returned")
  })
})
