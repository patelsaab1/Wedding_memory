# Wedding Memory

Private wedding memory cloud and premium family gallery.

Media lives in **Google Drive** (master archive) and **Cloudflare R2** (private app storage). The API stores **metadata only** in MongoDB and never keeps the ~40 GB media library on the server disk.

## Status

**Phase 0**, **Phase 02**, **Phase 03 (Auth + RBAC)**, and **Phase 04 (Storage abstraction)** are in place.

Monorepo, MongoDB models, read APIs, JWT cookie auth, provider-independent storage layer, and Vitest coverage.

Feature work (live Drive/R2 SDK wiring, gallery, admin UI, premium design) comes in later phases.

## Stack

| Area     | Choice                                                               |
| -------- | -------------------------------------------------------------------- |
| Monorepo | npm workspaces                                                       |
| Web      | React 19, Vite 6, Tailwind CSS 4, React Router 7, Axios              |
| API      | Node.js (ESM), Express, MongoDB, Mongoose, Zod, Helmet, CORS, Vitest |
| Shared   | `@wedding-memory/shared` constants & helpers                         |
| Language | JavaScript (ES modules) with strict ESLint rules                     |

> The long-term roadmap may add TypeScript; this foundation intentionally uses JavaScript ESM as specified for Phase 0.

## Repository structure

```
apps/web     → frontend
apps/api     → backend API
packages/shared → shared constants/utils
docs/        → architecture documentation
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for design principles and storage rules.

## Prerequisites

- Node.js **20+** (tested on 22)
- npm **10+**
- MongoDB running locally (default URI in `apps/api/.env`)

## Setup

```bash
# From repository root
npm install

# Copy env examples (already seeded for local foundation)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

## Development

```bash
# Ensure MongoDB is running, then:

# API — http://localhost:4000
npm run dev:api

# Web — http://localhost:5173
npm run dev:web
```

Health endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

The web app includes a **Status** page that calls the same endpoint.

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev:web`      | Start Vite dev server                    |
| `npm run dev:api`      | Start API with `--watch`                 |
| `npm run build`        | Build all workspaces that define `build` |
| `npm run build:web`    | Production frontend build                |
| `npm run build:api`    | Syntax-check API entrypoints             |
| `npm run test`         | API Vitest suite (in-memory MongoDB)     |
| `npm run lint`         | ESLint across the monorepo               |
| `npm run format`       | Prettier write                           |
| `npm run format:check` | Prettier check                           |
| `npm run check`        | Lint + format check + tests              |

## Environment

- **API secrets** → `apps/api/.env` (never commit)
- **Web public vars** → `apps/web/.env.local` (`VITE_*` only)
- Examples: `apps/api/.env.example`, `apps/web/.env.example`

Do not put Cloudflare R2 keys or Google service credentials in the frontend.

## Not in this phase

- Google Drive / Cloudflare R2 integrations
- Authentication enforcement
- Gallery / albums / uploads / sharing UI
- Admin or wedding marketing UI

## License

Private — all rights reserved.
