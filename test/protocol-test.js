// Headless protocol test for model.html — boots the real inline script with
// browser stubs and drives it over Node's native BroadcastChannel.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'model.html'), 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- browser stubs ----------------------------------------------------------
const noop = () => {};
const ctxStub = new Proxy({}, { get: () => noop, set: () => true });
const cvStub = {
  clientWidth: 1600, clientHeight: 900, width: 0, height: 0,
  getContext: () => ctxStub, addEventListener: noop
};
const statusStub = { classList: { toggle: noop, add: noop, remove: noop }, textContent: '',
                     style: {}, width: 0, height: 0, getContext: () => ctxStub };
globalThis.document = { getElementById: id => (id === 'cv' ? cvStub : statusStub) };
globalThis.window = { addEventListener: noop, devicePixelRatio: 1, BroadcastChannel };
globalThis.location = { search: '' };
globalThis.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 5);

// ---- test harness -----------------------------------------------------------
const chan = new BroadcastChannel('boids-lab');
const inbox = [];
chan.onmessage = e => { if (e.data && e.data.from === 'model') inbox.push(e.data); };
function send(m) { m.proto = 1; m.from = 'remote'; chan.postMessage(m); }

let cursor = 0;
function waitFor(pred, label, ms = 3000) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      for (let i = cursor; i < inbox.length; i++) {
        if (pred(inbox[i])) { cursor = i + 1; clearInterval(iv); return res(inbox[i]); }
      }
      if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error('timeout: ' + label)); }
    }, 10);
  });
}
function assert(cond, label) {
  if (!cond) { console.log('FAIL: ' + label); process.exit(1); }
  console.log('ok: ' + label);
}

// ---- run --------------------------------------------------------------------
(async () => {
  new Function(src)();   // boot the model

  // 1. boot announce
  let d = await waitFor(m => m.t === 'describe', 'boot describe');
  assert(d.clock.running === false && d.clock.frame === 0, 'boots paused at frame 0');
  assert(d.values.cnt === 500 && d.values.seed === 1234567, 'default values present');
  assert(d.field.w === 1920 && d.field.h === 1080, 'logical field 1920x1080 at 16:9');
  assert(d.spec.sep.kind === 'behavioral' && d.spec.seed.kind === 'setup', 'spec kinds published');
  assert(d.presets.gnats.ali === 0, 'presets published');

  // 2. hello -> describe
  send({ t: 'hello' });
  await waitFor(m => m.t === 'describe', 'describe after hello');
  console.log('ok: hello answered with describe');

  // 3. live set + echo
  send({ t: 'set', key: 'coh', value: 1.4 });
  let s = await waitFor(m => m.t === 'state' && m.key === 'coh', 'state echo');
  assert(s.value === 1.4 && s.frame === 0, 'set echoed with frame stamp');

  // 4. set clamps to spec
  send({ t: 'set', key: 'vis', value: 9999 });
  s = await waitFor(m => m.t === 'state' && m.key === 'vis', 'clamp echo');
  assert(s.value === 130, 'out-of-range value clamped to spec max');

  // 5. setup-only params refuse set
  send({ t: 'set', key: 'seed', value: 7 });
  let err = await waitFor(m => m.t === 'err' && m.key === 'seed', 'seed set refused');
  assert(/setup-only/.test(err.msg), 'setup-only refusal names the fix');

  // 6. single-step while paused
  send({ t: 'do', cmd: 'step' });
  let c = await waitFor(m => m.t === 'clock' && m.frame === 1, 'step to frame 1');
  assert(c.running === false, 'still paused after step');
  send({ t: 'do', cmd: 'step' });
  await waitFor(m => m.t === 'clock' && m.frame === 2, 'step to frame 2');
  console.log('ok: frame counter is absolute and monotonic');

  // 7. go / pause round trip
  send({ t: 'do', cmd: 'go' });
  c = await waitFor(m => m.t === 'clock' && m.running === true, 'go');
  send({ t: 'do', cmd: 'pause' });
  c = await waitFor(m => m.t === 'clock' && m.running === false, 'pause');
  console.log('ok: go/pause round trip');

  // 8. determinism: same setup twice -> identical telemetry after 5 steps
  async function runFive() {
    send({ t: 'setup', profile: { seed: 42, cnt: 200, sep: 1.6, ali: 1.0, coh: 0.9, vis: 52, spd: 2.6 } });
    const sd = await waitFor(m => m.t === 'setupDone', 'setupDone');
    assert(sd.values.seed === 42 && sd.values.cnt === 200 && sd.clock.frame === 0,
      'setup applied: seed 42, 200 birds, frame 0');
    for (let i = 1; i <= 5; i++) {
      send({ t: 'do', cmd: 'step' });
      await waitFor(m => m.t === 'clock' && m.frame === i, 'step ' + i);
    }
    return waitFor(m => m.t === 'telemetry' && m.frame === 5, 'telemetry at frame 5', 4000);
  }
  const t1 = await runFive();
  const t2 = await runFive();
  assert(t1.pol === t2.pol && t1.rot === t2.rot && t1.meanNb === t2.meanNb && t1.checks === t2.checks,
    'DETERMINISM: identical setup reproduces identical flock (pol=' + t1.pol +
    ' rot=' + t1.rot + ' meanNb=' + t1.meanNb + ' checks=' + t1.checks + ')');
  assert(t1.pol > 0 || t1.meanNb > 0, 'telemetry carries real (non-zero) measurements');

  // 9. display params apply live, stops validated
  send({ t: 'set', key: 'stops', value: ['#000000', 'not-a-colour'] });
  await waitFor(m => m.t === 'err' && m.key === 'stops', 'bad stops refused');
  console.log('ok: malformed colour ramp refused');
  send({ t: 'set', key: 'stops', value: ['#112233', '#445566', '#778899'] });
  s = await waitFor(m => m.t === 'state' && m.key === 'stops', 'stops echo');
  assert(s.value.length === 3, 'valid colour ramp applied and echoed');

  // ===== milestone 2: capture, scrub, branch, run file =====

  async function stepTo(f) {
    send({ t: 'do', cmd: 'step' });
    return waitFor(m => m.t === 'clock' && m.viewFrame === f, 'step to ' + f);
  }

  // 10. deterministic run with a mid-run change: 10 steps, coh change, 10 more
  send({ t: 'setup', profile: { seed: 42, cnt: 200, sep: 1.6, ali: 1.0, coh: 0.9, vis: 52, spd: 2.6 } });
  await waitFor(m => m.t === 'setupDone', 'm2 setup');
  for (let i = 1; i <= 10; i++) await stepTo(i);
  send({ t: 'set', key: 'coh', value: 1.4 });
  await waitFor(m => m.t === 'state' && m.key === 'coh', 'coh change at frame 10');
  for (let i = 11; i <= 20; i++) await stepTo(i);
  const tA = await waitFor(m => m.t === 'telemetry' && m.frame === 20, 'telemetry A', 4000);
  console.log('ok: original run to frame 20 (pol=' + tA.pol + ' rot=' + tA.rot + ')');

  // 11. scrub is array indexing: back into the log, step walks it, back returns
  send({ t: 'scrub', frame: 15 });
  let c2 = await waitFor(m => m.t === 'clock' && m.viewFrame === 15, 'scrub to 15');
  assert(c2.frame === 20 && c2.bufFirst === 0, 'scrubbed to 15; head still 20, buffer from 0');
  send({ t: 'do', cmd: 'step' });
  c2 = await waitFor(m => m.t === 'clock' && m.viewFrame === 16, 'step walks log');
  assert(c2.frame === 20, 'step inside the log views 16 without simulating');
  send({ t: 'do', cmd: 'back' });
  await waitFor(m => m.t === 'clock' && m.viewFrame === 15, 'back to 15');
  console.log('ok: back/forward stepping inside the captured log');

  // behavioural set refused while scrubbed
  send({ t: 'set', key: 'coh', value: 2.0 });
  err = await waitFor(m => m.t === 'err' && m.key === 'coh', 'set while scrubbed refused');
  assert(/branch here first/.test(err.msg), 'scrubbed behavioural set refused with guidance');

  // 12. branch at 15, replay 5 steps: a control branch must reproduce the original
  send({ t: 'do', cmd: 'branchHere' });
  let tr = await waitFor(m => m.t === 'tree', 'tree after branch');
  assert(tr.tree.nodes.length === 2 && tr.tree.active === 1 &&
         tr.tree.nodes[1].startFrame === 15, 'branch created: node 1 at frame 15');
  for (let i = 16; i <= 20; i++) await stepTo(i);
  const tB = await waitFor(m => m.t === 'telemetry' && m.frame === 20, 'telemetry B', 4000);
  assert(tB.pol === tA.pol && tB.rot === tA.rot && tB.meanNb === tA.meanNb && tB.checks === tA.checks,
    'BRANCH DETERMINISM: unchanged branch reproduces the original exactly');

  // 13. claim + export
  send({ t: 'claim', from: 18, to: 20, note: 'test claim' });
  tr = await waitFor(m => m.t === 'tree' && m.tree.claims.length === 1, 'claim recorded');
  assert(tr.tree.claims[0].note === 'test claim' && tr.tree.claims[0].node === 1, 'claim carries node + note');
  send({ t: 'export' });
  const rf = await waitFor(m => m.t === 'runFile', 'run file export');
  const file = rf.file;
  assert(file.format === 'boids-run' && file.model === 1, 'file format + model version stamped');
  assert(file.nodes.length === 2 && file.active === 1 && file.claims.length === 1, 'file carries the tree + claims');
  assert(file.state0.n === 200 && typeof file.state0.px === 'string', 'file carries explicit frame-0 state');
  const jsonKB = (JSON.stringify(file).length / 1024).toFixed(1);
  console.log('ok: exported run file is ' + jsonKB + ' KB');

  // 14. destroy the session, load the file, replay: full circle
  send({ t: 'setup', profile: { seed: 7, cnt: 100 } });
  await waitFor(m => m.t === 'setupDone', 'destroy session');
  send({ t: 'load', file: JSON.parse(JSON.stringify(file)) });
  const sd2 = await waitFor(m => m.t === 'setupDone', 'load run file');
  assert(sd2.values.cnt === 200 && sd2.clock.frame === 0, 'load restores 200 birds at frame 0');
  tr = await waitFor(m => m.t === 'tree', 'tree after load');
  assert(tr.tree.nodes.length === 2 && tr.tree.active === 1, 'load restores the branch tree');
  send({ t: 'do', cmd: 'goto', frame: 20 });
  await waitFor(m => m.t === 'state' && m.key === 'coh' && m.value === 1.4, 'replay applies logged coh change');
  await waitFor(m => m.t === 'clock' && m.viewFrame === 20 && m.frame === 20 && !m.replaying, 'replay reaches 20');
  const tC = await waitFor(m => m.t === 'telemetry' && m.frame === 20, 'telemetry C', 4000);
  assert(tC.pol === tA.pol && tC.rot === tA.rot && tC.meanNb === tA.meanNb && tC.checks === tA.checks,
    'REPLAY DETERMINISM: exported file re-grows the identical run (pol=' + tC.pol + ')');

  // ===== milestone 4: divergence =====
  send({ t: 'setup', profile: { seed: 5, cnt: 150, sep: 1.6, ali: 1.0, coh: 0.9, vis: 52, spd: 2.6 } });
  await waitFor(m => m.t === 'setupDone', 'm4 setup');
  for (let i = 1; i <= 12; i++) await stepTo(i);
  send({ t: 'scrub', frame: 8 });
  await waitFor(m => m.t === 'clock' && m.viewFrame === 8, 'scrub to 8');
  send({ t: 'do', cmd: 'branchHere' });
  await waitFor(m => m.t === 'tree' && m.tree.nodes.length === 2, 'branch at 8');

  // control: identical twin steps must diverge by exactly zero
  await stepTo(9); await stepTo(10);
  send({ t: 'divergence' });
  let dv = await waitFor(m => m.t === 'divSeries', 'div series (control)');
  assert(dv.series.length === 2 && dv.series[0][1] === 0 && dv.series[1][1] === 0,
    'CONTROL BRANCH: divergence exactly zero (bit-identical twins)');

  // nudge cohesion; keep stepping over the abandoned frames 11..12
  send({ t: 'set', key: 'coh', value: 2.5 });
  await waitFor(m => m.t === 'state' && m.key === 'coh' && m.value === 2.5, 'coh nudge');
  await stepTo(11); await stepTo(12);
  send({ t: 'divergence' });
  dv = await waitFor(m => m.t === 'divSeries', 'div series (nudged)');
  assert(dv.series.length === 4, 'divergence measured over the abandoned span');
  assert(dv.series[3][1] > 0,
    'BUTTERFLY: nudged branch diverges from the abandoned timeline (d=' + dv.series[3][1] + ' at f12)');

  await stepTo(13);   // beyond the parent's end: no twin left to measure
  send({ t: 'divergence' });
  dv = await waitFor(m => m.t === 'divSeries', 'div series (past end)');
  assert(dv.series.length === 4, 'no divergence entries beyond the abandoned timeline');

  const tD = await waitFor(m => m.t === 'telemetry' && m.div != null, 'telemetry div', 4000);
  assert(typeof tD.div === 'number', 'telemetry carries live divergence');
  send({ t: 'export' });
  const rf2 = await waitFor(m => m.t === 'runFile', 'export after divergence');
  assert(rf2.file.nodes[1].div === undefined, 'divergence series stays out of the run file');

  console.log('\nALL PASS');
  process.exit(0);
})().catch(e => { console.log('FAIL: ' + e.message); process.exit(1); });
