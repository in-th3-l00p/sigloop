# Shared Components

[Back to README](./README.md) | [Layout Components](./components-layout.md) | [Wallet Components](./components-wallet.md) | [Agent Components](./components-agent.md) | [Styling](./styling.md)

Shared components are reusable UI primitives used across multiple feature areas. They handle common patterns like status indicators, blockchain address display, and empty state placeholders.

**Source directory:** `src/components/shared/`

---

## Table of Contents

- [StatusDot](#statusdot)
- [AddressDisplay](#addressdisplay)
- [EmptyState](#emptystate)

---

## StatusDot

**Source:** `src/components/shared/StatusDot.tsx`

### Purpose

Renders a small colored circle to indicate status. Used for inline status indicators throughout the application.

### Props Interface

```ts
interface StatusDotProps {
  color: "green" | "red" | "yellow" | "gray";
  className?: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `color` | `"green" \| "red" \| "yellow" \| "gray"` | Yes | Dot color |
| `className` | `string` | No | Additional CSS classes |

### Color Mapping

| Color | Tailwind Class |
|-------|---------------|
| `green` | `bg-emerald-500` |
| `red` | `bg-red-500` |
| `yellow` | `bg-amber-500` |
| `gray` | `bg-zinc-500` |

### What It Renders

An inline `<span>` element with `h-2 w-2 rounded-full` and the mapped background color. Uses the `cn()` utility to merge classes.

### Usage

```tsx
import { StatusDot } from "@/components/shared/StatusDot";

<StatusDot color="green" />
<StatusDot color="red" className="mr-2" />

<div className="flex items-center gap-1.5">
  <StatusDot color="green" />
  <span>Connected</span>
</div>
```

---

## AddressDisplay

**Source:** `src/components/shared/AddressDisplay.tsx`

### Purpose

Displays a truncated blockchain address with a click-to-copy button. Shows a brief checkmark confirmation after copying. Used in `WalletCard`, `AgentCard`, and `Dashboard`.

### Props Interface

```ts
interface AddressDisplayProps {
  address: string;
  className?: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `address` | `string` | Yes | Full blockchain address (e.g., `0x1234...abcd`) |
| `className` | `string` | No | Additional CSS classes |

### Internal State

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `copied` | `boolean` | `false` | Whether the address was recently copied |

### What It Renders

A `<button>` element styled as inline-flex with:
- **Truncated address**: `{first 6 chars}...{last 4 chars}` (e.g., `0x1234...abcd`)
- **Copy icon**: `Copy` (Lucide) icon, switches to `Check` (Lucide, emerald-500) for 2 seconds after clicking

### Behavior

1. On click, copies the full `address` to clipboard using `navigator.clipboard.writeText()`
2. Sets `copied` to `true`
3. After 2000ms, resets `copied` to `false`

### Styling

- Monospace font (`font-mono text-sm`)
- Muted foreground color that transitions to foreground on hover
- Uses `cn()` to merge additional className

### Usage

```tsx
import { AddressDisplay } from "@/components/shared/AddressDisplay";

<AddressDisplay address="0x1234567890abcdef1234567890abcdef12345678" />

// With additional styling
<AddressDisplay
  address="0xabcdef..."
  className="text-xs"
/>
```

---

## EmptyState

**Source:** `src/components/shared/EmptyState.tsx`

### Purpose

A centered placeholder component shown when a list has no items. Displays an icon, title, description, and an optional call-to-action button. Used by `WalletList`, `AgentList`, and the `Policies` page.

### Props Interface

```ts
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `LucideIcon` | Yes | Lucide icon component displayed in a circular muted background |
| `title` | `string` | Yes | Heading text (e.g., "No wallets yet") |
| `description` | `string` | Yes | Explanatory text below the title (max-width `max-w-sm`) |
| `actionLabel` | `string` | No | Button label text. If omitted, no button is shown. |
| `onAction` | `() => void` | No | Callback when the action button is clicked. Required if `actionLabel` is provided. |

### What It Renders

A vertically centered flex column (`py-16 text-center`) containing:
1. **Icon circle**: `rounded-full bg-muted p-4` with the icon rendered at `h-8 w-8 text-muted-foreground`
2. **Title**: `<h3>` with `text-lg font-semibold`
3. **Description**: `<p>` with `text-sm text-muted-foreground max-w-sm`
4. **Action button** (conditional): shadcn `Button` rendered only when both `actionLabel` and `onAction` are provided

### Components Used

- `Button` (shadcn/ui)

### Usage

```tsx
import { EmptyState } from "@/components/shared/EmptyState";
import { Wallet } from "lucide-react";

// With action button
<EmptyState
  icon={Wallet}
  title="No wallets yet"
  description="Create your first smart wallet to start delegating to AI agents."
  actionLabel="Create Wallet"
  onAction={() => setDialogOpen(true)}
/>

// Without action button
<EmptyState
  icon={Search}
  title="No results"
  description="Try adjusting your search criteria."
/>
```
