# Arsitektur Database & Relasi Microservices HomeHub
## Pola Bounded Context, Database-per-Service & Loose Coupling

Dokumen ini merupakan spesifikasi resmi arsitektur basis data dan relasi antarlayanan pada **HomeHub**. Seluruh backend HomeHub menerapkan **Arsitektur Microservices Murni** dengan prinsip **Database-per-Service**, di mana setiap domain bisnis terisolasi dalam basis data dan proses runtime independen tanpa adanya *Physical Foreign Key* lintas batas database.

---

## 1. Diagram Arsitektur Sistem & Isolasi Data

```mermaid
flowchart TD
    subgraph CLIENTS["Frontend & Client Applications Layer"]
        WEB["React Web App\n(:5173)"]
        ADMIN["Admin Panel Web App\n(:5174)"]
        MOBILE["React Native / Expo Mobile App"]
    end

    subgraph GATEWAY["API Gateway Layer (:8000)"]
        GW["Express API Gateway & Security Guard\n• JWT Verification & Downstream Context Injection\n• Injeksi Header: x-user-id, x-household-id, x-subscription-tier\n• Rate Limiting & Helmet Security\n• Cross-Port Cookie & Sync Bridge Support"]
    end

    subgraph SERVICES["Independent Microservice Runtimes (Node.js Express)"]
        S1["Auth & Family Service\n(:8001)\n• User & Household Management\n• Role & Subscription\n• Dynamic Master Categories\n• Audit Trail Logs & Vouchers"]
        S2["Utility & Bills Service\n(:8002)\n• Quota Guard: Max 1 Bill (Free)\n• Utility Accounts & Bills"]
        S3["Asset & Vehicle Service\n(:8003)\n• Quota Guard: Max 2 Assets (Free)\n• Warranties & Maintenance Logs"]
        S4["Pantry & Grocery Service\n(:8004)\n• Quota Guard: Max 3 Notes (Free)\n• Shopping Items Checklist"]
        S5["Finance & Expense Service\n(:8005)\n• Quota Guard: Max 5 Expenses/Mo (Free)\n• Expense Logs & Monthly Budgets\n• AI OCR Receipt Scanner"]
        S6["Activity & Calendar Service\n(:8006)\n• Family Schedules & Recurring Events\n• Attendees & Reminders"]
    end

    subgraph DATABASES["Isolated Database-per-Service Layer (MySQL 8.0)"]
        DB1[("db_family\n• users, households, members\n• subscriptions, vouchers\n• audit_logs\n• 5x master_categories (Bilingual)")]
        DB2[("db_utility\n• utility_accounts\n• utility_bills")]
        DB3[("db_asset\n• assets\n• maintenance_schedules\n• maintenance_logs")]
        DB4[("db_grocery\n• shopping_items")]
        DB5[("db_finance\n• expenses\n• budgets")]
        DB6[("db_activity\n• activities\n• activity_attendees")]
    end

    CLIENTS -->|REST API / Bearer JWT| GW

    GW -->|/api/v1/auth & /api/v1/categories| S1
    GW -->|/api/v1/utility| S2
    GW -->|/api/v1/asset| S3
    GW -->|/api/v1/grocery| S4
    GW -->|/api/v1/finance| S5
    GW -->|/api/v1/activity| S6

    S1 <-->|Pool: db_family| DB1
    S2 <-->|Pool: db_utility| DB2
    S3 <-->|Pool: db_asset| DB3
    S4 <-->|Pool: db_grocery| DB4
    S5 <-->|Pool: db_finance| DB5
    S6 <-->|Pool: db_activity| DB6
```

---

## 2. Prinsip Loose Coupling & ID Reference (Zero Cross-DB Foreign Keys)

Dalam arsitektur monolitik tradisional, seluruh tabel disatukan ke dalam satu database besar dengan *Physical Foreign Key* yang mengikat tabel-tabel anak ke tabel `households` atau `users`:

```sql
-- ❌ POLA MONOLITIK (ANTI-PATTERN - TIDAK DIGUNAKAN DI HOMEHUB):
-- Menghubungkan database utility secara langsung ke database family via physical foreign key
ALTER TABLE db_utility.utility_accounts 
ADD CONSTRAINT fk_cross_db_household 
FOREIGN KEY (household_id) REFERENCES db_family.households(id);
```

### ✅ Pola Microservices Murni HomeHub
Di HomeHub, seluruh relasi antar microservice menggunakan **Logical ID Reference (Loose Coupling)**:
1. Setiap microservice downstream (`utility`, `asset`, `grocery`, `finance`, `activity`) menyimpan `household_id VARCHAR(36)` dan/atau `user_id VARCHAR(36)` sebagai **kolom independen tanpa constraint fisik ke database lain**.
2. Service downstream **tidak perlu tahu struktur tabel `users` atau `households`**.
3. **Konteks Keamanan & Identitas Disuplai API Gateway**:
   - API Gateway memvalidasi JWT Bearer token dari pengguna.
   - Gateway mengekstrak identitas pengguna dan rumah tangga yang aktif.
   - Gateway menyuntikkan HTTP header downstream:
     - `x-household-id: <uuid>`
     - `x-user-id: <uuid>`
     - `x-subscription-tier: FREE | PRO`
4. Query di downstream murni memfilter data miliknya sendiri:
   ```sql
   -- ✅ Query terisolasi tanpa JOIN lintas database:
   SELECT * FROM utility_accounts WHERE household_id = ?;
   SELECT * FROM expenses WHERE household_id = ? AND expense_date >= ?;
   SELECT * FROM activities WHERE household_id = ? ORDER BY start_datetime ASC;
   ```

---

## 3. Spesifikasi Lengkap Skema ERD per-Microservice

### 3.1 `db_family` (Auth, Family, Subscriptions, Audit Logs & Master Categories)

```mermaid
erDiagram
    USERS ||--o{ HOUSEHOLDS : "owner_user_id (Physical FK)"
    USERS ||--o{ HOUSEHOLD_MEMBERS : "user_id (Physical FK)"
    HOUSEHOLDS ||--o{ HOUSEHOLD_MEMBERS : "household_id (Physical FK)"
    HOUSEHOLDS ||--o{ SUBSCRIPTIONS : "household_id (Physical FK)"
    VOUCHERS ||--o{ VOUCHER_CLAIMS : "voucher_id (Physical FK)"

    USERS {
        string id PK "VARCHAR(36)"
        string name "VARCHAR(100)"
        string email UK "VARCHAR(150)"
        string password_hash "VARCHAR(255)"
        string phone "VARCHAR(25)"
        string avatar_url "VARCHAR(255)"
        enum preferred_language "'id', 'en'"
        enum status "'ACTIVE', 'INACTIVE', 'SUSPENDED'"
        timestamp created_at
        timestamp updated_at
    }

    HOUSEHOLDS {
        string id PK "VARCHAR(36)"
        string owner_user_id FK "VARCHAR(36)"
        string name "VARCHAR(120)"
        text address
        enum subscription_tier "'FREE', 'PRO'"
        enum subscription_status "'ACTIVE', 'EXPIRED', 'CANCELED'"
        timestamp pro_valid_until
        timestamp created_at
        timestamp updated_at
    }

    HOUSEHOLD_MEMBERS {
        string id PK "VARCHAR(36)"
        string household_id FK "VARCHAR(36)"
        string user_id FK "VARCHAR(36)"
        enum role "'OWNER', 'ADMIN', 'MEMBER', 'HELPER'"
        timestamp joined_at
        boolean is_active
    }

    SUBSCRIPTIONS {
        string id PK "VARCHAR(36)"
        string household_id FK "VARCHAR(36)"
        enum plan_type "'PRO_MONTHLY', 'PRO_YEARLY'"
        decimal amount_paid "DECIMAL(12,2)"
        timestamp started_at
        timestamp expires_at
        string payment_gateway_ref "VARCHAR(100)"
        enum status "'PENDING', 'PAID', 'FAILED', 'REFUNDED'"
        timestamp created_at
    }

    VOUCHERS {
        string id PK "VARCHAR(50)"
        string code UK "VARCHAR(50)"
        string description "VARCHAR(255)"
        enum discount_type "'PERCENTAGE', 'FIXED_AMOUNT'"
        decimal discount_value "DECIMAL(12,2)"
        enum target_plan "'ALL', 'PRO_YEARLY', 'PRO_MONTHLY'"
        int max_quota
        int claimed_count
        enum status "'ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED'"
        timestamp valid_until
        string generated_by_name "VARCHAR(100)"
        string generated_by_role "VARCHAR(50)"
        timestamp created_at
        timestamp updated_at
    }

    VOUCHER_CLAIMS {
        string id PK "VARCHAR(50)"
        string voucher_id FK "VARCHAR(50)"
        string user_id "VARCHAR(50)"
        string user_name "VARCHAR(100)"
        string user_email "VARCHAR(150)"
        string household_id "VARCHAR(50)"
        string household_name "VARCHAR(120)"
        string applied_plan "VARCHAR(50)"
        decimal original_price "DECIMAL(12,2)"
        decimal discount_amount "DECIMAL(12,2)"
        decimal final_price "DECIMAL(12,2)"
        timestamp claimed_at
    }

    AUDIT_LOGS {
        string id PK "VARCHAR(50)"
        string admin_name "VARCHAR(100)"
        string admin_role "VARCHAR(50)"
        string action "VARCHAR(80)"
        string target_type "VARCHAR(50)"
        string target_id "VARCHAR(50)"
        string target_name "VARCHAR(150)"
        text details
        timestamp created_at "INDEX"
    }

    UTILITY_CATEGORIES {
        string id PK "VARCHAR(50)"
        string code UK "VARCHAR(50)"
        string name "VARCHAR(100) (ID)"
        string name_en "VARCHAR(100) (EN)"
        string icon "VARCHAR(50)"
        string icon_url "VARCHAR(255)"
        string color "VARCHAR(50)"
        json providers "List Provider"
        boolean is_default
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    MASTER_MODULE_CATEGORIES {
        string id PK "VARCHAR(50)"
        string code UK "VARCHAR(50)"
        string name "VARCHAR(100) (ID)"
        string name_en "VARCHAR(100) (EN)"
        string icon "VARCHAR(50)"
        string icon_url "VARCHAR(255)"
        string color "VARCHAR(50)"
        json metadata "JSON Config"
        boolean is_default
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.2 `db_utility` (Utility & Bills Service)

```mermaid
erDiagram
    UTILITY_ACCOUNTS ||--o{ UTILITY_BILLS : "account_id (Physical FK)"

    UTILITY_ACCOUNTS {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        enum category_code "'ELECTRICITY', 'WATER', 'INTERNET', 'MAINTENANCE_IPL', 'GAS', 'OTHER'"
        string provider_name "VARCHAR(100)"
        string customer_number "VARCHAR(100)"
        string account_name "VARCHAR(120)"
        int default_due_day "CHECK (1..31)"
        timestamp created_at
        timestamp updated_at
    }

    UTILITY_BILLS {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        string account_id FK "VARCHAR(36)"
        string billing_period "VARCHAR(7) e.g. '2026-09'"
        date due_date
        decimal amount "DECIMAL(12,2) CHECK (>= 0)"
        enum status "'UNPAID', 'PAID', 'OVERDUE'"
        timestamp paid_at
        string paid_by_user_id "VARCHAR(36) (Loose Ref)"
        string receipt_attachment_url "VARCHAR(255)"
        text notes
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.3 `db_asset` (Asset, Vehicle & Maintenance Service)

```mermaid
erDiagram
    ASSETS ||--o{ MAINTENANCE_SCHEDULES : "asset_id (Physical FK)"
    ASSETS ||--o{ MAINTENANCE_LOGS : "asset_id (Physical FK)"

    ASSETS {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        enum asset_type "'ELECTRONIC', 'VEHICLE', 'FURNITURE', 'OTHER'"
        string category "VARCHAR(50)"
        string name "VARCHAR(120)"
        string brand "VARCHAR(80)"
        string model_type "VARCHAR(100)"
        string serial_or_plate_number "VARCHAR(100)"
        string location_room "VARCHAR(80)"
        date purchase_date
        decimal purchase_price "DECIMAL(14,2)"
        date warranty_expiry_date
        string service_center_contact "VARCHAR(150)"
        string invoice_url "VARCHAR(255)"
        string photo_url "VARCHAR(255)"
        enum status "'ACTIVE', 'IN_REPAIR', 'DISPOSED'"
        int current_odometer "CHECK (>= 0)"
        timestamp created_at
        timestamp updated_at
    }

    MAINTENANCE_SCHEDULES {
        string id PK "VARCHAR(36)"
        string asset_id FK "VARCHAR(36)"
        string title "VARCHAR(120)"
        enum frequency_type "'DAYS', 'MONTHS', 'ODOMETER', 'WHICHEVER_FIRST'"
        int frequency_value
        int frequency_months
        int frequency_km
        date next_due_date
        int next_due_odometer
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    MAINTENANCE_LOGS {
        string id PK "VARCHAR(36)"
        string asset_id FK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        date performed_date
        string vendor_name "VARCHAR(120)"
        string vendor_phone "VARCHAR(30)"
        decimal cost "DECIMAL(12,2)"
        int current_odometer
        text notes
        string receipt_url "VARCHAR(255)"
        timestamp created_at
    }
```

---

### 3.4 `db_grocery` (Pantry & Grocery Service)

```mermaid
erDiagram
    SHOPPING_ITEMS {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        string name "VARCHAR(120)"
        string category "VARCHAR(60)"
        string quantity "VARCHAR(50)"
        enum stock_status "'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'"
        decimal estimated_price "DECIMAL(10,2)"
        decimal actual_price "DECIMAL(10,2)"
        boolean is_bought
        string bought_by_user_id "VARCHAR(36) (Loose Ref)"
        timestamp bought_at
        string notes "VARCHAR(255)"
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.5 `db_finance` (Finance & Expense Service)

```mermaid
erDiagram
    EXPENSES {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        string user_id "VARCHAR(36) (Loose Ref)"
        string title "VARCHAR(150)"
        decimal amount "DECIMAL(12,2) CHECK (> 0)"
        date expense_date
        string category "VARCHAR(60)"
        text description
        enum source_type "'MANUAL', 'UTILITY_BILL', 'ASSET_MAINTENANCE', 'GROCERY'"
        string source_reference_id "VARCHAR(36)"
        string receipt_url "VARCHAR(255)"
        timestamp created_at
    }

    BUDGETS {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        string period_month "VARCHAR(7) e.g. '2026-09'"
        decimal limit_amount "DECIMAL(12,2) CHECK (>= 0)"
        timestamp created_at
    }
```

---

### 3.6 `db_activity` (Activity & Calendar Service)

```mermaid
erDiagram
    ACTIVITIES ||--o{ ACTIVITY_ATTENDEES : "activity_id (Physical FK)"

    ACTIVITIES {
        string id PK "VARCHAR(36)"
        string household_id "VARCHAR(36) (Loose Ref)"
        string created_by_user_id "VARCHAR(36) (Loose Ref)"
        string title "VARCHAR(150)"
        enum activity_type "'COURSE_LES', 'VACATION', 'BIZTRIP', 'INVITATION', 'BIRTHDAY', 'ROUTINE', 'OTHER'"
        datetime start_datetime
        datetime end_datetime
        string location "VARCHAR(200)"
        int reminder_minutes_before "CHECK (>= 0)"
        text notes
        string recurrence_group_id "VARCHAR(50)"
        string recurrence_rule "VARCHAR(100)"
        string recurrence_summary "VARCHAR(100)"
        boolean is_master
        timestamp created_at
    }

    ACTIVITY_ATTENDEES {
        string id PK "VARCHAR(36)"
        string activity_id FK "VARCHAR(36)"
        string user_id "VARCHAR(36) (Loose Ref)"
        enum status "'ATTENDING', 'NOT_ATTENDING', 'TENTATIVE'"
    }
```

---

## 4. Matriks Komprehensif Relasi Antar-Service

| Entitas Sumber | Kolom Kunci Sumber | Entitas Target | Service Target | Metode Relasi | Deskripsi Alur Bisnis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `households` (`db_family`) | `id` | `utility_accounts` | Utility Service | Logical ID (`household_id`) | Menghubungkan akun tagihan ke rumah tangga pemilik. |
| `households` (`db_family`) | `id` | `assets` | Asset Service | Logical ID (`household_id`) | Menghubungkan inventaris barang/kendaraan ke rumah. |
| `households` (`db_family`) | `id` | `shopping_items` | Grocery Service | Logical ID (`household_id`) | Memfilter daftar belanja sesuai rumah tangga aktif. |
| `households` (`db_family`) | `id` | `expenses` | Finance Service | Logical ID (`household_id`) | Mengelompokkan riwayat pengeluaran kas keluarga. |
| `households` (`db_family`) | `id` | `activities` | Activity Service | Logical ID (`household_id`) | Menampilkan agenda kalender keluarga yang bersangkutan. |
| `users` (`db_family`) | `id` | `expenses` | Finance Service | Logical ID (`user_id`) | Mencatat siapa anggota keluarga yang mengeluarkan uang. |
| `users` (`db_family`) | `id` | `shopping_items` | Grocery Service | Logical ID (`bought_by_user_id`) | Menandai anggota keluarga yang membelanjakan barang. |
| `users` (`db_family`) | `id` | `activities` | Activity Service | Logical ID (`created_by_user_id`) | Menandai anggota keluarga yang membuat agenda. |
| `users` (`db_family`) | `id` | `utility_bills` | Utility Service | Logical ID (`paid_by_user_id`) | Mencatat siapa yang melunasi pembayaran tagihan. |
| `utility_bills` (`db_utility`) | `id` | `expenses` | Finance Service | Logical Ref (`source_reference_id`) | Tagihan yang telah dibayar otomatis tercatat ke pembukuan pengeluaran (`source_type = 'UTILITY_BILL'`). |
| `maintenance_logs` (`db_asset`)| `id` | `expenses` | Finance Service | Logical Ref (`source_reference_id`) | Biaya servis kendaraan/AC otomatis tercatat ke pengeluaran (`source_type = 'ASSET_MAINTENANCE'`). |

---

## 5. Fitur Monetisasi & Batasan Kuota (Quota Guard Enforcement)

Sistem menerapkan pembatasan penggunaan berbasis tier langganan yang diverifikasi pada lapisan middleware (`shared/src/middleware/quotaGuard.js`):

| Modul Layanan | Batasan Paket FREE | Fitur Paket PRO | Mekanisme Guard di Database |
| :--- | :--- | :--- | :--- |
| **Multi-Household** | Maksimal **1 Rumah** | **Unlimited Rumah** | Dicek pada `POST /api/v1/auth/households` via `COUNT(*) FROM households WHERE owner_user_id = ?`. |
| **Anggota Keluarga** | Maksimal **5 Anggota** | **Unlimited Anggota** | Dicek pada `POST /api/v1/auth/households/:id/members`. |
| **Tagihan Utilitas** | Maksimal **1 Akun Tagihan** | **Unlimited Tagihan** | Query `SELECT COUNT(*) FROM utility_accounts WHERE household_id = ?` harus `< 1` untuk tier Free. |
| **Aset & Kendaraan** | Maksimal **2 Aset** | **Unlimited Aset** | Query `SELECT COUNT(*) FROM assets WHERE household_id = ?` harus `< 2` untuk tier Free. |
| **Daftar Belanja** | Maksimal **3 Item Aktif** | **Unlimited Belanja** | Query `SELECT COUNT(*) FROM shopping_items WHERE household_id = ?` harus `< 3` untuk tier Free. |
| **Pengeluaran Bulanan**| Maksimal **5 Transaksi / Bulan** | **Unlimited Transaksi** | Query `SELECT COUNT(*) FROM expenses WHERE household_id = ? AND MONTH(expense_date) = ?` harus `< 5`. |
| **AI OCR Struk** | **Dinonaktifkan (Locked)** | **Akses Penuh Gemini 1.5** | Tombol scan OCR di-guard pada client dan diverifikasi di gateway. |

---

## 6. Ringkasan Perbandingan: Monolith Tradisional vs Microservices HomeHub

| Dimensi | Arsitektur Monolitik Tradisional | Arsitektur Microservices HomeHub Saat Ini |
| :--- | :--- | :--- |
| **Proses Aplikasi** | 1 proses Node.js monolitik tunggal. | **7 proses runtime independen** di port terpisah (:8000 sampai :8006). |
| **Koneksi Database** | 1 connection pool tunggal (`mydb`). | **6 koneksi pool terpisah** (`db_family`, `db_utility`, `db_asset`, `db_grocery`, `db_finance`, `db_activity`). |
| **Relasi Antartabel** | `FOREIGN KEY` fisik ketat lintas semua tabel. | **Nol Physical FK Lintas DB**. Murni menggunakan string UUID reference. |
| **Query Data** | `JOIN users`, `JOIN households`, `JOIN accounts`. | **Nol Cross-DB JOIN**. Pemfilteran murni via Header Context Gateway. |
| **Kategori Master** | Statis di hardcode frontend / tabel tunggal. | **Master Kategori Dinamis Dwibahasa (Bilingual Hybrid)** di MySQL `db_family` dengan sinkronisasi instan ke seluruh client. |
| **Audit & Log** | Tidak ada atau tercampur di log teks file. | **Dedicated `audit_logs` table** dengan pagination efisien untuk jejak operasional admin. |
| **Fault Isolation** | Error di modul aset bisa menjatuhkan modul login. | Crash di `asset-service` tidak berdampak pada transaksi di `finance-service` atau `utility-service`. |
