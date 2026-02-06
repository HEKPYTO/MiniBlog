FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS release
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.js ./drizzle.config.js
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lockb ./bun.lockb

RUN bun install --production

RUN mkdir data && chown 1000:1000 data

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
ENV DB_FILENAME=data/miniblog.db

USER bun

EXPOSE 4321
CMD ["bun", "run", "start"]
