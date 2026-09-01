# The instrument protocol — v1

The contract between the boids model (`model.html`) and any interface that
drives it (`remote.html` is the first). Per the architecture decision inherited
from ArtWall: **the model publishes an API and owns all state; every interface
is a client and owns none.** What gets frozen is this contract, not markup.

Status: milestone 1 (contract + same-machine transport). Capture, run files,
and branching are milestone 2 — their semantics are settled in
`instrumenting-the-flock.md` and the design conversation, but no messages for
them exist yet.

---

## Transport

Messages are transport-agnostic JSON objects. Milestone 1 carries them over a
`BroadcastChannel` named **`boids-lab`** — same browser, same origin, so the
pages must be served over http (BroadcastChannel does not cross `file://`
pages). A WebSocket relay for cross-device (tablet → big screen) is the planned
second transport; nothing in the message format assumes BroadcastChannel.

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
| `do` | `cmd`: `go` \| `pause` \| `step` | clock control |

`setup.profile` may contain any parameter below plus `run` (boolean: start
running, default false = hold at frame 0). Missing keys keep their current
values. `setup` is re-enterable: the same profile reproduces the same frame-0
flock every time (see determinism notes).

`step` advances exactly one frame and only while paused.

## Model → remote

| Message | Fields | Meaning |
|---|---|---|
| `describe` | `version`, `spec`, `values`, `clock`, `field`, `presets` | the contract as it currently stands |
| `state` | `key`, `value`, `frame` | echo of every applied `set`, frame-stamped |
| `clock` | `running`, `frame`, `rate` | sent on every clock change |
| `setupDone` | `values`, `clock` | a setup completed; full truth attached |
| `telemetry` | see below | 4 Hz readout stream |
| `err` | `of`, `key?`, `msg` | a request was refused, and why |

`version` is `{app, model, proto}`. **`model` bumps whenever `step()`'s
arithmetic or constants change** — determinism means old runs replay only on
the model version that made them. `proto` bumps on message-format changes.

### Telemetry (4 Hz)

`frame`, `running`, `fps`, `stepMs`, `checks` (neighbour comparisons this
frame), `meanNb` (mean neighbour count), and two order parameters over the
whole flock:

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
| `rate` | clock | simulation steps per animation frame (0.25–8); distinct from `spd`, which is how fast *birds* fly |

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

## Milestone 2 (settled in design, not yet in the protocol)

Rolling raw-state capture buffer (pause = the capture), scrubbing, branch /
resume-from-here, the single-file run-tree format (explicit initial state +
frame-indexed change log + claim markers), and ensemble starts.
