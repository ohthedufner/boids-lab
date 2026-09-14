// The WebSocket-transport test suite, relay-agnostic: real model.html script
// (with browser stubs), real WebSocket client — the tablet's path. Two relays
// must pass it identically: relay.js (ws-test.js) and the TV apps' embedded
// Java port (tv-relay-test.js). The suite only assumes *something* is
// listening on the port and serving the repo's pages.
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');

function assert(cond, label) {
  if (!cond) { console.log('FAIL: ' + label); process.exit(1); }
  console.log('ok: ' + label);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeGet(PORT) {
  return p => new Promise((res, rej) => {
    http.get('http://127.0.0.1:' + PORT + p, r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => res({ code: r.statusCode, body }));
    }).on('error', rej);
  });
}

// Everything from "the relay is up" to "rooms are isolated". `label` names the
// relay under test in the room-isolation line.
async function runSuite(PORT) {
  const get = makeGet(PORT);

  // ---- static serving ----
  let r = await get('/model.html');
  assert(r.code === 200 && /Boids Model/.test(r.body), 'relay serves model.html');
  r = await get('/tablet.html');
  assert(r.code === 200 && /Boids Instrument/.test(r.body), 'relay serves tablet.html');
  r = await get('/no-such-file.html');
  assert(r.code === 404, 'missing file is 404');

  // ---- boot the model with the WS transport (?room=t1) ----
  const html = fs.readFileSync(path.join(ROOT, 'model.html'), 'utf8');
  const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const noop = () => {};
  const ctxStub = new Proxy({}, { get: () => noop, set: () => true });
  const cvStub = { clientWidth: 1600, clientHeight: 900, width: 0, height: 0,
                   getContext: () => ctxStub, addEventListener: noop };
  const elStub = { classList: { toggle: noop, add: noop, remove: noop },
                   textContent: '', style: {}, width: 0, height: 0,
                   getContext: () => ctxStub };
  globalThis.document = { getElementById: id => (id === 'cv' ? cvStub : elStub) };
  globalThis.window = { addEventListener: noop, devicePixelRatio: 1, BroadcastChannel };
  globalThis.location = { search: '?room=t1', host: '127.0.0.1:' + PORT,
                          protocol: 'http:', origin: 'http://127.0.0.1:' + PORT,
                          pathname: '/model.html' };
  globalThis.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 5);
  new Function(src)();   // boot

  // ---- a "tablet": plain WebSocket client in room t1 ----
  const inbox = [];
  let cursor = 0;
  const c1 = new WebSocket('ws://127.0.0.1:' + PORT + '/ws/t1');
  c1.onmessage = e => { try { const m = JSON.parse(e.data); if (m.from === 'model') inbox.push(m); } catch (err) {} };
  await new Promise((res, rej) => { c1.onopen = res; c1.onerror = rej; });
  function send(m) { m.proto = 1; m.from = 'remote'; c1.send(JSON.stringify(m)); }
  function waitFor(pred, label, ms = 5000) {
    return new Promise((res, rej) => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        for (let i = cursor; i < inbox.length; i++)
          if (pred(inbox[i])) { cursor = i + 1; clearInterval(iv); return res(inbox[i]); }
        if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error('timeout: ' + label)); }
      }, 10);
    });
  }

  send({ t: 'hello' });
  const d = await waitFor(m => m.t === 'describe', 'describe over WS');
  assert(d.clock.running === false && d.clock.frame === 0, 'model answers over the relay: paused at frame 0');
  assert(d.spec.sep && d.values.cnt === 500, 'full contract crosses the wire');

  send({ t: 'set', key: 'coh', value: 1.2 });
  const s = await waitFor(m => m.t === 'state' && m.key === 'coh', 'state echo over WS');
  assert(s.value === 1.2, 'set + echo round-trips the relay');

  for (let i = 1; i <= 3; i++) {
    send({ t: 'do', cmd: 'step' });
    await waitFor(m => m.t === 'clock' && m.viewFrame === i, 'step ' + i + ' over WS');
  }
  console.log('ok: stepping works across the relay');

  send({ t: 'setup', profile: { seed: 9, cnt: 150 } });
  const sd = await waitFor(m => m.t === 'setupDone', 'setup over WS');
  assert(sd.values.seed === 9 && sd.values.cnt === 150, 'setup round-trips the relay');

  send({ t: 'export' });
  const rf = await waitFor(m => m.t === 'runFile', 'run file over WS');
  assert(rf.file.state0.n === 150, 'multi-KB run file survives WS framing');

  const tel = await waitFor(m => m.t === 'telemetry', 'telemetry over WS');
  assert(typeof tel.pol === 'number', 'telemetry streams to the room');

  // ---- room isolation ----
  const c2got = [];
  const c2 = new WebSocket('ws://127.0.0.1:' + PORT + '/ws/OTHER');
  c2.onmessage = e => c2got.push(e.data);
  await new Promise((res, rej) => { c2.onopen = res; c2.onerror = rej; });
  c2.send(JSON.stringify({ proto: 1, from: 'remote', t: 'hello' }));
  send({ t: 'set', key: 'ali', value: 1.5 });
  await waitFor(m => m.t === 'state' && m.key === 'ali', 'ali echo in t1');
  await sleep(600);   // a telemetry tick fires in t1 during this window
  const c2protocol = c2got.filter(x => { try { return JSON.parse(x).from === 'model'; } catch (e) { return false; } });
  assert(c2protocol.length === 0, 'ROOM ISOLATION: room OTHER hears nothing from room t1');

  c1.close(); c2.close();
}

module.exports = { runSuite, assert, sleep, makeGet };
