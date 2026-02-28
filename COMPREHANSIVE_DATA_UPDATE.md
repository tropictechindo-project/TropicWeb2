# 🌐 TropicTech Comprehensive Data Update & Knowledge Base

**Last Updated**: 2026-02-28 15:20:00 (WITA/GMT+8)
**System Version**: 1.0.0-beta
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
- [x] **Category Management**: Added dynamic "Add New" category creation logic to Admin Dashboard.
- [x] **Data Cleanup**: Purged duplicate product categories (Chairs, Desks, etc.) and optimized database.
- [x] **Deployment Fix**: Added `rhel-openssl-3.0.x` binary targets to Prisma schema to resolve deployment engine errors.
- [x] **UI Connections**: Connected rental packages to their included products in public UI (`ProductDetailPage` and `ProductDetailModal`).
- [x] **Authentication Flow**: Fixed Supabase PKCE code challenge loop in Password Reset by migrating to `@supabase/ssr` with Next.js cookies. Added Exit (X) buttons to all auth modals.
- [x] **Delivery Flow Prep**: Added 'Set Delivery' mock CTA to Admin Invoices and documented Google Maps API keys (Directions, Distance Matrix, Places) in `.env` and `MIGRATION_REQUIRED.md`.
- [x] **New Delivery & Dispatch API Core**: 
  - Eradicated legacy `WorkerSchedule`, `DailyReport`, and `DeliveryChecklistItem` components to enforce "Clean Slate" system integrity.
  - Implemented 100% type-safe Prisma schema models (`Vehicle`, `Delivery`, `DeliveryItem`, `DeliveryLog`, `DeliveryEditLog`).
  - Authored `/api/admin/deliveries/*` and `/api/admin/vehicles/*` REST handlers for queue management, overrides, and cancellations.
  - Authored highly secure, atomic `/api/worker/deliveries/*` API for Workers containing explicit Transaction models for Claiming (locking vehicle pools), Updating GPS ETA, and fully robust final Delivery Completion with automated `InventorySyncLog` audits.
- [x] **New Delivery & Dispatch UI Architectures**:
  - Rebuilt `Admin Dashboard` Server/Client separation for **Deliveries Queue** and **Vehicles Fleet**. Overrides enabled via robust Shadcn modal interfaces.
  - Rebuilt `Worker Dashboard` by bifurcating classic 'Schedules' into unified **Available Pool** card interactions where Drivers select a targeted Vehicle lock and verify claim.
  - Rebuilt fully-fledged `Public Tracking` layout module in `/tracking/[code]` visually detailing Couriers, Delivery delays, and interactive event logs utilizing the new REST API outputs.
  - [x] **Worker Dashboard Optimization**:
  - Implemented **Complete Delivery Dialog** with integrated photo proof and notes support.
  - Added **12-Hour Edit Log Window** allowing workers to correct their own delivery logs before finalize.
- [x] **Next.js 15 & Type Safety Hardening**:
  - System-wide migration of 15+ API routes to **Asynchronous `params` compliance** for Next.js 15.
  - Resolved `user?.userId` vs `user?.id` property mismatches across the dashboard layer.
  - Achieved **Clean `npx tsc` status** for all core application modules.
- [x] **Supabase Security RLS Hardening**:
  - Authored `rls_hardening.sql` to resolve "Always True" warnings for `orders`, `invoices`, and `rental_items`.
  - Implemented role-based access control (RBAC) ensuring users only see their own data while Admins retain full visibility.
- [x] **Google Maps Infrastructure**:
  - Finalized server-side geography layer (`src/lib/google-maps.ts`) for secure ETA and route calculation.
  - Implemented startup environment validation to prevent deployment with missing API keys.
- [x] **Global Brand Identity Transition (Tropic Tech Bali)**: 
  - Standardized all UI components, public invoices, and automated notifications to **"Tropic Tech Bali"**.
  - Transitioned the entire ecosystem from legacy Gmail to professional domain hub: **`contact@tropictech.online`**.
- [x] **Landing Page & Animation**: 
  - Implemented cinematic **3-second fade-in** for the Hero background Image.
  - Optimized image loading with `priority` and `eager` fetch settings for LCP speed.
- [x] **SEO & Discovery Infrastructure**: 
  - **Dynamic Sitemap**: Created a dynamic `sitemap.ts` that automatically indexes all Products and Rental Packages with accurate database timestamps.
  - **Robots Management**: Configured `robots.ts` to guide search crawlers and protect sensitive admin/API paths.
  - **Schema Markup**: Enhanced JSON-LD structured data for products, FAQs, and business details.
- [x] **Final Production Build & Commitment**: 
  - Verified a **100% Successful Production Build** with `npm run build`.
  - Staged and committed **13 major architectural updates** to the local `main` branch.
- [x] **Workspace Cleanliness**: Purged all temporary logs (`tsc.log`) and scratch files to ensure a lean production-ready codebase.

> [!IMPORTANT]
> **Production Note**: The local repository is currently 13 commits ahead of origin. Run `git push origin main` manually to synchronize the cloud repository.

> [!NOTE]
> This file is the **Source of Truth** for TropicTech system state. All major updates should be logged here before session close.
