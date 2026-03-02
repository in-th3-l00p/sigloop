import { describe, it, expect, beforeEach } from "vitest"
import { createAgentService } from "../../../src/services/agent.js"
import { createAgentsStore } from "../../../src/stores/agents.js"
import { createWalletsStore } from "../../../src/stores/wallets.js"
import { createPoliciesStore } from "../../../src/stores/policies.js"
import { createKeysService } from "../../../src/services/keys.js"
import { createEventsStore } from "../../../src/stores/events.js"
import { createWalletService } from "../../../src/services/wallet.js"
import { createConfig } from "../../../src/config.js"

describe("createAgentService", () => {
  let agentService: ReturnType<typeof createAgentService>
  let walletService: ReturnType<typeof createWalletService>
  let walletsStore: ReturnType<typeof createWalletsStore>
  let eventsStore: ReturnType<typeof createEventsStore>

  beforeEach(() => {
    walletsStore = createWalletsStore()
    const keysService = createKeysService()
    eventsStore = createEventsStore()
    const config = createConfig()

    walletService = createWalletService({ walletsStore, keysService, eventsStore, config })

    agentService = createAgentService({
      agentsStore: createAgentsStore(),
      walletsStore,
      policiesStore: createPoliciesStore(),
      keysService,
      eventsStore,
    })
  })

  it("creates an agent for a wallet", () => {
    const wallet = walletService.create({ name: "W" })
    const result = agentService.create(wallet.id, { name: "Agent 1" })
    expect(result.agent.id).toBeTruthy()
    expect(result.agent.address).toMatch(/^0x/)
    expect(result.agent.status).toBe("active")
    expect(result.sessionKey).toMatch(/^0x/)
  })

  it("throws when wallet not found", () => {
    expect(() => agentService.create("nope", { name: "A" })).toThrow("not found")
  })

  it("throws when name is missing", () => {
    const wallet = walletService.create({ name: "W" })
    expect(() => agentService.create(wallet.id, { name: "" })).toThrow("required")
  })

  it("gets an agent by id", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    const retrieved = agentService.get(agent.id)
    expect(retrieved.id).toBe(agent.id)
  })

  it("lists agents", () => {
    const wallet = walletService.create({ name: "W" })
    agentService.create(wallet.id, { name: "A1" })
    agentService.create(wallet.id, { name: "A2" })
    expect(agentService.list()).toHaveLength(2)
  })

  it("lists agents by wallet", () => {
    const w1 = walletService.create({ name: "W1" })
    const w2 = walletService.create({ name: "W2" })
    agentService.create(w1.id, { name: "A1" })
    agentService.create(w2.id, { name: "A2" })
    expect(agentService.list(w1.id)).toHaveLength(1)
  })

  it("revokes an agent", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    const revoked = agentService.revoke(agent.id)
    expect(revoked.status).toBe("revoked")
    expect(revoked.revokedAt).toBeTruthy()
  })

  it("throws when revoking already revoked agent", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    agentService.revoke(agent.id)
    expect(() => agentService.revoke(agent.id)).toThrow("already")
  })

  it("deletes an agent", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    agentService.delete(agent.id)
    expect(() => agentService.get(agent.id)).toThrow("not found")
  })

  it("broadcasts agent:created event", () => {
    const wallet = walletService.create({ name: "W" })
    agentService.create(wallet.id, { name: "A" })
    const events = eventsStore.getRecentEvents()
    expect(events.some((e) => e.type === "agent:created")).toBe(true)
  })

  it("broadcasts agent:revoked event", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    agentService.revoke(agent.id)
    const events = eventsStore.getRecentEvents()
    expect(events.some((e) => e.type === "agent:revoked")).toBe(true)
  })

  it("gets session status", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    const session = agentService.getSession(agent.id)
    expect(session.active).toBe(true)
    expect(session.remainingSeconds).toBeGreaterThan(0)
  })

  it("returns null policy when agent has no policy", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    expect(agentService.getPolicy(agent.id)).toBeNull()
  })
})
