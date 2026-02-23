# Layout Components

[Back to README](./README.md) | [Pages](./pages.md) | [Shared Components](./components-shared.md) | [Styling](./styling.md)

Layout components provide the persistent shell around all pages: the sidebar navigation, the top header bar, and the root page container with the router outlet.

**Source directory:** `src/components/layout/`

---

## Table of Contents

- [PageContainer](#pagecontainer)
- [Sidebar](#sidebar)
- [Header](#header)

---

## PageContainer

**Source:** `src/components/layout/PageContainer.tsx`

### Purpose

Root layout component used by the router. It renders the `Sidebar` alongside a scrollable main content area that hosts the React Router `<Outlet />`.

### Props

None. This is a layout route component.

### What It Renders

- A full-height flex container with `bg-background`
- `Sidebar` on the left (fixed 256px width)
- `<main>` element with `flex-1 overflow-y-auto` containing the `<Outlet />`

### Usage

Used in `router.tsx` as the root layout element:

```tsx
import { createBrowserRouter } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";

export const router = createBrowserRouter([
  {
    element: <PageContainer />,
    children: [
      { path: "/", element: <Dashboard /> },
      // ...other routes
    ],
  },
]);
```

### Source Code

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function PageContainer() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Sidebar

**Source:** `src/components/layout/Sidebar.tsx`

### Purpose

Persistent vertical navigation sidebar rendered on the left side of every page. Contains the Sigloop logo/brand, navigation links, and a version footer.

### Props

None.

### What It Renders

1. **Brand header** (h=16, border-bottom):
   - A rounded square with the letter "S" on the primary background
   - "sigloop" text in bold
2. **Navigation links** -- six `NavLink` items from React Router, each with a Lucide icon:
   - `/` -- Dashboard (LayoutDashboard icon)
   - `/wallets` -- Wallets (Wallet icon)
   - `/agents` -- Agents (Bot icon)
   - `/policies` -- Policies (Shield icon)
   - `/payments` -- Payments (CreditCard icon)
   - `/settings` -- Settings (Settings icon)
3. **Version footer** -- "Sigloop v0.1.0" text at the bottom

### Active State Styling

Navigation links use React Router's `NavLink` with an `isActive` callback. Active links receive `bg-accent text-accent-foreground`. Inactive links show `text-muted-foreground` with `hover:bg-accent/50 hover:text-foreground`.

The Dashboard link (`/`) uses the `end` prop so it only highlights on an exact match.

### Usage

Automatically rendered by `PageContainer`. Not used directly in other components.

```tsx
// Internal to PageContainer
<Sidebar />
```

---

## Header

**Source:** `src/components/layout/Header.tsx`

### Purpose

Top header bar rendered at the top of each page. Displays the page title, a chain selector dropdown, and a connection status badge.

### Props Interface

```ts
interface HeaderProps {
  title: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | The page title displayed on the left side of the header |

### What It Renders

1. **Page title** (`<h1>`) on the left
2. **Chain selector** (shadcn `Select`) on the right -- defaults to Base (8453), with options for Ethereum (1), Base (8453), Optimism (10), Arbitrum (42161)
3. **Connection badge** -- a `Badge` with a green dot and "Connected" text

### Supported Chains

```ts
const chains = [
  { id: "1", name: "Ethereum" },
  { id: "8453", name: "Base" },
  { id: "10", name: "Optimism" },
  { id: "42161", name: "Arbitrum" },
];
```

### Usage

Every page component renders a `Header` as its first child:

```tsx
import { Header } from "@/components/layout/Header";

export function MyPage() {
  return (
    <div>
      <Header title="My Page" />
      <div className="p-6">
        {/* page content */}
      </div>
    </div>
  );
}
```

### Components Used

- `Badge` (shadcn/ui)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (shadcn/ui)
