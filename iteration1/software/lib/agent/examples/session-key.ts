import {
  generateSessionKey,
  isSessionKeyActive,
  getSessionKeyRemainingTime,
  serializeSessionKey,
  deserializeSessionKey,
} from "../src/advanced.js"

async function main() {
  const key = generateSessionKey(7200)

  console.log("Address:", key.address)
  console.log("Private key:", key.privateKey)
  console.log("Expires at:", new Date(key.expiresAt * 1000).toISOString())
  console.log("Active:", isSessionKeyActive(key))
  console.log("Remaining (seconds):", getSessionKeyRemainingTime(key))

  const serialized = serializeSessionKey(key)
  console.log("\nSerialized:", serialized)

  const deserialized = deserializeSessionKey(serialized)
  console.log("\nDeserialized address:", deserialized.address)
  console.log("Addresses match:", key.address === deserialized.address)
}

main().catch(console.error)
