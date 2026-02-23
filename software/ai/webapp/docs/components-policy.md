# Policy Components

[Back to README](./README.md) | [Pages](./pages.md) | [Hooks](./hooks.md) | [Types](./types.md) | [Shared Components](./components-shared.md)

Policy components handle the display and creation of permission policies that define spending limits, contract allowlists, and time windows for AI agents.

**Source directory:** `src/components/policy/`

---

## Table of Contents

- [PolicyCard](#policycard)
- [PolicyBuilder](#policybuilder)
- [SpendingLimitInput](#spendinglimitinput)
- [AllowlistEditor](#allowlisteditor)

---

## PolicyCard

**Source:** `src/components/policy/PolicyCard.tsx`

### Purpose

Displays a single policy as a card showing its name, contract count, spending limits, and optional time window.

### Props Interface

```ts
interface PolicyCardProps {
  policy: Policy;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `policy` | `Policy` | Yes | The policy object to display |

### What It Renders

- **Card** with hover effect (`hover:border-primary/30`)
- **Header**: policy name as `CardTitle` + a `Badge` showing the number of allowed contracts (FileText icon)
- **Spending limits grid** (3 columns):
  - Per Tx -- `policy.spending.maxPerTx` ETH
  - Daily -- `policy.spending.dailyLimit` ETH
  - Weekly -- `policy.spending.weeklyLimit` ETH
- **Time window** (conditional): shown only when `validAfter` or `validUntil` is set, displayed with a Clock icon. Format: `"{validAfter date} - {validUntil date}"`, with "Now" / "No expiry" as fallbacks.

### Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` (shadcn/ui)
- `Badge` (shadcn/ui)
- `FileText`, `Clock` icons (Lucide)

### Usage

```tsx
import { PolicyCard } from "@/components/policy/PolicyCard";

<PolicyCard
  policy={{
    id: "p1",
    name: "Default Spending Policy",
    spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
    allowlist: {
      contracts: ["0xabc..."],
      functions: ["transfer(address,uint256)"],
    },
    timeWindow: { validAfter: "2024-01-01", validUntil: "2025-01-01" },
    createdAt: "2024-01-01T00:00:00Z",
  }}
/>
```

---

## PolicyBuilder

**Source:** `src/components/policy/PolicyBuilder.tsx`

### Purpose

A comprehensive modal dialog for creating new policies. Composes `SpendingLimitInput` and `AllowlistEditor` sub-components alongside name and time window inputs.

### Props Interface

```ts
interface PolicyBuilderProps {
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
| `name` | `string` | `""` | Policy name |
| `spending` | `SpendingLimit` | `{ maxPerTx: "", dailyLimit: "", weeklyLimit: "" }` | Spending limit values |
| `allowlist` | `Allowlist` | `{ contracts: [], functions: [] }` | Contract and function allowlists |
| `validAfter` | `string` | `""` | Start of validity window |
| `validUntil` | `string` | `""` | End of validity window |

### What It Renders

- **Dialog** with `max-w-lg max-h-[85vh] overflow-y-auto` for scrollable content
- **Header**: "Create Policy" title
- **Policy Name** input with "Default Spending Policy" placeholder
- **Separator**
- **SpendingLimitInput** -- controlled sub-component for spending limits
- **Separator**
- **AllowlistEditor** -- controlled sub-component for contract/function allowlists
- **Separator**
- **Time Window** section with two `datetime-local` inputs (Valid After, Valid Until)
- **Footer**: Cancel and "Create Policy" buttons

### Behavior

1. On submit, calls `useCreatePolicy().mutate()` with `{ name, spending, allowlist, timeWindow: { validAfter, validUntil } }`
2. Create button is disabled when `name` is empty or mutation is pending
3. Shows "Creating..." while pending
4. On success: resets all state and closes dialog

### Hooks Used

- `useCreatePolicy()` from `@/hooks/usePolicy`

### Components Used

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` (shadcn/ui)
- `Button`, `Input`, `Separator` (shadcn/ui)
- `SpendingLimitInput`, `AllowlistEditor` (policy sub-components)

### Usage

```tsx
import { PolicyBuilder } from "@/components/policy/PolicyBuilder";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Create Policy</Button>
<PolicyBuilder open={open} onOpenChange={setOpen} />
```

---

## SpendingLimitInput

**Source:** `src/components/policy/SpendingLimitInput.tsx`

### Purpose

A controlled form group for editing the three spending limit fields: max per transaction, daily limit, and weekly limit. Used as a sub-component inside `PolicyBuilder`.

### Props Interface

```ts
interface SpendingLimitInputProps {
  value: SpendingLimit;
  onChange: (value: SpendingLimit) => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `SpendingLimit` | Yes | Current spending limit values |
| `onChange` | `(value: SpendingLimit) => void` | Yes | Callback with updated spending limits |

### What It Renders

- **Section heading**: "Spending Limits" (`<h4>`)
- **3-column responsive grid** (`sm:grid-cols-3`) with:
  - **Max Per Tx (ETH)** -- Input with "0.1" placeholder
  - **Daily Limit (ETH)** -- Input with "1.0" placeholder
  - **Weekly Limit (ETH)** -- Input with "5.0" placeholder

### Change Handling

Updates are immutably merged into the value object:

```ts
const handleChange = (field: keyof SpendingLimit, val: string) => {
  onChange({ ...value, [field]: val });
};
```

### Components Used

- `Input` (shadcn/ui)

### Usage

```tsx
import { SpendingLimitInput } from "@/components/policy/SpendingLimitInput";

const [spending, setSpending] = useState<SpendingLimit>({
  maxPerTx: "",
  dailyLimit: "",
  weeklyLimit: "",
});

<SpendingLimitInput value={spending} onChange={setSpending} />
```

---

## AllowlistEditor

**Source:** `src/components/policy/AllowlistEditor.tsx`

### Purpose

A dynamic list editor for managing allowed contract addresses and function signatures. Supports adding and removing entries. Used as a sub-component inside `PolicyBuilder`.

### Props Interface

```ts
interface AllowlistEditorProps {
  value: Allowlist;
  onChange: (value: Allowlist) => void;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Allowlist` | Yes | Current allowlist containing `contracts` and `functions` arrays |
| `onChange` | `(value: Allowlist) => void` | Yes | Callback with updated allowlist |

### What It Renders

Two sections, each with an "Add" button and a dynamic list of inputs:

1. **Allowed Contracts**:
   - Header with "Allowed Contracts" label and an "Add" button (Plus icon)
   - Each contract entry: a monospace `Input` with "0x..." placeholder + a remove button (X icon)

2. **Allowed Functions**:
   - Header with "Allowed Functions" label and an "Add" button (Plus icon)
   - Each function entry: a monospace `Input` with "transfer(address,uint256)" placeholder + a remove button (X icon)

### Operations

| Operation | Behavior |
|-----------|----------|
| **Add contract** | Appends an empty string to `value.contracts` |
| **Remove contract** | Filters out the entry at the given index |
| **Update contract** | Replaces the entry at the given index with the new value |
| **Add function** | Appends an empty string to `value.functions` |
| **Remove function** | Filters out the entry at the given index |
| **Update function** | Replaces the entry at the given index with the new value |

### Components Used

- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Plus`, `X` icons (Lucide)

### Usage

```tsx
import { AllowlistEditor } from "@/components/policy/AllowlistEditor";

const [allowlist, setAllowlist] = useState<Allowlist>({
  contracts: [],
  functions: [],
});

<AllowlistEditor value={allowlist} onChange={setAllowlist} />
```
