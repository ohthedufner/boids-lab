# Boids Lab

One flock, one file. This is the boids toy from dufner-dev-web, isolated so it
can be explored and re-coloured on its own. Craig Reynolds' three rules
(separation, alignment, cohesion), seven sliders, five presets, a spatial-hash
toggle with a live cost counter, and a permalink that encodes the whole state.

## Run it

Any static server works; double-clicking `index.html` also works (the Copy-link
button just produces uglier URLs from `file://`).

    cd C:\Users\mreri\Projects\boids-lab
    python -m http.server 8013

then open http://localhost:8013/

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

## Reading

- `docs/boids-panel-stories.md` — the museum-placard prose for every control.
- `docs/boids-history-and-provenance.md` — the sourced history: Reynolds,
  Aoki, Vicsek, Couzin, STARFLAG, and which knobs have no ancestor at all.
- [Reynolds' boids page](https://www.red3d.com/cwr/boids/) ·
  [the 1987 paper](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/)
