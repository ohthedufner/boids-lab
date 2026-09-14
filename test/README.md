# Test suites

Four suites, all headless, all runnable with plain Node (≥ 22). They boot
the *real* inline script from `model.html` with browser stubs — no build
step, no framework.

| Suite | Run | Covers |
|---|---|---|
| `protocol-test.js` | `node test/protocol-test.js` | 40 checks over BroadcastChannel: contract, clock, setup determinism (identical setup → bit-identical flock), capture/scrub, **branch determinism** (unchanged branch reproduces the original exactly), run-file export/load/**replay determinism**, divergence (control branch = exactly zero; nudged branch > 0; series bounded to the abandoned span; stays out of exports) |
| `ws-test.js` | `node test/ws-test.js` | 12 checks end-to-end through a real spawned `relay.js` over real WebSockets: static serving, full contract round-trip, multi-KB run file across WS framing, room isolation. The checks themselves live in `ws-suite.js`, shared with the next suite |
| `tv-relay-test.js` | `node test/tv-relay-test.js` | compiles the TV apps' embedded relay (`tv_app/shared/src/…/RelayServer.java` — the class the APKs actually ship) and runs **the exact same suite** against it, plus the TV pages it must serve. Needs a JDK (`javac` via JAVA_HOME, PATH, or Android Studio's bundled runtime); skips politely without one |
| `qr-test.js` | `cd test && npm install && node qr-test.js` | decode round-trip of the model's hand-rolled QR encoder through **jsqr** (an independent decoder), all five supported versions + oversize refusal. Skips politely if jsqr isn't installed, so the repo root stays zero-dependency |

Every suite prints `ALL PASS` and exits 0 on success; any failure prints
`FAIL: <reason>` and exits 1.

## Notes for future test authors

- **The rAF stub must tick.** `requestAnimationFrame` is stubbed as a 5 ms
  `setTimeout` because chunked replay runs inside the animation loop. A
  no-op stub silently freezes replay and the running clock.
- **Headless Chrome + `--virtual-time-budget` starves rAF.** Virtual time
  races through the timer queue far faster than BeginFrames are issued, so
  a scripted go → wait → pause can elapse with *zero* animation frames in
  between and the sim never steps. For browser smoke tests, drive the model
  through the synchronous path instead: `step`/`back` commands execute in
  the message handler and need no rAF.
- **The model's telemetry interval keeps Node's event loop alive** — end
  every suite with an explicit `process.exit`.
- `ws-test.js` uses port **8077** and `tv-relay-test.js` **8078**, to stay
  clear of a live relay on 8014 and of each other.
