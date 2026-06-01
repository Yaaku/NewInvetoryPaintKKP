# Berger Paint Inventory (InventoryCat) — Project Handover

> Read this first when continuing the project in a new session. It is the single
> source of truth for goals, architecture, conventions, and operational recipes.

## Project goal
Production-ready, **Bahasa Indonesia** web app to manage a paint store's inventory:
products/variants, suppliers, batch + expiry tracking, stock in/out/tinting/adjustment/
opname, reorder → purchase orders, movement logs, reports, RBAC, and a low-stock/expiry
email digest. Single-store MVP; clean path to multi-warehouse / PostgreSQL later.

## Tech stack
- **Next.js 15** (App Router, Server Actions, React 19), **TypeScript** (strict)
- **Prisma + SQLite** (`prisma/dev.db`); migrate to PostgreSQL by swapping `provider` + `DATABASE_URL`
- **Tailwind CSS** (CSS-variable tokens, dark mode via `.dark` class), **lucide-react** icons
- **iron-session** + **bcryptjs** auth, **Zod** validation
- Fonts: **Inter** (UI) + **JetBrains Mono** (data/mono)

## Architecture (essentials)
- Routes under `src/app/(app)/` are auth-guarded by the group layout
  (`getCurrentUser()` → redirect `/login`). Public: `/login`, `/api/cron/digest`.
- **Mutations = Server Actions** in each route's `actions.ts`, guarded by
  `requireCapability(...)`. Defense-in-depth: UI hides controls *and* server re-checks.
- **Stock engine** `src/lib/stock.ts` — `applyInbound` / `applyOutbound` / `applyAdjustment`
  run inside `prisma.$transaction` and ALWAYS write a `StockMovement`. `suggestBatch()` =
  FEFO if any batch has expiry, else FIFO. **Every stock change goes through here**
  (incl. PO receiving and tinting).
- **RBAC** `src/lib/rbac.ts`: roles `staff < manager < admin = owner`; capabilities
  `stock.write`, `catalog.manage`, `catalog.delete`, `procurement.manage`, `users.manage`.
  `src/lib/auth.ts` = `getCurrentUser`, `requireCapability`.
- **Theming**: semantic colors are CSS variables `rgb(var(--x) / <alpha-value>)` defined in
  `globals.css` `:root` + `.dark`. Toggle in Settings persists to `localStorage`; a no-flash
  init script lives in `src/app/layout.tsx`.

## Important files/folders
- `src/lib/` — `db.ts`, `auth.ts`, `rbac.ts`, `session.ts`, `stock.ts`, `digest.ts`,
  `email.ts`, `product-filters.ts`, `utils.ts` (`withFlash`), `csv.ts`
- `src/app/(app)/` — `dashboard`, `products`, `suppliers`, `stock-in`, `stock-out`,
  `tinting`, `adjustments`, `opname`, `reorder`, `purchase-orders`, `movements`,
  `reports`, `users`, `settings`
- `src/app/api/` — `cron/digest`, `search`, `export/{products,movements}`, `product-batches`
- `src/components/` — `Sidebar`, `Topbar`, `CommandPalette`, `ThemeToggle`, `ConfirmSubmit`,
  `ToastHost`, `Pagination`, `SearchBox`, `dashboard/*`
- `prisma/schema.prisma` + `prisma/seed.ts`; `.github/workflows/{ci,digest}.yml`

## Data model (Prisma)
`User`(role) · `Supplier` · `Product`(SKU unique, currentStock, minStock,
purchase/sellingPrice, isActive) · `Batch`(batchNumber, quantity, expiryDate,
conditionStatus) · `StockMovement`(type INBOUND/OUTBOUND/ADJUSTMENT/TINTING, signed
quantity, stockBefore/After) · `TintingRecord`+`TintingComponent` · `StockOpname`+
`StockOpnameItem` · `PurchaseOrder`(status draft/ordered/partial/received/cancelled)+
`PurchaseOrderItem`(quantityOrdered/Received).

## Current progress (all on `main`)
MVP complete + dark mode + Berger Paint rebrand / operational dashboard / ⌘K command
palette + low-stock/expiry email digest. CI green. Merged PRs: #1 ci/docs, #2 partial PO
receiving, #3 dark mode, #4 branding/dashboard/palette, #5 digest.

## Environment & access
- Local path: `C:\Berger_paint_Iventory` (Windows; Git Bash + PowerShell 5.1).
- GitHub: `https://github.com/Yaaku/NewInvetoryPaintKKP` (default branch `main`, protected).
- No `gh` CLI, but a token with scopes `repo`,`workflow` is in the git credential helper:
  ```bash
  TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')
  ```
  (Never print the token.)

## Run locally
```bash
npm install            # postinstall runs prisma generate
cp .env.example .env   # ensure SESSION_PASSWORD >= 32 chars
npx prisma db push
npm run db:seed
npm run dev            # http://localhost:3000
```
Login: `admin@bergerpaint.local` / `admin123`. Demo roles: `owner@` / `manajer@` /
`staf@bergerpaint.local` (`owner123` / `manajer123` / `staf123`).

## Verify an authenticated page (recipe)
```bash
SEAL=$(node -e "const {sealData}=require('iron-session');(async()=>{console.log(await sealData({userId:1,email:'admin@bergerpaint.local',name:'Admin',role:'admin'},{password:process.env.SESSION_PASSWORD||'change-this-to-a-long-random-secret-of-at-least-32-characters!!',ttl:0}))})()")
curl -s -H "Cookie: berger_inv_session=$SEAL" http://localhost:PORT/dashboard
```
Do NOT override `DATABASE_URL` on the CLI — SQLite path resolves relative to `prisma/`;
the `.env` default `file:./dev.db` is correct.

## Env vars
Required: `DATABASE_URL`, `SESSION_PASSWORD` (>=32 chars). Optional (digest): `APP_URL`,
`CRON_SECRET`, `RESEND_API_KEY`, `DIGEST_FROM`, `DIGEST_TO`. Constant `NEAR_EXPIRY_DAYS=60`
in `lib/utils.ts`. Currency = IDR (`compactRupiah`).

## Scripts
`dev` · `build` (= `prisma generate && next build`) · `start` · `lint` (`next lint`) ·
`typecheck` (`tsc --noEmit`) · `db:push` · `db:seed` · `digest` (`tsx scripts/send-digest.ts`).

## Coding conventions
- **Feature branches + PRs only — never push to `main`.** Protected: requires PR +
  green checks **Lint / Typecheck / Build** + up-to-date branch.
- **Conventional Commits.** End commit bodies with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Before pushing: `npm run lint && npm run typecheck && npm run build` must pass.
- UI text in **Bahasa Indonesia** (keep technical terms: SKU, batch, supplier, tinting, dashboard).
- Use **semantic color tokens** (never hardcode hex in components) so dark mode works.
- Feedback via `withFlash(path, msg, type)` redirects → `ToastHost`; wrap destructive
  actions in `ConfirmSubmit`.
- Icons = **lucide-react only** (Material Symbols were removed — they rendered as raw
  ligature text; do not reintroduce).

## Merge-via-API recipe (no gh CLI)
1. `POST /repos/Yaaku/NewInvetoryPaintKKP/pulls` (head, base=main).
2. If `mergeable_state:"behind"` → `PUT /pulls/N/update-branch`.
3. Poll per check: `GET /commits/{sha}/check-runs?check_name=Lint|Typecheck|Build` until
   each `conclusion:"success"`. (Do NOT count `"name":` in the bulk check-runs response —
   nested JSON fields inflate the count.)
4. `PUT /pulls/N/merge` `{"merge_method":"squash"}` → `DELETE /git/refs/heads/{branch}`.
5. Locally: `git checkout main && git fetch && git reset --hard origin/main`
   (squash diverges history; reset rather than fast-forward).

## Branch protection (`protect-main`)
Required PR (0 approvals OK) · required status checks **Lint**, **Typecheck**, **Build** ·
strict/up-to-date · block force-push · no bypass actors · merge methods merge/squash/rebase.

## Known issues / open work
- **PR #6 `feat/ui-improvements`** is OPEN with merge conflicts (`mergeable_state: dirty`).
  Adds `ProductPicker.tsx`, `MobileNav.tsx`, reworked adjustments/stock-in/stock-out forms,
  reports, products, large `globals.css` diff, Sidebar/Topbar. **Overlaps PR #4** → needs
  manual reconciliation against current `main`, or close it. DECISION PENDING.
- Merged-but-undeleted remote branches: `chore/ci-and-docs`, `feat/partial-po-receiving`
  (safe to delete).
- Error boxes using `bg-danger/5` / `text-danger` rely on a non-existent `danger` DEFAULT
  token (silently unstyled) — pre-existing, cosmetic.
- `next lint` prints a deprecation warning (harmless). Windows shows LF→CRLF warnings on add.

## Next recommended steps
1. Resolve **PR #6** (reconcile + merge, or close).
2. Configure digest in prod: `CRON_SECRET`, `RESEND_API_KEY`, `DIGEST_FROM/TO`, `APP_URL`;
   add repo secrets `DIGEST_URL` + `CRON_SECRET` for the scheduled Action.
3. Roadmap: CSV import with validation preview; multi-warehouse + PostgreSQL; barcode scanning.

## Must NOT change
- **CI job names** `Lint`, `Typecheck`, `Build` (branch-protection required checks match these).
- The **stock engine transaction pattern** — never mutate `currentStock` / batch qty without a
  `StockMovement` in the same `$transaction`.
- **`darkMode: "class"`** + the `rgb(var(--x) / <alpha-value>)` token scheme.
- The `prisma db push` workflow — **no committed migrations**; `build` must stay
  `prisma generate && next build` (do not re-add `prisma migrate deploy`).
- Do not commit `.env` or `prisma/dev.db` (git-ignored); keep `.env.example` current.
- Do not hard-delete products with movement history (deactivate instead); keep SKU unique.
