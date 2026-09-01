// Decode round-trip for the model's hand-rolled QR encoder: rasterize the
// matrix and decode it with jsqr, a real independent decoder.
// Run: cd test && npm install && node qr-test.js
// (Skips politely if jsqr is not installed, so the repo stays zero-dependency.)
const fs = require('fs');
const path = require('path');

let jsQR;
try { jsQR = require('jsqr'); }
catch (e) {
  console.log('SKIP: jsqr not installed — run `npm install` in test/ to enable the QR decode test');
  process.exit(0);
}

const html = fs.readFileSync(path.join(__dirname, '..', 'model.html'), 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const noop = () => {};
const ctxStub = new Proxy({}, { get: () => noop, set: () => true });
const elStub = { classList: { toggle: noop, add: noop, remove: noop }, textContent: '',
                 style: {}, width: 0, height: 0, getContext: () => ctxStub };
const cvStub = { clientWidth: 1600, clientHeight: 900, width: 0, height: 0,
                 getContext: () => ctxStub, addEventListener: noop };
globalThis.document = { getElementById: id => (id === 'cv' ? cvStub : elStub) };
globalThis.window = { addEventListener: noop, devicePixelRatio: 1, BroadcastChannel };
globalThis.location = { search: '', host: 'x', protocol: 'http:', origin: 'http://x', pathname: '/model.html' };
globalThis.requestAnimationFrame = noop;
new Function(src)();

const qr = globalThis.window.__qrMatrix;
if (typeof qr !== 'function') { console.log('FAIL: __qrMatrix not exposed'); process.exit(1); }

function raster(M, scale, margin) {
  const n = M.length, dim = (n + margin * 2) * scale;
  const arr = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!M[r][c]) continue;
    for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
      const o = (((r + margin) * scale + y) * dim + (c + margin) * scale + x) * 4;
      arr[o] = arr[o + 1] = arr[o + 2] = 0;
    }
  }
  return { arr, dim };
}

const CASES = [
  'ROOM-K7QM',                                                     // v1
  'http://x/tablet.html?room=AB',                                  // v2
  'http://192.168.1.100:8014/tablet.html?room=K7QM',               // v3
  'http://some-hostname.local:8014/tablet.html?room=CLASSROOM-42', // v4
  'http://a-quite-long-machine-name.example.lan:8014/tablet.html?room=PERIOD3-SECTION-B&x=1' // v5
];
let pass = 0;
for (const text of CASES) {
  const M = qr(text);
  if (!M) { console.log('FAIL: no matrix for ' + text.length + ' chars'); process.exit(1); }
  const { arr, dim } = raster(M, 8, 4);
  const res = jsQR(arr, dim, dim);
  if (!res || res.data !== text) {
    console.log('FAIL: decode mismatch (' + M.length + ' modules, len ' + text.length + '): got ' +
                (res ? JSON.stringify(res.data) : 'null'));
    process.exit(1);
  }
  console.log('ok: ' + M.length + 'x' + M.length + ' modules decode round-trip (' + text.length + ' chars)');
  pass++;
}
const over = qr('x'.repeat(107));
if (over !== null) { console.log('FAIL: oversize should return null'); process.exit(1); }
console.log('ok: oversize text (107 bytes) politely refused');
console.log('\nALL PASS (' + pass + ' decode round-trips)');
process.exit(0);   // the model's telemetry interval would keep the loop alive
