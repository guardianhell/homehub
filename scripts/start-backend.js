const { spawn } = require('child_process');
const path = require('path');

const SERVICES = [
  { name: 'Gateway', port: 8000, dir: 'backend/api-gateway', color: '\x1b[35m' },
  { name: 'Auth   ', port: 8001, dir: 'backend/services/auth-service', color: '\x1b[32m' },
  { name: 'Utility', port: 8002, dir: 'backend/services/utility-service', color: '\x1b[36m' },
  { name: 'Asset  ', port: 8003, dir: 'backend/services/asset-service', color: '\x1b[34m' },
  { name: 'Grocery', port: 8004, dir: 'backend/services/grocery-service', color: '\x1b[33m' },
  { name: 'Finance', port: 8005, dir: 'backend/services/finance-service', color: '\x1b[31m' },
  { name: 'Activity', port: 8006, dir: 'backend/services/activity-service', color: '\x1b[36m' },
];

const RESET = '\x1b[0m';
const processes = [];

console.log('🚀 Menyalakan Seluruh Backend Microservices HomeHub...\n');

SERVICES.forEach((service) => {
  const serviceDir = path.resolve(__dirname, '..', service.dir);
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: serviceDir,
    shell: true,
    env: { ...process.env, PORT: service.port },
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) console.log(`${service.color}[${service.name}]${RESET} ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) console.error(`${service.color}[${service.name} ERR]${RESET} ${line}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`${service.color}[${service.name}]${RESET} process exited with code ${code}`);
  });

  processes.push(proc);
});

const cleanup = () => {
  console.log('\n🛑 Menghentikan seluruh backend microservices...');
  processes.forEach((proc) => {
    try {
      proc.kill('SIGINT');
    } catch (e) {}
  });
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
