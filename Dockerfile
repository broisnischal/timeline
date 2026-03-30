
FROM oven/bun:1.3.3-alpine AS build
WORKDIR /app

# Install dependencies with cache-friendly layering.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build Nitro output.
COPY . .
RUN NITRO_PRESET=node-server bun run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Run as non-root user.
RUN addgroup -S nodejs && adduser -S nitro -G nodejs

# Copy only production runtime artifacts.
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

USER nitro
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", ".output/server/index.mjs"]
