// End-to-end test of the WebSocket transport: real relay.js, real model.html
// script (with browser stubs), real WebSocket client — the tablet's path.
// The checks live in ws-suite.js, shared with tv-relay-test.js so the TV
// apps' embedded relay must pass the exact same suite.
// Run: node test/ws-test.js   (needs Node >= 22 for the native WebSocket client)
const path = require('path');
const { spawn } = require('child_process');
const { runSuite, assert, sleep } = require('./ws-suite.js');

const ROOT = path.join(__dirname, '..');
const PORT = 8077;

(async () => {
  // ---- start the relay ----
  const relay = spawn(process.execPath, ['relay.js'], {
    cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(PORT) })
  });
  let up = false;
  relay.stdout.on('data', d => { if (/listening/.test(String(d))) up = true; });
  relay.on('exit', () => { if (!up) { console.log('FAIL: relay exited early'); process.exit(1); } });
  for (let i = 0; i < 50 && !up; i++) await sleep(100);
  assert(up, 'relay starts and listens');
  const kill = () => { try { relay.kill(); } catch (e) {} };
  process.on('exit', kill);

  await runSuite(PORT);

  kill();
  console.log('\nALL PASS');
  process.exit(0);
})().catch(e => { console.log('FAIL: ' + e.message); process.exit(1); });
