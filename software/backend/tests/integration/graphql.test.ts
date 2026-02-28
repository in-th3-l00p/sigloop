import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

async function gql(app: any, query: string, variables?: any) {
  const res = await app.request("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

describe("GraphQL API", () => {
  let app: ReturnType<typeof createApp>["app"]

  beforeAll(() => {
    app = createApp(config).app
  })

  it("query wallets - returns empty initially", async () => {
    const result = await gql(app, `{ wallets { id name } }`)
    expect(result.data.wallets).toEqual([])
  })

  it("mutation createWallet - creates wallet", async () => {
    const result = await gql(app, `
      mutation {
        createWallet(input: { name: "GQL Wallet", chainId: 8453 }) {
          id
          name
          address
          chainId
        }
      }
    `)
    expect(result.data.createWallet.name).toBe("GQL Wallet")
    expect(result.data.createWallet.address).toMatch(/^0x/)
  })

  it("query wallets - returns created wallet", async () => {
    const result = await gql(app, `{ wallets { id name chainId } }`)
    expect(result.data.wallets.length).toBeGreaterThanOrEqual(1)
  })

  it("mutation createAgent - creates agent for wallet", async () => {
    const walletsResult = await gql(app, `{ wallets { id } }`)
    const walletId = walletsResult.data.wallets[0].id

    const result = await gql(app, `
      mutation($walletId: ID!) {
        createAgent(walletId: $walletId, input: { name: "GQL Agent" }) {
          agent { id name status address }
          sessionKey
        }
      }
    `, { walletId })
    expect(result.data.createAgent.agent.name).toBe("GQL Agent")
    expect(result.data.createAgent.agent.status).toBe("active")
    expect(result.data.createAgent.sessionKey).toMatch(/^0x/)
  })

  it("query agents - returns created agents", async () => {
    const result = await gql(app, `{ agents { id name status walletId } }`)
    expect(result.data.agents.length).toBeGreaterThanOrEqual(1)
  })

  it("mutation createPolicy - creates policy", async () => {
    const result = await gql(app, `
      mutation {
        createPolicy(input: {
          name: "GQL Policy"
          type: "x402"
          config: { maxPerRequest: "1000000", dailyBudget: "10000000", totalBudget: "100000000", allowedDomains: ["api.example.com"] }
        }) {
          id
          name
          type
        }
      }
    `)
    expect(result.data.createPolicy.name).toBe("GQL Policy")
    expect(result.data.createPolicy.type).toBe("x402")
  })

  it("mutation recordPayment - records payment", async () => {
    const walletsResult = await gql(app, `{ wallets { id } }`)
    const walletId = walletsResult.data.wallets[0].id
    const agentsResult = await gql(app, `{ agents { id } }`)
    const agentId = agentsResult.data.agents[0].id

    const result = await gql(app, `
      mutation($input: RecordPaymentInput!) {
        recordPayment(input: $input) {
          id
          amount
          domain
          status
        }
      }
    `, {
      input: { agentId, walletId, domain: "gql.example.com", amount: "500" },
    })
    expect(result.data.recordPayment.status).toBe("completed")
    expect(result.data.recordPayment.domain).toBe("gql.example.com")
  })

  it("query paymentStats - returns stats", async () => {
    const result = await gql(app, `{ paymentStats { totalSpent totalTransactions } }`)
    expect(result.data.paymentStats.totalTransactions).toBeGreaterThanOrEqual(1)
  })

  it("mutation encodeSwap - encodes swap calldata", async () => {
    const result = await gql(app, `
      mutation {
        encodeSwap(input: {
          chainId: 8453
          tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
          tokenOut: "0x4200000000000000000000000000000000000006"
          amountIn: "1000000"
          minAmountOut: "0"
          recipient: "0x1111111111111111111111111111111111111111"
        }) {
          to
          data
          value
        }
      }
    `)
    expect(result.data.encodeSwap.to).toMatch(/^0x/)
    expect(result.data.encodeSwap.data).toMatch(/^0x/)
  })

  it("mutation deleteWallet - deletes wallet", async () => {
    const createResult = await gql(app, `
      mutation { createWallet(input: { name: "Delete Me" }) { id } }
    `)
    const id = createResult.data.createWallet.id

    const result = await gql(app, `
      mutation($id: ID!) { deleteWallet(id: $id) }
    `, { id })
    expect(result.data.deleteWallet).toBe(true)
  })
})
