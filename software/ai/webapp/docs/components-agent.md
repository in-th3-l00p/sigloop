# Agent Components

[Back to README](./README.md) | [Pages](./pages.md) | [Hooks](./hooks.md) | [Types](./types.md) | [Shared Components](./components-shared.md)

Agent components handle the display, creation, and status visualization of AI agents that hold delegated session keys.

**Source directory:** `src/components/agent/`

---

## Table of Contents

- [AgentStatusBadge](#agentstatusbadge)
- [AgentCard](#agentcard)
- [AgentList](#agentlist)
- [CreateAgentDialog](#createagentdialog)

---

## AgentStatusBadge

**Source:** `src/components/agent/AgentStatusBadge.tsx`

### Purpose

Renders a color-coded badge indicating an agent's current status (active, revoked, or expired).

### Props Interface

```ts
interface AgentStatusBadgeProps {
  status: AgentStatus;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `AgentStatus` | Yes | One of `"active"`, `"revoked"`, or `"expired"` |

### Status Styling

| Status | Label | Colors |
|--------|-------|--------|
| `active` | "Active" | Emerald background/text (`bg-emerald-500/15 text-emerald-500 border-emerald-500/20`) |
| `revoked` | "Revoked" | Red background/text (`bg-red-500/15 text-red-500 border-red-500/20`) |
| `expired` | "Expired" | Amber background/text (`bg-amber-500/15 text-amber-500 border-amber-500/20`) |

### What It Renders

A shadcn `Badge` with `variant="outline"` and the corresponding status-specific class names.

### Components Used

- `Badge` (shadcn/ui)

### Usage

```tsx
import { AgentStatusBadge } from "@/components/agent/AgentStatusBadge";

<AgentStatusBadge status="active" />
<AgentStatusBadge status="revoked" />
<AgentStatusBadge status="expired" />
```

---

## AgentCard

**Source:** `src/components/agent/AgentCard.tsx`

### Purpose

Displays a single agent as a card with its name, status, session key address, associated policy, and expiration date.

### Props Interface

```ts
interface AgentCardProps {
  agent: Agent;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agent` | `Agent` | Yes | The agent object to display |

### What It Renders

- **Card** with hover effect (`hover:border-primary/30`)
- **Header**: agent name as `CardTitle` + `AgentStatusBadge` showing current status
- **Session key address** via `AddressDisplay` (truncated, copy-to-clipboard)
- **Policy reference**: Shield icon + truncated policy ID (`policy.slice(0, 8)...`)
- **Expiry date**: Clock icon + formatted expiration date

### Date Formatting

The expiry date is formatted using `new Date(agent.expiresAt).toLocaleDateString()`.

### Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` (shadcn/ui)
- `AgentStatusBadge`
- `AddressDisplay` (shared)
- `Clock`, `Shield` icons (Lucide)

### Usage

```tsx
import { AgentCard } from "@/components/agent/AgentCard";

<AgentCard
  agent={{
    id: "a1",
    walletId: "w1",
    name: "Payment Bot",
    sessionKeyAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    status: "active",
    policyId: "p1234567",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2025-01-01T00:00:00Z",
  }}
/>
```

---

## AgentList

**Source:** `src/components/agent/AgentList.tsx`

### Purpose

Renders a responsive grid of `AgentCard` components, or an `EmptyState` placeholder if no agents exist.

### Props Interface

```ts
interface AgentListProps {
  agents: Agent[];
  onCreateNew: () => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agents` | `Agent[]` | Yes | Array of agents to display (may be filtered) |
| `onCreateNew` | `() => void` | Yes | Callback triggered by the EmptyState "Create Agent" button |

### What It Renders

- **If `agents.length === 0`**: renders `EmptyState` with Bot icon, "No agents found" title, descriptive text about session keys, and a "Create Agent" action button
- **Otherwise**: a responsive grid (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`) of `AgentCard` components

### Components Used

- `AgentCard`
- `EmptyState` (shared)
- `Bot` icon (Lucide)

### Usage

```tsx
import { AgentList } from "@/components/agent/AgentList";

<AgentList
  agents={filteredAgents}
  onCreateNew={() => setDialogOpen(true)}
/>
```

---

## CreateAgentDialog

**Source:** `src/components/agent/CreateAgentDialog.tsx`

### Purpose

A modal dialog for creating a new AI agent. Provides form inputs for agent name, wallet assignment, policy assignment, and expiration date. Dynamically loads available wallets and policies via hooks.

### Props Interface

```ts
interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback when dialog open state changes |

### Internal State

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | `""` | Agent name input |
| `walletId` | `string` | `""` | Selected wallet ID |
| `policyId` | `string` | `""` | Selected policy ID |
| `expiresAt` | `string` | `""` | Expiration datetime string |

### What It Renders

- **Dialog** with controlled open state
- **Header**: "Create Agent" title
- **Name input**: text field with "Payment Agent" placeholder
- **Wallet selector**: dropdown populated from `useWallets()` data
- **Policy selector**: dropdown populated from `usePolicies()` data
- **Expires At input**: `datetime-local` input
- **Footer**: Cancel and Create buttons

### Behavior

1. On submit, calls `useCreateAgent().mutate()` with `{ name, walletId, policyId, expiresAt }`
2. Create button is disabled when `name`, `walletId`, or `policyId` is empty, or mutation is pending
3. Shows "Creating..." while pending
4. On success: resets all form fields and closes the dialog

### Hooks Used

- `useCreateAgent()` from `@/hooks/useAgent`
- `useWallets()` from `@/hooks/useWallet` -- populates wallet dropdown
- `usePolicies()` from `@/hooks/usePolicy` -- populates policy dropdown

### Components Used

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` (shadcn/ui)
- `Button`, `Input` (shadcn/ui)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (shadcn/ui)

### Usage

```tsx
import { CreateAgentDialog } from "@/components/agent/CreateAgentDialog";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Create Agent</Button>
<CreateAgentDialog open={open} onOpenChange={setOpen} />
```
