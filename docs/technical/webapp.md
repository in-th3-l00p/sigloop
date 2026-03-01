# Dashboard (Webapp)

React-based management dashboard for wallets, agents, policies, and payments.

**Location:** `software/ai/webapp`
**Files:** 63 source, 26 test (89 total)
**Stack:** React 19, Vite 7, TailwindCSS v4, shadcn/ui, @tanstack/react-query

---

## Stack

| Dependency                | Version | Purpose                        |
|---------------------------|---------|--------------------------------|
| React                     | 19      | UI framework                   |
| React DOM                 | 19      | DOM rendering                  |
| React Router DOM          | 7       | Client-side routing            |
| Vite                      | 7       | Build tool and dev server      |
| TailwindCSS               | 4       | Utility-first CSS              |
| shadcn/ui                 | latest  | Component library              |
| @tanstack/react-query     | 5       | Data fetching and caching      |
| lucide-react              | latest  | Icon library                   |
| class-variance-authority  | latest  | Variant-based component styling |
| clsx + tailwind-merge     | latest  | Conditional class names         |

---

## Pages

### Dashboard

Summary view with key metrics, recent payments, and active agent count. Provides an at-a-glance overview of the platform state.

### Wallets

Create and manage ERC-4337 smart wallets. Select chain, view addresses, and monitor wallet state.

### Agents

Provision session-key agents, filter by status (active/revoked/expired), revoke agents, and view session details.

### Policies

Build and manage three policy types:
- **Spending limits** — daily/weekly caps per agent
- **Allowlists** — restrict callable contracts and functions
- **Time windows** — time-based access restrictions

Policies can be composed using AND/OR logic.

### Payments

X402 payment history table with filtering by date range, domain, and agent. Includes spending statistics and budget indicators.

### Settings

API configuration (backend URL, API key) and UI preferences (dark mode toggle).

---

## Component Architecture

### Layout

- `Header.tsx` — Top navigation bar with branding and navigation links
- `Sidebar.tsx` — Left sidebar with page navigation
- `PageContainer.tsx` — Page wrapper with consistent padding and max-width

### Page Components

| Component             | Page       | Description                              |
|-----------------------|------------|------------------------------------------|
| `AgentList.tsx`       | Agents     | Agent table with creation dialog         |
| `WalletList.tsx`      | Wallets    | Wallet cards with creation form          |
| `PolicyCard.tsx`      | Policies   | Policy display with type-specific config |
| `PaymentTable.tsx`    | Payments   | Payment history with sortable columns    |
| `PaymentStats.tsx`    | Payments   | Aggregate statistics display             |
| `BudgetIndicator.tsx` | Payments   | Visual progress bar for budget usage     |

### Shared Components

| Component              | Description                                        |
|------------------------|----------------------------------------------------|
| `AddressDisplay.tsx`   | Ethereum address with truncation and copy button   |
| `StatusDot.tsx`        | Color-coded status indicator (green/yellow/red)    |
| `EmptyState.tsx`       | Placeholder for empty lists                        |

### shadcn/ui Components

Installed via `pnpm dlx shadcn@latest add <component>`:

Button, Card, Input, Dialog, Sheet, Tabs, Select, Badge, Alert, Avatar, Tooltip, Separator, Table, Dropdown Menu

---

## Data Fetching

Uses `@tanstack/react-query` for all backend communication. Query hooks are co-located with their pages.

Pattern:
```typescript
const { data: wallets } = useQuery({
  queryKey: ["wallets"],
  queryFn: () => fetch(`${API_URL}/api/wallets`, { headers }).then(r => r.json()),
})
```

Mutations use `useMutation` with `queryClient.invalidateQueries` for cache updates.

---

## Styling

- **Dark theme** by default via TailwindCSS dark mode classes
- Consistent spacing and color tokens from shadcn/ui theme
- All custom styles use Tailwind utility classes (no custom CSS files)

---

## Environment Variables

| Variable             | Default                  | Description                   |
|----------------------|--------------------------|-------------------------------|
| `VITE_API_URL`       | `http://localhost:3001`  | Backend API base URL          |
| `VITE_ANVIL_RPC_URL` | `http://localhost:8545` | Anvil RPC for direct chain queries |
| `VITE_CHAIN_ID`      | `31337`                 | Default chain ID               |

---

## Testing

26 test files using Jest 30 + React Testing Library + @testing-library/jest-dom.

Tests cover:
- Component rendering and state
- User interaction (clicks, form submission)
- Loading and error states
- Data display and formatting

---

## Landing Page

Separate from the dashboard. Located at `software/landing/`.

**Stack:** Astro 5.17, React 19, TailwindCSS v4, shadcn/ui

**Components:**
- `Hero.astro` — Hero section with headline and CTA
- `About.astro` — Platform overview
- `Introduction.astro` — Feature introduction
- `Cta.astro` — Call-to-action section
- `Footer.astro` — Footer with links
- `DevBanner.astro` — Developer-focused banner

Static site, no backend required. Builds to static HTML/CSS/JS.
