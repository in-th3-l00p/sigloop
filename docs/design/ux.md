# Sigloop Dashboard — UX Schema

## Overview

Management dashboard for the Sigloop wallet abstraction platform. Operators use this to create wallets, provision AI agents with scoped session keys, define spending policies, monitor x402 payments, and track analytics — all from a single interface.

**Target user:** Developer or operator deploying autonomous AI agents that transact on-chain.

**Stack:** React 19, Vite 7, TailwindCSS v4, shadcn/ui, @tanstack/react-query, lucide-react, react-router-dom 7

**Design language:** Dark theme default, violet accent (`#7C3AED` / `#8B5CF6`), zinc neutrals, minimal chrome, monospace for addresses/hashes, OKLCH color space matching the landing page.

---

## Information Architecture

```
┌─ Sidebar (persistent, collapsible) ──────────────────────────────┐
│                                                                   │
│  sigloop logo                                                     │
│                                                                   │
│  Dashboard          /                                             │
│  Wallets            /wallets                                      │
│  Agents             /agents                                       │
│  Policies           /policies                                     │
│  Payments           /payments                                     │
│  DeFi               /defi                                         │
│  Analytics          /analytics                                    │
│  Settings           /settings                                     │
│                                                                   │
│  ── bottom ──                                                     │
│  WebSocket status indicator (connected/disconnected)              │
│  API connection status                                            │
└───────────────────────────────────────────────────────────────────┘
```

### Route Map

| Route                | Page        | Description                              |
|----------------------|-------------|------------------------------------------|
| `/`                  | Dashboard   | Overview metrics, recent activity feed   |
| `/wallets`           | Wallets     | Wallet list, create, detail              |
| `/wallets/:id`       | Wallet Detail | Single wallet view with agents and txns |
| `/agents`            | Agents      | Agent list, create, filter, revoke       |
| `/agents/:id`        | Agent Detail | Session info, policy, activity log       |
| `/policies`          | Policies    | Policy list, create, compose             |
| `/policies/:id`      | Policy Detail | Policy config, bound agents             |
| `/payments`          | Payments    | Payment history, filters, stats          |
| `/defi`              | DeFi        | Encode and preview DeFi operations       |
| `/analytics`         | Analytics   | Spending charts, agent rankings          |
| `/settings`          | Settings    | API config, UI preferences               |

---

## Global Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Sidebar (240px, collapsible to 64px icon-only)                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │                         Page Content                           │ │
│ │  ┌──────────────────────────────────────────────────────────┐  │ │
│ │  │ Page Header                                              │  │ │
│ │  │  Title + Description + Primary Action Button             │  │ │
│ │  └──────────────────────────────────────────────────────────┘  │ │
│ │                                                                │ │
│ │  ┌──────────────────────────────────────────────────────────┐  │ │
│ │  │ Page Body                                                │  │ │
│ │  │  (varies per page)                                       │  │ │
│ │  └──────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

- Sidebar: fixed left, zinc-900 background, violet highlight on active item, lucide icons + labels
- Page content: scrollable, max-w-7xl centered, px-6 lg:px-8 padding
- Toast notifications: bottom-right stack for WebSocket events and action confirmations

---

## Page Schemas

### 1. Dashboard (`/`)

The landing view after login. At-a-glance health of the entire platform.

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard                                                        │
│                                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Wallets     │ │  Agents     │ │  Payments   │ │  Budget     ││
│  │  3           │ │  12 active  │ │  $2,847     │ │  67% used   ││
│  │  total       │ │  2 revoked  │ │  today      │ │  daily      ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                    │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐│
│  │  Recent Activity             │ │  Spending (7d)               ││
│  │                              │ │                              ││
│  │  ● payment:recorded  2s ago │ │  ┌──────────────────────┐   ││
│  │    agent-gpt4 → api.ex.com  │ │  │  ▃ ▅ ▇ ▆ ▄ ▅ ▇     │   ││
│  │    $0.003 USDC               │ │  │  M T W T F S S      │   ││
│  │                              │ │  └──────────────────────┘   ││
│  │  ● agent:created    5m ago  │ │                              ││
│  │    researcher-bot            │ │  Total: $18.42              ││
│  │    wallet: ops-wallet        │ │  Avg/day: $2.63             ││
│  │                              │ │                              ││
│  │  ● budget:warning  12m ago  │ │                              ││
│  │    ops-wallet at 80%         │ │                              ││
│  │                              │ │                              ││
│  │  (live via WebSocket)        │ │                              ││
│  └──────────────────────────────┘ └──────────────────────────────┘│
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Top Agents by Spend                                         │  │
│  │                                                              │  │
│  │  Agent           Wallet       Transactions   Total Spent     │  │
│  │  agent-gpt4      ops-wallet   142            $12.84          │  │
│  │  researcher-bot  research     38             $3.21           │  │
│  │  data-fetcher    ops-wallet   24             $2.37           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `MetricCard` (4x) — stat value, label, subtle trend indicator
- `ActivityFeed` — real-time event list from WebSocket, color-coded by event type (green: created, yellow: warning, red: exceeded, blue: payment)
- `SpendingMiniChart` — 7-day bar chart via a lightweight chart lib or CSS bars
- `TopAgentsTable` — sortable 3-column table from `/api/analytics/agents`

**Data sources:**
- `GET /api/wallets` → wallet count
- `GET /api/agents` → agent count by status
- `GET /api/payments/stats` → today's spend total
- `GET /api/payments/budgets/:walletId` → budget usage per wallet
- `GET /api/analytics/spending?period=daily` → 7-day chart
- `GET /api/analytics/agents?sortBy=spent&limit=5` → top agents
- WebSocket `/ws` → live activity feed

---

### 2. Wallets (`/wallets`)

CRUD for ERC-4337 smart wallets.

```
┌──────────────────────────────────────────────────────────────────┐
│  Wallets                                          [+ New Wallet] │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ops-wallet                                                  │  │
│  │  0x1234...abcd                    [copy]                     │  │
│  │  Chain: Base (8453)          Agents: 4        Created: 2d    │  │
│  │                                                [View] [Delete]│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  research-wallet                                             │  │
│  │  0x5678...ef01                    [copy]                     │  │
│  │  Chain: Arbitrum (42161)     Agents: 1        Created: 5d    │  │
│  │                                                [View] [Delete]│  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**[+ New Wallet] Dialog:**

```
┌──────────────────────────────────────────┐
│  Create Wallet                            │
│                                           │
│  Name                                     │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Chain                                    │
│  ┌─────────────────────────────────────┐  │
│  │  Base (8453)                    ▼   │  │
│  └─────────────────────────────────────┘  │
│  Options: Base, Ethereum, Arbitrum,       │
│  Optimism, Anvil Local                    │
│                                           │
│                     [Cancel]   [Create]    │
└──────────────────────────────────────────┘
```

**Components:**
- `WalletCard` — name, truncated address with copy button, chain badge, agent count, relative timestamp
- `CreateWalletDialog` — shadcn Dialog with name input + chain Select
- `AddressDisplay` — monospace truncated address (`0x1234...abcd`) with clipboard copy via navigator.clipboard

**Data sources:**
- `GET /api/wallets` → list
- `POST /api/wallets` → create
- `DELETE /api/wallets/:id` → delete (with confirmation dialog)

---

### 3. Wallet Detail (`/wallets/:id`)

Deep view of a single wallet with its agents and transaction capability.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Wallets  /  ops-wallet                                        │
│                                                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐│
│  │  Address                    │  │  Budget Status              ││
│  │  0x1234567890abcdef1234...  │  │  Daily: $67 / $100  ███░░  ││
│  │               [copy] [scan] │  │  Remaining: $33             ││
│  │  Chain: Base (8453)         │  │                             ││
│  │  Created: 2025-02-28        │  │                             ││
│  └─────────────────────────────┘  └─────────────────────────────┘│
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Agents (4)]   [Actions]                                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Agents tab:                                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ agent-gpt4     ● active    expires in 23h   [Revoke]  │  │  │
│  │  │ researcher     ● active    expires in 6d    [Revoke]  │  │  │
│  │  │ old-agent      ● revoked   —                          │  │  │
│  │  │ test-agent     ● expired   —                          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  Actions tab:                                                │  │
│  │  ┌─────────────────────────────────────────────┐             │  │
│  │  │  Sign Message          [open form →]        │             │  │
│  │  │  Send Transaction      [open form →]        │             │  │
│  │  └─────────────────────────────────────────────┘             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- Breadcrumb nav (`Wallets / {name}`)
- `WalletInfo` — address, chain badge, creation date
- `BudgetIndicator` — progress bar with percentage, color shifts green→yellow→red
- Tabs: `Agents` (inline agent list with status dots) | `Actions` (sign/send forms)
- `SignMessageSheet` — shadcn Sheet sliding from right, textarea for message, shows signature result
- `SendTransactionSheet` — to address, value (ETH), data (hex), shows txHash result

---

### 4. Agents (`/agents`)

Central agent management. Filterable list with provisioning.

```
┌──────────────────────────────────────────────────────────────────┐
│  Agents                                           [+ New Agent]  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Filter:  [All ▼]  [All Wallets ▼]          Search: [_____]  │  │
│  │          active/revoked/expired                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Name          Wallet       Status    Session     Policy     │  │
│  │  ─────────────────────────────────────────────────────────── │  │
│  │  agent-gpt4    ops-wallet   ● active  23h left    spending-1│  │
│  │  researcher    research     ● active  6d left     allowlist │  │
│  │  old-agent     ops-wallet   ● revoked —           —         │  │
│  │  test-agent    ops-wallet   ● expired —           basic     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Status dots:**
- `● active` — green
- `● revoked` — red
- `● expired` — zinc/gray

**[+ New Agent] Dialog:**

```
┌──────────────────────────────────────────┐
│  Provision Agent                          │
│                                           │
│  Wallet                                   │
│  ┌─────────────────────────────────────┐  │
│  │  ops-wallet                     ▼   │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Agent Name                               │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Policy (optional)                        │
│  ┌─────────────────────────────────────┐  │
│  │  Select policy...               ▼   │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Session Duration                         │
│  ┌─────────────────────────────────────┐  │
│  │  24 hours                       ▼   │  │
│  └─────────────────────────────────────┘  │
│  Options: 1h, 6h, 24h, 7d, 30d           │
│                                           │
│                    [Cancel]  [Provision]   │
└──────────────────────────────────────────┘
```

**Post-creation success view (critical UX moment):**

```
┌──────────────────────────────────────────┐
│  Agent Provisioned                        │
│                                           │
│  ⚠ Save this session key now.            │
│  It will not be shown again.              │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  0xabcdef1234567890abcdef12345678.. │  │
│  │                              [copy] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Agent ID: agt_a2b3c4d5                   │
│  Expires: 2025-03-02 14:30 UTC            │
│                                           │
│                              [Done]       │
└──────────────────────────────────────────┘
```

The session key is displayed exactly once. The dialog prevents closing without explicit acknowledgement.

**Data sources:**
- `GET /api/agents?walletId=` → list
- `POST /api/wallets/:walletId/agents` → create (returns sessionKey once)
- `POST /api/agents/:id/revoke` → revoke
- `DELETE /api/agents/:id` → delete
- `GET /api/agents/:id/session` → session status
- `GET /api/agents/:id/policy` → bound policy

---

### 5. Agent Detail (`/agents/:id`)

Deep view of a single agent's configuration, session, and activity.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Agents  /  agent-gpt4                          [Revoke Agent]│
│                                                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐│
│  │  Status: ● active           │  │  Session                    ││
│  │  Wallet: ops-wallet         │  │  Expires: 2025-03-02 14:30  ││
│  │  Address: 0xabc...def       │  │  Remaining: 23h 14m         ││
│  │  Created: 2025-03-01        │  │  ████████████████░░░░ 82%   ││
│  └─────────────────────────────┘  └─────────────────────────────┘│
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Bound Policy: spending-limits-v1                            │  │
│  │                                                              │  │
│  │  Type: agent                                                 │  │
│  │  Allowed targets: 0x833...913 (USDC), 0x420...069 (Router)  │  │
│  │  Max per tx: 0.01 ETH                                       │  │
│  │  Daily limit: $100          Weekly limit: $500               │  │
│  │  Valid: 2025-03-01 → 2025-03-08                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Recent Payments                                             │  │
│  │                                                              │  │
│  │  Time          Domain           Amount    Currency           │  │
│  │  2m ago        api.example.com  $0.003    USDC               │  │
│  │  15m ago       data.service.io  $0.010    USDC               │  │
│  │  1h ago        api.example.com  $0.003    USDC               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Sign UserOp                                                 │  │
│  │                                                              │  │
│  │  UserOp Hash                                                 │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  0x...                                               │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                               [Sign]        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `AgentStatusCard` — status dot, wallet link, address, creation date
- `SessionCountdown` — live countdown timer with progress bar, auto-updates via `setInterval`
- `PolicySummary` — read-only display of the bound policy config
- `AgentPaymentTable` — filtered payment history for this agent
- `SignUserOpForm` — hex input + sign button, shows signature result

---

### 6. Policies (`/policies`)

Policy builder and management.

```
┌──────────────────────────────────────────────────────────────────┐
│  Policies                                        [+ New Policy]  │
│                                          [Compose Policies]      │
│                                                                    │
│  ┌──────────────────────┐ ┌──────────────────────┐                │
│  │  spending-limits-v1  │ │  api-allowlist       │                │
│  │  Type: agent         │ │  Type: agent         │                │
│  │                      │ │                      │                │
│  │  Daily: $100         │ │  Targets: 3          │                │
│  │  Weekly: $500        │ │  Selectors: 5        │                │
│  │  Max/tx: 0.01 ETH   │ │  Valid until: 7d     │                │
│  │                      │ │                      │                │
│  │  Bound to: 2 agents  │ │  Bound to: 1 agent   │                │
│  │  [View] [Edit] [Del] │ │  [View] [Edit] [Del] │                │
│  └──────────────────────┘ └──────────────────────┘                │
│                                                                    │
│  ┌──────────────────────┐ ┌──────────────────────┐                │
│  │  x402-budget-default │ │  composed-policy-1   │                │
│  │  Type: x402          │ │  Type: agent         │                │
│  │                      │ │                      │                │
│  │  Per request: $0.05  │ │  Composed from:      │                │
│  │  Daily: $50          │ │  spending-limits-v1  │                │
│  │  Total: $500         │ │  + api-allowlist     │                │
│  │  Domains: 2          │ │                      │                │
│  │                      │ │  Bound to: 0 agents  │                │
│  │  [View] [Edit] [Del] │ │  [View] [Encode]     │                │
│  └──────────────────────┘ └──────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

**[+ New Policy] Dialog — multi-step:**

Step 1: Select type
```
┌──────────────────────────────────────────┐
│  Create Policy                            │
│                                           │
│  Policy Type                              │
│  ┌─────────────────────────────────────┐  │
│  │  ◉ Agent Permission                 │  │
│  │    Control targets, selectors,      │  │
│  │    amounts, and time windows        │  │
│  │                                     │  │
│  │  ○ x402 Budget                      │  │
│  │    Set per-request, daily, and      │  │
│  │    total payment caps               │  │
│  │                                     │  │
│  │  ○ Spending Limit                   │  │
│  │    Daily and weekly token           │  │
│  │    spending caps                    │  │
│  └─────────────────────────────────────┘  │
│                                           │
│                      [Cancel]    [Next →] │
└──────────────────────────────────────────┘
```

Step 2a: Agent Permission config
```
┌──────────────────────────────────────────┐
│  Agent Permission Policy                  │
│                                           │
│  Name                                     │
│  [_________________________________]      │
│                                           │
│  Allowed Targets (contract addresses)     │
│  ┌─────────────────────────────────────┐  │
│  │  0x833589fCD...02913          [×]   │  │
│  │  [+ Add target]                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Allowed Selectors (function selectors)   │
│  ┌─────────────────────────────────────┐  │
│  │  0xa9059cbb (transfer)        [×]   │  │
│  │  [+ Add selector]                   │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Max Amount Per Tx                        │
│  [_______________] ETH                    │
│                                           │
│  Daily Limit            Weekly Limit      │
│  [_______________]      [_______________] │
│                                           │
│  Valid After             Valid Until       │
│  [_______________]      [_______________] │
│                                           │
│                   [← Back]     [Create]   │
└──────────────────────────────────────────┘
```

Step 2b: x402 Budget config
```
┌──────────────────────────────────────────┐
│  x402 Budget Policy                       │
│                                           │
│  Name                                     │
│  [_________________________________]      │
│                                           │
│  Max Per Request                          │
│  [_______________] USDC                   │
│                                           │
│  Daily Budget           Total Budget      │
│  [_______________]      [_______________] │
│                                           │
│  Allowed Domains                          │
│  ┌─────────────────────────────────────┐  │
│  │  api.example.com               [×]  │  │
│  │  data.service.io               [×]  │  │
│  │  [+ Add domain]                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│                   [← Back]     [Create]   │
└──────────────────────────────────────────┘
```

**[Compose Policies] Dialog:**

```
┌──────────────────────────────────────────┐
│  Compose Policies                         │
│                                           │
│  Select policies to combine (AND logic):  │
│                                           │
│  ☑ spending-limits-v1                     │
│  ☑ api-allowlist                          │
│  ☐ x402-budget-default                   │
│                                           │
│  Result: intersection of all selected     │
│  policy constraints                       │
│                                           │
│                   [Cancel]   [Compose]    │
└──────────────────────────────────────────┘
```

**Components:**
- `PolicyCard` — type-specific summary rendering (spending shows limits, x402 shows budgets, agent shows targets)
- `CreatePolicyDialog` — multi-step with RadioGroup for type selection, dynamic form per type
- `TargetListInput` — repeatable address input with add/remove
- `SelectorListInput` — repeatable bytes4 input with optional label lookup
- `DomainListInput` — repeatable domain input with add/remove
- `ComposePoliciesDialog` — multi-select checkbox list of existing agent policies

**Data sources:**
- `GET /api/policies` → list
- `POST /api/policies` → create
- `PUT /api/policies/:id` → update
- `DELETE /api/policies/:id` → delete
- `POST /api/policies/:id/encode` → ABI-encode for on-chain
- `POST /api/policies/compose` → compose

---

### 7. Payments (`/payments`)

Payment history, filtering, and budget monitoring.

```
┌──────────────────────────────────────────────────────────────────┐
│  Payments                                                        │
│                                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Total       │ │  Today      │ │  Transactions│ │  Domains    ││
│  │  $247.82     │ │  $18.42     │ │  1,284       │ │  12         ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Filters                                                     │  │
│  │  Agent: [All ▼]  Wallet: [All ▼]  Domain: [All ▼]          │  │
│  │  Date range: [Start ____] → [End ____]                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Time       Agent        Wallet      Domain         Amount   │  │
│  │  ──────────────────────────────────────────────────────────  │  │
│  │  14:32:01   agent-gpt4   ops-wallet  api.ex.com     $0.003  │  │
│  │  14:31:45   researcher   research    data.svc.io    $0.010  │  │
│  │  14:28:12   agent-gpt4   ops-wallet  api.ex.com     $0.003  │  │
│  │  14:15:00   data-fetch   ops-wallet  feed.api.co    $0.025  │  │
│  │  ...                                                         │  │
│  │                                                              │  │
│  │  ← 1 2 3 ... 12 →                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Budget Status by Wallet                                     │  │
│  │                                                              │  │
│  │  ops-wallet     Daily: $67/$100  ██████░░░░ 67%              │  │
│  │  research       Daily: $12/$50   ████░░░░░░ 24%              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `PaymentStats` — 4 metric cards (total, today, transaction count, unique domains)
- `PaymentFilters` — Select dropdowns for agent, wallet, domain + date range picker
- `PaymentTable` — sortable, paginated table with relative timestamps
- `BudgetStatusList` — per-wallet budget progress bars

**Data sources:**
- `GET /api/payments?agentId=&walletId=&domain=&startDate=&endDate=` → filtered list
- `GET /api/payments/stats` → aggregate stats
- `GET /api/payments/budgets/:walletId` → per-wallet budget state
- `POST /api/payments/budgets/:walletId/check` → budget check

---

### 8. DeFi (`/defi`)

Encode and preview DeFi operations before execution. Tool-like interface.

```
┌──────────────────────────────────────────────────────────────────┐
│  DeFi Operations                                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Swap]  [Supply]  [Borrow]  [Repay]  [Approve]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Swap tab:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Chain                                                       │  │
│  │  [Base (8453) ▼]                                             │  │
│  │                                                              │  │
│  │  Token In                        Token Out                   │  │
│  │  [0x... or symbol ___]           [0x... or symbol ___]       │  │
│  │                                                              │  │
│  │  Amount In                       Min Amount Out              │  │
│  │  [_______________]               [_______________]           │  │
│  │                                                              │  │
│  │  Recipient                                                   │  │
│  │  [0x_________________________________]                       │  │
│  │                                                              │  │
│  │                                             [Encode]         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Result:                                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  To:    0x2626664c2603336E57B271c5C0b26F421741e481           │  │
│  │  Data:  0x414bf389000000000000000000000000833589f...  [copy] │  │
│  │  Value: 0                                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- Tabs: `Swap` | `Supply` | `Borrow` | `Repay` | `Approve`
- Per-tab form with chain selector, token inputs, amount inputs
- `EncodedCallResult` — readonly display of `{ to, data, value }` with copy buttons on each field
- Token inputs accept both raw addresses and common symbols (resolved client-side from a constants map)

**Data sources:**
- `POST /api/defi/swap/encode` → encoded swap calldata
- `POST /api/defi/supply/encode` → encoded supply calldata
- `POST /api/defi/borrow/encode` → encoded borrow calldata
- `POST /api/defi/repay/encode` → encoded repay calldata
- `POST /api/defi/approve/encode` → encoded approve calldata

---

### 9. Analytics (`/analytics`)

Spending trends and agent activity rankings.

```
┌──────────────────────────────────────────────────────────────────┐
│  Analytics                                                       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Period: [Daily ▼]  Wallet: [All ▼]  Agent: [All ▼]        │  │
│  │  Range:  [2025-02-22] → [2025-03-01]                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Spending Over Time                                          │  │
│  │                                                              │  │
│  │  $50 ┤                                                       │  │
│  │      │        ╭─╮                                            │  │
│  │  $40 ┤     ╭──╯ ╰──╮                                        │  │
│  │      │  ╭──╯       ╰──╮      ╭──╮                           │  │
│  │  $30 ┤──╯              ╰──╮──╯  ╰──╮                        │  │
│  │      │                    ╰──╯      ╰──╮                     │  │
│  │  $20 ┤                                 ╰──                   │  │
│  │      ┼────┬────┬────┬────┬────┬────┬────                     │  │
│  │      Feb22 23  24   25   26   27   28                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Agent Activity                             Sort: [Spent ▼] │  │
│  │                                                              │  │
│  │  Rank  Agent          Wallet       Txns    Total Spent       │  │
│  │  1     agent-gpt4     ops-wallet   142     $128.40           │  │
│  │  2     researcher     research     89      $67.20            │  │
│  │  3     data-fetcher   ops-wallet   56      $32.10            │  │
│  │  4     monitor-bot    ops-wallet   24      $12.50            │  │
│  │  5     test-agent     research     12      $7.62             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `SpendingFilters` — period selector (hourly/daily/weekly/monthly), wallet/agent dropdowns, date range
- `SpendingChart` — line/area chart for spending time series
- `AgentActivityTable` — ranked table sortable by spent/transactions/recent

**Data sources:**
- `GET /api/analytics/spending?period=daily&startDate=&endDate=&walletId=&agentId=` → time series
- `GET /api/analytics/agents?walletId=&limit=10&sortBy=spent` → agent rankings

---

### 10. Settings (`/settings`)

API configuration and UI preferences.

```
┌──────────────────────────────────────────────────────────────────┐
│  Settings                                                        │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Configuration                                           │  │
│  │                                                              │  │
│  │  Backend URL                                                 │  │
│  │  [http://localhost:3001_______________________]               │  │
│  │                                                              │  │
│  │  API Key                                                     │  │
│  │  [••••••••••••••••________] [show/hide toggle]               │  │
│  │                                                              │  │
│  │  Chain ID                                                    │  │
│  │  [31337 ▼]                                                   │  │
│  │                                                              │  │
│  │  Connection: ● Connected                   [Test Connection] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Preferences                                                 │  │
│  │                                                              │  │
│  │  Theme                  [Dark ▼]                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `ApiConfigForm` — inputs for backend URL, API key (masked by default), chain ID selector
- `ConnectionStatus` — green/red dot with label, test button that hits `GET /api/health`
- `ThemeSelector` — dark/light/system toggle, persisted to localStorage

**Data source:**
- `GET /api/health` → connection test

---

## Shared Components

| Component              | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `AddressDisplay`       | Monospace truncated address with copy-to-clipboard button        |
| `StatusDot`            | Colored circle indicator (green/yellow/red/gray)                 |
| `EmptyState`           | Illustration + message + CTA button for empty lists              |
| `MetricCard`           | Stat value + label in a shadcn Card, used across dashboard/payments |
| `BudgetBar`            | Progress bar that shifts green→yellow→red at 60%/80% thresholds |
| `ConfirmDialog`        | "Are you sure?" dialog for destructive actions (delete, revoke)  |
| `CopyButton`           | Icon button that copies adjacent text to clipboard               |
| `RelativeTime`         | Renders "2m ago", "3d ago" etc., auto-refreshes                  |
| `ChainBadge`           | Badge showing chain name + ID with chain-specific color          |
| `HexDisplay`           | Monospace display for hex data with truncation and copy          |
| `LoadingSkeleton`      | Pulse shimmer placeholders matching each page's layout           |
| `ErrorBoundary`        | Catches render errors, shows retry button                        |

---

## WebSocket Integration

Real-time events are consumed globally via a `WebSocketProvider` at the app root.

**Event handling:**

| Event              | UI Effect                                                           |
|--------------------|---------------------------------------------------------------------|
| `payment:recorded` | Toast notification, invalidate payments/stats queries, update activity feed |
| `agent:created`    | Toast notification, invalidate agents query, update activity feed   |
| `agent:revoked`    | Toast notification, invalidate agents query, update activity feed   |
| `budget:warning`   | Yellow toast with budget percentage, flash budget bar on dashboard  |
| `budget:exceeded`  | Red toast with alert, flash budget bar, update budget indicators    |

**Implementation:**
- Single WebSocket connection managed in a React context
- Auto-reconnect with exponential backoff
- Connection status shown in sidebar footer
- Events trigger `queryClient.invalidateQueries` for relevant query keys
- Activity feed on dashboard is a ring buffer of the last 50 events

---

## Data Fetching Patterns

All API calls go through `@tanstack/react-query`.

**Query key conventions:**
```
["wallets"]
["wallets", id]
["agents", { walletId }]
["agents", id]
["agents", id, "session"]
["agents", id, "policy"]
["policies"]
["policies", id]
["payments", filters]
["payments", "stats"]
["payments", "budget", walletId]
["analytics", "spending", filters]
["analytics", "agents", filters]
```

**Shared API client:**
- Base URL and API key read from settings (localStorage → React context)
- All requests include `X-API-KEY` header
- Error responses parsed and surfaced via toast notifications
- Stale time: 30s for lists, 10s for real-time data (budget, session status)

---

## Responsive Behavior

| Breakpoint | Layout Change                                               |
|------------|-------------------------------------------------------------|
| < 768px    | Sidebar collapses to hamburger menu, single-column cards    |
| 768-1024px | Sidebar collapses to icon-only (64px), 2-column card grid  |
| > 1024px   | Full sidebar (240px), full layout as shown in schemas above |

---

## Navigation Flows

**Primary flow (onboarding):**
```
Dashboard → Wallets → [+ New Wallet] → Policies → [+ New Policy]
→ Agents → [+ New Agent] (select wallet + policy) → Session key shown
→ Dashboard (monitor activity)
```

**Monitoring flow:**
```
Dashboard (see alert) → Payments (filter by agent/wallet) → Agent Detail (check session/policy)
```

**Policy iteration flow:**
```
Policies → [+ New Policy] → test with agent → Analytics (verify spending)
→ Policies → [Edit] or [Compose] → re-bind to agent
```

**Emergency flow:**
```
Dashboard (budget:exceeded toast) → Agent Detail → [Revoke Agent] → confirm
```
