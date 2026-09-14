// The TV apps' embedded relay (tv_app/shared/src/.../RelayServer.java) must
// pass the exact same WebSocket suite as relay.js — same model script, same
// client, same room isolation. Compiles the very class the apps ship and runs
// it on the desktop JVM via DesktopRelayMain.
//
// Run: node test/tv-relay-test.js
// Needs a JDK (javac). Looks in JAVA_HOME, then PATH, then Android Studio's
// bundled runtime; skips politely if none is found (like qr-test without jsqr).
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { runSuite, assert, sleep, makeGet } = require('./ws-suite.js');

const ROOT = path.join(__dirname, '..');
const TV = path.join(ROOT, 'tv_app');
const OUT = path.join(__dirname, 'tv-relay-classes');
const PORT = 8078;

function findJdk() {
  const candidates = [];
  if (process.env.JAVA_HOME) candidates.push(path.join(process.env.JAVA_HOME, 'bin'));
  candidates.push('');   // PATH
  if (process.platform === 'win32')
    candidates.push('C:\\Program Files\\Android\\Android Studio\\jbr\\bin');
  else if (process.platform === 'darwin')
    candidates.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin');
  const exe = process.platform === 'win32' ? '.exe' : '';
  for (const dir of candidates) {
    const javac = dir ? path.join(dir, 'javac' + exe) : 'javac';
    const probe = spawnSync(javac, ['-version'], { encoding: 'utf8' });
    if (!probe.error && probe.status === 0)
      return { javac, java: dir ? path.join(dir, 'java' + exe) : 'java' };
  }
  return null;
}

(async () => {
  const jdk = findJdk();
  if (!jdk) {
    console.log('SKIP: no JDK found (javac) — install one or set JAVA_HOME to run this suite');
    process.exit(0);
  }

  // ---- compile the class the apps ship, plus the desktop runner ----
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const compile = spawnSync(jdk.javac, ['-d', OUT,
    path.join(TV, 'shared', 'src', 'org', 'boidslab', 'tv', 'RelayServer.java'),
    path.join(TV, 'shared', 'desktop', 'DesktopRelayMain.java')],
    { encoding: 'utf8' });
  assert(compile.status === 0, 'RelayServer.java compiles' +
    (compile.status === 0 ? '' : '\n' + compile.stderr));

  // ---- run it, serving the same merged view of files the apps' assets hold ----
  const relay = spawn(jdk.java, ['-cp', OUT, 'DesktopRelayMain', String(PORT),
    ROOT, path.join(TV, 'web')]);
  let up = false;
  relay.stdout.on('data', d => { if (/listening/.test(String(d))) up = true; });
  relay.on('exit', () => { if (!up) { console.log('FAIL: java relay exited early'); process.exit(1); } });
  for (let i = 0; i < 50 && !up; i++) await sleep(100);
  assert(up, 'embedded (java) relay starts and listens');
  const kill = () => { try { relay.kill(); } catch (e) {} };
  process.on('exit', kill);

  // ---- the TV pages it must also serve ----
  const get = makeGet(PORT);
  let r = await get('/tv.html');
  assert(r.code === 200 && /Boids TV/.test(r.body), 'relay serves tv.html (the TV wrapper)');
  r = await get('/remote-lite.html');
  assert(r.code === 200 && /TV Boids Remote/.test(r.body), 'relay serves remote-lite.html');

  // ---- and the exact suite relay.js passes ----
  await runSuite(PORT);

  kill();
  console.log('\nALL PASS');
  process.exit(0);
})().catch(e => { console.log('FAIL: ' + e.message); process.exit(1); });
