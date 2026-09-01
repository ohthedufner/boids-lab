# Boids Lab

One flock, one file. This is the boids toy from a larger multi-page exhibit,
isolated so it can be explored and re-coloured on its own. Craig Reynolds' three rules
(separation, alignment, cohesion), seven sliders, five presets, a spatial-hash
toggle with a live cost counter, and a permalink that encodes the whole state.

## Run it

Any static server works; double-clicking `index.html` also works (the Copy-link
button just produces uglier URLs from `file://`).

    cd boids-lab
    python -m http.server 8013

then open http://localhost:8013/

## The instrument (v2, milestones 1–4)

A second version for study: the model with **no control panel**, driven
entirely through a published API. `model.html` is the display — it boots
paused at frame 0 and waits (add `?autorun` for the ambient case).
`remote.html` is the first client: presets, live sliders, clock control
(go / pause / single-step / rate), telemetry readouts including polarization
and rotation order parameters, and a visually distinct setup card for
deterministic restarts (seed, flock size, aspect).

Milestone 2 adds the memory: a rolling capture buffer where **pause is the
capture** — scrub back and forth through the recent past, then resume the
timeline or **branch** from any captured frame and try a different future.
The whole experiment (start state, every change, every branch, claim
markers) exports as a single small **run file** that replays bit-identically:
load it, press "go to", and the model re-grows the run.

Milestone 3 adds cross-device control and the tablet. `tablet.html` is the
full instrument: numeric entry beside every slider, a setup form where
presets fill fields and nothing happens until Apply, and **ensembles** —
the same setup across many seeds with order parameters tabulated.

**Same machine** (BroadcastChannel; any static server over http):

    http://localhost:8013/model.html
    http://localhost:8013/tablet.html      (or remote.html for the phone layout)

**Across devices** (big screen + tablet on the LAN) — one command, zero
dependencies:

    node relay.js

then open the URLs it prints: `model.html?room=class` on the display,
`tablet.html?room=class` on the tablet. `model.html?room` (no value)
generates a room code and shows the tablet URL — text and QR code — in
the corner whenever the model is paused.

Milestone 4 adds the classroom layer: **lessons** (an ordered list of
starts with talking points, built and advanced from the tablet, saved as a
file), **observer mode** (`?observe` makes any client read-only — student
phones follow the instructor's moves live), and the **divergence curve** —
branch, nudge one number, and watch the mean distance between the two
timelines' corresponding birds rise: the butterfly effect, measured. An
unchanged branch reads exactly zero.

The contract between all pages is `docs/instrument-protocol.md`; the design
reasoning is `docs/instrumenting-the-flock.md`. The toy (`index.html`) is
frozen and unaffected — model and toy are a conscious fork, never synced.

## Where the colours live

Everything is in one clearly-marked block near the top of the script in
`index.html` — look for `---- colour ----`:

- **`STOPS`** — the ramp, as hex colours from *alone* to *crowded*. Edit these
  freely; any number of stops works, blended evenly. Current ramp:
  blue `#3D63D8` → teal `#2FB6A8` → yellow `#EFC94C` → hot orange `#FF5C38`.
- **`CROWD`** — the neighbour count where the ramp saturates. Set to **7**,
  which is a citation, not a taste: real starlings attend to their 6–7 nearest
  neighbours (Ballerini et al., PNAS 2008 — the STARFLAG project). A fully hot
  bird is seeing a real starling's neighbourhood.

A legend strip in the panel paints the ramp live from `STOPS`, so your edits
show up in the UI automatically.

## Changed from the original

- Colour was a two-point blue→orange blend that crossed muddy grey in the
  middle; now a multi-stop lookup table with much stronger hue separation.
- The neighbour-count divisor moved from 9 (arbitrary) to `CROWD = 7` (cited).
- Added the legend strip and a sentence in the panel note.
- Stripped the glasswall remote plumbing (BroadcastChannel / SSE / `?remote=1`
  cast mode) — that machinery belongs to the multi-page exhibit, not this lab.

## Tests

    node test/protocol-test.js     # 40 checks: contract, determinism, capture, run files, divergence
    node test/ws-test.js           # 12 checks: real relay, real WebSockets, room isolation
    cd test && npm install && node qr-test.js    # QR decode round-trip (skips without jsqr)

See `test/README.md` for what each covers and hard-won notes for future
test authors.

## Reading

- `docs/driving-the-instrument.md` — **start here to use the tablet**: the
  field guide for whoever is holding it, including living-room setup and
  five things to try tonight.
- `docs/boids-panel-stories.md` — the museum-placard prose for every control.
- `docs/boids-history-and-provenance.md` — the sourced history: Reynolds,
  Aoki, Vicsek, Couzin, STARFLAG, and which knobs have no ancestor at all.
- [Reynolds' boids page](https://www.red3d.com/cwr/boids/) ·
  [the 1987 paper](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/)
