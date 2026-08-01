# STACconnect Management System

A full-stack document management system: a role-based publishing workflow (MS Publishing), a
public read-only document library (Read Site), and a separately-authenticated storefront for
engineering/drawing documents (Drawing Register).

## Architecture

Monorepo with two independent apps:

```
management_app/
├── backend/   Node.js + Express + MongoDB (Mongoose) API
└── frontend/  React + TypeScript + Vite SPA
```

### Tech stack

**Backend** — Express, Mongoose/MongoDB, JWT auth (access token + httpOnly refresh cookie),
Zod validation, Multer + AWS SDK v3 (Cloudflare R2 file storage), Pino logging,
Swagger/OpenAPI docs, bcrypt.

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit (client-only global
state), TanStack Query (all server state), React Router, Framer Motion, react-pdf +
docx-preview (in-app document preview).

## Features

- **MS Publishing** — full document lifecycle (Draft → Pending Assignment → Under Review →
  Pending Approval → Pending Publishing → Published → Archived) with role-based permissions
  (Author, Reviewer, Approver, Controller), versioned file uploads, comments, notifications,
  and audit logging.
- **Read Site** — public, unauthenticated browsing of published documents by department,
  category, and search, with in-app PDF/DOCX preview and download.
- **Drawing Register** — a second, separately-authenticated storefront (its own accounts,
  login, and session) for documents whose "destination" was set to Drawing Register at
  creation time. Mirrors the Read Site's browsing UI but requires sign-in.
- **User management** — Controllers manage both MS Publishing accounts and Drawing Register
  accounts from dedicated tabs (search, filter, sort, pagination, activate/deactivate, and —
  for Drawing Register accounts — password resets).
- **Notifications & audit logs** — role-aware in-app notifications (polling-based, swappable
  for real-time later) and a full audit trail of logins, uploads, edits, reviews, approvals,
  publishes, and archives.

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Cloudflare R2 bucket (for file uploads) — see `backend/.env.example`

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT secrets, and R2 credentials
npm run seed            # seeds demo departments, users, and documents
npm run dev
```

The API listens on `http://localhost:5000` by default; Swagger docs are served at
`/api/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies API calls to
`http://localhost:5000/api` by default (override with `VITE_API_URL`).

### Demo accounts

After seeding, all MS Publishing demo accounts share the password `password123` (e.g.
`admin@stac.com` for the Controller role). Drawing Register demo accounts also share
`password123` (e.g. `e.adeyemi@stac.com`) — a completely separate account system from MS
Publishing, with its own login at `/drawing-register/login`.

## Project structure

```
backend/src/
├── modules/       Feature-based modules (auth, documents, users, drawingRegisterAuth, ...)
├── middlewares/    Auth, validation, rate limiting, uploads
├── config/         Env, database, Cloudflare R2
└── database/seed.js

frontend/src/
├── features/       Feature-based modules (ms-publishing, read-site, drawing-register, ...)
├── components/     Shared UI (layout, auth guards, data tables)
├── pages/          Route-level views
├── store/          Redux slices (session/UI state only)
└── lib/            API clients, typed API response shapes
```
