# InventoryCat — Paint Store Inventory Management

A production-ready, Bahasa Indonesia inventory management system for a paint store. Built with Next.js 15, Prisma, and Tailwind CSS.

[![CI](https://github.com/Yaaku/NewInvetoryPaintKKP/actions/workflows/ci.yml/badge.svg)](https://github.com/Yaaku/NewInvetoryPaintKKP/actions/workflows/ci.yml)

## Stack

- **Next.js 15** — App Router, Server Actions, React 19
- **TypeScript** (strict)
- **Prisma + SQLite** — single-file DB for MVP, clean migration path to PostgreSQL
- **Tailwind CSS** — Inter (UI) + JetBrains Mono (data), enterprise slate/indigo theme
- **lucide-react** icons
- **iron-session** + **bcrypt** for auth, **Zod** for validation

## Features

| Area | Highlights |
|---|---|
| Dashboard | KPI cards (deep-linked), alerts, low-stock table, fast-moving products |
| Products | CRUD, color/size variants, server-side search + pagination, CSV export |
| Suppliers | CRUD, linked to products & purchase orders |
| Stock In / Out | Batch tracking, FEFO/FIFO suggestion, transactional stock + movement log |
| Tinting | Multi-component mixing, reduces base + colorant atomically |
| Adjustments | Required reason + notes, before/after recorded |
| Stock Opname | Session-based count vs system, confirm-to-apply |
| Reorder & Purchase Orders | Below-minimum suggestions → one-click PO → receive into stock |
| Movement Logs & Reports | Full filters, CSV export, asset value, fast/slow movers |
| Access control | RBAC (Pemilik / Admin Gudang / Manajer / Staf) + user management |
| UX | Notifications bell, toasts, confirm dialogs, accessibility baseline |

## Getting Started

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create your environment file
cp .env.example .env          # Windows: copy .env.example .env

# 3. Create the SQLite database from the schema
npx prisma db push

# 4. Seed an admin, demo role users, and sample data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin Gudang | `admin@bergerpaint.local` | `admin123` |
| Pemilik (Owner) | `owner@bergerpaint.local` | `owner123` |
| Manajer Toko | `manajer@bergerpaint.local` | `manajer123` |
| Staf Operasional | `staf@bergerpaint.local` | `staf123` |

> ⚠️ Change these before any real deployment.

## Environment

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma datasource. Default `file:./dev.db` (SQLite). |
| `SESSION_PASSWORD` | iron-session cookie secret — **must be ≥ 32 chars**. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

`.env` is git-ignored. See [`.env.example`](.env.example).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Apply schema to the database |
| `npm run db:seed` | Seed admin/demo users + sample data |

## Production

1. Set a strong `SESSION_PASSWORD` (≥ 32 chars) and a production `DATABASE_URL`.
2. `npm ci && npm run build && npm start`.

**PostgreSQL:** change `provider` in [`prisma/schema.prisma`](prisma/schema.prisma) to `postgresql`, point `DATABASE_URL` at your instance, then `npx prisma db push` (or adopt migrations with `npx prisma migrate dev`).

## Roles & Permissions (RBAC)

Capabilities are enforced on both the server (every mutating action) and the UI.

| Role | Stok | Kelola Produk/Supplier | Hapus | Purchase Order | Kelola Pengguna |
|---|:---:|:---:|:---:|:---:|:---:|
| Staf Operasional | ✅ | — | — | — | — |
| Manajer Toko | ✅ | ✅ | ✅ | ✅ | — |
| Admin Gudang | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pemilik | ✅ | ✅ | ✅ | ✅ | ✅ |

## Stock Digest (low-stock / expiry email)

A daily email summarising out-of-stock, low-stock, expired, and near-expiry items.

- **Endpoint:** `GET|POST /api/cron/digest`, guarded by `CRON_SECRET`
  (`Authorization: Bearer <secret>` or `?key=<secret>`).
  - `?dry=1` builds and returns the digest **without sending** (great for testing).
  - `?force=1` sends even when there is nothing to report.
- **Email provider:** [Resend](https://resend.com) via its HTTP API. Set
  `RESEND_API_KEY`, `DIGEST_FROM`, `DIGEST_TO`. Without these, it safely runs as a
  dry-run preview (never errors).
- **Local / self-hosted:** `npm run digest` (add `-- --dry` to preview). Schedule
  it with cron or Windows Task Scheduler.
- **GitHub Actions:** [`.github/workflows/digest.yml`](.github/workflows/digest.yml)
  runs daily (and on manual dispatch) and calls your deployed endpoint. Add two repo
  secrets — `DIGEST_URL` (e.g. `https://your-app/api/cron/digest`) and `CRON_SECRET`.
  If they're unset the job skips gracefully.

```bash
# Preview the digest locally (no email sent)
npm run digest -- --dry

# Hit the endpoint (replace the secret)
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/digest?dry=1"
```

## Project Layout

```
src/
  app/
    (app)/            # authenticated routes
      dashboard/  products/  suppliers/
      stock-in/  stock-out/  tinting/  adjustments/  opname/
      reorder/  purchase-orders/        # procurement
      movements/  reports/  users/  settings/
    api/export/       # CSV export routes
    api/cron/digest/  # scheduled stock digest endpoint
    login/
  components/         # Sidebar, Topbar, dashboard cards, Pagination, etc.
  lib/
    db.ts             # Prisma client
    auth.ts           # getCurrentUser / requireCapability
    rbac.ts           # roles + capabilities
    session.ts        # iron-session helpers
    stock.ts          # atomic inbound/outbound/adjustment engine
    digest.ts         # stock digest builder (html/text)
    email.ts          # Resend email sender (graceful no-op)
    product-filters.ts  utils.ts  csv.ts
scripts/
  send-digest.ts      # CLI digest runner (npm run digest)
prisma/
  schema.prisma       # data model
  seed.ts
.github/workflows/    # CI
```

## Contributing

The `main` branch is protected by intent: **all changes go through a feature branch and a Pull Request.** Do not commit directly to `main`.

### Workflow

```bash
# 1. Branch from an up-to-date main
git checkout main && git pull
git checkout -b feat/short-description

# 2. Make changes, then verify locally (must pass before pushing)
npm run lint
npm run typecheck
npm run build

# 3. Commit using Conventional Commits, then push
git push -u origin feat/short-description

# 4. Open a Pull Request on GitHub and let CI run
```

### Branch naming

`type/short-description` — e.g. `feat/partial-po-receiving`, `fix/opname-rounding`, `chore/ci-and-docs`.

### Conventional Commits

Format: `type(optional scope): subject`

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Tooling, deps, config |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting/UI-only, no logic change |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |

Examples:
```
feat(purchase-orders): support partial line-item receiving
fix(stock-out): respect FEFO when a batch is expired
docs(readme): add deployment notes
```

### CI

Every push and PR to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): **install → prisma generate → lint → typecheck → build**. A PR should be green before merge.

## Business Rules

- Unique SKU per product; color/size variants are separate SKUs.
- Stock never goes negative outside an explicit, reason-required adjustment.
- Outbound uses FEFO when any batch has an expiry date, otherwise FIFO.
- Expired/near-expiry batches are flagged on the dashboard, alerts, and reports.
- Products with movement history cannot be hard-deleted — deactivate instead.
- Every stock-changing operation writes a `StockMovement` record inside a DB transaction.
- Tinting reduces base paint + colorant components atomically.
- Stock-opname differences only update inventory after confirmation.
- Receiving a Purchase Order creates batches, increments stock, and logs movements via the shared stock engine.
