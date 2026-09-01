# Driving the instrument — a field guide

For the person holding the tablet. No protocol, no code — just what the
controls do, in the order you'll meet them. The science behind every knob is
in `boids-panel-stories.md`; the machinery is in `instrument-protocol.md`.

## Getting it on the big screen

1. On the PC, in the project folder: `node relay.js`
2. **First launch only:** Windows will ask whether to allow Node through the
   firewall. Click **Allow** (private networks is enough). If you dismissed
   that dialog and the tablet can't connect, that's why.
3. It prints three URLs. Open the **model** one on the big screen's browser.
4. On the tablet (same Wi-Fi), scan the QR code in the corner of the big
   screen, or type the **tablet** URL it printed.

The model boots **paused at frame 0** — a frozen scatter of blue birds.
That's not broken; it's waiting for you. The QR code shows whenever the
model is paused and disappears when it runs.

## The sixty-second tour

Tap **Flock** in the Setup card, then **Apply & run**. There's your
murmuration. Drag **Cohesion** up and down and watch the flock breathe.
Tap **Pause**. Tap **◀ Back** a few times. You just rewound time. Welcome.

## The one idea that explains everything

The tablet has two kinds of controls, and they look different on purpose:

- **Live controls** (plain cards): they steer the flock *now*, and they are
  **irreversible**. Putting a slider back does not rewind anything — the
  flock's state is its whole history, not its settings. There is no undo
  for the present.
- **The Setup card** (orange border): numbers here define a *start*, and
  nothing happens until you press Apply. This is the **only reproducible
  moment** — the same seed and numbers produce the identical flock, every
  time, forever. When you want "again, exactly," this is the card.

Everything else on the tablet exists to make peace between those two facts.

## Time travel (the Capture card)

The model is always recording the last ~600 frames into a rolling buffer.
You can't press record before something interesting happens — so instead,
**pause IS the capture**: pausing stops the discarding, and whatever just
flew by is yours.

- **Scrub / ◀ Back / Step ▶** — walk through the captured frames. Nothing
  is simulated; you're paging through the actual past. Step past the end
  and the simulation resumes growing, one frame per tap.
- **Resume from end** — back to the present, play on. The scrub was a replay.
- **Branch here** — the frame you're looking at *becomes* the present. The
  old future is abandoned, and you're free to try a different one. This is
  the what-if machine.
- **Mark claim** — bookmark the current frame with a note. Claims travel
  inside run files and are tap-to-jump for whoever loads them.

## The butterfly (the Divergence card)

The best trick in the box. Pause, scrub back a few seconds, **Branch here**,
nudge one number — cohesion up 0.1, say — and press Step a few times or Go.
The Divergence chart draws the average distance between each bird and its
twin in the timeline you abandoned. Unchanged branch: exactly zero, flat.
Nudged branch: a rising curve — sensitive dependence on initial conditions,
measured in your living room. The curve only lives as long as the abandoned
timeline had frames to compare against, so branch from a few seconds back,
not from the last instant.

## Saving and sharing (the Run file card)

**Export** writes a small JSON file: your starting flock, every change you
made and when, every branch, every claim. It is not a video — loading it
makes the model **re-grow the identical run** from scratch (Load…, then
"Go to" a frame). A whole evening's experiment fits in a few KB and replays
bit-for-bit on any machine with this model version.

One rule keeps this honest: leave **Pointer: off** (it is, by default). The
mouse perturbing the flock is an input the recording can't capture; if you
turn it on, the run is marked not-replayable.

## The Readouts, in one breath

- **polarization** → 1 when everyone flies the same direction (a *flock*)
- **rotation** → high when the group circles its own center (a *mill* — the
  doughnut)
- both near 0 → a *swarm* (gnats)
- **mean nb** — average neighbours each bird sees; the colour ramp is this
- **checks** — neighbour comparisons per frame; flip **Spatial hash off**
  at 4000 birds and watch this number explain computational complexity

## Ensembles (the honest-scientist button)

One run tells you what *this* flock did. **Run ensemble** repeats your setup
numbers across several different seeds and tabulates the order parameters
with mean ± σ — what the rules do *in general*. If a behaviour shows up in
one seed but not the ensemble, you found a fluke (or a story about history).

## Lessons (scripting an evening)

Set up something worth showing, type a title, **Add step**. Repeat. Prev/
Next walks the list one tap at a time; each step applies its start *paused*
so you can talk, then press Go. Export saves the whole sequence as a file.

## Handing out phones

Any client URL with `?observe` added is read-only — it follows everything
you do, live, and can touch nothing. `remote.html?room=class&observe` on
the guests' phones; the tablet stays yours.

## Five things to try tonight

1. **Gnats** preset — alignment is *zero*, yet the cloud holds together.
   Cohesion alone binds it, like real midge swarms.
2. **The mill hunt** — find settings where rotation climbs above 0.5. No
   recipe; when you get your doughnut, Export it. That file is proof.
3. **The butterfly** — the divergence demo above. Try a nudge of 0.05, then
   0.5. Compare how fast the curves rise.
4. **The shatter** — crank Speed while shrinking Vision. The flock breaks:
   birds outrun their own information horizon.
5. **Big-O by light switch** — 4000 birds, Spatial hash off. Watch `checks`
   and fps. Turn it back on. That's a complexity class, felt.

## If something's off

- **Tablet won't connect** — same Wi-Fi as the PC? Firewall allowed (step 2
  above)? Using `http://`, not `https://`? The room code in both URLs
  matching?
- **Big screen looks frozen at start** — it boots paused on purpose. Go.
- **"Scrubbed into the past" message** — you tried to change a behavioural
  slider while viewing an old frame. Branch here first (or Resume from
  end); the model refuses to let a change happen at an ambiguous time.
- **Bars at the screen edges** — letterboxing, on purpose: the field's
  shape is part of the run, so it reproduces exactly on every display.
