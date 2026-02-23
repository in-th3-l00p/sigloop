# Wallet Components

[Back to README](./README.md) | [Pages](./pages.md) | [Hooks](./hooks.md) | [Types](./types.md) | [Shared Components](./components-shared.md)

Wallet components handle the display and creation of smart wallets that AI agents operate on.

**Source directory:** `src/components/wallet/`

---

## Table of Contents

- [WalletCard](#walletcard)
- [WalletList](#walletlist)
- [CreateWalletDialog](#createwalletdialog)

---

## WalletCard

**Source:** `src/components/wallet/WalletCard.tsx`

### Purpose

Displays a single wallet as a card with its name, chain, address, agent count, and total spending.

### Props Interface

```ts
interface WalletCardProps {
  wallet: Wallet;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `wallet` | `Wallet` | Yes | The wallet object to display |

### What It Renders

- **Card** with hover effect (`hover:border-primary/30`)
- **Header**: wallet name as `CardTitle` + chain name as a `Badge` (variant="secondary")
- **Address**: truncated address with copy-to-clipboard via `AddressDisplay`
- **Footer row**: agent count (Bot icon + "{count} agents") and total spent ("{amount} ETH")

### Chain Name Resolution

```ts
const chainNames: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  10: "Optimism",
  42161: "Arbitrum",
};
```

Falls back to `Chain {chainId}` for unknown chain IDs.

### Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` (shadcn/ui)
- `Badge` (shadcn/ui)
- `AddressDisplay` (shared)
- `Bot` icon (Lucide)

### Usage

```tsx
import { WalletCard } from "@/components/wallet/WalletCard";

<WalletCard
  wallet={{
    id: "w1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "My Wallet",
    chainId: 8453,
    agentCount: 3,
    totalSpent: "2.5",
    createdAt: "2024-01-01T00:00:00Z",
  }}
/>
```

---

## WalletList

**Source:** `src/components/wallet/WalletList.tsx`

### Purpose

Renders a responsive grid of `WalletCard` components, or an `EmptyState` placeholder if no wallets exist.

### Props Interface

```ts
interface WalletListProps {
  wallets: Wallet[];
  onCreateNew: () => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `wallets` | `Wallet[]` | Yes | Array of wallets to display |
| `onCreateNew` | `() => void` | Yes | Callback triggered by the EmptyState "Create Wallet" button |

### What It Renders

- **If `wallets.length === 0`**: renders `EmptyState` with Wallet icon, "No wallets yet" title, descriptive text, and a "Create Wallet" action button
- **Otherwise**: a responsive grid (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`) of `WalletCard` components

### Components Used

- `WalletCard`
- `EmptyState` (shared)
- `Wallet` icon (Lucide, aliased as `WalletIcon` to avoid naming conflict with the type)

### Usage

```tsx
import { WalletList } from "@/components/wallet/WalletList";

<WalletList
  wallets={wallets ?? []}
  onCreateNew={() => setDialogOpen(true)}
/>
```

---

## CreateWalletDialog

**Source:** `src/components/wallet/CreateWalletDialog.tsx`

### Purpose

A modal dialog for creating a new smart wallet. Contains a form with wallet name and chain selection inputs.

### Props Interface

```ts
interface CreateWalletDialogProps {
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
| `name` | `string` | `""` | Wallet name input value |
| `chainId` | `string` | `"8453"` | Selected chain ID (Base by default) |

### What It Renders

- **Dialog** (shadcn/ui) with controlled open state
- **Dialog Header**: "Create Wallet" title
- **Name input**: text field with "My Agent Wallet" placeholder
- **Chain selector**: dropdown with Ethereum, Base, Optimism, Arbitrum
- **Footer**: Cancel button (closes dialog) and Create button (submits form)

### Behavior

1. On submit, calls `useCreateWallet().mutate()` with `{ name, chainId: Number(chainId) }`
2. Create button is disabled when `name` is empty or mutation is pending
3. Shows "Creating..." text on button while pending
4. On success: resets form fields and closes the dialog

### Hooks Used

- `useCreateWallet()` from `@/hooks/useWallet`

### Components Used

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` (shadcn/ui)
- `Button`, `Input` (shadcn/ui)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (shadcn/ui)

### Usage

```tsx
import { CreateWalletDialog } from "@/components/wallet/CreateWalletDialog";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Create Wallet</Button>
<CreateWalletDialog open={open} onOpenChange={setOpen} />
```
