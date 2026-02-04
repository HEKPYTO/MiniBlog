# Use Bun image
FROM oven/bun:1 AS base

# Install dependencies
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

# Copy source
COPY . .

# Build Astro
RUN bun run build

# Production image
FROM oven/bun:1 AS release
WORKDIR /app

# Copy built assets
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Copy Drizzle migrations if needed to run at start
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/scripts ./scripts

# Expose port
EXPOSE 4321

# Environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

# Run the server (Astro Node adapter standalone)
CMD ["bun", "./dist/server/entry.mjs"]
