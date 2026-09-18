# CARE YU Quotation Generation Management System

Production quotation software for **CARE YU AUTOMATION PVT LTD.**

The application recreates the five-page Canva quotation in HTML/CSS, with a live A4 preview, PostgreSQL storage, and PDF output that uses the same layout as the browser preview.

Production architecture:

```
GitHub (main)
    → Cloudflare Workers Builds
        → ONE Cloudflare Worker
            ├── React/Vite frontend  (https://quotation.careyu.ai/)
            ├── Express API          (https://quotation.careyu.ai/api/*)
            └── PDF via Browser Rendering
                    ↓
            PostgreSQL  (via Hyperdrive when configured)
```

Local development still uses two Node processes. Production does not.

## Stack

- Frontend: React 18, Vite, React Router, plain CSS
- Backend: Node.js, Express, Prisma ORM, PostgreSQL
- Production runtime: one Cloudflare Worker
- PDF: Puppeteer locally; Cloudflare Browser Rendering (`@cloudflare/puppeteer`) in production
- Pages: exactly 5 × A4 (Cover, About Us, Guarantee, Commercial, Terms)

## Prerequisites

- Node.js 18.18+
- Access to the existing PostgreSQL database
- Cloudflare account with Workers (Paid, required for Browser Rendering)

## Local development

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4001`  
Vite proxies `/api` to the backend, so the browser always calls `/api/...`.

### 1. Backend

```bash
cd backend
copy .env.example .env
```

Set these values in `backend/.env`:

```
PORT=4001
NODE_ENV=development
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Then:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Do **not** run `prisma db push --force-reset` or any destructive reset. Existing quotation, customer, settings, and user data must remain.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

`VITE_API_URL` is not used. Development API calls are same-origin `/api` through the Vite proxy. Production API calls are same-origin `/api` on the Worker.

### Default login

- Email: `admin@careyu.ai`
- Password: `CareYu@2026`

Change this password after first login in production.

## Workflow

1. Sign in
2. Open **Create Quotation** (`/quotations/new` starts empty)
3. Enter project, client, location, number and date
4. Add line items with **+ Add Item** (delete re-numbers automatically)
5. Enter freight, installation and GST
6. Adjust terms if needed
7. Watch the live 5-page A4 preview
8. Save Draft or Generate / Download PDF / Print

Quotation numbers follow `CY + YYMMDD + sequence`, for example `CY260917-0001`. Manual override is allowed; duplicates are rejected.

## Calculations

The backend never trusts frontend totals. It recalculates:

```
itemTotal = unitPrice × quantity
subtotal = SUM(itemTotal)
totalBasicLanded = subtotal + freight + installation
gstAmount = totalBasicLanded × gstPercentage / 100
grandTotal = totalBasicLanded + gstAmount
```

Amount in words uses Indian numbering (Thousand / Lakh / Crore) and is generated from **Total Basic Landed**, matching the original quotation where GST is shown as **EXTRA**.

Currency uses `Intl.NumberFormat('en-IN')`.

## Snapshot behaviour

Each quotation stores a `companySnapshot` at creation time (name, address, website, email, phone, signature, footer). Updating **Settings** later does not change already saved quotations.

## API

All production paths are same-origin:

`https://quotation.careyu.ai/api/...`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | `{ "status": "ok", "service": "careyu-quotation" }` |
| POST | `/api/auth/login` | Login |
| GET | `/api/quotations` | List / search / filter |
| POST | `/api/quotations` | Create |
| GET | `/api/quotations/:id` | Get one |
| PUT | `/api/quotations/:id` | Update |
| DELETE | `/api/quotations/:id` | Delete |
| POST | `/api/quotations/:id/duplicate` | Duplicate |
| POST | `/api/quotations/:id/generate-pdf` | Generate PDF |
| GET | `/api/quotations/:id/pdf` | Download PDF |
| GET | `/api/customers` | Customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/settings` | Company settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/dashboard` | Dashboard stats |

Authentication uses `Authorization: Bearer <jwt>`. JWT secret stays server-side.

## PDF file name

```
{quotation_number}_{client_company}_{project_name}.pdf
```

Example:

`CY260917-0001_HERO-MOTOCORP_MAINLINE-VISION-INSPECTION-SYSTEM.pdf`

Unsafe filesystem characters are sanitized.

## Project structure

```
frontend/     React application and A4 quotation templates
backend/      Express API, Prisma schema, PDF renderer
worker/       Cloudflare Worker entry (serves API; assets serve the SPA)
wrangler.jsonc
```

# Cloudflare Production Deployment

One GitHub repository, one Worker, one domain.

Production frontend, backend, API, and PDF all run from the same Worker:

- Frontend: `https://quotation.careyu.ai/`
- API: `https://quotation.careyu.ai/api/...`

React Router routes such as `/quotations/new` are served by the Worker static-asset SPA fallback (`index.html`), not as 404s.

## 1. GitHub repository

- Repository: https://github.com/fsdengg1/careyu_quotation
- Production branch: `main`

Every future update is:

```bash
git add .
git commit -m "Update quotation system"
git push origin main
```

Cloudflare Workers Builds then installs, builds, and deploys automatically. You should not run `wrangler deploy` after every push once Git is connected.

## 2. One-time Cloudflare resources

In the Cloudflare dashboard for account `ecea99dafa2e59907d7ee4d33150bfe4`:

### R2 bucket (optional PDF cache)

R2 is optional. This Cloudflare account must enable R2 in the dashboard before a bucket can be created. Until then, PDFs are generated on demand with Browser Rendering and are not stored as files.

After R2 is enabled:

1. Create bucket `careyu-quotation-pdfs`
2. Uncomment the `r2_buckets` block in `wrangler.jsonc`

### Hyperdrive (recommended PostgreSQL pooling)

Storage & Databases → Hyperdrive → Create configuration:

1. Name: `careyu-quotation-db`
2. Connection string: the existing PostgreSQL `DATABASE_URL` (including `sslmode=require`)
3. Copy the Hyperdrive **ID**
4. Uncomment the `hyperdrive` block in `wrangler.jsonc` and paste the ID:

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "YOUR_HYPERDRIVE_ID"
  }
]
```

Until Hyperdrive is bound, the Worker uses the `DATABASE_URL` secret directly.

### Browser Rendering

Workers & Pages → Browser Rendering must be available on a Workers Paid plan. `wrangler.jsonc` already declares:

```jsonc
"browser": { "binding": "BROWSER" }
```

The Worker launches Chromium with `@cloudflare/puppeteer` and `env.BROWSER`. Stock `puppeteer.launch()` is not used in production.

## 3. Connect GitHub to Workers Builds

1. Open https://dash.cloudflare.com/ecea99dafa2e59907d7ee4d33150bfe4/home
2. **Workers & Pages** → **Create application** → **Import a repository**
3. Authorize GitHub if needed
4. Select `fsdengg1/careyu_quotation`
5. Production branch: `main`

### Build settings

| Setting | Value |
| --- | --- |
| Root directory | `/` (repository root, leave empty) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `careyu-quotation` (from `wrangler.jsonc`) |
| Worker entry | `worker/index.js` |
| Static assets | `frontend/dist` (SPA fallback enabled) |

`npm run build` does three things:

1. Builds the React/Vite frontend into `frontend/dist`
2. Runs `prisma generate`
3. Embeds PDF CSS, logo, cover image, and fonts for the Worker bundle

Wrangler then deploys **one** Worker that serves those assets and the `/api/*` Express application.

Do not create a separate Pages project, a second Worker, or a Render/Railway/Vercel backend.

## 4. Environment variables and secrets

Cloudflare Dashboard → Worker `careyu-quotation` → Settings → Variables and Secrets.

### Public variables

| Name | Value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Already set in `wrangler.jsonc` |

Do **not** create `VITE_*` variables for the database or JWT secret. Anything prefixed `VITE_` is exposed to the browser.

Optional:

| Name | When to set |
| --- | --- |
| `JWT_EXPIRES_IN` | Only if you want a non-default token lifetime (`7d`) |
| `FRONTEND_URL` | Leave **unset** in production so the API is same-origin. Set only if a separate origin must call the API. |

### Server-only secrets

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL URL. Never put this in frontend code, `wrangler.jsonc` values, or README. |
| `JWT_SECRET` | Yes | Long random string. Used only on the server. |

Production CORS is not `Access-Control-Allow-Origin: *`. Same-origin calls do not need CORS. Development still allows `http://localhost:5173`.

## 5. Prisma and database migration

Safe production command (does not reset data):

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Use the production `DATABASE_URL` in the environment when running `migrate deploy`. Run this once against the existing database after the Prisma client upgrade, then only when new migrations are added.

Never run:

- `prisma db push --force-reset`
- `prisma migrate reset`
- anything that drops quotations, customers, settings, or users

## 6. Custom domain

The Worker works first on the `*.workers.dev` URL.

Then attach:

1. Workers & Pages → `careyu-quotation` → Settings → Domains & Routes
2. Add custom domain: `quotation.careyu.ai`
3. The zone `careyu.ai` must already be on this Cloudflare account

API code uses relative `/api` paths, so the same build works on `*.workers.dev` and `quotation.careyu.ai` without frontend changes.

## 7. Production testing

After the first deploy:

```bash
node scripts/api-smoke.js https://quotation.careyu.ai
```

Manually confirm:

- `https://quotation.careyu.ai/` loads the app
- `/login`, `/dashboard`, `/quotations`, `/quotations/new`, `/customers`, `/settings` do not 404
- `/quotations/new` is empty (no previous HERO / Sricity data)
- Login, quotations, customers, settings, dashboard work
- PDF generate/download returns exactly 5 A4 pages

## 8. Automatic deployment

After GitHub is connected:

```
git add .
git commit -m "Update quotation system"
git push origin main
```

Cloudflare automatically:

1. Detects the push to `main`
2. Installs dependencies
3. Builds the frontend
4. Generates Prisma Client and PDF assets
5. Deploys the single Worker
6. Updates frontend + backend + API together

You should not separately deploy frontend, backend, or run `wrangler deploy` for ordinary updates.

Manual deploy remains available:

```bash
npm install
npm run deploy
```

## 9. Local Worker simulation (optional)

```bash
copy .dev.vars.example .dev.vars
```

Put local `DATABASE_URL` and `JWT_SECRET` in `.dev.vars` (never commit it).

```bash
npm run build
npx wrangler dev
```

Browser Rendering PDF in `wrangler dev` may require remote bindings. Local `backend` + `frontend` `npm run dev` remains the supported day-to-day workflow.

## Production notes

- Keep `DATABASE_URL` and `JWT_SECRET` in Cloudflare secrets only
- Frontend production build output: `frontend/dist`
- Worker entry: `worker/index.js`
- Production does not run `app.listen(PORT)` as a TCP server; Cloudflare `httpServerHandler` bridges Fetch to Express
- Local backend still uses `app.listen(4001)`
