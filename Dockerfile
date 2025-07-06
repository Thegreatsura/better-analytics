FROM oven/bun:alpine AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/*/package.json ./packages/
COPY tooling/*/package.json ./tooling/

COPY packages/ ./packages/
COPY tooling/ ./tooling/

RUN bun install

COPY apps/api/src ./apps/api/src

ENV NODE_ENV=production

FROM oven/bun:alpine

WORKDIR /app

COPY --from=build /app ./

ENV NODE_ENV=production

CMD ["bun", "run", "apps/api/src/index.ts"]

EXPOSE 4000 