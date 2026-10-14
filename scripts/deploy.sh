#!/usr/bin/env bash
# =============================================================================
# HomeHub Auto Update & Deploy Script for Ubuntu Server
# =============================================================================
set -e

echo "🚀 [1/4] Menarik kode terbaru dari Git..."
git pull origin main

echo "🐳 [2/4] Membangun ulang dan memperbarui container Docker..."
# Docker hanya akan me-rebuild service yang kodenya berubah (Docker layer caching)
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo "🧹 [3/4] Membersihkan Docker image lama yang menggantung (dangling)..."
docker image prune -f

echo "📋 [4/4] Memeriksa status container yang berjalan..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ DEPLOY SELESAI! Server HomeHub Anda telah berhasil diperbarui."
