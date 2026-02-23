# Getting Started

[Back to README](./README.md) | [Pages](./pages.md) | [Hooks](./hooks.md) | [API Layer](./api-layer.md) | [Types](./types.md)

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** (latest, enabled via `corepack enable`)

---

## Installation

```bash
cd software/ai/webapp
pnpm install
```

---

## Running the Development Server

```bash
pnpm dev
```

This starts Vite on `http://localhost:5173` with hot module replacement. The dev server uses the Vite React plugin and the TailwindCSS v4 Vite plugin.

---

## Building for Production

```bash
pnpm build
```

This runs the TypeScript compiler (`tsc -b`) for type checking, then `vite build` to produce an optimized bundle in `dist/`.

---

## Previewing the Production Build

```bash
pnpm preview
```

Serves the `dist/` output locally for verification before deployment.

---

## Linting

```bash
pnpm lint
```

Runs ESLint with TypeScript-ESLint, React Hooks, and React Refresh plugins across all `.ts` and `.tsx` files. The configuration is defined in `eslint.config.js`.

---

## Running Tests

```bash
pnpm jest
```

or if a test script is added:

```bash
npx jest
```

Tests use Jest 30 with `jsdom` environment, `ts-jest` for TypeScript transpilation, and `@testing-library/react` for hook rendering. CSS imports are proxied via `identity-obj-proxy`. The path alias `@/` is mapped to `<rootDir>/src/` in the Jest config.

See [Testing](./testing.md) for details on what is tested and how.

---

## Docker

A `Dockerfile` is provided for containerized development:

```dockerfile
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]
```

Build and run:

```bash
docker build -t sigloop-webapp .
docker run -p 5173:5173 sigloop-webapp
```

The `--host` flag ensures Vite binds to `0.0.0.0` so the container port is accessible from the host.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Base URL for the Sigloop backend API. All API calls from `apiClient` use this as the prefix. |

Vite exposes variables prefixed with `VITE_` to client code via `import.meta.env`. Set this in a `.env` file at the project root or pass it at build time:

```bash
VITE_API_URL=https://api.sigloop.io pnpm build
```

---

## Project Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite config with React plugin, TailwindCSS plugin, and `@` path alias |
| `tsconfig.json` | Root TypeScript config with project references and `@/*` path mapping |
| `tsconfig.app.json` | App-specific TS config targeting ES2022, strict mode, React JSX |
| `tsconfig.node.json` | Node-specific TS config for Vite config file |
| `jest.config.ts` | Jest setup with jsdom, ts-jest, CSS proxy, and path alias |
| `eslint.config.js` | Flat ESLint config with TS-ESLint, React Hooks, React Refresh |
| `components.json` | shadcn/ui configuration (New York style, neutral base color, Lucide icons) |
| `index.html` | HTML entry with `class="dark"` on `<html>` for default dark theme |
