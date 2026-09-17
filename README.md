# CARE YU Quotation Generation Management System

Production-ready quotation software for **CARE YU AUTOMATION PVT LTD.**

The application recreates the five-page Canva quotation in HTML/CSS, with a live A4 preview, PostgreSQL storage, and Puppeteer PDF output that uses the same layout as the browser preview.

## Stack

- Frontend: React 18, Vite, React Router, plain CSS
- Backend: Node.js, Express, Prisma ORM, PostgreSQL
- PDF: Puppeteer (A4, exactly 5 pages)

## Pages in every quotation

1. Cover (dynamic)
2. About us (static)
3. Guarantee (static)
4. Commercial table (dynamic)
5. Terms and conditions (dynamic)

## Prerequisites

- Node.js 18+
- Access to the PostgreSQL database

## Setup

### 1. Backend

```bash
cd backend
copy .env.example .env
```

Set these values in `backend/.env`:

```
PORT=4001
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=a-long-random-secret
FRONTEND_URL=http://localhost:5173
```

Then:

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

The API starts at `http://localhost:4001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Default login

- Email: `admin@careyu.ai`
- Password: `CareYu@2026`

Change this password after first login in production.

## Workflow

1. Sign in
2. Open **Create Quotation**
3. Enter project, client, location, number and date
4. Add line items (totals calculate automatically)
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

| Method | Path | Description |
| --- | --- | --- |
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

## PDF file name

```
{quotation_number}_{client_company}_{project_name}.pdf
```

Example:

`CY260917-0001_HERO-MOTOCORP_MAINLINE-VISION-INSPECTION-SYSTEM.pdf`

## Project structure

```
frontend/   React application and A4 quotation templates
backend/    Express API, Prisma schema, Puppeteer renderer
```

## Production notes

- Keep `DATABASE_URL` and `JWT_SECRET` in environment variables only
- Run `npx prisma db push` or `npx prisma migrate deploy` against the production database
- Puppeteer downloads Chromium on `npm install`; servers may need `--no-sandbox` (already enabled)
- Frontend production build: `cd frontend && npm run build`
