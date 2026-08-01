# Management System

Full-stack Management System frontend built with React, Tailwind CSS, Redux Toolkit, and TanStack Query.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — utility-first styling
- **React Router DOM** — client-side routing
- **Redux Toolkit** — global state (auth, UI)
- **TanStack Query** — server state caching (ready for API integration)
- **Lucide React** — icons

## Project Structure

```
src/
├── components/       # Reusable UI & layout
│   ├── ui/           # Badge, Card, MetricCard, RoleLink, etc.
│   └── layout/       # PublicLayout, ProtectedLayout
├── features/         # Module-specific components
│   └── dashboard/    # HeroSection, MSPublishingCard, ReadSiteCard
├── pages/            # Route-level views
├── store/            # Redux store & slices
├── hooks/            # Custom hooks & providers
└── router/           # Route definitions
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Routes

| Path                     | Access    | Description                 |
| ------------------------ | --------- | --------------------------- |
| `/`                      | Public    | Dashboard landing page      |
| `/login`                 | Public    | Sign in (demo auth)         |
| `/ms-publishing`         | Protected | MS Publishing module        |
| `/read-site`             | Public    | Read Site — all departments |
| `/read-site/:department` | Public    | Department-specific view    |

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint
