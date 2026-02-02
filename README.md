# Twilight Explorer

A blockchain explorer for the Twilight network. This monorepo contains an indexer, REST API, and web frontend.

## Architecture

- **indexer** - Polls the Twilight LCD API and indexes blockchain data into PostgreSQL
- **api** - Express REST API with WebSocket support for real-time updates
- **web** - Next.js frontend for browsing blocks, transactions, deposits, and withdrawals

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose (for PostgreSQL and Redis)

## Getting Started

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` if you need to change any default values.

### 3. Start the database and Redis

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5433
- Redis on port 6379

### 4. Set up the database schema

Generate Prisma client and push schema to database:

```bash
npm run db:generate
npm run db:push
```

To reset/clear the database (drops all data and recreates tables):

```bash
npx prisma db push --force-reset
```

### 5. Run the services

Run all services together:

```bash
npm run dev
```

Or run services individually:

```bash
# Indexer only
npm run indexer

# API only
npm run api

# Web frontend only
npm run web
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web | 3000 | Next.js frontend |
| API | 3001 | REST API |
| WebSocket | 3002 | Real-time updates |
| PostgreSQL | 5433 | Database |
| Redis | 6379 | Caching and pub/sub |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services in development mode |
| `npm run build` | Build all packages |
| `npm run start` | Start all services in production mode |
| `npm run lint` | Run linting across all packages |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | See .env.example | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `TWILIGHT_LCD_URL` | `https://lcd.twilight.org` | Twilight LCD API endpoint |
| `ZKOS_DECODE_URL` | See .env.example | zkOS decode API endpoint |
| `API_PORT` | `3001` | API server port |
| `WS_PORT` | `3002` | WebSocket server port |
| `NEXT_PUBLIC_API_URL` | `http://143.198.60.224:3001` | API URL for frontend |
| `NEXT_PUBLIC_WS_URL` | `ws://143.198.60.224:3002` | WebSocket URL for frontend |
| `INDEXER_START_HEIGHT` | `1` | Block height to start indexing from |
| `INDEXER_POLL_INTERVAL` | `2000` | Polling interval in milliseconds |

## Stopping Services

```bash
# Stop the Docker containers
docker-compose down

# To also remove volumes (database data)
docker-compose down -v
```
