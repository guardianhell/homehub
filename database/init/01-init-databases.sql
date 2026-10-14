-- =============================================================================
-- HOMEHUB MICROSERVICES DATABASE INITIALIZATION
-- Multi-database per service architecture with strict constraints & security
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_family CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_utility CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_asset CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_grocery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_activity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant access to application user (Least Privilege principle)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_family.* TO 'homehub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_utility.* TO 'homehub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_asset.* TO 'homehub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_grocery.* TO 'homehub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_finance.* TO 'homehub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON db_activity.* TO 'homehub_user'@'%';
FLUSH PRIVILEGES;

-- =============================================================================
-- 1. DB_FAMILY (Auth, Multi-Household & Subscriptions)
-- =============================================================================
USE db_family;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(25) NULL,
    avatar_url VARCHAR(255) NULL,
    preferred_language ENUM('id', 'en') NOT NULL DEFAULT 'id',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS households (
    id VARCHAR(36) PRIMARY KEY,
    owner_user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    address TEXT NULL,
    subscription_tier ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE',
    subscription_status ENUM('ACTIVE', 'EXPIRED', 'CANCELED') NOT NULL DEFAULT 'ACTIVE',
    pro_valid_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_household_tier (subscription_tier)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS household_members (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'MEMBER', 'HELPER') NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uk_household_user (household_id, user_id),
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    plan_type ENUM('PRO_MONTHLY', 'PRO_YEARLY') NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL CHECK (amount_paid >= 0),
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    payment_gateway_ref VARCHAR(100) NULL,
    status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utility_categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    icon VARCHAR(50) NOT NULL DEFAULT '⚡',
    icon_url VARCHAR(255) NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    providers JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cat_code (code),
    INDEX idx_cat_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asset_categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    icon VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    metadata JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expense_categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    icon VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    metadata JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grocery_categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    icon VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    metadata JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    icon VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    metadata JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    target_plan ENUM('ALL', 'PRO_YEARLY', 'PRO_MONTHLY') NOT NULL DEFAULT 'ALL',
    max_quota INT NOT NULL DEFAULT 10,
    claimed_count INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    valid_until TIMESTAMP NOT NULL,
    generated_by_name VARCHAR(100) NOT NULL DEFAULT 'Super Admin',
    generated_by_role VARCHAR(50) NOT NULL DEFAULT 'SUPERADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_code (code),
    INDEX idx_voucher_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS voucher_claims (
    id VARCHAR(50) PRIMARY KEY,
    voucher_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NULL,
    user_email VARCHAR(150) NULL,
    household_id VARCHAR(50) NOT NULL,
    household_name VARCHAR(120) NULL,
    applied_plan VARCHAR(50) NOT NULL,
    original_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_claim_voucher (voucher_id),
    INDEX idx_claim_user (user_id),
    INDEX idx_claim_household (household_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    admin_role VARCHAR(50) NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    target_name VARCHAR(150) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_admin (admin_name),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. DB_UTILITY (Bills & Utility Accounts)
-- =============================================================================
USE db_utility;

CREATE TABLE IF NOT EXISTS utility_accounts (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    category_code VARCHAR(50) NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    customer_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(120) NOT NULL,
    default_due_day INT NULL CHECK (default_due_day BETWEEN 1 AND 31),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_util_household (household_id),
    UNIQUE KEY uk_household_account (household_id, provider_name, customer_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utility_bills (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    billing_period VARCHAR(7) NOT NULL, -- e.g. '2026-09'
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    status ENUM('UNPAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    paid_at TIMESTAMP NULL,
    paid_by_user_id VARCHAR(36) NULL,
    receipt_attachment_url VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES utility_accounts(id) ON DELETE CASCADE,
    INDEX idx_bill_household_status (household_id, status),
    INDEX idx_bill_due_date (due_date)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. DB_ASSET (Electronics, Vehicles & Maintenance Logs)
-- =============================================================================
USE db_asset;

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    asset_type ENUM('ELECTRONIC', 'VEHICLE', 'FURNITURE', 'OTHER') NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'AC', 'KULKAS', 'TV', 'MOBIL', 'MOTOR'
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(80) NULL,
    model_type VARCHAR(100) NULL,
    serial_or_plate_number VARCHAR(100) NULL,
    location_room VARCHAR(80) NULL,
    purchase_date DATE NULL,
    purchase_price DECIMAL(14, 2) NULL CHECK (purchase_price >= 0),
    warranty_expiry_date DATE NULL,
    service_center_contact VARCHAR(150) NULL,
    invoice_url VARCHAR(255) NULL,
    photo_url VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'IN_REPAIR', 'DISPOSED') NOT NULL DEFAULT 'ACTIVE',
    current_odometer INT NULL CHECK (current_odometer >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_asset_household (household_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) NOT NULL,
    title VARCHAR(120) NOT NULL, -- e.g. 'Cuci AC Berkala', 'Ganti Oli Mesin'
    frequency_type ENUM('DAYS', 'MONTHS', 'ODOMETER', 'WHICHEVER_FIRST') NOT NULL,
    frequency_value INT NOT NULL CHECK (frequency_value > 0),
    frequency_months INT NULL CHECK (frequency_months > 0),
    frequency_km INT NULL CHECK (frequency_km > 0),
    next_due_date DATE NULL,
    next_due_odometer INT NULL CHECK (next_due_odometer >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    performed_date DATE NOT NULL,
    vendor_name VARCHAR(120) NULL,
    vendor_phone VARCHAR(30) NULL,
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    current_odometer INT NULL CHECK (current_odometer >= 0),
    notes TEXT NULL,
    receipt_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    INDEX idx_maint_household (household_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. DB_GROCERY (Kitchen Supplies & Shopping List)
-- =============================================================================
USE db_grocery;

CREATE TABLE IF NOT EXISTS shopping_items (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Umum', -- 'Bumbu Dapur', 'Bahan Pokok', 'Kebersihan'
    quantity VARCHAR(50) NULL, -- '1 kg', '2 botol', '1 bungkus'
    stock_status ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'OUT_OF_STOCK',
    estimated_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_price >= 0),
    actual_price DECIMAL(10, 2) NULL DEFAULT NULL CHECK (actual_price IS NULL OR actual_price >= 0),
    is_bought BOOLEAN NOT NULL DEFAULT FALSE,
    bought_by_user_id VARCHAR(36) NULL,
    bought_at TIMESTAMP NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grocery_household (household_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 5. DB_FINANCE (Expense Tracking & Budgets)
-- =============================================================================
USE db_finance;

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    category VARCHAR(60) NOT NULL, -- 'Tagihan', 'Belanja Bulanan', 'Servis Aset', 'Pendidikan', 'Lainnya'
    description TEXT NULL,
    source_type ENUM('MANUAL', 'UTILITY_BILL', 'ASSET_MAINTENANCE', 'GROCERY') NOT NULL DEFAULT 'MANUAL',
    source_reference_id VARCHAR(36) NULL,
    receipt_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expense_household_date (household_id, expense_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    period_month VARCHAR(7) NOT NULL, -- e.g. '2026-09'
    limit_amount DECIMAL(12, 2) NOT NULL CHECK (limit_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_household_budget (household_id, period_month)
) ENGINE=InnoDB;

-- =============================================================================
-- 6. DB_ACTIVITY (Calendar & Events)
-- =============================================================================
USE db_activity;

CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NULL,
    location VARCHAR(200) NULL,
    reminder_minutes_before INT NOT NULL DEFAULT 30 CHECK (reminder_minutes_before >= 0),
    notes TEXT NULL,
    recurrence_group_id VARCHAR(50) NULL,
    recurrence_rule VARCHAR(100) NULL,
    recurrence_summary VARCHAR(100) NULL,
    is_master BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_household (household_id, start_datetime),
    INDEX idx_activity_recurrence (recurrence_group_id),
    INDEX idx_activity_master (household_id, is_master)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_attendees (
    id VARCHAR(36) PRIMARY KEY,
    activity_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('ATTENDING', 'NOT_ATTENDING', 'TENTATIVE') NOT NULL DEFAULT 'ATTENDING',
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE KEY uk_activity_attendee (activity_id, user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- SEED INITIAL MOCK DATA
-- =============================================================================

-- Users & Household (Tebet = FREE, Villa = PRO)
USE db_family;
INSERT INTO users (id, name, email, password_hash, phone, preferred_language, status) VALUES 
('usr-calvin-01', 'Calvin', 'calvin@homehub.app', '$2b$10$w09GgW5oXpL5zZ2W/kEu6e1C.e1oJ6U8gD8Kz3G5f6n8m9p0q1r2s', '081234567890', 'id', 'ACTIVE'),
('usr-siti-02', 'Siti Aminah', 'siti@keluarga.com', '$2b$10$w09GgW5oXpL5zZ2W/kEu6e1C.e1oJ6U8gD8Kz3G5f6n8m9p0q1r2s', '081234567891', 'id', 'ACTIVE'),
('usr-nathan-03', 'Nathan Santoso', 'nathan@keluarga.com', '$2b$10$w09GgW5oXpL5zZ2W/kEu6e1C.e1oJ6U8gD8Kz3G5f6n8m9p0q1r2s', '081234567892', 'id', 'ACTIVE');

INSERT INTO households (id, owner_user_id, name, address, subscription_tier, subscription_status) VALUES
('hh-tebet-01', 'usr-calvin-01', 'Rumah Tinggal - Tebet', 'Jl. Tebet Barat Dalam No. 12, Jakarta Selatan', 'FREE', 'ACTIVE'),
('hh-villa-02', 'usr-calvin-01', 'Villa Puncak', 'Komplek Green Hill Blok C-4, Puncak, Bogor', 'PRO', 'ACTIVE');

INSERT INTO household_members (id, household_id, user_id, role) VALUES
('hm-01', 'hh-tebet-01', 'usr-calvin-01', 'OWNER'),
('hm-02', 'hh-villa-02', 'usr-calvin-01', 'OWNER'),
('hm-03', 'hh-tebet-01', 'usr-siti-02', 'ADMIN'),
('hm-04', 'hh-tebet-01', 'usr-nathan-03', 'MEMBER');

-- Master Categories Seed
INSERT INTO utility_categories (id, code, name, name_en, icon, color, providers, is_default, is_active) VALUES
('cat-elec', 'ELECTRICITY', 'Listrik & Daya', 'Electricity & Power', '⚡', 'amber', '["PLN Pascabayar", "PLN Prabayar (Token)"]', TRUE, TRUE),
('cat-water', 'WATER', 'Air PDAM / Bersih', 'Clean Water / PDAM', '💧', 'blue', '["PDAM Tirtawening", "PAM Jaya", "Aetra Air"]', TRUE, TRUE),
('cat-inet', 'INTERNET', 'Internet & WiFi Fiber', 'Internet & Fiber WiFi', '🌐', 'purple', '["IndiHome Fiber", "Biznet Home", "MyRepublic", "First Media"]', TRUE, TRUE),
('cat-gas', 'GAS', 'Gas PGN & Tabung LPG', 'PGN Gas & LPG Tank', '🔥', 'orange', '["PGN GasKita", "Pertamina Bright Gas 12kg", "LPG 3kg"]', TRUE, TRUE),
('cat-ipl', 'MAINTENANCE_IPL', 'Iuran Pengelola (IPL)', 'Building & Security Dues (IPL)', '🏢', 'emerald', '["Iuran IPL Pengelola", "Iuran Keamanan RT/RW", "Retribusi Kebersihan"]', TRUE, TRUE),
('cat-other', 'OTHER', 'Lainnya / Tagihan Umum', 'Other / General Bills', '📄', 'slate', '["BPJS Kesehatan", "Asuransi Rumah", "Tagihan Lainnya"]', TRUE, TRUE);

INSERT INTO asset_categories (id, code, name, name_en, icon, color, metadata, is_default, is_active) VALUES
('cat-ast-elec', 'ELECTRONIC', 'Elektronik Rumah Tangga', 'Household Electronics', '❄️', 'emerald', '{"subcategories": ["AC", "Kulkas", "Smart TV", "Mesin Cuci", "Microwave", "Dispenser Air"]}', TRUE, TRUE),
('cat-ast-veh', 'VEHICLE', 'Kendaraan Bermotor', 'Motor Vehicles', '🚗', 'blue', '{"has_odometer": true, "subcategories": ["Mobil", "Sepeda Motor", "Sepeda Listrik"]}', TRUE, TRUE),
('cat-ast-furn', 'FURNITURE', 'Perabotan / Furnitur', 'Furniture & Fixtures', '🛋️', 'amber', '{"subcategories": ["Sofa & Kursi", "Meja Makan", "Tempat Tidur", "Lemari Pakaian", "Kitchen Set"]}', TRUE, TRUE),
('cat-ast-prop', 'PROPERTY', 'Properti & Bangunan', 'Property & Buildings', '🏡', 'indigo', '{"subcategories": ["Rumah Utama", "Villa", "Ruko / Toko", "Tanah"]}', TRUE, TRUE),
('cat-ast-jwl', 'JEWELRY', 'Perhiasan & Logam Mulia', 'Jewelry & Precious Metals', '💎', 'purple', '{"subcategories": ["Emas Batangan", "Cincin & Kalung", "Jam Tangan Mewah"]}', TRUE, TRUE),
('cat-ast-oth', 'OTHER', 'Aset Lainnya', 'Other Assets', '📦', 'slate', '{"subcategories": ["Kamera & Lensa", "Sepeda Olahraga", "Peralatan Bengkel / Hobi"]}', TRUE, TRUE);

INSERT INTO expense_categories (id, code, name, name_en, icon, color, metadata, is_default, is_active) VALUES
('cat-exp-dpr', 'EXP_DAPUR', 'Kebutuhan Dapur & Bahan Pokok', 'Kitchen Supplies & Staple Food', '🍳', 'emerald', '{"budget": 1500000}', TRUE, TRUE),
('cat-exp-bln', 'EXP_BULANAN', 'Belanja Bulanan & Supermarket', 'Monthly & Supermarket Shopping', '🛒', 'blue', '{"budget": 2500000}', TRUE, TRUE),
('cat-exp-utl', 'EXP_UTILITAS', 'Tagihan & Utilitas (Listrik/Air/Wifi)', 'Bills & Utilities', '⚡', 'amber', '{"budget": 1200000}', TRUE, TRUE),
('cat-exp-trn', 'EXP_TRANSPORT', 'Transportasi, Bensin & Tol', 'Transportation, Fuel & Toll', '🚗', 'orange', '{"budget": 1000000}', TRUE, TRUE),
('cat-exp-pdd', 'EXP_PENDIDIKAN', 'Pendidikan & Les Anak', 'Education & Courses', '📚', 'rose', '{"budget": 1200000}', TRUE, TRUE),
('cat-exp-med', 'EXP_KESEHATAN', 'Kesehatan, Obat & Medis', 'Healthcare & Medicines', '💊', 'teal', '{"budget": 500000}', TRUE, TRUE),
('cat-exp-srv', 'EXP_SERVIS', 'Servis Kendaraan & Rumah', 'Vehicle & Home Maintenance', '🔧', 'purple', '{"budget": 800000}', TRUE, TRUE),
('cat-exp-hbr', 'EXP_HIBURAN', 'Gaya Hidup, Kuliner & Hiburan', 'Lifestyle & Entertainment', '☕', 'cyan', '{"budget": 800000}', TRUE, TRUE),
('cat-exp-inv', 'EXP_INVESTASI', 'Investasi & Tabungan', 'Investment & Savings', '📈', 'emerald', '{"budget": 2000000}', TRUE, TRUE),
('cat-exp-dns', 'EXP_DONASI', 'Sosial & Zakat/Donasi', 'Social & Donations', '🤲', 'indigo', '{"budget": 500000}', TRUE, TRUE),
('cat-exp-oth', 'EXP_LAINNYA', 'Lainnya', 'Others', '📦', 'slate', '{"budget": 300000}', TRUE, TRUE);

INSERT INTO activity_categories (id, code, name, name_en, icon, color, metadata, is_default, is_active) VALUES
('cat-act-les', 'COURSE_LES', 'Kursus / Les / Bimbel', 'Courses & Tutoring', '🎓', 'amber', '{"tag": "Les", "reminder": 30}', TRUE, TRUE),
('cat-act-lib', 'VACATION', 'Liburan / Rekreasi Keluarga', 'Vacation & Family Recreation', '🌴', 'emerald', '{"tag": "Liburan", "reminder": 1440}', TRUE, TRUE),
('cat-act-dns', 'BIZTRIP', 'Perjalanan Bisnis / Dinas', 'Business Trip', '💼', 'blue', '{"tag": "Dinas", "reminder": 120}', TRUE, TRUE),
('cat-act-udg', 'INVITATION', 'Undangan / Hajatan', 'Invitation / Party', '✉️', 'purple', '{"tag": "Undangan", "reminder": 60}', TRUE, TRUE),
('cat-act-ult', 'BIRTHDAY', 'Ulang Tahun / Perayaan', 'Birthday & Celebration', '🎂', 'pink', '{"tag": "Ulang Tahun", "reminder": 1440}', TRUE, TRUE),
('cat-act-rtn', 'ROUTINE', 'Rutinitas / Ibadah', 'Routine & Worship', '⚡', 'indigo', '{"tag": "Rutinitas", "reminder": 15}', TRUE, TRUE),
('cat-act-med', 'HEALTH_CHECK', 'Pemeriksaan Kesehatan / Dokter', 'Doctor & Health Checkup', '🩺', 'rose', '{"tag": "Kesehatan", "reminder": 60}', TRUE, TRUE),
('cat-act-rpt', 'MEETING', 'Rapat RT/RW / Komunitas', 'Community & Neighborhood Meeting', '👥', 'teal', '{"tag": "Rapat", "reminder": 30}', TRUE, TRUE),
('cat-act-oth', 'OTHER', 'Lainnya', 'Others', '📌', 'slate', '{"tag": "Agenda", "reminder": 30}', TRUE, TRUE);

-- Utility Bills
USE db_utility;
INSERT INTO utility_accounts (id, household_id, category_code, provider_name, customer_number, account_name, default_due_day) VALUES
('acc-pln-01', 'hh-tebet-01', 'ELECTRICITY', 'PLN Pascabayar', '53891029381', 'Listrik Rumah Tebet', 5);

INSERT INTO utility_bills (id, household_id, account_id, billing_period, due_date, amount, status) VALUES
('bill-01', 'hh-tebet-01', 'acc-pln-01', '2026-09', '2026-09-05', 450000.00, 'UNPAID');

-- Assets (Free limit: 2 assets)
USE db_asset;
INSERT INTO assets (id, household_id, asset_type, category, name, brand, model_type, serial_or_plate_number, location_room, purchase_date, warranty_expiry_date, current_odometer) VALUES
('ast-ac-01', 'hh-tebet-01', 'ELECTRONIC', 'AC', 'AC Daikin Inverter 1 PK', 'Daikin', 'FTKQ25UVM4', 'DK-994821', 'Kamar Utama', '2025-01-15', '2028-01-15', NULL),
('ast-crv-02', 'hh-tebet-01', 'VEHICLE', 'MOBIL', 'Mobil Honda CR-V 1.5 Turbo', 'Honda', 'CR-V Turbo Prestige', 'B 1234 SK', 'Garasi', '2023-05-10', '2026-11-28', 44700);

INSERT INTO maintenance_schedules (id, asset_id, title, frequency_type, frequency_value, frequency_months, frequency_km, next_due_date, next_due_odometer) VALUES
('sch-ac-01', 'ast-ac-01', 'Cuci AC Rutin', 'MONTHS', 3, 3, NULL, '2026-09-13', NULL),
('sch-crv-02', 'ast-crv-02', 'Ganti Oli & Filter Berkala', 'WHICHEVER_FIRST', 6, 6, 10000, '2026-10-15', 54700);

-- Groceries (Free limit: 3 items)
USE db_grocery;
INSERT INTO shopping_items (id, household_id, name, category, quantity, stock_status, estimated_price, is_bought) VALUES
('item-01', 'hh-tebet-01', 'Garam Dapur Halus Refill', 'Bumbu Dapur', '1 bks', 'OUT_OF_STOCK', 8000.00, FALSE),
('item-02', 'hh-tebet-01', 'Minyak Goreng SunCo 2L', 'Bahan Pokok', '1 pouch', 'LOW_STOCK', 36000.00, FALSE),
('item-03', 'hh-tebet-01', 'Deterjen Attack Plus Softener 1.2kg', 'Kebersihan', '1 pack', 'IN_STOCK', 42000.00, TRUE);

-- Expenses (Free limit: 5 items)
USE db_finance;
INSERT INTO expenses (id, household_id, user_id, title, amount, expense_date, category, source_type) VALUES
('exp-01', 'hh-tebet-01', 'usr-calvin-01', 'Belanja Mingguan Sayur & Buah', 350000.00, '2026-09-01', 'Belanja Bulanan', 'MANUAL'),
('exp-02', 'hh-tebet-01', 'usr-calvin-01', 'Beras Ramos 10kg', 145000.00, '2026-09-01', 'Belanja Bulanan', 'MANUAL'),
('exp-03', 'hh-tebet-01', 'usr-calvin-01', 'Air Galon Aqua 3 Galon', 60000.00, '2026-09-02', 'Kebutuhan Dapur', 'MANUAL'),
('exp-04', 'hh-tebet-01', 'usr-calvin-01', 'Gas Elpiji 12kg', 220000.00, '2026-09-02', 'Utilitas', 'MANUAL'),
('exp-05', 'hh-tebet-01', 'usr-calvin-01', 'Bensin Honda CR-V', 475000.00, '2026-09-03', 'Transportasi', 'MANUAL');

-- Activities
USE db_activity;
INSERT INTO activities (id, household_id, created_by_user_id, title, activity_type, start_datetime, location, notes) VALUES
('act-01', 'hh-tebet-01', 'usr-calvin-01', 'Les Matematika Kumon Nathan', 'COURSE_LES', '2026-09-03 15:00:00', 'Kumon Ruko Tebet Square', 'Antar jam 14.45, selesai jam 16.30');

