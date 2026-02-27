# 🌐 TropicTech Comprehensive Data Update & Knowledge Base

**Last Updated**: 2026-02-28 04:25:00 (WITA/GMT+8)
**System Version**: 0.1.0-alpha
**Environment**: Production Ready (Next.js 15+ Scaffolding)

---

## 🏛️ System Overview
TropicTech is a sophisticated rental management and service ecosystem designed for seamless coordination between customers, administrators, and field workers. It features an AI-orchestrated backend, real-time inventory tracking, and an automated invoicing system.

### 🚀 Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS 4, Radix UI (Shadcn), Lucide Icons
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: NextAuth.js 4
- **State/Data**: Zustand (Client State), TanStack Query v5 (Server State)
- **Utilities**: Framer Motion (Animations), Nodemailer (Email), jsPDF (Invoices), Sharp (Images)
- **AI Engine**: OpenAI Integrated with custom AI Orchestration (Sales, Worker, Risk, Seller, Master agents)

---

## 🏗️ Architecture & How It Works

### 1. Unified Dashboard System
The website operates through three distinct entry points based on user roles:
- **Client Interface**: Browse products, create orders, track rentals, and view invoices.
- **Admin Panel (`/admin`)**: Central command for managing orders, products, workers, schedules, and site settings.
- **Worker Portal (`/dashboard/worker`)**: Mobile-first interface for field workers to check attendance, update job statuses, and sync inventory.

### 2. Core Business Workflows
#### 💳 Order & Payment Flow
1. User creates an order (Draft → Awaiting Payment).
2. User uploads payment proof or pays via provider.
3. Admin verifies payment (`/api/admin/orders/[id]/confirm-payment`).
4. System auto-calculates 2% tax and generates a `Invoice`.
5. Email notifications sent to User, Workers, and Central Admin.

#### 👷 Worker Management
- **Scheduling**: Admins assign jobs to workers linked to specific orders.
- **Attendance**: Workers check-in/out via the portal. System auto-flags "LATE" attendance after 9:00 AM.
- **Reporting**: Workers submit daily reports including checklist items (Delivered, Damaged, etc.).

#### 📦 Inventory & Sync
- **Serial Tracking**: Every product unit is tracked by serial number and condition.
- **Conflict Detection**: If a worker and admin update the same stock simultaneously, the system flags a "Sync Conflict" in `InventorySyncLog` for admin resolution.

---

## 🛣️ Deep Route Audit

### 📁 Frontend Routes
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page & Product browsing |
| `/auth/login` | Public | Authentication gateway |
| `/dashboard` | User | Customer order history & Profile |
| `/admin` | Admin | Main administration analytics |
| `/admin/workers` | Admin | Worker performance & Job assignment |
| `/admin/orders` | Admin | Order management & Payment verification |
| `/dashboard/worker` | Worker | Attendance & Active assignments |
| `/invoice/public/[token]` | Public | View-only shareable invoice |

### 🔌 API Endpoints (Core)
- **Admin**:
  - `POST /api/admin/orders/[id]/confirm-payment`
  - `GET/POST /api/admin/workers`
  - `POST /api/admin/workers/[id]/message`
- **Worker**:
  - `POST /api/worker/attendance`
  - `PATCH /api/worker/schedules/[id]`
- **System**:
  - `GET /api/realtime/polling` - Central synchronization endpoint.

---

## 📂 Folder Structure Audit
- `src/app/`: Next.js App Router (Routes & Layouts).
- `src/components/`:
  - `ui/`: Base Radix/Shadcn components.
  - `admin/`: Admin-specific complex components.
  - `worker/`: Worker portal widgets.
- `src/lib/`:
  - `invoice-utils.ts`: Core tax and subtotal logic.
  - `realtime.ts`: Polling and sync infrastructure.
  - `email.ts`: Nodemailer templates and transport.
  - `db.ts`: Prisma Client singleton.
- `prisma/`:
  - `schema.prisma`: Master data model (700+ lines).
  - `seed.ts`: Initial data population.

---

## 🛠️ Build & System Operations
- **Development**: `npm run dev` (Runs on port 3000)
- **Deployment**: Next.js Standalone build.
- **Database Push**: `npx prisma db push`
- **Environment**: Managed via `.env` (Requires `DATABASE_URL`, `NEXTAUTH_SECRET`, `SUPABASE_KEY`).

---

## 📝 Recent System Updates
- [x] Implemented 2% tax auto-calc on invoices.
- [x] Added worker attendance auto-late detection.
- [X] Deployment of Inventory Sync Conflict UI.
- [x] Enhanced Public Invoice sharing (Token-based, No Auth).

> [!NOTE]
> This file is the **Source of Truth** for TropicTech system state. All major updates should be logged here before session close.
