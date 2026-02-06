# Miniblog

A minimal, feature-rich blog built with Astro, Bun, Drizzle, SQLite, and Tailwind CSS v4.

## Features

- **Pure Astro** (SSR with Node adapter)
- **Bun** Runtime & Package Manager
- **Drizzle ORM** + **SQLite** (via libsql)
- **Lucia Auth v3** (Session management with Bcrypt)
- **Tailwind CSS v4** (CSS-first config)
- **UI Components** (Button, Input, Badge, etc.)
- **Markdown/MDX** Support
- **Open Graph** Image Generation
- **Sitemap**
- **View Transitions**
- **Responsive Design**
- **Dark/Light Mode**

## Getting Started

### Prerequisites

- Bun installed
- Docker (optional)

### Environment Setup

The project uses separate environment files for production and development to prevent data pollution.

Example `.env`:

```env
DB_FILENAME=miniblog.db
OWNER_CREDENTIALS=admin:$2y$10$...
HOST=0.0.0.0
PORT=4321
NODE_ENV=production
```

To generate the `OWNER_CREDENTIALS` string, use `htpasswd` with Bcrypt:

```bash
htpasswd -nbB -C 10 username password
```

### Installation

```bash
bun install
```

### Database Setup

```bash
bun run db:push
```

### Development

```bash
bun run dev
```

### Build & Run

```bash
bun run build
bun dist/server/entry.mjs
```

### Testing

Tests run using a separate dev database.

```bash
bun run test      # Unit tests
bun run test:e2e  # E2E tests (Playwright)
```

## Docker

```bash
docker compose up --build
```
