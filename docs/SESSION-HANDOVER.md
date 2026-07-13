# Session Handover — Berger Paint Inventory + KKP Report

> Continuation brief for a new chat (as of 2026-07-14). For deep app details not
> repeated here, read **`docs/HANDOVER.md`** (the app's canonical source of truth).

## Project goal
Two parallel workstreams for one paint-store inventory system:
1. **The app** — production-ready, **Bahasa Indonesia** web app to manage a paint store's
   inventory (products/variants, suppliers, batch+expiry, stock in/out/tinting/adjustment/
   opname, purchase orders, reports, RBAC, email digest).
2. **The KKP academic report** — a Kuliah Kerja Praktik paper (Universitas Budi Luhur) that
   documents this system for **CV. Cipta Insan Madani 2** (a paint distributor). Team: Rafif,
   Dhimas, Attala. Report + UML diagrams derived from the real app.

## Tech stack
- **Next.js 15** (App Router, Server Actions, React 19), **TypeScript** (strict)
- **Prisma + SQLite** (`prisma/dev.db`; `prisma db push` — NO committed migrations)
- **Tailwind** (CSS-variable semantic tokens, dark mode via `.dark`), **lucide-react** icons
- **iron-session** + **bcryptjs** auth, **Zod** validation
- KKP tooling: **python-docx**, **Pillow**, custom Python generators (no draw.io/mermaid CLI)

## Important architecture
- Routes under `src/app/(app)/` are auth-guarded by the group layout (`getCurrentUser()` →
  redirect `/login`). Public: `/login`, `/api/cron/digest`.
- **Mutations = Server Actions** in each route's `actions.ts`, guarded by `requireCapability()`.
  Defense-in-depth: UI hides controls AND server re-checks.
- **Stock engine** `src/lib/stock.ts` — `applyInbound`/`applyOutbound`/`applyAdjustment` run
  inside `prisma.$transaction` and ALWAYS write a `StockMovement`. `suggestBatch()` = FEFO/FIFO.
- **RBAC** `src/lib/rbac.ts`: roles `staff < manager < admin = owner`. Capabilities:
  `stock.write`, **`stock.verify`** (new), `catalog.manage`, `catalog.delete`,
  `procurement.manage`, `users.manage`.
- **Role-specific dashboards** (`src/app/(app)/dashboard/page.tsx` routes by role):
  - **owner** → `OwnerDashboard` (executive: masuk/keluar KPIs + 6-month SVG bar chart + nilai)
  - **manager** → `ManagerDashboard` (validation worklist hero + stats + chart)
  - **staff** → `StaffDashboard` (ONLY a `StockLookup` search list; sidebar hidden to Dashboard)
  - **admin** → `AdminDashboard` (the original full operational dashboard)
- **Charts** = inline SVG (`StockFlowChart`), no chart library, semantic tokens, dark-mode safe.

## Important decisions already made
- **KKP tech = real app** (Next.js/React/Prisma/SQLite), not the PHP/Laravel/MySQL the draft
  originally described. BAB II updated accordingly.
- **KKP scope = core inventory** (barang, pemasok, batch, transaksi_stok, pengguna); Indonesian
  table names; 2 actors (Pemilik, Admin, with Pemilik generalizing Admin).
- **Charts via inline SVG**, not a dependency.
- **Staff = stock-lookup-only** role (per user): sidebar shows only Dashboard; dashboard shows
  only the "Cek Stok Barang" search (answers "apakah ada cat ini?"); no financial figures.
- **Manager = validation** (separation of duties): chose **verify-after-recording** (adds
  metadata; stock engine untouched) over a blocking approval queue.

## Important files/folders
App:
- `src/lib/` — `stock.ts`, `auth.ts`, `rbac.ts`, `session.ts`, `dashboard-metrics.ts` (monthly
  flow + compactRupiah), `validation.ts` (validation worklist queries), `utils.ts`
- `src/components/dashboard/` — `AdminDashboard`, `OwnerDashboard`, `ManagerDashboard`,
  `StaffDashboard`, `StockFlowChart`, `StockLookup`, `ValidationList`, plus KpiCard/AlertsCard/etc.
- `src/app/(app)/validation/` — manager validation page + `verifyMovement`/`flagMovement` actions
- `src/app/(app)/reports/print/` — 3 printable PDF reports (masuk/keluar/kartu stok)
- `src/components/Sidebar.tsx` (`buildNavGroups` — role-filtered, exported; shared with MobileNav)
- `prisma/schema.prisma` + `prisma/seed.ts`

KKP deliverables (in `C:\Users\Dimas\Downloads\`):
- `KKP Terbaru (lanjutan).docx` — the report (BAB I–V written; figures are placeholders)
- `KKP-Diagram.drawio` — 15 UML diagrams (one per tab)
- `KKP-PNG\` — 15 rendered PNGs (01..15), ready to drop into report placeholders
- `KKP-Diagram-Mermaid.md`, and repo `docs/UML.md` — Mermaid sources
- Generators (in repo `scripts/`): `build_kkp.py` (docx), `build_drawio.py` (diagrams),
  `render_drawio_png.py` (drawio→PNG)

## Current progress
- **Merged to main:** MVP + dark mode + branding/command palette + email digest + UI
  improvements + dashboard declutter (#10) + themeColor→viewport fix (#11).
- **OPEN PRs (not merged; awaiting user go-ahead):**
  - **#12** auto-generate semantic SKU
  - **#13** printable PDF reports (3 keluaran — satisfies KKP rule of ≥3 printed transaction
    reports each joining ≥3 tables incl. the transaction table)
  - **#14** role dashboards — bundles: role routing, owner charts, staff stock-lookup,
    staff-only menu, AND **manager validation** (schema + `/validation` + worklist)
- **KKP report:** BAB II tech rewritten; BAB III finished (proses bisnis + fishbone); BAB IV
  complete (proses bisnis, aturan bisnis, use case + deskripsi, LRS/relational/spesifikasi
  basis data tables, struktur menu, rancangan layar, sequence, class BCE); BAB V done. 19 tables.
- **KKP diagrams:** use case, activity berjalan, **activity usulan (swimlane)**, class entitas,
  ERD/LRS, 6 sequences (BCE style), class BCE, **class boundary star**, **fishbone (4M
  sebab-akibat)**, struktur menu — all rendered to PNG.

## Known bugs / issues
- **Brand mismatch:** the app UI/kop says "Berger Paint" but the KKP paper is for
  "CV. Cipta Insan Madani 2". A rebrand pass is pending (user's call).
- **Restock button** style inconsistency on the low-stock table (habis=filled vs menipis=outline)
  — a 1-line unification is pending user approval.
- **Command palette (⌘K)** still lists all pages for staff even though the sidebar menu is hidden;
  mutations are still server-guarded, but if a hard lock is wanted, filter the palette too.
- **KKP figures are placeholders** — PNGs in `KKP-PNG\` must be inserted into the docx `«sisipkan
  gambar»` slots; team must still supply struktur organisasi (3.2), lembar pengesahan, and the
  running masukan/keluaran documents lampiran.
- Pre-existing/cosmetic: `bg-danger/5` uses a non-existent `danger` DEFAULT token; `next lint`
  deprecation warning; Windows LF→CRLF warnings.
- **Env note:** browser screenshot tool is flaky here; verify via authenticated `curl` (handover
  recipe) or DOM probes. Browser JS classifier had transient outages.

## Next recommended steps
1. **Merge PRs #12, #13, #14** in order (update each branch onto main before merge; poll the 3
   checks; squash-merge via REST API; then `git reset --hard origin/main` locally).
   ⚠️ #14 changes the schema — after merging, run `npx prisma db push`.
2. Insert the 15 PNGs from `KKP-PNG\` into the report's figure placeholders.
3. (Optional, user's call) rebrand app to "CV. Cipta Insan Madani 2"; unify Restock button.
4. Roadmap: CSV import w/ validation preview; multi-warehouse + PostgreSQL; barcode scanning.

## Coding conventions
- **Feature branches + PRs only — NEVER push to `main`** (protected: requires PR + green checks
  **Lint / Typecheck / Build** + up-to-date branch).
- No `gh` CLI — merge PRs via **GitHub REST API** using the token in the git credential helper
  (recipe + how to read the token in `docs/HANDOVER.md`). Never print the token.
- **Conventional Commits**; end commit bodies with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Before pushing: `npm run lint && npm run typecheck && npm run build` must pass.
- **UI text in Bahasa Indonesia** (keep SKU, batch, supplier, tinting, dashboard).
- **Semantic color tokens only — never hardcode hex** (dark mode depends on it).
- **lucide-react icons only** (no Material Symbols).
- Every stock change goes through `src/lib/stock.ts` in a `$transaction` writing a `StockMovement`.
- KKP diagrams: regenerate with the `scripts/*.py` generators, then re-run
  `render_drawio_png.py`. Sequence-diagram message text must avoid quotes/parens/em-dashes
  (Mermaid parser chokes); the draw.io/PNG pipeline is unaffected.

## Things that must NOT be changed
- **CI job names** `Lint`, `Typecheck`, `Build` (branch-protection required checks).
- The **stock engine transaction pattern** — never mutate `currentStock`/batch qty without a
  `StockMovement` in the same `$transaction`. (Manager validation adds metadata AFTER; it does
  not alter this.)
- **`darkMode: "class"`** + the `rgb(var(--x) / <alpha-value>)` token scheme.
- The **`prisma db push` workflow** — no committed migrations; `build` stays
  `prisma generate && next build` (do NOT add `prisma migrate deploy`).
- Do not commit `.env` or `prisma/dev.db` (git-ignored). Keep SKU unique; deactivate (don't
  hard-delete) products with movement history.
