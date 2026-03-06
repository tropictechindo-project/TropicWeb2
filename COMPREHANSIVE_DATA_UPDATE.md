# 🌐 TropicTech Comprehensive Data Update & Knowledge Base

**Last Updated**: 2026-03-06 14:42:00 (WITA/GMT+8)
**System Version**: 2.0.0-stable
**Environment**: Production Ready (Landing Page Maximization & Full Dashboard Integration)

---

## 🏛️ System Overview
TropicTech is a sophisticated rental management and service ecosystem designed for seamless coordination between customers, administrators, and field workers. It features an AI-orchestrated backend, real-time inventory tracking, an automated invoicing system, live delivery tracking (GPS/Maps), and a global tracker accessible across all roles.

### 🚀 Technology Stack
- **Framework**: Next.js 16.1.6 (App Router / Turbopack)
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS 4, Radix UI (Shadcn), Lucide Icons
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: Custom JWT + Supabase SSR Bridge
- **State/Data**: React Hooks, Server Components (App Router)
- **Utilities**: jsPDF (Invoices), Sharp (Images), Resend (Email)
- **AI Engine**: OpenAI & Google Gemini — Sales, Worker, Operator, Seller, Master agents
- **Maps**: Google Maps API (real-time GPS tracking, ETA calculation, distance-based delivery fees)
- **Storage**: Supabase Storage (Delivery proof photos, product images)
- **PWA**: Progressive Web App with install prompts for iOS & Android

---

## 🏗️ Architecture & How It Works

### 1. Unified Dashboard System
| Dashboard | Role | Key Features |
|-----------|------|--------------|
| `/` | Public | Landing Page, Products, Tracker Section, AI Chat (Ask-Me) |
| `/admin` | Admin | Full control — Orders, Workers, Deliveries, Settings, Global Tracker |
| `/dashboard/operator` | Operator | Order management, Delivery queue, Global Tracker |
| `/dashboard/worker` | Worker | Attendance, Delivery Pool, Live GPS updates |
| `/dashboard/user` | Customer | Order history, Rentals overview, Live tracking CTA |
| `/tracking` | Public | Global order search by Invoice/Order number |
| `/track/[trackingCode]` | Public | Real-time delivery map view (GPS) |

### 2. Core Business Workflows
#### 💳 Order → Payment → Delivery Flow
1. User browses products on landing page → adds to cart.
2. User places order → Invoice created (PENDING).
3. User uploads payment proof → awaiting admin confirmation.
4. Admin confirms payment → `Order`, `RentalItem`, `Delivery` records created atomically.
5. Workers see delivery in pool → claim it → update GPS location live.
6. User can track their delivery in real-time on `/track/[trackingCode]` or from User Dashboard.
7. Delivery completed → Worker uploads proof photo → status synced to all dashboards.

#### 👷 Worker Management
- **Delivery Pool**: Workers see and claim available delivery jobs.
- **Live GPS**: Workers update their location every 10s while on delivery.
- **Proof Upload**: Photos uploaded directly to Supabase Storage (Bucket: `delivery-proofs`).
- **AI Chat**: `Ask-Me (Worker AI)` available in worker sidebar for operational guidance.

#### 👤 User Experience
- **Active Rentals**: User Dashboard shows rented equipment list, not just counts.
- **Rental History**: Full historical log of all completed rentals.
- **Live Tracking**: "Track Live" CTA opens real-time GPS map for active deliveries.
- **Tracking from Landing**: New `TrackerSection` allows anyone to search by Invoice number.

---

## 🛣️ Deep Route Audit

### 📁 Frontend Routes
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page with Products, Tracker Section, ABout, AI Chat |
| `/products` | Public | Full product catalog with filters |
| `/product/[id]` | Public | Product detail page |
| `/checkout` | User | Checkout with location-based fee calculation |
| `/auth/login` | Public | Authentication gateway |
| `/auth/signup` | Public | Registration with email verification |
| `/dashboard/user` | User | Active rentals, order history, rental history |
| `/admin` | Admin | Full admin portal |
| `/dashboard/operator` | Operator | Order & delivery management |
| `/dashboard/worker` | Worker | Jobs, attendance, delivery pool |
| `/tracking` | Public | Search orders by Invoice/Order Number |
| `/track/[trackingCode]` | Public | Real-time GPS map view |
| `/invoice/public/[token]` | Public | View-only shareable invoice |

### 🔌 API Endpoints (Core)
- `POST /api/orders` — Create invoice/order
- `PATCH /api/invoices/[id]/confirm-payment` — Payment confirmation + delivery creation
- `GET /api/tracking/lookup` — Search by invoice/order number
- `GET /api/tracking/[code]` — Get delivery GPS state
- `POST /api/worker/deliveries/[id]/location` — Update worker GPS position
- `POST /api/worker/deliveries/[id]/complete` — Mark delivery done + upload proof
- `GET /api/orders/my-orders` — User's order history
- `GET /api/invoices/my-invoices` — User's invoice history
- `POST /api/ai/seller` — Landing page AI assistant (Ask-Me)
- `POST /api/ai/worker-chat` — Worker AI assistant
- `POST /api/ai/operator-chat` — Operator AI assistant
- `POST /api/ai/master` — Admin AI master control

---

## 📅 Complete System Update History

### ✅ v2.0.0 — Landing Page Maximization & Production Hardening (2026-03-06)
- **TrackerSection on Landing Page**: New premium section below Special Offers with Invoice search CTA and "Track Your Order" real-time features.
- **Icon Standardization**: Resolved `Map` / `Navigation` / `Home` naming conflicts across all dashboards by aliasing to `MapIcon`, `NavigationIcon`. Fixed all runtime `TypeError` ("Illegal constructor") and `ReferenceError` errors.
- **Hero.tsx Fix**: Fixed JSX structure — Opacity slider and scroll indicator moved to `<section>` level, restoring correct nesting and full opacity style functionality.
- **Ask-Me ChatWidget Unification**: Removed separate floating label pill. "Ask-Me" name is now integrated directly in the trigger button (icon + text). Card header also shows "Ask-Me" with black/zinc theme.
- **Delivery Search Hardening**: `/track/[trackingCode]` now falls back to searching by invoiceNumber or orderNumber if trackingCode lookup fails.
- **SEO Gold**: Removed redundant `public/sitemap.xml` and `public/robots.txt` in favor of dynamic Next.js generation. `sitemap.ts` now only returns published product routes.
- **Performance**: `loading="lazy"` applied to all below-fold images (ProductCard, SpecialOffers). Hero image upgraded to `quality={90}` with `fetchPriority="high"`.
- **Accessibility**: Comprehensive `aria-labels` added to Hero CTA, ProductCard actions, Footer links, and ChatWidget controls.
- **Production Build**: Verified `npm run build` — Exit code 0, all 100+ routes compiled successfully.
- **Commit**: `57213d2` — pushed to `origin main`.

### ✅ v1.9.5 — Dashboard Production Hardening (2026-03-05/06)
- **User Dashboard**: Active rented equipment list shows individual items (not just count). Rental history section added.
- **Global Tracker CTAs**: Admin, Operator, and Worker dashboards all have Global Tracker access buttons in their sidebars.
- **Worker Upload Fix**: Resolved "Bucket Not Found" error — standardized Supabase bucket name to `delivery-proofs`.
- **User Delivery Access**: "Active Shipments" card opens delivery popup — users can see their own deliveries only.
- **AI Ask-Me Branding**: Consistent "Ask-Me" black branding across Worker and Operator chat panels.

### ✅ v1.9.0 — Global Tracking & Inventory Sync
- Fixed Global Tracker 404s; added support for Invoice Number / Order Code lookups.
- Implemented `PAUSED` pickup state with Cron unlock 1 day before scheduled ETA.
- Added "Live Track" CTAs across all dashboard tiers.

### ✅ v1.7.7 — Operator Dashboard Refinement
- Operators can handle order confirmations, manage Gojek dispatch, and fully control deliveries.
- Intent-based browser permission prompts (Location, Notification only on checkout/login).

### ✅ v1.6.0 — AI Master Persona & Pricing Engine
- AI agents: Sales, Worker, Operator, Seller, Master — all with role-aware context.
- Tax & Logistics Engine: 2% tax + distance-based delivery fees (IDR 10k/km).
- Real-time checkout breakdown via `/api/checkout/calculate`.

---

## 🎯 Current System Health

| Component | Status | Notes |
|-----------|--------|-------|
| Landing Page | ✅ Production Ready | TrackerSection live, SEO Gold, lazy loading |
| Admin Dashboard | ✅ Fully Operational | Global Tracker, All CRUD, Analytics |
| Operator Dashboard | ✅ Fully Operational | Orders + Deliveries management |
| Worker Dashboard | ✅ Fully Operational | GPS, Proof Upload, AI Chat |
| User Dashboard | ✅ Fully Operational | Rentals, History, Live Tracking CTA |
| Tracking System | ✅ Real-time | GPS polling, maps, invoice/order lookup |
| AI System | ✅ Active | Ask-Me (Landing), Worker AI, Operator AI, Master AI |
| Payment Flow | ✅ End-to-End | Invoice → Confirm → Delivery creation atomic |
| SEO | ✅ Gold | Dynamic sitemap, structured data, FAQPage schema |
| PWA | ✅ Active | Install prompts for iOS/Android |

> [!IMPORTANT]
> **Production Status**: System is fully production-ready as of v2.0.0. All dashboards use real-time data. No mock data or placeholder content remains in any user-facing flow.

> [!NOTE]
> **Deployment**: All changes are live in `origin main` (commit `57213d2`). The application is built with `next build --standalone` and served via Caddy reverse proxy.
