# The instrument protocol — v1

The contract between the boids model (`model.html`) and any interface that
drives it (`remote.html` is the first). Per an architecture decision inherited
from a companion project: **the model publishes an API and owns all state;
every interface is a client and owns none.** What gets frozen is this
contract, not markup.

Status: milestones 1–4. The contract covers setup, live control, the clock,
telemetry, the capture buffer (scrub / branch), run files (export / load /
replay / claims), cross-device transport, divergence measurement, and
observer mode. Lessons are a client-side convention (see Clients).

---

## Transport

Messages are transport-agnostic JSON objects. Two transports exist, and every
page can run both at once (the model answers a same-browser remote and a
LAN tablet simultaneously — its echoes keep them agreeing):

- **BroadcastChannel `boids-lab`** — same browser, same origin. The pages
  must be served over http (BroadcastChannel does not cross `file://`).
- **WebSocket rooms via `relay.js`** — cross-device. `node relay.js` serves
  the static pages *and* relays `ws://<host>/ws/<room>`; a page joins a room
  with `?room=CODE` in its URL, JSON-stringifying each message. The relay is
  deliberately dumb: it forwards every message to every other socket in the
  room and understands nothing about the protocol — the model stays the
  single source of truth. Clients auto-reconnect; the model re-announces
  `describe` on every socket open, so reconnection needs no ceremony.

Pairing: `model.html?room` (no value) generates a 4-character room code and
shows the tablet URL — as text and as a **QR code** — in the corner of the
display whenever the model is paused; `?room=CODE` pins the code. The QR
encoder is self-contained in the model page (byte mode, ECC L, versions 1–5)
and is verified by decode round-trip in the test suite.

Every message carries an envelope:

```json
{ "proto": 1, "from": "model" | "remote", "t": "<type>", ... }
```

Clients ignore messages whose `from` matches their own role.

## Startup and authority

- The model boots **alone**: defaults loaded, paused at frame 0, no randomness
  consumed beyond the default setup. `?autorun` starts it running (the ambient
  case). It never waits for a remote.
- A remote sends `hello`; the model answers with `describe`. From then on the
  remote holds authority by sending messages; the model remains the single
  source of truth and echoes every applied change, so any number of remotes
  (and late joiners) converge on the same picture.

## Remote → model

| Message | Fields | Meaning |
|---|---|---|
| `hello` | — | announce; model replies with `describe` |
| `describe` | — | ask for the full contract + current truth |
| `set` | `key`, `value` | change one live parameter |
| `setup` | `profile` | **the determinate moment**: restart from frame 0 |
| `do` | `cmd` (see below) | clock and capture commands |
| `scrub` | `frame` | view a captured frame (paused only; clamped to the buffer) |
| `claim` | `from`, `to`, `note` | mark a frame range on the active branch |
| `export` | — | model replies with `runFile` |
| `load` | `file` | restore a run file: state, tree, claims; paused at frame 0 |
| `divergence` | — | model replies `divSeries` for the active branch |

`do` commands: `go`, `pause`, `step`, `back`, `resumeEnd`, `branchHere`,
`goto` (with `frame`). All but `go`/`pause` require the model to be paused.

`setup.profile` may contain any parameter below plus `run` (boolean: start
running, default false = hold at frame 0). Missing keys keep their current
values. `setup` is re-enterable: the same profile reproduces the same frame-0
flock every time (see determinism notes).

`step` advances exactly one frame and only while paused.

## Model → remote

| Message | Fields | Meaning |
|---|---|---|
| `describe` | `version`, `spec`, `values`, `clock`, `field`, `presets`, `tree` | the contract as it currently stands |
| `state` | `key`, `value`, `frame` | echo of every applied `set` (including replayed ones), frame-stamped |
| `clock` | `running`, `frame`, `viewFrame`, `bufFirst`, `rate`, `replaying` | sent on every clock/capture change; `frame` is the head, `viewFrame` the displayed frame, `bufFirst` the oldest captured |
| `setupDone` | `values`, `clock` | a setup completed; full truth attached |
| `tree` | `tree`: `{nodes, active, claims, tainted}` | the run tree changed (branch, claim, load) |
| `runFile` | `file` | the serialized run (reply to `export`) |
| `divSeries` | `node`, `series`: `[[frame, d], …]` | the active branch's divergence curve |
| `telemetry` | see below | 4 Hz readout stream |
| `err` | `of`, `key?`, `msg` | a request was refused, and why |

`version` is `{app, model, proto}`. **`model` bumps whenever `step()`'s
arithmetic or constants change** — determinism means old runs replay only on
the model version that made them. `proto` bumps on message-format changes.

### Telemetry (4 Hz)

`frame`, `running`, `fps`, `stepMs`, `checks` (neighbour comparisons this
frame), `meanNb` (mean neighbour count), `div` (latest divergence value, or
null — see below), and two order parameters over the whole flock:

- **`pol`** — polarization, |mean unit velocity|. ≈1 when travelling as one.
- **`rot`** — rotation, |mean tangential unit component| about the flock
  centroid (circular mean, since the field is a torus). High in a mill.

Couzin (2002) separates swarm / torus / polarized phases with exactly these
two numbers, which makes challenges like "achieve a doughnut" objectively
checkable: e.g. `rot > 0.7` sustained for 300 frames.

## Parameters

Declared in the model's `spec` (part of `describe`) with `min`/`max`/`step`/
`label`/`kind`. Clients build interfaces from `spec`, not from copies of it.

| Key | Kind | Notes |
|---|---|---|
| `seed` | setup | 32-bit; the RNG is reset to it on every `setup` |
| `cnt` | setup | flock size — changes only via restart |
| `aspect` | setup | field width / height; see geometry below |
| `sep` `ali` `coh` `vis` `spd` | behavioural | live and irreversible: they change the flock's future, and putting a slider back does not rewind anything |
| `pointer` | behavioural | mouse repulsion on the model page; **off by default** — an unlogged pointer pass would make a run unreproducible |
| `fade` `crowd` `stops` | display | freely reversible; the simulation never sees them. `stops` is an array of ≥2 `#rrggbb` colours |
| `hash` | engine | spatial hash on/off. No *intended* behavioural effect, but it changes float summation order, which diverges trajectories at bit level — so it must be recorded like a behavioural change |
| `buf` | engine | capture-buffer length in frames (100–3600), memory-capped at ~60 MB; never logged — the trajectory can't see it |
| `rate` | clock | simulation steps per animation frame (0.25–8); distinct from `spd`, which is how fast *birds* fly. Never logged |

Kinds are the three classes from `instrumenting-the-flock.md` (plus engine and
clock): the difference between them is the lesson, and interfaces must not make
setup fields and live fields look alike.

## Field geometry

Positions live in a **fixed logical field**: height 1080 units, width
`aspect × 1080`. All distance-flavoured parameters (`vis`, `spd`, separation
radius, pointer radius) are in logical units, so their values keep the exact
meanings they had in the toy. The screen letterboxes the field at uniform
scale; **resizing the window never re-initializes the flock**. `aspect` is a
setup parameter and will travel inside run files: the same run reproduces
exactly on every display.

## Determinism notes (they become load-bearing in milestone 2)

- `step()` uses only arithmetic and `Math.sqrt` (IEEE-exact): forward
  simulation from a given state is **bit-reproducible across machines**.
- `init()` uses `Math.cos`/`Math.sin`, which may differ by 1 ulp between JS
  engines — a seed alone is therefore not a cross-machine guarantee. Run files
  will store the explicit frame-0 state (positions + velocities) as well.
- The frame is the clock. Nothing is recorded against wall time.

## Capture, scrubbing, and branching

The model keeps a **rolling buffer** of raw per-frame state (positions,
velocities, neighbour counts — 20 bytes/bird/frame), always recording while
the sim runs, discarding as it goes. **Pause is the capture**: you cannot
decide to record before the interesting thing happens, so stopping doesn't
begin a recording — it stops the discarding.

While paused, `scrub`/`back`/`step` move `viewFrame` through the window
`[bufFirst .. frame]` by pure array indexing — nothing is re-simulated, and
display parameters can be retuned freely over a scrubbed frame. Two exits:

- **`resumeEnd`** — return to the head frame and continue the timeline.
- **`branchHere`** — adopt the viewed frame as the present. The frames ahead
  of it are abandoned (they stay recorded on the parent node); a new tree
  node begins at this frame, carrying the current parameters as its
  `startParams`.

Rules that keep the recording honest:

- Behavioural and engine `set`s are **refused while scrubbed into the past**
  (`branch here first`) — a change must have a well-defined frame.
- A behavioural/engine `set` while scheduled (loaded-run) changes are still
  pending **auto-branches**: departing the recorded path *is* a branch.
- `goto f` scrubs if `f` is buffered, replays forward (chunked, ~30 ms per
  animation frame) if `f` is ahead of the head, and refuses if `f` fell out
  of the buffer (reload the run file to replay from frame 0).

## The run file

A single JSON file holding the **whole experiment as a recipe** — replay
re-grows it on the viewer's own model, which is what makes it unfakeable:

```
{ format: "boids-run", formatVersion: 1, model, proto, created,
  field: {aspect, h},
  profile: {…},                      // full values at setup
  state0: {enc:"f32le-b64", n, px, py, vx, vy},   // explicit frame-0 state
  nodes: [{id, parent, startFrame, startParams, changes:[[frame,key,value],…], endFrame}, …],
  active,                            // the path replay follows
  claims: [{node, from, to, note}, …],
  tainted }                          // pointer was used: not replayable
```

- `state0` is explicit (not just the seed) because `init()`'s cos/sin is the
  one engine-portability risk; `step()` itself is bit-reproducible.
- A change `[f, key, value]` was applied while the frame counter read `f`,
  i.e. it governs the step `f → f+1`. Replay applies pending changes with
  `frame ≤ counter` before each step.
- On a branch's path, parent changes at or past the branch frame belong to
  the abandoned future; the branch's `startParams` snapshot re-establishes
  its own starting parameters.
- `load` refuses a file whose `model` version differs — trajectories would
  not reproduce. Any change to `step()`'s arithmetic bumps `MODEL_VER`.
- A 200-bird, two-branch experiment serializes to ~5 KB.

## Divergence

When a branch simulates forward, each new frame overwrites the abandoned
timeline's twin frame in the capture buffer. Just before overwriting, the
model measures the **mean toroidal distance between corresponding birds** —
the divergence curve, recorded on the branch node at zero extra memory cost.
An unchanged branch measures exactly zero (bit-identical twins); a nudged
one draws sensitive dependence on initial conditions, live. The series
exists only over the abandoned span, is streamed as `div` in telemetry,
fetched whole via `divergence`, and **stays out of run files** (it is
derived data; replay regenerates it).

## Clients

Every interface is a client of this contract, owning its own presentation:

- `remote.html` — phone-shaped panel, sliders-first.
- `tablet.html` — the instrument: slider + numeric entry per live parameter,
  a visually distinct setup form (numbers define a *start*, and nothing
  happens until Apply), capture/branch/claims, run files, the divergence
  chart, lessons, and **ensembles** — same setup numbers across K
  deterministically-derived seeds, F frames each, order parameters tabulated
  with mean ± σ. Ensembles and lessons are pure client-side orchestration;
  the model needed nothing new for either.
- **Observer mode** — `?observe` on any client makes it read-only: it sends
  nothing but `hello`/`describe` (and `divergence`), and follows the model's
  echoes perfectly. Students' phones watch the instructor's moves live. This
  is a courtesy flag, not security — anyone can drop it.

### Lesson files (client-side convention)

`{format:'boids-lesson', formatVersion:1, steps:[{title, note, setup?, run?}]}`
— an ordered list of starts with talking points, advanced one tap at a time
from the tablet. A step with `setup` applies it (paused unless `run`); a step
without is a talking point. The model knows nothing about lessons.

## Still open (milestone 5+)

Embedding run files inside lesson steps, side-by-side branch playback on a
second model window, and log-scale divergence for reading the exponent.
