# HomeHub - Home Management Operating System

A modern, comprehensive household management ecosystem designed for families to manage physical assets, routine bills, kitchen inventory, family finances, and daily logistics.

---

## 🌟 Key Capabilities

- **Multi-Household Management**: Manage multiple homes/properties (e.g. _Rumah Tinggal_ & _Villa Puncak_) with instant top-bar switching.
- **Multi-Language (i18n)**: Fully localized in **Bahasa Indonesia (ID)** and **English (EN)**.
- **Monetization (Free vs. Pro Tier)**:
  - **Free Tier**: 2 Assets, 1 Routine Bill, 3 Kitchen Notes, 5 Monthly Expenses.
  - **Pro Tier**: Unlimited across all modules with multi-household management.
- **3-Tier Validation & Security**:
  - Frontend: Form validation with immediate feedback.
  - Backend: Express Zod validation middleware + parameterized queries (zero SQL injection risk) + Helmet & Rate Limiting.
  - Database: Strict MySQL DDL constraints (`CHECK`, `NOT NULL`, Foreign Keys, `DECIMAL`).

---

## 🏗️ Repository & Workbench Structure

```
Home Management Apps/
├── backend/
│   ├── api-gateway/            # Port 8000 (Reverse Proxy, JWT Guard, Helmet, Rate Limit)
│   ├── shared/                 # Shared validation, DB pool factory, response helpers, quota guard
│   └── services/
│       ├── auth-service/       # Port 8001 (db_family: Users, Multi-Households, Roles, Subscriptions)
│       ├── utility-service/    # Port 8002 (db_utility: Electricity, Water, Internet, Due dates)
│       ├── asset-service/      # Port 8003 (db_asset: Electronics, Vehicles, Maintenance schedules & logs)
│       ├── grocery-service/    # Port 8004 (db_grocery: Kitchen inventory & live shopping checklist)
│       ├── finance-service/    # Port 8005 (db_finance: Expense tracking, budget limits, analytics)
│       └── activity-service/   # Port 8006 (db_activity: Calendar, kids tuition, vacations, invitations)
│
├── frontend/
│   ├── web/                    # React.js + Vite + TailwindCSS + Lucide Icons + i18next
│   └── mobile/                 # React Native (Expo) for iOS & Android
│
├── database/
│   ├── docker-compose.yml      # MySQL 8.0 & Redis containers
│   └── init/
│       └── 01-init-databases.sql # Multi-database schema DDL & mock seed data
│
├── docs/                       # Architectural blueprints & specs
│   └── architecture.md
│
├── docker-compose.yml          # Root infrastructure runner
└── package.json                # Monorepo workbench scripts
```

---

## 🚀 Quick Start Guide

### 1. Jalankan Database (MySQL & Redis)

Pastikan Docker Desktop aktif di komputer Anda, lalu jalankan:

```bash
npm run db:up
```

Ini akan menyalakan container MySQL 8.0 dan Redis, serta menginisialisasi 6 database (`db_family`, `db_utility`, `db_asset`, `db_grocery`, `db_finance`, `db_activity`) lengkap dengan data sampel.

### 2. Instalasi Dependensi

```bash
npm run install:all
```

### 3. Menjalankan Layanan

- **API Gateway**: `npm run gateway` (Port 8000)
- **Auth Service**: `npm run auth` (Port 8001)
- **Utility Service**: `npm run utility` (Port 8002)
- **Asset Service**: `npm run asset` (Port 8003)
- **Grocery Service**: `npm run grocery` (Port 8004)
- **Finance Service**: `npm run finance` (Port 8005)
- **Activity Service**: `npm run activity` (Port 8006)
- **Frontend Web**: `cd frontend/web && npm run dev` (Port 5173)
