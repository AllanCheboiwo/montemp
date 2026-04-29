# Frontend Migration Plan — Next.js + TypeScript → Vite + React + JavaScript

## What changes and why

| | Before | After |
|---|---|---|
| Framework | Next.js 16 | Vite + React |
| Language | TypeScript (.tsx / .ts) | JavaScript (.jsx / .js) |
| Routing | Next.js App Router (file-based) | React Router v6 (component-based) |
| Env vars | `NEXT_PUBLIC_*` / `process.env` | `VITE_*` / `import.meta.env` |
| Build output | `out/` (static export) | `dist/` (default Vite) |
| CSS framework | Tailwind v4 via PostCSS | Tailwind v4 via Vite plugin (faster) |

Everything else carries over unchanged — Zustand, Schedule-X, Recharts, shadcn
components, sonner, lucide-react, the `lib/` files, all component logic.

---

## Approach

Work in a new `frontend/` folder alongside the old one. The old Next.js app stays
intact until the Vite version is confirmed working, then you swap them.

1. Rename the current frontend: `frontend/` → `frontend-next/`
2. Build the Vite app in a new `frontend/`
3. Once verified, delete `frontend-next/`

---

## Phase 1 — Scaffold the Vite project

Inside `time-log/`:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

This gives you a clean Vite + React (plain JS) project with `src/main.jsx` and
`src/App.jsx` as entry points.

---

## Phase 2 — Install dependencies

### Remove (Next.js specific, not needed)
```
next
next-themes
eslint-config-next
typescript
@types/node
@types/react
@types/react-dom
```

### Add
```bash
npm install react-router-dom        # replaces Next.js routing
npm install @tailwindcss/vite       # Tailwind v4 Vite plugin (faster than PostCSS)
```

### Keep (copy from frontend-next/package.json, install in new frontend/)
```
zustand
@schedule-x/calendar
@schedule-x/calendar-controls
@schedule-x/event-modal
@schedule-x/events-service
@schedule-x/react
@schedule-x/theme-default
recharts
sonner
lucide-react
clsx
tailwind-merge
class-variance-authority
tw-animate-css
date-fns
react-day-picker
@base-ui/react
@preact/signals
preact
```

### Dev dependencies to keep
```
tailwindcss
eslint
```

---

## Phase 3 — Configure tooling

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },  // keeps @/ imports working
  },
})
```

### `src/index.css`
Copy `frontend-next/src/app/globals.css` → `src/index.css` (same Tailwind v4 CSS,
no changes needed).

### shadcn — `components.json`
Update the framework field from `next` to `vite`. Run `npx shadcn@latest init` to
regenerate it for Vite, then copy existing component files from
`frontend-next/src/components/ui/` — they are plain React components and require
zero changes.

### `.env.local`
```
VITE_API_URL=http://localhost:3000
```
(Vite requires the `VITE_` prefix; `NEXT_PUBLIC_` no longer works.)

---

## Phase 4 — Migrate `src/lib/`

Copy these files from `frontend-next/src/lib/` and convert:

| File | Changes |
|---|---|
| `api.ts` → `api.js` | Remove the `<T>` generic, remove the type cast. Change `process.env.NEXT_PUBLIC_API_URL` → `import.meta.env.VITE_API_URL` |
| `store.ts` → `store.js` | Remove all TypeScript — interfaces (`ApiTag`, `ApiLog`, `AppState`), type annotations on functions and parameters, `: Tag`, `: EventItem`, etc. Logic stays identical |
| `types.ts` → `types.js` | `export type Tag = {...}` becomes `/** @type */` JSDoc or just remove entirely — the store and components work without them |
| `date-utils.ts` → `date-utils.js` | Remove type annotations on function params and return types |
| `utils.ts` → `utils.js` | Remove type annotations |

TypeScript removal cheat sheet:
```
// Remove these entirely:
interface Foo { ... }
type Foo = { ... }
<T>, <T extends ...>
: string, : number, : boolean, : void, : Promise<X>
as SomeType
Omit<X, 'id'>

// "use client" directives — remove all of them (not needed in Vite)
```

---

## Phase 5 — Set up routing

React Router replaces Next.js file-based routing. Define all routes in `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login'
import SignupPage from './pages/signup'
import AppLayout from './pages/app-layout'
import DashboardPage from './pages/dashboard'
import SummariesPage from './pages/summaries'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/summaries" element={<SummariesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

`AppLayout` uses React Router's `<Outlet />` where Next.js used `{children}`.

### Next.js → React Router API cheat sheet

| Next.js | React Router v6 |
|---|---|
| `import { useRouter } from 'next/navigation'` | `import { useNavigate } from 'react-router-dom'` |
| `import { usePathname } from 'next/navigation'` | `import { useLocation } from 'react-router-dom'` |
| `import Link from 'next/link'` | `import { Link } from 'react-router-dom'` |
| `const router = useRouter()` | `const navigate = useNavigate()` |
| `router.push('/dashboard')` | `navigate('/dashboard')` |
| `router.replace('/login')` | `navigate('/login', { replace: true })` |
| `pathname === '/dashboard'` | `location.pathname === '/dashboard'` |
| `layout.tsx` with `{children}` | layout component with `<Outlet />` |

---

## Phase 6 — Migrate components and pages

### `src/components/` — copy from `frontend-next/src/components/`
- Remove `"use client"` from the top of every file
- Rename `.tsx` → `.jsx`
- Remove TypeScript (type annotations, interfaces, generics)
- Components using `useRouter` / `usePathname` / `Link` — swap to React Router equivalents (cheat sheet above)

Files affected by routing imports:
- `app-sidebar.tsx` — uses `useRouter`, `usePathname`
- `auth-shell.tsx` — check for any Next.js imports

### `src/pages/` — convert from `frontend-next/src/app/`

| Next.js file | New file |
|---|---|
| `app/login/page.tsx` | `src/pages/login.jsx` |
| `app/signup/page.tsx` | `src/pages/signup.jsx` |
| `app/(app)/layout.tsx` | `src/pages/app-layout.jsx` (add `<Outlet />`) |
| `app/(app)/dashboard/page.tsx` | `src/pages/dashboard.jsx` |
| `app/(app)/summaries/page.tsx` | `src/pages/summaries.jsx` |

Root redirect (`app/page.tsx`) is replaced by the `path="*"` catch-all route in
`App.jsx`.

### `src/main.jsx`
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster richColors />
  </StrictMode>
)
```

---

## Phase 7 — Dark mode

`next-themes` is gone. The simplest replacement: add `class="dark"` to `<html>` in
`index.html` to lock the app in dark mode (matching the current default). If you
want a real toggle later, add it as a small enhancement.

```html
<!-- index.html -->
<html lang="en" class="dark">
```

---

## Phase 8 — Build config for S3 / Cloudflare

Vite's default build outputs to `dist/`. Both S3 and Cloudflare Pages work with this
directly — no extra config needed.

For S3 + CloudFront: upload `dist/` contents to your bucket.
For Cloudflare Pages (later): point build command at `dist/` — done.

One setting to add to `vite.config.js` for SPA routing (so refreshing `/dashboard`
doesn't 404 on S3/CloudFront):

```js
build: {
  rollupOptions: {
    output: { manualChunks: undefined }
  }
}
```

On S3/CloudFront you also need to set the error document to `index.html` so React
Router handles 404s instead of S3.

---

## Phase 9 — Verify and clean up

```bash
cd frontend
npm run dev      # check all pages load
npm run build    # check dist/ builds without errors
```

Once everything works:
```bash
rm -rf ../frontend-next
```

Update `README.md` — port stays 3001, just swap `npm run dev` command is the same.

---

## Summary of files created in new `frontend/`

```
frontend/
  index.html              ← add class="dark" to <html>
  vite.config.js          ← new
  .env.local              ← VITE_API_URL=http://localhost:3000
  src/
    main.jsx              ← entry point with Toaster
    App.jsx               ← all routes defined here
    index.css             ← copy from globals.css
    pages/
      login.jsx
      signup.jsx
      app-layout.jsx      ← has <Outlet /> instead of {children}
      dashboard.jsx
      summaries.jsx
    components/
      app-sidebar.jsx     ← swap next/navigation → react-router-dom
      auth-shell.jsx
      event-modal.jsx
      tag-modal.jsx
      schedule-x-calendar.jsx
      ui/                 ← copy shadcn components unchanged
    lib/
      api.js              ← import.meta.env.VITE_API_URL
      store.js            ← no types, same logic
      date-utils.js
      utils.js
      types.js            ← optional, just the TAG_PALETTE array
```
