# 🌐 TropicTech Comprehensive Data Update & Knowledge Base

**Last Updated**: 2026-03-07 12:45:00 (WITA/GMT+8)
**System Version**: 2.5.0-hardened
**Environment**: Global Production (AI Intelligence & Auth Hardened)

---

## 🏛️ System Overview
TropicTech is a sophisticated rental management and service ecosystem designed for seamless coordination between customers, administrators, and field workers. It features an **Audit-Hardened AI Orchestration** backend, real-time inventory tracking, an automated invoicing system, live delivery tracking (GPS/Maps), and a global tracker accessible across all roles.

### 🛡️ AI Security Model: "Proposal-First"
To ensure 100% data safety, the AI system follows a strict **Proposal → Signature → Execution** workflow:
1. **Proposal**: AI suggests a change (e.g., updating a product price) based on natural language.
2. **Signature**: Admin must verify the proposal using a **super-secret admin code**.
3. **Execution**: Only after valid 2-step verification does the system mutate the database.

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
- **Real-time**: Supabase Real-time (Websockets) for instant messaging and notification sync
- **Storage**: Supabase Storage (Delivery proof photos, product images)
- **PWA**: Progressive Web App with install prompts for iOS & Android

---

## 🏗️ Architecture & How It Works

### 1. Unified Dashboard System
| Dashboard | Role | Key Features |
|-----------|------|--------------|
| `/` | Public | Landing Page, Products, Tracker Section, AI Chat (T-Tech.Ai) |
| `/admin` | Admin | Full control — Orders, Workers, Deliveries, Settings, Global Tracker |
| `/dashboard/operator` | Operator | Order management, Delivery queue, Global Tracker, Operator AI |
| `/dashboard/worker` | Worker | Attendance, Delivery Pool, Live GPS updates, Worker AI |
| `/dashboard/user` | Customer | Order history, Rentals overview, Live tracking, User AI |
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
- **AI Chat**: `T-Tech.Ai (Worker AI)` available in worker sidebar for operational guidance.

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
- `POST /api/ai/seller` — Landing page AI assistant (T-Tech.Ai)
- `POST /api/ai/worker-chat` — Worker AI assistant
- `POST /api/ai/operator-chat` — Operator AI assistant
- `POST /api/ai/master` — Admin AI master control

---

## 📅 Complete System Update History

### ✅ v2.5.0 — Role-Specific Intelligence & Auth Hardening (2026-03-07)
- **Tailored AI Agents**: Integrated specialized AI assistants in User, Worker, and Operator dashboards with deep context sync.
- **Auth Hardening**: Fixed intermittent multi-login issues; standardized logout logic site-wide.
- **Manual Flow Fix**: Hardened `OperatorDashboardClient` manual invoice creation to include full `lineItems` data for stock reservation.

### ✅ v2.4.0 — Infrastructure Hardening & Global Production (2026-03-07)
- **Supabase Security Hardening**: Resolved `mutable search_path` vulnerability in `handle_new_user` and related functions to prevent search path hijacking.
- **Production Build Integrity**: Verified 100% stability across all routes for final global deployment.

### ✅ v2.3.0 — UI Mastery & Auth Hardening (2026-03-07)
- **Hero CTA Transformation**: Refined "RENT NOW" to a premium large, pitch-black aesthetic.
- **Pricing Logic Overhaul**: Implemented unified rounding: `(Monthly / 30)` rounded UP to the nearest **IDR 2,000**.
- **Single Admin Lock**: Restricted `ADMIN` role access exclusively to `tropictechindo@gmail.com`.
- **Image Resiliency**: Local fallback `/packages/Rental Bali3.webp` ensured for broken package links.
- **Admin Dashboard Stability**: Hardened BigInt/Date serialization to prevent production server exceptions.

### ✅ v2.2.0 — UI Refinement & Performance Maximization (2026-03-07)
- **Instant Page Architecture**: Converted all below-the-fold components to `dynamic` imports with Skeleton placeholders, maximizing TTI and perceived loading speed.
- **Minimal CTA Styling**: Redesigned all landing page actions with business charcoal `#55595a` and minimal "short/thin" padding layout.
- **Footer Cleanup**: Streamlined navigation by removing Hardware, Corporate, and FAQ links.
- **Gallery Deep Sync**: Hardened `useSiteSettings` with JSON parsing to ensure perfect synchronization between Admin settings and Landing visual state.
- **Image Fallback**: Fixed broken "Team Setup" visuals with verified local asset `/packages/Rental Bali3.webp`.
- **System Hardening**: Successfully verified production build (`npm run build`) and purged all temporary diagnostic scripts.

### ✅ v2.1.1 — Landing Page & SEO Mastery (2026-03-07)
- **LCP Optimization**: Precision-tuned image loading (`fetchPriority`, `decoding="async"`) for < 1.2s perceived load time.
- **SEO Gold**: Validated all `h1`-`h2`-`h3` tags and structured data schemas for maximum search visibility.
- **Performance Hints**: Root layout now includes `preconnect` for lightning-fast font and data delivery.

### ✅ v2.1.0 — Real-time Hardening & Dispatch Automation (2026-03-07)
- **Supabase Real-time Core**: Native WebSocket synchronization for `messages`, `group_messages`, and `system_notifications`. Replaced legacy polling architecture.
- **Worker Dispatch Automation**: Integrated "Auto-Claim" logic for unclaimed delivery jobs (60-minute timeout).
- **Inventory Protection**: Implemented PostgreSQL row-level locking (`FOR UPDATE`) for all stock adjustments to prevent concurrent update conflicts.

### ✅ v2.0.0 — Landing Page Maximization & Production Hardening (2026-03-06)
- **TrackerSection on Landing Page**: New premium section below Special Offers with Invoice search CTA and "Track Your Order" real-time features.
- **Icon Standardization**: Resolved `Map` / `Navigation` / `Home` naming conflicts across all dashboards by aliasing to `MapIcon`, `NavigationIcon`. Fixed all runtime `TypeError` ("Illegal constructor") and `ReferenceError` errors.
- **Hero.tsx Fix**: Fixed JSX structure — Opacity slider and scroll indicator moved to `<section>` level, restoring correct nesting and full opacity style functionality.
- **T-Tech.Ai ChatWidget Unification**: Removed separate floating label pill. "T-Tech.Ai" name is now integrated directly in the trigger button (icon + text). Card header also shows "T-Tech.Ai" with black/zinc theme.
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
- **AI T-Tech.Ai Branding**: Consistent "T-Tech.Ai" black branding across Worker and Operator chat panels.

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
| Landing Page | ✅ v2.2.0 Hardened | Instant Page, Minimal CTAs, Deep Sync |
| Admin Dashboard | ✅ Fully Operational | Global Tracker, All CRUD, Analytics |
| Operator Dashboard | ✅ Fully Operational | Orders + Deliveries management |
| Worker Dashboard | ✅ Fully Operational | GPS, Proof Upload, AI Chat |
| User Dashboard | ✅ Fully Operational | Rentals, History, Live Tracking CTA |
| Tracking System | ✅ Real-time | GPS polling, maps, invoice/order lookup |
| AI System | ✅ Active | T-Tech.Ai (Landing), Worker AI, Operator AI, Master AI |
| Payment Flow | ✅ End-to-End | Invoice → Confirm → Delivery creation atomic |
| SEO | ✅ Gold | Dynamic sitemap, structured data, FAQPage schema |
| PWA | ✅ Active | Install prompts for iOS/Android |

> [!IMPORTANT]
> **Production Status**: System is fully production-hardened as of v2.2.0. All user-facing components use the new minimal branding and extreme performance optimizations.

> [!NOTE]
> **Deployment**: All changes are live in `origin main`. The application is built with `next build --standalone` and served via Caddy reverse proxy.
