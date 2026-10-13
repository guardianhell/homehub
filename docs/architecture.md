# HomeHub Architecture Specification

## 1. Microservices Architecture

HomeHub dibangun menggunakan **Arsitektur Microservices Murni** dengan pola **Database-per-Service** di balik unified API Gateway:

- **API Gateway (Port 8000)**: Reverse proxy, Rate limiting, Helmet security headers, CORS, JWT Auth verification, Cross-Port Cookie Sync Bridge, & downstream context injection (`x-user-id`, `x-household-id`, `x-subscription-tier`).
- **Auth & Family Service (Port 8001)**: User registration/login, multi-household management, member roles, subscription & voucher management, audit trail logs (paginated), serta master kategori dinamis dwibahasa (Bilingual Hybrid). Database: `db_family`.
- **Utility & Bills Service (Port 8002)**: Electricity, water, internet, and recurring bills tracking. Quota guarded: Max 1 bill account on Free tier. Database: `db_utility`.
- **Asset & Vehicle Service (Port 8003)**: Electronics (AC, refrigerator, TV) & vehicles (cars, motorbikes) with warranty tracking, maintenance schedules & logs. Quota guarded: Max 2 assets on Free tier. Database: `db_asset`.
- **Pantry & Grocery Service (Port 8004)**: Real-time kitchen supplies checklist & grocery notes. Quota guarded: Max 3 notes on Free tier. Database: `db_grocery`.
- **Finance & Expense Service (Port 8005)**: Expense logging, monthly budget limits, category summaries, and AI OCR Receipt Scanning (Gemini 1.5 Flash). Quota guarded: Max 5 expense entries/month on Free tier. Database: `db_finance`.
- **Activity & Calendar Service (Port 8006)**: Family schedules (tuition/les, vacations, biztrips, event invitations) & recurring occurrences. Database: `db_activity`.

## 2. Client Applications Layer

- **User Web App (Port 5173)**: React 18 + Vite + TailwindCSS + Lucide Icons + i18next (Bilingual ID ⇄ EN).
- **Admin Panel App (Port 5174)**: React 18 + Vite + TailwindCSS (Audit logs pagination, Master categories hub, Voucher generator, Pro manual activator).
- **Mobile Client App**: React Native (Expo) untuk platform iOS & Android.

## 3. 3-Tier Validation & Security Model

1. **Tier 1 (Frontend)**: React Hook Form + Zod schema validation. Prevents invalid input from reaching the network.
2. **Tier 2 (Backend)**: Zod middleware `validate(schema)` on all Express routes. Strips unknown fields, rejects malformed payloads with 400 Bad Request. Parameterized queries via `mysql2/promise` (zero raw SQL string concatenation).
3. **Tier 3 (Database)**: MySQL DDL constraints: `NOT NULL`, `CHECK (amount >= 0)`, `FOREIGN KEY (ON DELETE CASCADE/RESTRICT)` within each database, strict `DECIMAL(12,2)` and `ENUM` types.

## 4. Monetization (Free vs. Pro Quotas)

- **Multi-Household**: 1 House (Free) vs. Multiple Houses (Pro)
- **Anggota Keluarga**: Max 5 Members (Free) vs. Unlimited (Pro)
- **Aset & Kendaraan**: Max 2 Assets (Free) vs. Unlimited (Pro)
- **Tagihan Rutin**: Max 1 Routine Bill (Free) vs. Unlimited (Pro)
- **Catatan Dapur**: Max 3 Notes (Free) vs. Unlimited (Pro)
- **Pencatatan Expense**: Max 5 Entries / Month (Free) vs. Unlimited (Pro)
- **AI OCR Struk**: Locked (Free) vs. Unlimited Scan (Pro)

## 5. Dokumentasi Arsitektur Database & ERD Terperinci

Detail lengkap skema tabel, diagram ERD per-layanan, matriks relasi lintas microservice (Loose ID references), dan panduan tanpa Physical Foreign Key lintas database dapat dilihat pada:
- [`docs/database_architecture.md`](file:///Users/calvin/Documents/Code%20Project/Antigravity/Home%20Management%20Apps/docs/database_architecture.md)

