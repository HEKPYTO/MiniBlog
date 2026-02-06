FROM oven/bun:1 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

FROM node:22 AS prod-deps
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm pkg delete scripts.prepare
RUN npm install --omit=dev

FROM node:22-slim AS release
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.js ./drizzle.config.js

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json

RUN mkdir data && chown 1000:1000 data

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
ENV DB_FILENAME=data/miniblog.db

USER node

EXPOSE 4321
CMD ["npm", "run", "start"]
