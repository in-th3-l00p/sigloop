# Payment Components

[Back to README](./README.md) | [Pages](./pages.md) | [Hooks](./hooks.md) | [Types](./types.md) | [Shared Components](./components-shared.md)

Payment components handle the display of x402 micropayment data, including transaction history tables, aggregated statistics, and budget utilization indicators.

**Source directory:** `src/components/payment/`

---

## Table of Contents

- [PaymentTable](#paymenttable)
- [PaymentStats](#paymentstats)
- [BudgetIndicator](#budgetindicator)

---

## PaymentTable

**Source:** `src/components/payment/PaymentTable.tsx`

### Purpose

Renders a table of x402 payment transactions with columns for timestamp, agent name, domain, amount, and status. Shows a centered "No payments recorded yet" message when the list is empty.

### Props Interface

```ts
interface PaymentTableProps {
  payments: Payment[];
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `payments` | `Payment[]` | Yes | Array of payment records to display |

### What It Renders

A bordered, rounded container holding a `Table` with:

| Column | Content | Alignment | Style |
|--------|---------|-----------|-------|
| Time | `new Date(payment.timestamp).toLocaleString()` | Left | `text-sm text-muted-foreground` |
| Agent | `payment.agentName` | Left | `font-medium` |
| Domain | `payment.domain` | Left | `text-sm` |
| Amount | `{payment.amount} ETH` | Right | `font-mono text-sm` |
| Status | Status badge | Right | Color-coded outline badge |

### Status Styling

| Status | Colors |
|--------|--------|
| `settled` | `bg-emerald-500/15 text-emerald-500 border-emerald-500/20` |
| `pending` | `bg-amber-500/15 text-amber-500 border-amber-500/20` |
| `failed` | `bg-red-500/15 text-red-500 border-red-500/20` |

### Empty State

When `payments.length === 0`, a single table row spans all 5 columns with centered text: "No payments recorded yet".

### Components Used

- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` (shadcn/ui)
- `Badge` (shadcn/ui)

### Usage

```tsx
import { PaymentTable } from "@/components/payment/PaymentTable";

<PaymentTable payments={payments ?? []} />

// With limited results (e.g., on Dashboard)
<PaymentTable payments={(payments ?? []).slice(0, 5)} />
```

---

## PaymentStats

**Source:** `src/components/payment/PaymentStats.tsx`

### Purpose

Displays four aggregated payment statistic cards in a responsive grid: total spent, total payment count, average per payment, and top domain.

### Props Interface

```ts
interface PaymentStatsProps {
  stats: PaymentStatsType; // imported as PaymentStats from @/types, aliased to avoid name conflict
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stats` | `PaymentStats` (type) | Yes | Aggregated payment statistics object |

### What It Renders

A 4-column responsive grid (`sm:grid-cols-2 lg:grid-cols-4`) of `Card` components:

| Card | Icon | Title | Value |
|------|------|-------|-------|
| Total Spent | DollarSign | "Total Spent" | `{stats.totalSpent} ETH` |
| Total Payments | Hash | "Total Payments" | `{stats.totalPayments}` |
| Avg Per Payment | TrendingUp | "Avg Per Payment" | `{stats.avgPerPayment} ETH` |
| Top Domain | Globe | "Top Domain" | `{topDomain.domain}` with `{topDomain.amount} ETH` subtitle |

The "Top Domain" card displays "N/A" when `stats.topDomains` is empty.

### Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` (shadcn/ui)
- `DollarSign`, `Hash`, `TrendingUp`, `Globe` icons (Lucide)

### Usage

```tsx
import { PaymentStats } from "@/components/payment/PaymentStats";

const { data: stats } = usePaymentStats();

{stats && <PaymentStats stats={stats} />}
```

---

## BudgetIndicator

**Source:** `src/components/payment/BudgetIndicator.tsx`

### Purpose

Displays a labeled progress bar showing budget utilization with color-coded thresholds. Useful for visualizing how much of a spending limit has been consumed.

### Props Interface

```ts
interface BudgetIndicatorProps {
  used: number;
  total: number;
  label: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `used` | `number` | Yes | Amount spent/used |
| `total` | `number` | Yes | Total budget limit |
| `label` | `string` | Yes | Descriptive label for the budget (e.g., "Daily Limit") |

### What It Renders

1. **Label row**: label text on the left, `"{used} / {total} ETH"` on the right (both formatted to 4 decimal places)
2. **Progress bar**: a `h-2` rounded bar with a `bg-muted` track and a colored fill

### Color Thresholds

| Utilization | Bar Color | Constant |
|-------------|-----------|----------|
| 0-75% | Emerald (`bg-emerald-500`) | Normal |
| 75-90% | Amber (`bg-amber-500`) | Warning |
| 90-100% | Red (`bg-red-500`) | Danger |

### Percentage Calculation

```ts
const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
```

The percentage is capped at 100% and handles the zero-total edge case.

### Usage

```tsx
import { BudgetIndicator } from "@/components/payment/BudgetIndicator";

<BudgetIndicator used={0.75} total={1.0} label="Daily Limit" />
<BudgetIndicator used={4.8} total={5.0} label="Weekly Limit" />
<BudgetIndicator used={0.001} total={0.1} label="Per Transaction" />
```
