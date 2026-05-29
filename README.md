# Berger Paint — Inventory Management System

A production-ready web-based inventory management system for a paint store, built from the attached PRD.

## Stack
- **Next.js 15** (App Router, Server Actions)
- **TypeScript**, strict
- **Prisma + SQLite** (single-file DB, easy migration path to Postgres)
- **Tailwind CSS** with Geist Mono / JetBrains Mono typography per PRD §14.5
- **iron-session** + bcrypt for admin login
- **Zod** for input validation

## Features
All MVP modules from the PRD are implemented:

| # | Module | Notes |
|---|---|---|
| 1 | Dashboard | Widgets + 4 panels (Low Stock, Near-Expiry, Fast Moving, Problem Stock) |
| 2 | Products | Full CRUD, variants, deactivation rule (no hard-delete if used) |
| 3 | Suppliers | CRUD, linked to products & batches |
| 4 | Stock In | Creates/updates batch, increments stock, logs movement, supplier + invoice |
| 5 | Stock Out | FEFO/FIFO batch suggestion with manual override |
| 6 | Adjustments | Required reason + notes, before/after stock recorded |
| 7 | Tinting | Multi-component, reduces base + colorants atomically |
| 8 | Stock Opname | Session-based, count vs system, confirm-to-apply |
| 9 | Movement Logs | All filters from PRD §7.8 |
| 10 | Reports | Stock by group, low-stock, expiry, fast/slow, problem stock, asset value |

## Setup

```bash
# install
npm install

# create db + apply schema
npx prisma db push

# seed admin + sample data
npm run db:seed

# dev
npm run dev
```

Open <http://localhost:3000>.

**Default login:** `admin@bergerpaint.local` / `admin123`

## Production

Set a strong `SESSION_PASSWORD` (≥32 chars) in `.env`, then:

```bash
npm run build
npm start
```

To migrate to PostgreSQL later: change the `provider` and `DATABASE_URL` in `prisma/schema.prisma` + `.env`, then `npx prisma migrate dev`.

## Project layout
```
src/
  app/
    (app)/          # authenticated routes
      dashboard/
      products/
      suppliers/
      stock-in/
      stock-out/
      adjustments/
      tinting/
      opname/
      movements/
      reports/
    login/
    api/product-batches/
  components/
  lib/
    db.ts           # Prisma client
    session.ts      # iron-session helpers
    stock.ts        # atomic inbound/outbound/adjustment helpers
    utils.ts
prisma/
  schema.prisma     # all tables from PRD §10 ERD
  seed.ts
```

## Business rules enforced (PRD §11)
- Unique SKU per product (Prisma `@unique`).
- Color/size variants = separate SKUs (modeled directly).
- Stock cannot go negative outside an explicit adjustment.
- Outbound uses FEFO when any batch has expiry, FIFO otherwise.
- Expired batches are visually flagged in the dashboard, product page, and reports.
- Products with movement history cannot be hard-deleted (deactivate instead).
- Every stock-changing operation creates a `stock_movements` record inside a DB transaction.
- Tinting reduces base paint + colorant components atomically.
- Opname differences only update inventory after admin confirmation.
