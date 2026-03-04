# 🌐 TropicTech Comprehensive Data Update & Knowledge Base

**Last Updated**: 2026-03-05 04:15:00 (WITA/GMT+8)
**System Version**: 1.9.0-stable
**Environment**: Production Ready (AI Personas & Unified Dashboards)

---

## 🏛️ System Overview
TropicTech is a sophisticated rental management and service ecosystem designed for seamless coordination between customers, administrators, and field workers. It features an AI-orchestrated backend, real-time inventory tracking, and an automated invoicing system.

### 🚀 Technology Stack
- **Framework**: Next.js 16 (App Router / Turbopack)
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS 4, Radix UI (Shadcn), Lucide Icons
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: NextAuth.js 4 & Supabase SSR Bridge
- **State/Data**: Zustand (Client State), TanStack Query v5 (Server State)
- **Utilities**: Framer Motion (Animations), Resend.com (Email - Professional Domain), jsPDF (Invoices), Sharp (Images)
- **Email Infrastructure**: Switched to **Local Transport (SMTP/Resend)** for all auth and system notifications via `contact@tropictech.online`.
- **AI Engine**: OpenAI & Google Gemini Integrated with custom AI Orchestration (Sales, Worker, Risk, Seller, Master agents)

---

## 🏗️ Architecture & How It Works

### 1. Unified Dashboard System
The website operates through three distinct entry points based on user roles:
- **Client Interface**: Browse products, create orders, track rentals, and view invoices.
- **Admin Panel (`/admin`)**: Central command for managing orders, products, workers, schedules, and site settings.
- **Operator Panel (`/dashboard/operator`)**: Specialized view for handling orders and deliveries.
- **Worker Portal (`/dashboard/worker`)**: Mobile-first interface for field workers to check attendance, update job statuses, and sync inventory.

### 2. Core Business Workflows
#### 💳 Order & Payment Flow
1. User creates an order (Draft → Awaiting Payment).
2. User uploads payment proof or pays via provider.
3. Admin verifies payment (`/api/admin/orders/[id]/confirm-payment`).
4. System auto-calculates 2% tax and generates an `Invoice`.
5. Email notifications sent to User, Workers, and Central Admin.

#### 👷 Worker Management
- **Scheduling**: Admins assign jobs to workers linked to specific orders.
- **Attendance**: Workers check-in/out via the portal. System auto-flags "LATE" attendance after 9:00 AM.
- **Reporting**: Workers submit daily reports including checklist items and **Live Delivery Photos**.

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
| `/dashboard/user` | User | Customer order history & Profile |
| `/admin` | Admin | Main administration analytics |
| `/dashboard/operator`| Operator| Order & Delivery management |
| `/dashboard/worker` | Worker | Attendance & Active assignments |
| `/invoice/public/[token]` | Public | View-only shareable invoice |
| `/tracking/[code]` | Public | Real-time GPS delivery tracking |

### 🔌 API Endpoints (Core)
- **Admin**:
  - `POST /api/admin/orders/[id]/confirm-payment`
  - `GET/POST /api/admin/workers`
- **Worker**:
  - `POST /api/worker/attendance`
  - `POST /api/worker/upload-proof` - Image upload for delivery.
- **AI**:
  - `/api/ai/worker-chat` - Specific Worker persona.
  - `/api/ai/operator-chat` - Dashboard context AI.

---

## 📅 Recent System Updates (v1.9.0)
- [x] **Dashboard Unification (Phase 14)**:
  - Synchronized `AdminSidebar` and `OperatorSidebar` with real-time notification badges for Orders and Deliveries.
  - Implemented **SPI Redirection**: Clicking a notification popup now instantly navigates the user to the relevant dashboard panel.
  - Integrated **Global Tracker Modal**: Accessible from all sidebar roles (Admin, Operator, Worker, User).
- [x] **AI Persona Integration**: 
  - Launched specialized AI personas: **Worker AI** (Safety & Ops focused) and **Operator AI** (Analytics & Queue focused).
  - Standardized AI response handling across all dashboard panels (`data.reply` / `data.response` normalization).
- [x] **Worker Proof of Delivery (v1.9.0)**:
  - Successfully migrated from "Image URL" manual input to a robust **File Uploader** component.
  - Integrated with Supabase Storage for secure persistence of delivery proof photos.
- [x] **PWA & Mobile Engagement**:
  - Authored a premium **PWA Install Prompt**: Contextual detection for iOS/Safari and Android/Chrome using glassmorphic UI.
  - Added "Register UX Hardening": Notification now prompts users to check their "Spam Email" folder.
- [x] **Auth & Hydration Hardening**:
  - Unified redirection logic: Both standard and Google login now redirect exclusively to the **Landing Page** as per user request.
  - Resolved persistent **Hydration Mismatch** errors on the landing page by utilizing `isMounted` guards and `suppressHydrationWarning` on dynamic accessibility nodes.
- [x] **CTA Intelligence**: Added diagnostic toast notifications for Google Login failures to assist in real-time troubleshooting.

> [!IMPORTANT]
> **Production Note**: The system is now unified, hardened, and accessible via PWA on mobile devices. AI Agents are role-aware and provide significantly higher contextual utility.

> [!NOTE]
> This file is the **Source of Truth** for TropicTech system state. Version 1.9.0 focus: **Unity, AI Intelligence, and Mobile UX**.
