# nool School Admin

School-scoped admin console for noolAI: roster (teachers/students), classes,
curriculum, analytics, and a read-only subscription view. One School Admin
account manages exactly one school - see nool-core's `CLAUDE.md` for the
role model.

Sibling app to `nool-super-admin` (product-owner console, cross-school) and
`nool-apps` (the Teacher/Student mobile app) - all three call the same
nool-core backend and share one Firebase identity provider. Visual design
(colors, type, spacing, radii) is ported directly from nool-apps'
`spec/design/assets/tokens.css`/`components.css` - the platform's one
design source of truth - see `src/app/globals.css`'s header comment.

## Stack

Next.js (App Router, TypeScript), Firebase Auth (web SDK), plain `fetch`
against nool-core's REST API - no UI framework/component library, matching
nool-apps' own from-scratch approach to the same design tokens.

## Getting started

```bash
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_BASE_URL if not localhost:8080
npm install
npm run dev
```

Requires nool-core's stack running (`docker compose up` in `nool-core`) and
a Firebase user with a `SCHOOL_ADMIN` custom claim + a matching `users` row
in Core's database (`role = 'SCHOOL_ADMIN'`, `school_id` set) - see
nool-core's `services/auth/scripts/set_role.py` for the claim and
`services/core`'s `/api/v1/admin/school-admins/invite` (called by a Super
Admin) for the real provisioning path.

## Structure

```
src/
├── app/
│   ├── login/              # sign-in
│   └── (dashboard)/         # role-gated shell: sidebar + the 6 features
│       ├── teachers/
│       ├── students/
│       ├── classes/
│       ├── curriculum/
│       ├── analytics/
│       └── subscription/    # read-only
├── components/               # Sidebar, Modal, loading/empty/error states
└── lib/
    ├── firebase.ts           # Firebase Auth init
    ├── AuthProvider.tsx       # sign-in + /me role resolution + role gate
    ├── apiClient.ts           # fetch wrapper: auth header, error mapping
    ├── api.ts                 # typed calls to every /school/* endpoint
    ├── types.ts                # response/request shapes, mirrors the backend schemas
    └── useAsyncData.ts          # shared loading/error/success fetch hook
```

## Auth model

Firebase ID token -> nool-core's `GET /api/v1/me` -> `role`. A signed-in
user whose role isn't `SCHOOL_ADMIN` sees a clear "wrong role" screen, never
the admin shell - see `src/app/(dashboard)/layout.tsx`. This is a UX gate
only; the real security boundary is nool-core's own `require_role` on every
`/school/*` route.

## Docker

```bash
docker compose --env-file .env.local build
docker compose --env-file .env.local up -d
curl http://localhost:3100/api/health
```

`compose.yml` only runs `--env-file .env.local` explicitly because Docker
Compose auto-loads a file literally named `.env`, not `.env.local` - copy
`.env.local` to `.env` instead if you'd rather not pass the flag every
time. `NEXT_PUBLIC_*` vars are inlined into the client bundle at build
time (a Next.js/browser constraint, not a choice) via the Dockerfile's
build `ARG`s - these are all public-by-design values (a Firebase web
config identifies the project, not a secret), never a real secret behind
that prefix.

The container only needs its own port published - `NEXT_PUBLIC_API_BASE_URL`
calls happen from the browser on the host, not from inside the container,
so no shared Docker network with `nool-core` is required even though this
app depends on nool-core's API being reachable.

`docker compose down` stops it; nothing here is meant to run continuously
in local dev - `npm run dev` is faster for iteration.
