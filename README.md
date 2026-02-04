# Miniblog

A minimal, feature-rich blog built with Astro, Bun, Drizzle, SQLite, and Tailwind CSS v4.

## Features

- **Pure Astro** (SSR with Node adapter)
- **Bun** Runtime & Package Manager
- **Drizzle ORM** + **SQLite** (Better-SQLite3)
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

- `.env`: Production configuration (Default)
- `.env.dev`: Development/Test configuration

Example `.env`:

```env
DATABASE_URL=file:miniblog.db
DB_FILENAME=miniblog.db
OWNER_CREDENTIALS=admin:$2y$05$mGBNpRfJwgF1I1wNlVlkgON7rdIkOxAH6sF6Pn3FT75RUwCY2Pnqe
HOST=0.0.0.0
PORT=4321
NODE_ENV=production
```

To generate a password hash for `OWNER_CREDENTIALS`:

```bash
htpasswd -nBb <username> <password>
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

Tests run using the `.env.dev` configuration and a separate database.

```bash
bun run test      # Unit tests
bun run test:e2e  # E2E tests (Playwright)
```

## Docker

```bash
docker compose up --build
```
