const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DUMP_FILE = path.join(__dirname, '..', 'database', 'dumps', 'latest-data.sql');

if (!fs.existsSync(DUMP_FILE)) {
  console.error(`❌ File dump tidak ditemukan di: ${DUMP_FILE}`);
  console.log('💡 Jalankan "npm run db:dump" di desktop sumber terlebih dahulu, lalu git push & git pull.');
  process.exit(1);
}

console.log('🔄 Memulai pemulihan (restore) database ke container Docker (homehub-mysql)...');

// Command executes mysql command inside docker feeding sql via stdin
const RESTORE_CMD = `docker exec -i homehub-mysql mysql -u root -prootpassword`;

try {
  const sqlContent = fs.readFileSync(DUMP_FILE);
  execSync(RESTORE_CMD, { input: sqlContent, maxBuffer: 100 * 1024 * 1024 });

  console.log(`✅ Seluruh database (db_family, db_utility, db_asset, db_grocery, db_finance, db_activity) berhasil dipulihkan!`);
  console.log(`🚀 Data Anda sekarang identik dengan desktop sebelumnya.`);
} catch (error) {
  console.error('❌ Gagal memulihkan database:');
  console.error(error.message);
  console.log('\n💡 Pastikan container homehub-mysql sudah menyala (npm run db:up).');
  process.exit(1);
}
