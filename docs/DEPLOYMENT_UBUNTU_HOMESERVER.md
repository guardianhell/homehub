# 🏠 Panduan Deployment HomeHub ke Ubuntu Home Server

Panduan langkah-demi-langkah untuk mendeploy seluruh ekosistem **HomeHub** (Backend Microservices, Database MySQL, Redis, dan Frontend Web/Admin) ke server Ubuntu di rumah dengan koneksi internet ISP rumahan (IP Public Dynamic / CGNAT).

---

## 📋 Prasyarat di Server Ubuntu

Pastikan Ubuntu Server Anda sudah terpasang:
1. **Git**
2. **Docker Engine & Docker Compose** (Plugin v2)

Jika belum terpasang di Ubuntu Server, jalankan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Install Docker Engine & Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Aktifkan perizinan docker tanpa sudo (logout lalu login kembali atau jalankan):
newgrp docker
```

---

## 🚀 Langkah 1: Clone Repository ke Server

Buka terminal Ubuntu Server dan clone repository proyek Anda:
```bash
git clone <URL_REPO_GITHUB_ANDA> homehub
cd homehub
```

---

## ⚙️ Langkah 2: Buat File `.env` Produksi

Salin template konfigurasi produksi:
```bash
cp .env.production.example .env
```

Buka dan sesuaikan nilainya:
```bash
nano .env
```

> [!IMPORTANT]
> **Wajib diubah untuk keamanan:**
> 1. `MYSQL_ROOT_PASSWORD` & `MYSQL_PASSWORD`: Gunakan password yang kuat.
> 2. `JWT_SECRET`: Minimal 32 karakter acak. Anda bisa membuatnya dengan menjalankan perintah:
>    ```bash
>    openssl rand -hex 32
>    ```
> 3. `PAYMENT_WEBHOOK_SECRET`: Kunci rahasia untuk verifikasi webhook pembayaran.
> 4. `REDIS_PASSWORD`: Password untuk akses Redis.

---

## 🐳 Langkah 3: Build & Jalankan Seluruh Sistem

Jalankan perintah berikut untuk mem-build seluruh image Docker dan menyalakan container:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
*(atau jika menggunakan shortcut npm: `npm run prod:up`)*

### Memeriksa Status Layanan:
```bash
docker compose -f docker-compose.prod.yml ps
```
Pastikan seluruh layanan (MySQL, Redis, 6 Microservices, API Gateway, dan Frontend Nginx) berstatus `running` / `healthy`.

### Memeriksa Log:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🌐 Langkah 4: Uji Akses di Jaringan Lokal (LAN)

Cari tahu IP lokal Ubuntu Server Anda:
```bash
ip a | grep inet
```
*(Contoh IP lokal: `192.168.1.50`)*

Buka browser dari laptop atau HP yang terhubung ke Wi-Fi rumah yang sama:
- **HomeHub Web Portal (Keluarga)**: `http://192.168.1.50`
- **HomeHub Admin Backoffice**: `http://192.168.1.50:8080`
- **Health Check API Gateway**: `http://192.168.1.50/api/v1/health`

---

## 🌍 Langkah 5: Akses dari Luar Rumah (Mengatasi IP Public Dynamic / CGNAT)

Karena ISP rumah memiliki IP dinamis atau berada di balik CGNAT, **Cloudflare Tunnel** adalah metode terbaik:
- **Tanpa Port Forwarding** di router (0 port terbuka ke publik, sangat aman).
- **Tembus CGNAT & Dynamic IP**.
- **Mendapatkan SSL/HTTPS Resmi Gratis**.

### Cara Konfigurasi Cloudflare Tunnel:
1. Daftarkan domain Anda di Cloudflare (bisa beli domain murah Rp 15.000/thn).
2. Masuk ke [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
3. Masuk ke menu **Networks** > **Tunnels** > klik **Add a tunnel**.
4. Pilih **Cloudflared**, beri nama tunnel (misal: `homehub-server`).
5. Pada bagian **Install and run a connector**, pilih tab **Docker**.
6. Salin kode token panjang di bagian belakang `--token <TOKEN_PANJANG_ANDA>`.
7. Masukkan token tersebut ke file `.env` di server:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYm...
   ```
8. Restart container tunnel:
   ```bash
   docker compose -f docker-compose.prod.yml up -d cloudflared
   ```
9. Kembali ke dashboard Cloudflare, tambahkan **Public Hostname**:
   - **Layanan 1 (Web Portal)**:
     - Subdomain: `homehub` (misal: `homehub.domainanda.com`)
     - Service Type: `HTTP`
     - URL: `frontend:80`
   - **Layanan 2 (Admin Portal)**:
     - Subdomain: `admin` (misal: `admin.domainanda.com`)
     - Service Type: `HTTP`
     - URL: `frontend:8080`

🎉 **Selesai!** Sekarang HomeHub dapat diakses dari mana saja secara aman melalui:
- `https://homehub.domainanda.com`
- `https://admin.domainanda.com`

---

## 🔄 Cara Memperbarui Kode di Server Saat Ada Update

Setiap kali Anda selesai melakukan perubahan kode di laptop/PC dan sudah di-push ke Git (`git push origin main`), lakukan langkah berikut di terminal Ubuntu Server:

### Cara 1: Menggunakan Script Deploy Otomatis (1 Perintah)
```bash
./scripts/deploy.sh
```

### Cara 2: Perintah Manual Langkah demi Langkah
```bash
# 1. Tarik perubahan terbaru dari GitHub
git pull origin main

# 2. Build ulang container (Docker hanya akan rebuild service yang kodenya berubah)
docker compose -f docker-compose.prod.yml up -d --build

# 3. (Opsional) Bersihkan image cache lama agar disk tidak penuh
docker image prune -f
```

> [!NOTE]
> **Apakah Data Database Akan Hilang Saat Update Kode?**
> **TIDAK**. Data MySQL dan Redis disimpan di dalam Docker Volumes permanen (`mysql_data` dan `redis_data`). Saat container di-rebuild atau di-restart, volume data tetap utuh dan tidak terhapus.

---

## 🛠️ Perintah Berguna untuk Operasional

| Perintah | Deskripsi |
|---|---|
| `./scripts/deploy.sh` | Update kode terbaru dari git dan rebuild container otomatis |
| `docker compose -f docker-compose.prod.yml up -d --build` | Update kode terbaru dan build ulang manual |
| `docker compose -f docker-compose.prod.yml down` | Matikan seluruh layanan |
| `docker compose -f docker-compose.prod.yml restart frontend` | Restart hanya frontend proxy |
| `docker exec -it homehub-mysql mysql -u root -p` | Masuk ke terminal database MySQL |
| `npm run db:dump` | Backup database ke file SQL |
| `npm run db:restore` | Restore database dari dump |

