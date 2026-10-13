# HomeHub - Project Context & AI State Memory
> Dokumen ini dirancang sebagai jembatan memori (*context bridge*) untuk AI Assistant (Antigravity) agar dapat langsung melanjutkan pekerjaan di desktop mana pun dengan pemahaman 100% terhadap arsitektur dan status terkini codebase.

---

## 1. Identitas & Gambaran Umum Proyek
- **Nama Proyek**: HomeHub (Comprehensive Home Management System)
- **Target Platform**: Web Client (React 18 Vite), Admin Panel (React 18 Vite), Mobile (React Native Expo)
- **Arsitektur**: 100% Microservices Murni dengan pola **Database-per-Service** di balik unified API Gateway.
- **Port Mapping**:
  - `8000`: API Gateway (Reverse proxy, JWT guard, Rate limiting, CORS, Context injection: `x-user-id`, `x-household-id`, `x-subscription-tier`)
  - `8001`: Auth & Family Service (`db_family`)
  - `8002`: Utility & Bills Service (`db_utility`)
  - `8003`: Asset & Vehicle Service (`db_asset`)
  - `8004`: Pantry & Grocery Service (`db_grocery`)
  - `8005`: Finance & Expense Service (`db_finance`)
  - `8006`: Activity & Calendar Service (`db_activity`)
  - `5173`: Frontend Web Client
  - `5174`: Frontend Admin Panel
  - `3306`: MySQL 8.0 Docker Container (`homehub-mysql`)
  - `6379`: Redis 7 Alpine Docker Container (`homehub-redis`)

---

## 2. Fitur-Fitur Kunci yang Sudah Dibangun & Berjalan
1. **Master Kategori Dinamis Dwibahasa (Bilingual Hybrid)**:
   - Terpusat di `db_family` (`utility_categories`, `asset_categories`, `grocery_categories`, `expense_categories`, `activity_categories`).
   - Mendukung input Bahasa Indonesia dengan tombol **`⚡ Auto-Translate`** ke English di Admin Panel.
   - Sinkronisasi instan ke seluruh Modal Form (`AddBillModal`, `AddAssetModal`, `AddGroceryModal`, `AddExpenseModal`, `AddActivityModal`) dan Card badge di Web Client tanpa reload.
2. **Audit Trail Logs (Paginated)**:
   - Disimpan di `db_family.audit_logs` dengan sistem paginasi untuk performa tinggi pada Admin Panel.
3. **AI OCR Scan Struk**:
   - Terintegrasi dengan Google Gemini 1.5 Flash Vision API di Finance Service.
4. **Jadwal Berulang (*Recurring Events*)**:
   - Mendukung recurrence pattern (`DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`) pada Activity Service dengan badge status dan pengelompokan master.
5. **Monetisasi & Quota Guard**:
   - Free vs. Pro tier checking di API Gateway & backend middleware (`shared/src/middleware/quotaGuard.js`).
6. **Voucher Promo & Diskon**:
   - Tabel `vouchers` dan `voucher_claims` di `db_family`.

---

## 3. Database & Relasi Antar-Service
- **Prinsip**: **Nol Physical Foreign Key Lintas Database**.
- **Metode**: Menggunakan **Logical ID Reference (Loose Coupling)** (`household_id` dan `user_id` bertipe `VARCHAR(36)`).
- Relasi detail tercatat di [`docs/database_architecture.md`](file:///Users/calvin/Documents/Code%20Project/Antigravity/Home%20Management%20Apps/docs/database_architecture.md).

---

## 4. Instruksi Kickstart untuk Antigravity di Desktop Baru
Jika Anda (Antigravity) membaca dokumen ini di percakapan baru atau di desktop kedua:
1. Pahami bahwa seluruh source code, schema database, dan dependency sudah terstruktur rapi.
2. Saat user meminta melanjutkan fitur baru atau perbaikan, selalu pertahankan konvensi:
   - Microservices isolation (jangan buat cross-DB physical foreign keys).
   - Simpan teks bilingual (`name` & `name_en`) untuk data master kategori.
   - Jalankan build test (`npm run build` di `frontend/web` dan `frontend/admin`) setelah melakukan perubahan kode.
