# Sigloop React Webapp Documentation

Sigloop is a management dashboard for delegating blockchain transactions to AI agents using session keys, scoped policies, and x402 micropayments. It provides a complete interface for creating smart wallets, provisioning agents with time-bound permissions, defining granular spending policies, and monitoring payment activity across EVM-compatible chains.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.x |
| Language | TypeScript | 5.9.x |
| Build Tool | Vite | 7.3.x |
| Styling | TailwindCSS v4 | 4.2.x |
| Component Library | shadcn/ui (New York style) | 3.8.x |
| Icons | Lucide React | 0.575.x |
| Routing | React Router DOM | 7.13.x |
| Server State | TanStack React Query | 5.90.x |
| Testing | Jest + Testing Library | 30.2.x / 16.3.x |
| Package Manager | pnpm | latest |

---

## Architecture Overview

```
src/
  main.tsx                  # React entry point (StrictMode + root render)
  App.tsx                   # QueryClientProvider + TooltipProvider + RouterProvider
  router.tsx                # createBrowserRouter with PageContainer layout
  index.css                 # Tailwind imports + dark/light theme CSS variables
  lib/
    utils.ts                # cn() utility (clsx + tailwind-merge)
  types/
    index.ts                # Barrel re-export of all types
    wallet.ts               # Wallet, CreateWalletRequest
    agent.ts                # Agent, AgentStatus, CreateAgentRequest
    policy.ts               # Policy, SpendingLimit, Allowlist, TimeWindow, CreatePolicyRequest
    payment.ts              # Payment, PaymentStats
  api/
    client.ts               # Generic apiClient<T> fetch wrapper
    wallets.ts              # Wallet CRUD endpoints
    agents.ts               # Agent CRUD + revoke endpoints
    policies.ts             # Policy CRUD endpoints
    payments.ts             # Payment list + stats endpoints
  hooks/
    useWallet.ts            # useWallets, useWallet, useCreateWallet, useDeleteWallet
    useAgent.ts             # useAgents, useAgent, useCreateAgent, useRevokeAgent
    usePolicy.ts            # usePolicies, usePolicy, useCreatePolicy, useDeletePolicy
    useX402.ts              # usePayments, usePaymentStats
    useDefi.ts              # useSwap, useLend, useStake
    __tests__/              # Jest tests for all hooks
  components/
    ui/                     # shadcn/ui primitives (Button, Card, Badge, etc.)
    shared/                 # StatusDot, AddressDisplay, EmptyState
    layout/                 # Sidebar, Header, PageContainer
    wallet/                 # WalletCard, WalletList, CreateWalletDialog
    agent/                  # AgentCard, AgentList, CreateAgentDialog, AgentStatusBadge
    policy/                 # PolicyCard, PolicyBuilder, SpendingLimitInput, AllowlistEditor
    payment/                # PaymentTable, PaymentStats, BudgetIndicator
  pages/
    Dashboard.tsx           # Overview with stat cards, recent payments, recent agents
    Wallets.tsx             # Wallet management page
    Agents.tsx              # Agent management with status filter tabs
    Policies.tsx            # Policy management page
    Payments.tsx            # Payment history + statistics
    Settings.tsx            # API URL, chain, and appearance settings
```

---

## Data Flow

1. **Pages** render the top-level view for each route and orchestrate hooks and components.
2. **Hooks** (built on TanStack React Query) call into the **API layer** and manage cache invalidation.
3. **API functions** call the generic `apiClient`, which wraps `fetch` against the configurable backend URL.
4. **Components** receive data via props and handle local UI state (dialogs, form inputs, filters).

---

## Table of Contents

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation, dev server, build, Docker, environment variables |
| [Pages](./pages.md) | Dashboard, Wallets, Agents, Policies, Payments, Settings |
| [Hooks](./hooks.md) | useWallet, useAgent, usePolicy, useX402, useDefi |
| [API Layer](./api-layer.md) | apiClient, wallets, agents, policies, payments API functions |
| [Types](./types.md) | All TypeScript interfaces with field descriptions |
| [Layout Components](./components-layout.md) | Sidebar, Header, PageContainer |
| [Wallet Components](./components-wallet.md) | WalletCard, CreateWalletDialog, WalletList |
| [Agent Components](./components-agent.md) | AgentCard, CreateAgentDialog, AgentList, AgentStatusBadge |
| [Policy Components](./components-policy.md) | PolicyBuilder, PolicyCard, SpendingLimitInput, AllowlistEditor |
| [Payment Components](./components-payment.md) | PaymentTable, PaymentStats, BudgetIndicator |
| [Shared Components](./components-shared.md) | StatusDot, AddressDisplay, EmptyState |
| [Testing](./testing.md) | Jest setup, test coverage, mocking strategy |
| [Styling](./styling.md) | TailwindCSS, shadcn/ui, dark theme, design system |
