# Pages

[Back to README](./README.md) | [Hooks](./hooks.md) | [Layout Components](./components-layout.md) | [Types](./types.md)

All pages are rendered inside the `PageContainer` layout, which provides the persistent `Sidebar` navigation. Each page renders its own `Header` component at the top with a page title.

**Source directory:** `src/pages/`

**Router:** `src/router.tsx` -- uses `createBrowserRouter` from React Router DOM v7.

---

## Route Map

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Dashboard` | Overview with stat cards, recent payments, recent agents |
| `/wallets` | `Wallets` | Smart wallet management |
| `/agents` | `Agents` | Agent management with status filtering |
| `/policies` | `Policies` | Policy creation and management |
| `/payments` | `Payments` | x402 payment history and statistics |
| `/settings` | `Settings` | API URL, default chain, and appearance configuration |

---

## Dashboard

**Source:** `src/pages/Dashboard.tsx`
**Route:** `/`

### What It Renders

1. **Header** with title "Dashboard"
2. **Stat cards grid** (4 cards in a responsive grid):
   - Wallets count (Wallet icon)
   - Agents count (Bot icon)
   - Policies count (Shield icon)
   - Total x402 Spend in ETH (CreditCard icon)
3. **Recent Payments** section (left, 2/3 width on large screens) -- renders a `PaymentTable` with the 5 most recent payments
4. **Recent Agents** section (right, 1/3 width on large screens) -- renders a list of `Card` components showing each agent's name, session key address (via `AddressDisplay`), and status badge (via `AgentStatusBadge`)

### Hooks Used

- `useWallets()` -- wallet count
- `useAgents()` -- agent count + recent agents list
- `usePolicies()` -- policy count
- `usePayments()` -- recent payments
- `usePaymentStats()` -- total x402 spend

### Components Used

- `Header`, `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `PaymentTable`, `AgentStatusBadge`, `AddressDisplay`

---

## Wallets

**Source:** `src/pages/Wallets.tsx`
**Route:** `/wallets`

### What It Renders

1. **Header** with title "Wallets"
2. **Action bar** with description text and a "Create Wallet" button (Plus icon)
3. **Loading state** -- "Loading wallets..." text centered
4. **WalletList** -- renders a grid of `WalletCard` components, or an `EmptyState` if no wallets exist
5. **CreateWalletDialog** -- controlled dialog for creating new wallets

### Hooks Used

- `useWallets()` -- fetches wallet data, provides `isLoading` state

### State

- `dialogOpen: boolean` -- controls the `CreateWalletDialog` visibility

### Components Used

- `Header`, `Button`, `WalletList`, `CreateWalletDialog`

---

## Agents

**Source:** `src/pages/Agents.tsx`
**Route:** `/agents`

### What It Renders

1. **Header** with title "Agents"
2. **Filter tabs** (All / Active / Revoked / Expired) using shadcn `Tabs` component
3. **Create Agent button** (Plus icon)
4. **Loading state** or **AgentList** (filtered by selected tab)
5. **CreateAgentDialog** -- controlled dialog

### Hooks Used

- `useAgents()` -- fetches all agents

### State

- `dialogOpen: boolean` -- controls dialog visibility
- `filter: "all" | AgentStatus` -- current filter tab value

### Filtering Logic

```ts
const filteredAgents = (agents ?? []).filter((agent) => {
  if (filter === "all") return true;
  return agent.status === filter;
});
```

### Components Used

- `Header`, `Tabs`, `TabsList`, `TabsTrigger`, `Button`
- `AgentList`, `CreateAgentDialog`

---

## Policies

**Source:** `src/pages/Policies.tsx`
**Route:** `/policies`

### What It Renders

1. **Header** with title "Policies"
2. **Action bar** with description text and a "Create Policy" button
3. **Loading state**, **EmptyState** (with Shield icon), or a **grid of PolicyCard** components
4. **PolicyBuilder** dialog for creating new policies

### Hooks Used

- `usePolicies()` -- fetches all policies

### State

- `dialogOpen: boolean` -- controls dialog visibility

### Components Used

- `Header`, `Button`, `PolicyCard`, `PolicyBuilder`, `EmptyState`

---

## Payments

**Source:** `src/pages/Payments.tsx`
**Route:** `/payments`

### What It Renders

1. **Header** with title "Payments"
2. **PaymentStats** -- 4-card grid with Total Spent, Total Payments, Avg Per Payment, Top Domain
3. **Payment History** section heading
4. **PaymentTable** -- full table of all payments

### Hooks Used

- `usePayments()` -- payment list with `isLoading` state
- `usePaymentStats()` -- aggregated statistics with `isLoading` state

### Components Used

- `Header`, `PaymentStats`, `PaymentTable`

---

## Settings

**Source:** `src/pages/Settings.tsx`
**Route:** `/settings`

### What It Renders

1. **Header** with title "Settings"
2. **API Configuration card** -- text input for the API URL with a Save button and help text
3. **Chain Selection card** -- dropdown to select the default chain (Ethereum, Base, Optimism, Arbitrum)
4. **Separator**
5. **Appearance card** -- shows "Dark Mode" is enabled by default (disabled toggle button)

### State

- `apiUrl: string` -- initialized from `VITE_API_URL` or `"http://localhost:3001"`
- `chain: string` -- default chain ID, initialized to `"8453"` (Base)

### Supported Chains

| Chain ID | Name |
|----------|------|
| 1 | Ethereum |
| 8453 | Base |
| 10 | Optimism |
| 42161 | Arbitrum |

### Components Used

- `Header`, `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Input`, `Button`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Separator`
