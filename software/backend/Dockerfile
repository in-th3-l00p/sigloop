FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY lib/ /app/lib/

COPY backend/package.json backend/pnpm-lock.yaml /app/backend/
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

COPY backend/ /app/backend/

EXPOSE 3001

CMD ["pnpm", "start"]
