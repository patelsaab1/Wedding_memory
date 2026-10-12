# Wedding Memory Architecture

## Purpose

Private personal wedding memory cloud and premium family gallery.

Media binaries (~40 GB and growing) are **never** stored on the Node.js application server filesystem.

| Layer             | Responsibility                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Google Drive**  | Master archive for existing photos/videos                                                      |
| **Cloudflare R2** | Private app storage: selected media, website assets, thumbnails, documents (presigned uploads) |
| **MongoDB**       | Metadata only: users, albums, media records, permissions, share links, website config          |
| **Node.js API**   | Auth, authorization, storage abstraction, business logic                                       |
| **React web**     | UI only — talks to API; never holds storage credentials                                        |

## Monorepo layout

```
weddingMemory/
├── apps/
│   ├── web/          # React + Vite + Tailwind (JavaScript ESM)
│   └── api/          # Express API (JavaScript ESM)
├── packages/
│   └── shared/       # Shared constants, utils, JSDoc types
└── docs/             # Architecture and project docs
```

Managed with **npm workspaces**.

## Layering rules

### Backend

1. **Routes** — wire HTTP paths to controllers
2. **Controllers** — thin; parse request, call services, send response
3. **Services** — business logic
4. **Repositories** — database access (MongoDB / Mongoose — later phase)
5. **Storage providers** — implement `StorageProvider`; never called directly from React

### Frontend

1. **Pages / routes** — composition and routing
2. **Features** — domain UI modules (gallery, albums, etc. — later)
3. **Services** — API wrappers
4. **Components** — reusable presentational UI
5. **No provider-specific Drive/R2 logic in React components**

## Storage abstraction

Provider-independent layer under `apps/api/src/services/storage/`.

```
controller / domain service
        ↓
  StorageManager
        ↓
  StorageProvider (interface)
        ↓
  GoogleDriveProvider | CloudflareR2Provider
```

Normalized types (use these everywhere — never SDK shapes):

- `StorageProviderType`
- `StorageFile`
- `StorageFolder`
- `StorageUploadRequest`
- `StorageDownloadRequest`

Required provider operations:

- `listFiles`
- `getFileMetadata`
- `getPreviewUrl`
- `getDownloadUrl`
- `createUploadUrl`
- `deleteFile`
- `createFolder`
- `listFolders`

`StorageManager` chooses the provider, validates configuration, delegates, and normalizes responses.

Phase 04 ships the interface + provider structure + clear `STORAGE_NOT_CONFIGURED` reporting when env vars are missing. Actual Google Drive / R2 SDK wiring and credentials come in a later phase. Secrets never leave the API process and must never appear in `VITE_*` frontend env.

## Media metadata principle

Every media document in MongoDB should carry provider-agnostic metadata, for example:

- `provider`: `"google_drive"` | `"r2"`
- `providerFileId`
- `storageKey`
- `albumId`
- `mimeType`
- `mediaType`
- `fileName`
- `fileSize`
- thumbnail fields
- `visibility`
- `createdAt` / `updatedAt`

Shared constants and JSDoc shapes start in `@wedding-memory/shared`.

## Security baselines

- No R2 / Google secrets in the frontend
- Private R2 bucket; browser uploads only via short-lived presigned URLs (later)
- Env-based configuration (`apps/api/.env`, `apps/web/.env.local`)
- Helmet, restricted CORS, centralized error handling
- Never log tokens, credentials, or sensitive payloads

## Current phase status

### Phase 0 — Foundation (done)

Monorepo, web/API shells, shared package, lint/format, health endpoint, error handling, logger.

### Phase 02 — Backend + database foundation (done)

- MongoDB + Mongoose models: User, Album, Media, Document, WebsiteSection, ShareLink, StorageConnection
- Repositories + services for albums, media, documents, website sections
- Read APIs under `/api/v1` with pagination, Zod validation, request IDs
- Vitest + Supertest + in-memory MongoDB tests

### Phase 03 — Authentication + authorization + RBAC (done)

- bcrypt password hashing
- JWT access + refresh tokens in HTTP-only cookies
- Refresh token rotation with hashed sessions in MongoDB
- CSRF double-submit for mutating requests
- Login rate limiting, inactive account checks, auth audit logs
- Centralized permissions (`media.view`, `album.manage`, …)
- Frontend `/login`, `AuthProvider`, `useAuth`, `RequireAuth`, `RequireRole`, `RequirePermission`

### Phase 04 — Storage abstraction layer (done)

- `StorageProvider` interface + `StorageManager`
- `GoogleDriveProvider` / `CloudflareR2Provider` structure with config validation
- Normalized types: `StorageFile`, `StorageFolder`, `StorageUploadRequest`, `StorageDownloadRequest`, `StorageProviderType`
- No live cloud credentials or fake production Drive/R2 APIs
- Unit tests for provider selection, invalid provider, normalization, delegation

**Still not implemented:** live Drive/R2 SDK calls, upload/share flows, admin UI, premium wedding design.

## Local development

```bash
npm install
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Health check: `GET http://localhost:4000/api/v1/health`
