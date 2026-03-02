FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY lib/ /app/lib/

WORKDIR /app/lib/policy
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/lib/x402
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/lib/wallet
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/lib/wallet-server
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/lib/defi
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/lib/agent
RUN pnpm install --frozen-lockfile && pnpm build

COPY backend/package.json backend/pnpm-lock.yaml /app/backend/
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

COPY backend/ /app/backend/

EXPOSE 3001

CMD ["pnpm", "start"]
