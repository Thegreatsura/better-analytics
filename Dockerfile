FROM oven/bun AS build

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

RUN bun build \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
    --sourcemap \
	./apps/api/src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/apps/api/src/index.js ./

ENV NODE_ENV=production

CMD ["./index.js"]

EXPOSE 4000 