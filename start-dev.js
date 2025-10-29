const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Grocery Inventory Management System...\n');

// Start backend
console.log('Starting backend server...');
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('Backend error:', err);
});

// Start frontend after a short delay
setTimeout(() => {
  console.log('\nStarting frontend server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (err) => {
    console.error('Frontend error:', err);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 2000);

console.log('\n✅ Servers starting...');
console.log('Backend: http://localhost:5000');
console.log('Frontend: http://localhost:3000');
console.log('\nPress Ctrl+C to stop both servers');
