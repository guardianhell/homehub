const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DUMP_DIR = path.join(__dirname, '..', 'database', 'dumps');
const DUMP_FILE = path.join(DUMP_DIR, 'latest-data.sql');

if (!fs.existsSync(DUMP_DIR)) {
  fs.mkdirSync(DUMP_DIR, { recursive: true });
}

console.log('🔄 Memulai ekspor database dari container Docker (homehub-mysql)...');

const DB_LIST = [
  'db_family',
  'db_utility',
  'db_asset',
  'db_grocery',
  'db_finance',
  'db_activity'
].join(' ');

const DUMP_CMD = `docker exec homehub-mysql mysqldump -u root -prootpassword --databases ${DB_LIST} --add-drop-database --add-drop-table --routines --triggers`;

try {
  const dumpOutput = execSync(DUMP_CMD, { maxBuffer: 100 * 1024 * 1024 });
  fs.writeFileSync(DUMP_FILE, dumpOutput);

  const stats = fs.statSync(DUMP_FILE);
  const sizeKb = (stats.size / 1024).toFixed(2);

  console.log(`✅ Database dump berhasil disimpan!`);
  console.log(`📁 Lokasi file: database/dumps/latest-data.sql (${sizeKb} KB)`);
  console.log(`\n📌 Langkah selanjutnya untuk push ke GitHub:`);
  console.log(`   git add database/dumps/latest-data.sql`);
  console.log(`   git commit -m "sync: update latest database dump"`);
  console.log(`   git push`);
} catch (error) {
  console.error('❌ Gagal melakukan dump database:');
  console.error(error.message);
  console.log('\n💡 Pastikan container homehub-mysql sedang berjalan (npm run db:up).');
  process.exit(1);
}
