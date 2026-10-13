-- MySQL dump 10.13  Distrib 8.0.46, for Linux (aarch64)
--
-- Host: localhost    Database: db_family
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `db_family`
--

/*!40000 DROP DATABASE IF EXISTS `db_family`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_family` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_family`;

--
-- Table structure for table `activity_categories`
--

DROP TABLE IF EXISTS `activity_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_categories` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `metadata` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_categories`
--

LOCK TABLES `activity_categories` WRITE;
/*!40000 ALTER TABLE `activity_categories` DISABLE KEYS */;
INSERT INTO `activity_categories` VALUES ('cat-act-1791627198553','GYM_SPORT','Olahraga & Gym Rutin',NULL,'🏋️',NULL,'emerald','{}',0,1,'2026-10-10 10:13:18','2026-10-10 10:13:18'),('cat-act-dns','BIZTRIP','Perjalanan Bisnis / Dinas','Business Trip','💼',NULL,'blue','{\"tag\": \"Dinas\", \"reminder\": 120}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-les','COURSE_LES','Kursus / Les / Bimbel','Courses & Tutoring','🎓',NULL,'amber','{\"tag\": \"Les\", \"reminder\": 30}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-lib','VACATION','Liburan / Rekreasi Keluarga','Vacation & Family Recreation','🌴',NULL,'emerald','{\"tag\": \"Liburan\", \"reminder\": 1440}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-med','HEALTH_CHECK','Pemeriksaan Kesehatan / Dokter','Doctor & Health Checkup','🩺',NULL,'rose','{\"tag\": \"Kesehatan\", \"reminder\": 60}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-oth','OTHER','Lainnya','Others','📌',NULL,'slate','{\"tag\": \"Agenda\", \"reminder\": 30}',1,1,'2026-10-10 09:43:12','2026-10-10 10:38:31'),('cat-act-rpt','MEETING','Rapat RT/RW / Komunitas','Community & Neighborhood Meeting','👥',NULL,'teal','{\"tag\": \"Rapat\", \"reminder\": 30}',1,1,'2026-10-10 09:43:12','2026-10-10 10:38:31'),('cat-act-rtn','ROUTINE','Rutinitas / Ibadah','Routine & Worship','⚡',NULL,'indigo','{\"tag\": \"Rutinitas\", \"reminder\": 15}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-udg','INVITATION','Undangan / Hajatan','Invitation / Party','✉️',NULL,'purple','{\"tag\": \"Undangan\", \"reminder\": 60}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-act-ult','BIRTHDAY','Ulang Tahun / Perayaan','Birthday & Celebration','🎂',NULL,'pink','{\"tag\": \"Ulang Tahun\", \"reminder\": 1440}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31');
/*!40000 ALTER TABLE `activity_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_categories` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `metadata` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
INSERT INTO `asset_categories` VALUES ('cat-ast-1791627023531','TEST_AST','Test Asset',NULL,'🚗',NULL,'blue','{}',0,1,'2026-10-10 10:10:23','2026-10-10 10:10:23'),('cat-ast-1791627063653','TES_AUTH_AST','Mobile Phone',NULL,'📱',NULL,'blue','{\"subcategories\": []}',0,1,'2026-10-10 10:11:03','2026-10-10 10:15:49'),('cat-ast-1791627198531','DRONE_AERIAL','Drone & Kamera Udara',NULL,'🛸',NULL,'indigo','{}',0,1,'2026-10-10 10:13:18','2026-10-10 10:13:18'),('cat-ast-1791627274247','MUSICAL_INSTRUMENTS','Alat Musik & Audio',NULL,'🎸',NULL,'purple','{\"subcategories\": [\"Gitar Listrik\", \"Keyboard Yamaha\", \"Speaker Bose\"]}',0,1,'2026-10-10 10:14:34','2026-10-10 10:14:34'),('cat-ast-1791629428038','KRIPTO','Kripto','Crypto','📦',NULL,'orange','{\"budget\": 0, \"reminder\": 30, \"subcategories\": [], \"item_suggestions\": []}',0,1,'2026-10-10 10:50:28','2026-10-10 10:50:28'),('cat-ast-1791629474559','BITCOIN','Bitcoin','Bitcoins','💎',NULL,'amber','{\"budget\": 0, \"reminder\": 30, \"subcategories\": [], \"item_suggestions\": []}',0,1,'2026-10-10 10:51:14','2026-10-10 10:51:14'),('cat-ast-elec','ELECTRONIC','Elektronik Rumah Tangga','Household Electronics','❄️',NULL,'emerald','{\"subcategories\": [\"AC\", \"Kulkas\", \"Smart TV\", \"Mesin Cuci\", \"Microwave\", \"Dispenser Air\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-ast-furn','FURNITURE','Perabotan / Furnitur','Furniture & Fixtures','🛋️',NULL,'amber','{\"subcategories\": [\"Sofa & Kursi\", \"Meja Makan\", \"Tempat Tidur\", \"Lemari Pakaian\", \"Kitchen Set\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-ast-jwl','JEWELRY','Perhiasan & Logam Mulia','Jewelry & Precious Metals','💎',NULL,'purple','{\"subcategories\": [\"Emas Batangan\", \"Cincin & Kalung\", \"Jam Tangan Mewah\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-ast-oth','OTHER','Aset Lainnya','Other Assets','📦',NULL,'slate','{\"subcategories\": [\"Kamera & Lensa\", \"Sepeda Olahraga\", \"Peralatan Bengkel / Hobi\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-ast-prop','PROPERTY','Properti & Bangunan','Property & Buildings','🏡',NULL,'indigo','{\"subcategories\": [\"Rumah Utama\", \"Villa\", \"Ruko / Toko\", \"Tanah\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-ast-veh','VEHICLE','Kendaraan Bermotor','Motor Vehicles','🚗',NULL,'blue','{\"has_odometer\": true, \"subcategories\": [\"Mobil\", \"Sepeda Motor\", \"Sepeda Listrik\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31');
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_admin` (`admin_name`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('aud-01','Dimas Helpdesk','HELPDESK','ACTIVATE_PRO_MANUAL','HOUSEHOLD','hh-surabaya-08','Pakuwon City Surabaya (Dewi Anggraeni)','Aktivasi Paket PRO Tahunan 12 bulan via verifikasi transfer manual','2026-08-11 15:10:00'),('aud-02','Bramantyo Superadmin','SUPERADMIN','SUSPEND_USER','USER','usr-rina-07','Rina Kusuma Dewi (rina.kdewi@gmail.com)','Penangguhan akun sementara karena terindikasi aktivitas spam pendaftaran bot','2026-08-15 09:00:00'),('aud-03','Clarissa Natalia','FINANCE','GENERATE_VOUCHER','VOUCHER','vouch-02','Voucher HEMAT100K','Generate voucher diskon Rp 100.000 untuk kuota 10 pengguna.','2026-09-01 10:00:00'),('aud-04','Reza Pratama','MARKETING','GENERATE_VOUCHER','VOUCHER','vouch-01','Voucher RAMADHAN50','Generate voucher promo diskon 50% untuk kuota 20 pengguna.','2026-09-05 11:30:00'),('aud-05','Bramantyo Superadmin','SUPERADMIN','UPDATE_FEATURE_LIMITS','SYSTEM','feature_limits','Konfigurasi Batasan Fitur Free & PRO','Pembaruan batas limit kuota anggota dan tagihan bulanan.','2026-09-10 14:00:00'),('aud-1791024813167-730F','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:33'),('aud-1791024829466-B5D4','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:49'),('aud-1791024829898-CEF6','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:49'),('aud-1791024830318-F96F','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:50'),('aud-1791024830661-F17E','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:50'),('aud-1791024830851-8E2D','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:50'),('aud-1791024831021-76AA','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:51'),('aud-1791024831194-74C6','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:51'),('aud-1791024831344-0D12','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:51'),('aud-1791024831494-781E','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:51'),('aud-1791024831780-4E19','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:51'),('aud-1791024831908-85AB','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:51'),('aud-1791024832048-461C','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:52'),('aud-1791024832193-9E06','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:52'),('aud-1791024832332-2D88','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:52'),('aud-1791024832483-3FFC','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:52'),('aud-1791024832615-9F00','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:52'),('aud-1791024832778-A5F3','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:52'),('aud-1791024833083-137E','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833237-5F35','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833377-8732','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833531-E939','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833682-5326','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833825-2D55','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:53'),('aud-1791024833983-3B71','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:53'),('aud-1791024834161-9C1F','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:54'),('aud-1791024834358-9383','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:54'),('aud-1791024834582-1DFA','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:54'),('aud-1791024834794-CC7C','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:54'),('aud-1791024835007-0A47','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:53:55'),('aud-1791024836305-887C','Super Admin','SUPERADMIN','SUSPEND_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:53:56'),('aud-1791025006143-998A','Super Admin','SUPERADMIN','SUSPEND_USER','USER','bcfedb86-ab1d-41b8-94d9-60d269c991a4','User ID: bcfedb86-ab1d-41b8-94d9-60d269c991a4','Perubahan status akun ke SUSPENDED. Alasan: -','2026-10-03 10:56:46'),('aud-1791025008862-2B5B','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','bcfedb86-ab1d-41b8-94d9-60d269c991a4','User ID: bcfedb86-ab1d-41b8-94d9-60d269c991a4','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:56:48'),('aud-1791025009661-990B','Super Admin','SUPERADMIN','ACTIVATE_USER','USER','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','User ID: b0d9612a-0e06-4a00-9481-2a72a8fd17ae','Perubahan status akun ke ACTIVE. Alasan: -','2026-10-03 10:56:49'),('aud-1791627023526-BE1A','Super Admin','SUPERADMIN','CREATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627023518','⚡ Test Utility 2 (TEST_UTIL_2)','Admin menambahkan kategori utilitas baru: Kode [TEST_UTIL_2], Logo/Ikon [⚡], Warna [blue], Saran Provider [].','2026-10-10 10:10:23'),('aud-1791627023534-27DB','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791627023531','🚗 Test Asset (TEST_AST)','Admin menambahkan kategori Aset & Inventaris baru: Kode [TEST_AST], Logo/Ikon [🚗], Warna [blue].','2026-10-10 10:10:23'),('aud-1791627063645-F1E1','Super Admin','SUPERADMIN','CREATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627063641','⚡ Tes Via Auth Prefix (TES_AUTH_PREF)','Admin menambahkan kategori utilitas baru: Kode [TES_AUTH_PREF], Logo/Ikon [⚡], Warna [blue], Saran Provider [].','2026-10-10 10:11:03'),('aud-1791627063657-C860','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791627063653','🚗 Tes Via Auth Asset (TES_AUTH_AST)','Admin menambahkan kategori Aset & Inventaris baru: Kode [TES_AUTH_AST], Logo/Ikon [🚗], Warna [blue].','2026-10-10 10:11:03'),('aud-1791627198524-FCC3','Super Admin','SUPERADMIN','CREATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627198519','🔥 Gas Tabung Portable (GAS_PORTABLE)','Admin menambahkan kategori utilitas baru: Kode [GAS_PORTABLE], Logo/Ikon [🔥], Warna [rose], Saran Provider [].','2026-10-10 10:13:18'),('aud-1791627198533-E8D4','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791627198531','🛸 Drone & Kamera Udara (DRONE_AERIAL)','Admin menambahkan kategori Aset & Inventaris baru: Kode [DRONE_AERIAL], Logo/Ikon [🛸], Warna [indigo].','2026-10-10 10:13:18'),('aud-1791627198540-730F','Super Admin','SUPERADMIN','CREATE_GROCERY_CATEGORY','GROCERY_CATEGORY','cat-groc-1791627198538','🧊 Frozen Food Siap Saji (FROZEN_FOOD)','Admin menambahkan kategori Belanja & Dapur baru: Kode [FROZEN_FOOD], Logo/Ikon [🧊], Warna [cyan].','2026-10-10 10:13:18'),('aud-1791627198549-FE63','Super Admin','SUPERADMIN','CREATE_EXPENSE_CATEGORY','EXPENSE_CATEGORY','cat-exp-1791627198546','🎮 Langganan Streaming & Game (STREAMING_GAME)','Admin menambahkan kategori Pengeluaran Keuangan baru: Kode [STREAMING_GAME], Logo/Ikon [🎮], Warna [purple].','2026-10-10 10:13:18'),('aud-1791627198557-F4EB','Super Admin','SUPERADMIN','CREATE_ACTIVITY_CATEGORY','ACTIVITY_CATEGORY','cat-act-1791627198553','🏋️ Olahraga & Gym Rutin (GYM_SPORT)','Admin menambahkan kategori Agenda & Aktivitas baru: Kode [GYM_SPORT], Logo/Ikon [🏋️], Warna [emerald].','2026-10-10 10:13:18'),('aud-1791627274239-F0E2','Super Admin','SUPERADMIN','CREATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627274233','🛡️ Iuran Keamanan Lingkungan (SECURITY_FEE)','Admin menambahkan kategori utilitas baru: Kode [SECURITY_FEE], Logo/Ikon [🛡️], Warna [emerald], Saran Provider [SATPAM Cluster, Pos Ronda RT 05].','2026-10-10 10:14:34'),('aud-1791627274250-135D','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791627274247','🎸 Alat Musik & Audio (MUSICAL_INSTRUMENTS)','Admin menambahkan kategori Aset & Inventaris baru: Kode [MUSICAL_INSTRUMENTS], Logo/Ikon [🎸], Warna [purple].','2026-10-10 10:14:34'),('aud-1791627349781-5786','Super Admin','SUPERADMIN','UPDATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791627063653','📱 Mobile Phone (TES_AUTH_AST)','Admin memperbarui kategori Aset & Inventaris: Nama [Mobile Phone], Ikon [📱], Status [AKTIF].','2026-10-10 10:15:49'),('aud-1791627389498-49E8','Super Admin','SUPERADMIN','UPDATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627063641','⚡ Tagijam Telepon Seluler (TES_AUTH_PREF)','Admin memperbarui kategori utilitas: Nama [Tagijam Telepon Seluler], Ikon [⚡], Status [AKTIF].','2026-10-10 10:16:29'),('aud-1791627398240-DBDC','Super Admin','SUPERADMIN','UPDATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791627063641','⚡ Tagihan Telepon Seluler (TES_AUTH_PREF)','Admin memperbarui kategori utilitas: Nama [Tagihan Telepon Seluler], Ikon [⚡], Status [AKTIF].','2026-10-10 10:16:38'),('aud-1791629318960-32A2','Super Admin','SUPERADMIN','CREATE_UTILITY_CATEGORY','UTILITY_CATEGORY','cat-1791629318953','🚗 Cicilan Kredit Mobil (CICILAN_KREDIT_MOBIL)','Admin menambahkan kategori utilitas baru: Kode [CICILAN_KREDIT_MOBIL], Nama EN [Car Loan Installments], Logo/Ikon [🚗], Warna [cyan], Saran Provider [BCA, MAYBANK, KREDIT PLUS, MANDIRI].','2026-10-10 10:48:38'),('aud-1791629428044-61DA','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791629428038','📦 Kripto (KRIPTO)','Admin menambahkan kategori Aset & Inventaris baru: Kode [KRIPTO], Nama EN [Crypto], Logo/Ikon [📦], Warna [orange].','2026-10-10 10:50:28'),('aud-1791629474569-57A2','Super Admin','SUPERADMIN','CREATE_ASSET_CATEGORY','ASSET_CATEGORY','cat-ast-1791629474559','💎 Bitcoin (BITCOIN)','Admin menambahkan kategori Aset & Inventaris baru: Kode [BITCOIN], Nama EN [Bitcoins], Logo/Ikon [💎], Warna [amber].','2026-10-10 10:51:14');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `metadata` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES ('cat-exp-1791627198546','STREAMING_GAME','Langganan Streaming & Game',NULL,'🎮',NULL,'purple','{}',0,1,'2026-10-10 10:13:18','2026-10-10 10:13:18'),('cat-exp-bln','EXP_BULANAN','Belanja Bulanan & Supermarket','Monthly & Supermarket Shopping','🛒',NULL,'blue','{\"budget\": 2500000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-dns','EXP_DONASI','Sosial & Zakat/Donasi','Social & Donations','🤲',NULL,'indigo','{\"budget\": 500000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-dpr','EXP_DAPUR','Kebutuhan Dapur & Bahan Pokok','Kitchen Supplies & Staple Food','🍳',NULL,'emerald','{\"budget\": 1500000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-hbr','EXP_HIBURAN','Gaya Hidup, Kuliner & Hiburan','Lifestyle & Entertainment','☕',NULL,'cyan','{\"budget\": 800000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-inv','EXP_INVESTASI','Investasi & Tabungan','Investment & Savings','📈',NULL,'emerald','{\"budget\": 2000000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-med','EXP_KESEHATAN','Kesehatan, Obat & Medis','Healthcare & Medicines','💊',NULL,'teal','{\"budget\": 500000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-oth','EXP_LAINNYA','Lainnya','Others','📦',NULL,'slate','{\"budget\": 300000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-pdd','EXP_PENDIDIKAN','Pendidikan & Les Anak','Education & Courses','📚',NULL,'rose','{\"budget\": 1200000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-srv','EXP_SERVIS','Servis Kendaraan & Rumah','Vehicle & Home Maintenance','🔧',NULL,'purple','{\"budget\": 800000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-trn','EXP_TRANSPORT','Transportasi, Bensin & Tol','Transportation, Fuel & Toll','🚗',NULL,'orange','{\"budget\": 1000000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-exp-utl','EXP_UTILITAS','Tagihan & Utilitas (Listrik/Air/Wifi)','Bills & Utilities','⚡',NULL,'amber','{\"budget\": 1200000}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grocery_categories`
--

DROP TABLE IF EXISTS `grocery_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grocery_categories` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `metadata` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grocery_categories`
--

LOCK TABLES `grocery_categories` WRITE;
/*!40000 ALTER TABLE `grocery_categories` DISABLE KEYS */;
INSERT INTO `grocery_categories` VALUES ('cat-groc-1791627198538','FROZEN_FOOD','Frozen Food Siap Saji',NULL,'🧊',NULL,'cyan','{}',0,1,'2026-10-10 10:13:18','2026-10-10 10:13:18'),('cat-groc-bersih','KEBERSIHAN','Kebersihan & Mandi','Cleaning & Bathing','🧼',NULL,'cyan','{\"item_suggestions\": [\"Deterjen Cair\", \"Sabun Mandi Refill\", \"Shampoo\", \"Pembersih Lantai\", \"Pasta Gigi\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-bumbu','BUMBU','Bumbu Masak','Cooking Seasoning','🧂',NULL,'amber','{\"item_suggestions\": [\"Bawang Merah\", \"Bawang Putih\", \"Garam Dapur\", \"Merica Bubuk\", \"Kecap Manis\", \"Minyak Goreng 2L\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-daging','DAGING_IKAN','Daging, Ikan & Telur','Meat, Fish & Eggs','🥩',NULL,'rose','{\"item_suggestions\": [\"Daging Sapi Has Dalam\", \"Dada Ayam Fillet\", \"Ikan Salmon\", \"Udang Segar\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-minum','MINUMAN_SUSU','Minuman & Susu','Beverages & Milk','🥛',NULL,'blue','{\"item_suggestions\": [\"Susu UHT Full Cream\", \"Air Galon Aqua\", \"Teh Celup\", \"Kopi Bubuk\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-oth','OTHER','Lainnya','Others','📦',NULL,'slate','{\"item_suggestions\": [\"Baterai AA\", \"Tisu Basah\", \"Kantong Sampah Hitam\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-pokok','BAHAN_POKOK','Bahan Pokok','Staple Foods','🌾',NULL,'orange','{\"item_suggestions\": [\"Beras Pandan Wangi 10kg\", \"Gula Pasir 1kg\", \"Tepung Terigu Segitiga\", \"Telur Ayam 1kg\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-sayur','SAYUR_BUAH','Sayuran & Buah','Vegetables & Fruits','🥦',NULL,'emerald','{\"item_suggestions\": [\"Wortel Impor\", \"Bayam Segar\", \"Brokoli Hijau\", \"Apel Fuji\", \"Pisang Cavendish\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31'),('cat-groc-snack','SNACK','Makanan Ringan','Snacks','🍪',NULL,'purple','{\"item_suggestions\": [\"Biskuit Roma\", \"Keripik Kentang\", \"Kacang Almond\", \"Roti Tawar Gandum\"]}',1,1,'2026-10-10 09:43:11','2026-10-10 10:38:31');
/*!40000 ALTER TABLE `grocery_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `household_members`
--

DROP TABLE IF EXISTS `household_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `household_members` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('OWNER','ADMIN','MEMBER','HELPER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEMBER',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_household_user` (`household_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `household_members_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `household_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `household_members`
--

LOCK TABLES `household_members` WRITE;
/*!40000 ALTER TABLE `household_members` DISABLE KEYS */;
INSERT INTO `household_members` VALUES ('9aadae79-863b-42dc-842d-ca47fd956dda','1014f548-5ad7-41ca-9712-bd0ee964e61a','296b1c26-62b4-497c-8831-389521fef239','OWNER','2026-09-04 08:04:31',1),('d86c1ec7-094f-44f2-b186-503508ead2e0','09dd7def-8f40-40cd-818e-59ea92aa67d3','b0d9612a-0e06-4a00-9481-2a72a8fd17ae','MEMBER','2026-10-03 06:26:15',1),('da5dbf12-60da-4245-aa55-1dca2412aad1','09dd7def-8f40-40cd-818e-59ea92aa67d3','bcfedb86-ab1d-41b8-94d9-60d269c991a4','OWNER','2026-09-13 06:39:53',1),('hm-01','hh-tebet-01','usr-calvin-01','OWNER','2026-09-03 06:15:42',1),('hm-02','hh-villa-02','usr-calvin-01','OWNER','2026-09-03 06:15:42',1);
/*!40000 ALTER TABLE `household_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `households`
--

DROP TABLE IF EXISTS `households`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `households` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `subscription_tier` enum('FREE','PRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FREE',
  `subscription_status` enum('ACTIVE','EXPIRED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `pro_valid_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_user_id` (`owner_user_id`),
  KEY `idx_household_tier` (`subscription_tier`),
  CONSTRAINT `households_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `households`
--

LOCK TABLES `households` WRITE;
/*!40000 ALTER TABLE `households` DISABLE KEYS */;
INSERT INTO `households` VALUES ('09dd7def-8f40-40cd-818e-59ea92aa67d3','bcfedb86-ab1d-41b8-94d9-60d269c991a4','🏡 Rumah Met',NULL,'PRO','ACTIVE','2026-11-03 17:34:44','2026-09-13 06:39:53','2026-10-03 10:34:43'),('1014f548-5ad7-41ca-9712-bd0ee964e61a','296b1c26-62b4-497c-8831-389521fef239','Rumah Utama Keluarga',NULL,'FREE','ACTIVE',NULL,'2026-09-04 08:04:31','2026-09-04 08:04:31'),('hh-tebet-01','usr-calvin-01','Rumah Tinggal - Tebet','Jl. Tebet Barat Dalam No. 12, Jakarta Selatan','FREE','ACTIVE',NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42'),('hh-villa-02','usr-calvin-01','Villa Puncak','Komplek Green Hill Blok C-4, Puncak, Bogor','PRO','ACTIVE',NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `households` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_type` enum('PRO_MONTHLY','PRO_YEARLY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_paid` decimal(12,2) NOT NULL,
  `started_at` timestamp NOT NULL,
  `expires_at` timestamp NOT NULL,
  `payment_gateway_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PAID','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_chk_1` CHECK ((`amount_paid` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES ('ORD-038046-FB95','09dd7def-8f40-40cd-818e-59ea92aa67d3','PRO_MONTHLY',39200.00,'2026-10-03 10:24:00','2026-11-03 17:24:00','PG-QRIS-ORD-038046-FB95','PAID','2026-10-03 10:23:58'),('ORD-683380-AA9B','09dd7def-8f40-40cd-818e-59ea92aa67d3','PRO_MONTHLY',39200.00,'2026-10-03 10:34:43','2026-11-03 17:34:44','PG-QRIS-ORD-683380-AA9B','PAID','2026-10-03 10:34:43'),('sub-vouch-1791023683919','09dd7def-8f40-40cd-818e-59ea92aa67d3','PRO_MONTHLY',38710.00,'2026-10-03 10:34:43','2026-11-03 17:34:44','VOUCHER-PROMO','PAID','2026-10-03 10:34:43');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_language` enum('id','en') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'id',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('296b1c26-62b4-497c-8831-389521fef239','123','123@123.com','$2b$10$qrAvjMnskru2oyNxCx5w8O/N2sSt5oKEkjetBie.JVU.DGtvDYi9S',NULL,NULL,'id','ACTIVE','2026-09-04 08:04:31','2026-09-04 08:04:31'),('b0d9612a-0e06-4a00-9481-2a72a8fd17ae','1233213','calvinsi1807@gmail.com','$2b$10$huMgc3ScJNmx9yi44GGvpObG9xRv8T9yHGLATiBHO7DA3.BIaGWm6',NULL,NULL,'id','ACTIVE','2026-10-03 06:26:15','2026-10-03 10:56:49'),('bcfedb86-ab1d-41b8-94d9-60d269c991a4','111','111@111.com','$2b$10$mvK.S4jBHx6shafYiuo1W.57yhcADSEu1YfY81jxgzAI4uwNZsz5u',NULL,NULL,'id','ACTIVE','2026-09-13 06:39:53','2026-10-03 10:56:48'),('usr-calvin-01','Calvin','calvin@homehub.app','$2b$10$w09GgW5oXpL5zZ2W/kEu6e1C.e1oJ6U8gD8Kz3G5f6n8m9p0q1r2s','081234567890',NULL,'id','ACTIVE','2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utility_categories`
--

DROP TABLE IF EXISTS `utility_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utility_categories` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '⚡',
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `providers` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_cat_code` (`code`),
  KEY `idx_cat_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utility_categories`
--

LOCK TABLES `utility_categories` WRITE;
/*!40000 ALTER TABLE `utility_categories` DISABLE KEYS */;
INSERT INTO `utility_categories` VALUES ('cat-1791627023518','TEST_UTIL_2','Test Utility 2',NULL,'⚡',NULL,'blue','[]',0,1,'2026-10-10 10:10:23','2026-10-10 10:10:23'),('cat-1791627063641','TES_AUTH_PREF','Tagihan Telepon Seluler',NULL,'⚡',NULL,'amber','[]',0,1,'2026-10-10 10:11:03','2026-10-10 10:16:38'),('cat-1791627198519','GAS_PORTABLE','Gas Tabung Portable',NULL,'🔥',NULL,'rose','[]',0,1,'2026-10-10 10:13:18','2026-10-10 10:13:18'),('cat-1791627274233','SECURITY_FEE','Iuran Keamanan Lingkungan',NULL,'🛡️',NULL,'emerald','[\"SATPAM Cluster\", \"Pos Ronda RT 05\"]',0,1,'2026-10-10 10:14:34','2026-10-10 10:14:34'),('cat-1791629318953','CICILAN_KREDIT_MOBIL','Cicilan Kredit Mobil','Car Loan Installments','🚗',NULL,'cyan','[\"BCA\", \"MAYBANK\", \"KREDIT PLUS\", \"MANDIRI\"]',0,1,'2026-10-10 10:48:38','2026-10-10 10:48:38'),('cat-elec','ELECTRICITY','Listrik & Daya','Electricity & Power','⚡',NULL,'amber','[\"PLN Pascabayar\", \"PLN Prabayar (Token)\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55'),('cat-gas','GAS','Gas PGN & Tabung LPG','PGN Gas & LPG Tank','🔥',NULL,'orange','[\"PGN GasKita\", \"Pertamina Bright Gas 12kg\", \"LPG 3kg\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55'),('cat-inet','INTERNET','Internet & WiFi Fiber','Internet & Fiber WiFi','🌐',NULL,'purple','[\"IndiHome Fiber\", \"Biznet Home\", \"MyRepublic\", \"First Media\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55'),('cat-ipl','MAINTENANCE_IPL','Iuran Pengelola (IPL)','Building & Security Dues (IPL)','🏢',NULL,'emerald','[\"Iuran IPL Pengelola\", \"Iuran Keamanan RT/RW\", \"Retribusi Kebersihan\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55'),('cat-other','OTHER','Lainnya / Tagihan Umum','Other / General Bills','📄',NULL,'slate','[\"BPJS Kesehatan\", \"Asuransi Rumah\", \"Tagihan Lainnya\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55'),('cat-water','WATER','Air PDAM / Bersih','Clean Water / PDAM','💧',NULL,'blue','[\"PDAM Tirtawening\", \"PAM Jaya\", \"Aetra Air\"]',1,1,'2026-10-10 09:25:28','2026-10-10 10:36:55');
/*!40000 ALTER TABLE `utility_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_claims`
--

DROP TABLE IF EXISTS `voucher_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_claims` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voucher_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_plan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `claimed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_claim_voucher` (`voucher_id`),
  KEY `idx_claim_user` (`user_id`),
  KEY `idx_claim_household` (`household_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_claims`
--

LOCK TABLES `voucher_claims` WRITE;
/*!40000 ALTER TABLE `voucher_claims` DISABLE KEYS */;
INSERT INTO `voucher_claims` VALUES ('clm-1791023683914-54FE','vouch-1791023670270','bcfedb86-ab1d-41b8-94d9-60d269c991a4','111','111@111.com','09dd7def-8f40-40cd-818e-59ea92aa67d3','🏡 Rumah Met','PRO_MONTHLY',49000.00,10290.00,38710.00,'2026-10-03 10:34:43');
/*!40000 ALTER TABLE `voucher_claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('PERCENTAGE','FIXED_AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENTAGE',
  `discount_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `target_plan` enum('ALL','PRO_YEARLY','PRO_MONTHLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `max_quota` int NOT NULL DEFAULT '10',
  `claimed_count` int NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','EXHAUSTED','EXPIRED','DISABLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `valid_until` timestamp NOT NULL,
  `generated_by_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Super Admin',
  `generated_by_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUPERADMIN',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_voucher_code` (`code`),
  KEY `idx_voucher_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES ('vouch-01','RAMADHAN50','Promo Berkah Ramadhan diskon 50% seluruh paket PRO HomeHub','PERCENTAGE',50.00,'ALL',20,0,'ACTIVE','2027-12-31 23:59:59','Reza Pratama','MARKETING','2026-10-03 10:29:15','2026-10-03 10:29:15'),('vouch-02','HEMAT100K','Potongan langsung Rp 100.000 untuk langganan PRO Tahunan pertama','FIXED_AMOUNT',100000.00,'PRO_YEARLY',10,0,'ACTIVE','2027-12-31 23:59:59','Clarissa Natalia','FINANCE','2026-10-03 10:29:15','2026-10-03 10:29:15'),('vouch-03','FREE1MO-COMMUNITY','Voucher Uji Coba Gratis 100% Paket PRO 1 Bulan untuk Pengurus RT/RW Mitra','PERCENTAGE',100.00,'PRO_MONTHLY',50,0,'ACTIVE','2027-12-31 23:59:59','Bramantyo Superadmin','SUPERADMIN','2026-10-03 10:29:15','2026-10-03 10:29:15'),('vouch-1791023670270','PROMO','Diskon 21%','PERCENTAGE',21.00,'ALL',1,1,'EXHAUSTED','2027-01-15 06:59:59','Super Admin','SUPERADMIN','2026-10-03 10:34:30','2026-10-03 10:34:43'),('vouch-1791024109831','PROMOPOTONGAN-9X62','Diskon 74%','PERCENTAGE',74.00,'ALL',20,0,'ACTIVE','2027-01-04 06:59:59','Super Admin','SUPERADMIN','2026-10-03 10:41:49','2026-10-03 10:41:49');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_family'
--

--
-- Current Database: `db_utility`
--

/*!40000 DROP DATABASE IF EXISTS `db_utility`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_utility` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_utility`;

--
-- Table structure for table `utility_accounts`
--

DROP TABLE IF EXISTS `utility_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utility_accounts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_code` enum('ELECTRICITY','WATER','INTERNET','MAINTENANCE_IPL','GAS','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_due_day` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_household_account` (`household_id`,`provider_name`,`customer_number`),
  KEY `idx_util_household` (`household_id`),
  CONSTRAINT `utility_accounts_chk_1` CHECK ((`default_due_day` between 1 and 31))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utility_accounts`
--

LOCK TABLES `utility_accounts` WRITE;
/*!40000 ALTER TABLE `utility_accounts` DISABLE KEYS */;
INSERT INTO `utility_accounts` VALUES ('acc-pln-01','hh-tebet-01','ELECTRICITY','PLN Pascabayar','53891029381','Listrik Rumah Tebet',5,'2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `utility_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utility_bills`
--

DROP TABLE IF EXISTS `utility_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utility_bills` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_period` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('UNPAID','PAID','OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `paid_at` timestamp NULL DEFAULT NULL,
  `paid_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_attachment_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `idx_bill_household_status` (`household_id`,`status`),
  KEY `idx_bill_due_date` (`due_date`),
  CONSTRAINT `utility_bills_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `utility_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `utility_bills_chk_1` CHECK ((`amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utility_bills`
--

LOCK TABLES `utility_bills` WRITE;
/*!40000 ALTER TABLE `utility_bills` DISABLE KEYS */;
INSERT INTO `utility_bills` VALUES ('bill-01','hh-tebet-01','acc-pln-01','2026-09','2026-09-05',450000.00,'UNPAID',NULL,NULL,NULL,NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `utility_bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_utility'
--

--
-- Current Database: `db_asset`
--

/*!40000 DROP DATABASE IF EXISTS `db_asset`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_asset` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_asset`;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_type` enum('ELECTRONIC','VEHICLE','FURNITURE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial_or_plate_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_room` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(14,2) DEFAULT NULL,
  `warranty_expiry_date` date DEFAULT NULL,
  `service_center_contact` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','IN_REPAIR','DISPOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asset_household` (`household_id`),
  CONSTRAINT `assets_chk_1` CHECK ((`purchase_price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES ('ast-ac-01','hh-tebet-01','ELECTRONIC','AC','AC Daikin Inverter 1 PK','Daikin','FTKQ25UVM4','DK-994821','Kamar Utama','2025-01-15',NULL,'2028-01-15',NULL,NULL,NULL,'ACTIVE','2026-09-03 06:15:42','2026-09-03 06:15:42'),('ast-crv-02','hh-tebet-01','VEHICLE','MOBIL','Mobil Honda CR-V 1.5 Turbo','Honda','CR-V Turbo Prestige','B 1234 SK','Garasi','2023-05-10',NULL,'2026-11-28',NULL,NULL,NULL,'ACTIVE','2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_logs`
--

DROP TABLE IF EXISTS `maintenance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_date` date NOT NULL,
  `vendor_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_odometer` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `receipt_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `idx_maint_household` (`household_id`),
  CONSTRAINT `maintenance_logs_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_logs_chk_1` CHECK ((`cost` >= 0)),
  CONSTRAINT `maintenance_logs_chk_2` CHECK ((`current_odometer` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_logs`
--

LOCK TABLES `maintenance_logs` WRITE;
/*!40000 ALTER TABLE `maintenance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_schedules`
--

DROP TABLE IF EXISTS `maintenance_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_schedules` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency_type` enum('DAYS','MONTHS','ODOMETER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency_value` int NOT NULL,
  `next_due_date` date DEFAULT NULL,
  `next_due_odometer` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `maintenance_schedules_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_schedules_chk_1` CHECK ((`frequency_value` > 0)),
  CONSTRAINT `maintenance_schedules_chk_2` CHECK ((`next_due_odometer` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_schedules`
--

LOCK TABLES `maintenance_schedules` WRITE;
/*!40000 ALTER TABLE `maintenance_schedules` DISABLE KEYS */;
INSERT INTO `maintenance_schedules` VALUES ('sch-ac-01','ast-ac-01','Cuci AC Rutin','MONTHS',3,'2026-09-13',NULL,1,'2026-09-03 06:15:42','2026-09-03 06:15:42'),('sch-crv-02','ast-crv-02','Ganti Oli & Filter Berkala','ODOMETER',10000,NULL,45000,1,'2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `maintenance_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_asset'
--

--
-- Current Database: `db_grocery`
--

/*!40000 DROP DATABASE IF EXISTS `db_grocery`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_grocery` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_grocery`;

--
-- Table structure for table `shopping_items`
--

DROP TABLE IF EXISTS `shopping_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopping_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Umum',
  `quantity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_status` enum('IN_STOCK','LOW_STOCK','OUT_OF_STOCK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OUT_OF_STOCK',
  `is_bought` tinyint(1) NOT NULL DEFAULT '0',
  `bought_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bought_at` timestamp NULL DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_grocery_household` (`household_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopping_items`
--

LOCK TABLES `shopping_items` WRITE;
/*!40000 ALTER TABLE `shopping_items` DISABLE KEYS */;
INSERT INTO `shopping_items` VALUES ('item-01','hh-tebet-01','Garam Dapur Halus Refill','Bumbu Dapur','1 bks','OUT_OF_STOCK',0,NULL,NULL,NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42'),('item-02','hh-tebet-01','Minyak Goreng SunCo 2L','Bahan Pokok','1 pouch','LOW_STOCK',0,NULL,NULL,NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42'),('item-03','hh-tebet-01','Deterjen Attack Plus Softener 1.2kg','Kebersihan','1 pack','IN_STOCK',1,NULL,NULL,NULL,'2026-09-03 06:15:42','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `shopping_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_grocery'
--

--
-- Current Database: `db_finance`
--

/*!40000 DROP DATABASE IF EXISTS `db_finance`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_finance` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_finance`;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `limit_amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_household_budget` (`household_id`,`period_month`),
  CONSTRAINT `budgets_chk_1` CHECK ((`limit_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `category` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `source_type` enum('MANUAL','UTILITY_BILL','ASSET_MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MANUAL',
  `source_reference_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_household_date` (`household_id`,`expense_date`),
  CONSTRAINT `expenses_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('exp-01','hh-tebet-01','usr-calvin-01','Belanja Mingguan Sayur & Buah',350000.00,'2026-09-01','Belanja Bulanan',NULL,'MANUAL',NULL,NULL,'2026-09-03 06:15:42'),('exp-02','hh-tebet-01','usr-calvin-01','Beras Ramos 10kg',145000.00,'2026-09-01','Belanja Bulanan',NULL,'MANUAL',NULL,NULL,'2026-09-03 06:15:42'),('exp-03','hh-tebet-01','usr-calvin-01','Air Galon Aqua 3 Galon',60000.00,'2026-09-02','Kebutuhan Dapur',NULL,'MANUAL',NULL,NULL,'2026-09-03 06:15:42'),('exp-04','hh-tebet-01','usr-calvin-01','Gas Elpiji 12kg',220000.00,'2026-09-02','Utilitas',NULL,'MANUAL',NULL,NULL,'2026-09-03 06:15:42'),('exp-05','hh-tebet-01','usr-calvin-01','Bensin Honda CR-V',475000.00,'2026-09-03','Transportasi',NULL,'MANUAL',NULL,NULL,'2026-09-03 06:15:42');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_finance'
--

--
-- Current Database: `db_activity`
--

/*!40000 DROP DATABASE IF EXISTS `db_activity`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_activity` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `db_activity`;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` enum('COURSE_LES','VACATION','BIZTRIP','INVITATION','BIRTHDAY','ROUTINE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_minutes_before` int NOT NULL DEFAULT '30',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_household` (`household_id`,`start_datetime`),
  CONSTRAINT `activities_chk_1` CHECK ((`reminder_minutes_before` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES ('act-01','hh-tebet-01','usr-calvin-01','Les Matematika Kumon Nathan','COURSE_LES','2026-09-03 15:00:00',NULL,'Kumon Ruko Tebet Square',30,'Antar jam 14.45, selesai jam 16.30','2026-09-03 06:15:42');
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_attendees`
--

DROP TABLE IF EXISTS `activity_attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_attendees` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ATTENDING','NOT_ATTENDING','TENTATIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ATTENDING',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_attendee` (`activity_id`,`user_id`),
  CONSTRAINT `activity_attendees_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_attendees`
--

LOCK TABLES `activity_attendees` WRITE;
/*!40000 ALTER TABLE `activity_attendees` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_activity'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-12  6:38:30
