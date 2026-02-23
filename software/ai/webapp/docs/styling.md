# Styling

[Back to README](./README.md) | [Layout Components](./components-layout.md) | [Shared Components](./components-shared.md) | [Getting Started](./getting-started.md)

The Sigloop webapp uses TailwindCSS v4 with the shadcn/ui component library for a consistent, dark-mode-first design system.

---

## Table of Contents

- [TailwindCSS v4 Setup](#tailwindcss-v4-setup)
- [shadcn/ui Configuration](#shadcnui-configuration)
- [shadcn/ui Components Used](#shadcnui-components-used)
- [Dark Theme](#dark-theme)
- [CSS Custom Properties](#css-custom-properties)
- [Utility Function: cn()](#utility-function-cn)
- [Design System Patterns](#design-system-patterns)
- [Color Semantics](#color-semantics)
- [Responsive Grid System](#responsive-grid-system)

---

## TailwindCSS v4 Setup

TailwindCSS v4 is integrated via the Vite plugin, not PostCSS:

**`vite.config.ts`:**
```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**`src/index.css`:**
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

The CSS file imports TailwindCSS core, the `tw-animate-css` animation utilities, and the shadcn Tailwind stylesheet. The `@custom-variant` directive defines the `dark:` variant to match elements inside a `.dark` ancestor.

---

## shadcn/ui Configuration

**`components.json`:**
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

| Setting | Value | Description |
|---------|-------|-------------|
| Style | `new-york` | The shadcn/ui visual style variant |
| RSC | `false` | No React Server Components (client-side only) |
| Base Color | `neutral` | Gray scale palette |
| CSS Variables | `true` | Colors defined as CSS custom properties |
| Icon Library | `lucide` | Lucide React for all icons |

---

## shadcn/ui Components Used

The following shadcn/ui primitives are installed in `src/components/ui/`:

| Component | File | Used In |
|-----------|------|---------|
| `Alert` | `alert.tsx` | Available (not currently used in pages) |
| `Avatar` | `avatar.tsx` | Available (not currently used in pages) |
| `Badge` | `badge.tsx` | Header, WalletCard, AgentStatusBadge, PolicyCard, PaymentTable |
| `Button` | `button.tsx` | All dialogs, EmptyState, Settings, page action bars |
| `Card` | `card.tsx` | WalletCard, AgentCard, PolicyCard, PaymentStats, Dashboard stat cards, Settings |
| `Dialog` | `dialog.tsx` | CreateWalletDialog, CreateAgentDialog, PolicyBuilder |
| `DropdownMenu` | `dropdown-menu.tsx` | Available (not currently used in pages) |
| `Input` | `input.tsx` | All create dialogs, SpendingLimitInput, AllowlistEditor, Settings |
| `Select` | `select.tsx` | Header chain selector, CreateWalletDialog, CreateAgentDialog, Settings |
| `Separator` | `separator.tsx` | PolicyBuilder, Settings |
| `Sheet` | `sheet.tsx` | Available (not currently used in pages) |
| `Table` | `table.tsx` | PaymentTable |
| `Tabs` | `tabs.tsx` | Agents page filter |
| `Tooltip` | `tooltip.tsx` | TooltipProvider wraps the entire app in App.tsx |

---

## Dark Theme

The application uses dark mode by default. The `<html>` element in `index.html` has the `dark` class:

```html
<html lang="en" class="dark">
```

The dark variant is activated via `@custom-variant dark (&:is(.dark *))` in `index.css`, which means all `dark:` prefixed utilities apply when any ancestor has the `.dark` class.

The Settings page shows "Dark Mode" as enabled with a disabled toggle button, indicating the dark theme is currently always on.

---

## CSS Custom Properties

All colors are defined as CSS custom properties using the OKLCH color space. The system defines both light (`:root`) and dark (`.dark`) theme values.

### Key Color Tokens

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Card backgrounds |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Primary actions/accents |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Border colors |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error/destructive actions |

### Radius Tokens

The base radius is `0.625rem` with computed variants:

| Token | Value |
|-------|-------|
| `--radius` | `0.625rem` |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

---

## Utility Function: cn()

**Source:** `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

The `cn()` function combines `clsx` (for conditional class joining) with `tailwind-merge` (for intelligently resolving conflicting Tailwind classes). This is used throughout all components for composing class names.

Example:

```tsx
<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-accent text-accent-foreground",
  className
)} />
```

---

## Design System Patterns

### Status Colors

The application uses a consistent color scheme for status indicators:

| Semantic | Color | Tailwind Classes |
|----------|-------|-----------------|
| Success / Active / Connected | Emerald | `bg-emerald-500`, `text-emerald-500`, `bg-emerald-500/15` |
| Warning / Expired / Caution | Amber | `bg-amber-500`, `text-amber-500`, `bg-amber-500/15` |
| Error / Revoked / Failed / Danger | Red | `bg-red-500`, `text-red-500`, `bg-red-500/15` |
| Neutral / Inactive | Zinc | `bg-zinc-500` |

### Card Hover Effect

All interactive cards use a consistent hover effect:

```tsx
<Card className="transition-colors hover:border-primary/30">
```

### Badge Variants

- `variant="secondary"` -- used for informational badges (chain name, contract count)
- `variant="outline"` -- used for status badges with custom color overrides

### Typography Scale

| Element | Classes | Usage |
|---------|---------|-------|
| Page title | `text-xl font-semibold` | Header component |
| Section heading | `text-lg font-semibold` | Dashboard sections |
| Card title | `text-base` (via CardTitle) | All cards |
| Body text | `text-sm` | Table cells, descriptions |
| Label text | `text-sm font-medium` | Form labels |
| Caption text | `text-xs text-muted-foreground` | Help text, sub-labels |
| Monospace | `font-mono text-sm` | Addresses, API URLs |

### Spacing

- Page padding: `p-6`
- Section spacing: `space-y-6`
- Card internal spacing: `space-y-2` to `space-y-4`
- Grid gaps: `gap-4`

---

## Responsive Grid System

The application uses Tailwind's responsive grid utilities:

| Context | Grid Classes |
|---------|-------------|
| Wallet/Agent/Policy cards | `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` |
| Dashboard stat cards | `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` |
| PaymentStats cards | `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` |
| Dashboard main layout | `grid gap-6 lg:grid-cols-3` (2/3 + 1/3 split) |
| SpendingLimit inputs | `grid gap-3 sm:grid-cols-3` |
| Time window inputs | `grid gap-3 sm:grid-cols-2` |
| Settings page | `max-w-2xl` container |

All grids stack to single column on mobile and expand on larger breakpoints.
