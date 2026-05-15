# FuelControl — Setup Guide

## Stack
- Next.js 16 (App Router) + TypeScript
- PostgreSQL via Prisma 7 ORM (with `@prisma/adapter-pg`)
- Tailwind CSS v4 + custom design tokens
- NextAuth.js v5 (Credentials provider, JWT sessions)
- TanStack Table v8, React Hook Form + Zod v4
- ExcelJS (Excel export), HTML print (PDF export)
- Zustand (filter state), Recharts (charts)

## Prerequisites
- Node.js 18+
- PostgreSQL database

## Quick Start

### 1. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/fuelcontrol"
AUTH_SECRET="generate-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed with sample data (10 logs, 5 vehicles, 5 drivers, 2 users)
npm run db:seed
```

### 4. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Default Credentials
| Role     | Email                        | Password     |
|----------|------------------------------|--------------|
| Admin    | admin@fuelcontrol.com        | admin123     |
| Operator | operador@fuelcontrol.com     | operator123  |

## Available Scripts
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (no migration files)
npm run db:migrate   # Run migrations (with migration files)
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

## Project Structure
```
app/
├── (auth)/login/          ← Login page
├── (dashboard)/
│   ├── layout.tsx         ← Protected layout with Sidebar
│   ├── dashboard/         ← Summary cards + chart
│   ├── logs/              ← Main table, new/edit forms
│   ├── vehicles/          ← Vehicle management
│   └── drivers/           ← Driver management
├── api/
│   ├── auth/[...nextauth] ← NextAuth handler
│   ├── logs/              ← CRUD + filters
│   ├── vehicles/          ← CRUD
│   ├── drivers/           ← CRUD
│   ├── dashboard/         ← Stats aggregation
│   └── exports/
│       ├── excel/         ← ExcelJS report
│       └── pdf/           ← HTML report (print to PDF)
components/
├── ui/                    ← shadcn-style primitives
├── layout/                ← Sidebar, Header, Providers
├── logs/                  ← Table, Filters, Form, ExportButtons
└── dashboard/             ← DashboardClient with Recharts
lib/
├── prisma.ts              ← Prisma singleton (Prisma 7 + pg adapter)
├── auth.ts                ← NextAuth config
├── utils.ts               ← cn(), formatDate(), formatLitres()
├── validations/           ← Zod schemas
└── exports/               ← Excel + PDF helpers
store/filterStore.ts       ← Zustand filter state
hooks/useLogs.ts           ← Data fetching hook
```

## Role-Based Access
- **ADMIN**: Full CRUD (create, read, update, delete logs, vehicles, drivers)
- **OPERATOR**: Create + Read only (no delete)

## Export Formats
- **Excel** (`/api/exports/excel`): Styled `.xlsx` with totals row, color-coded rows
- **PDF** (`/api/exports/pdf`): Printable HTML report (open in browser → Print → Save as PDF)

## Notes on Prisma 7
Prisma 7 no longer supports `url` in `schema.prisma`. Connection config lives in `prisma.config.ts`.
The PrismaClient requires an explicit adapter:
```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```
