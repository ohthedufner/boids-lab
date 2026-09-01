# Instrumenting the flock — notes toward a teaching instrument

Design notes, not a build. Nothing here is implemented. It came out of a long
conversation on 2026-09-01 about what this toy would have to become to be useful
in a room where people are trying to *learn* something from it, and it is written
down because the reasoning was more valuable than the conclusions.

Every claim about the current code is checked against `index.html` and cited by
line. Where something is speculation, it says so.

---

## The premise it assumes

A second version of this, for large screens in a teaching environment, driven by a
tablet rather than a phone — so the interface has room for direct numeric entry,
setting start values before the model begins, and reading numbers off a running
flock.

That version assumes an architecture settled the same day in a companion
project: **an effect is a display model that publishes an API**, and every
interface is a client of that contract. The control panel does not live inside
the model. The argument was made in that project's architecture notes; this
document only assumes it.

**The toy and the instrument are two products sharing one model.** The ambient
wall version stays frozen and plays. The instrument grows. Neither drags the other
around, which is the entire return on separating the model from its panel.

---

## 1. Three classes of parameter, not one

The seven sliders look alike and behave nothing alike. Sorting them is the first
thing the instrument's interface has to get right, because the difference is the
lesson.

| Class | Which ones | Reversible? |
|---|---|---|
| **Initial conditions** | seed, flock size, field dimensions, and the parameter values at the moment of `init()` | Only by restarting |
| **Behavioural** | separation, alignment, cohesion, vision, speed | **Never** |
| **Display** | `CROWD`, `STOPS`, trails | **Freely** — the model never notices |

### Why behavioural parameters are irreversible

You cannot return to a previous view by putting the sliders back where they were.
This is a behavioural model: its state is not determined by its parameters, it is
determined by its parameters *plus the entire history of the system*. Restoring a
slider does not rewind anything. The flock is where it is.

The start point is the only thing you can try to set perfectly. One slider moves
and it is a new adventure.

**An interface that implies otherwise is lying**, and on a tablet with numeric
entry the lie gets loud — a field you can type an exact number into looks like a
field that will take you back. Setup fields and live fields should not look alike.

### Why display parameters are the safe ones

Colour is computed from `nb[i]`, the live neighbour count (line 313). `CROWD` and
`STOPS` change only how the model is *drawn*; the simulation never sees them. So
they can be pushed around and put back exactly.

That makes them the right first controls to expose, and pedagogically the most
generous ones: *"tell it starlings track four neighbours instead of seven, watch
the colouring change, now put it back"* is a demonstration you can run repeatedly
on a live flock without spending anything.

Today `CROWD` and `STOPS` are hardcoded (lines ~153–171) and reach no interface at
all.

---

## 2. Reproducibility — good news, and two catches

**The good news: this simulation is fully deterministic.** Line 181 seeds an
xorshift generator, `rnd()` at line 183 advances it, and there is **no
`Math.random()` anywhere in the file**. A start point *can* be reproduced exactly.

### Catch one: the seed is never restored

`seed` is a module-level variable that `rnd()` mutates, and `init()` (line 199)
never resets it. So every re-scatter continues from wherever the stream happened
to be and produces a different flock.

For ambient art that is a feature. For a classroom — *everyone start from the same
flock, now watch what one slider does* — it is fatal. The fix is one line, but it
has to be a deliberate one.

### Catch two: the start point depends on the screen

Line 204 places birds at `rnd() * FW` and `rnd() * FH` — **the field's pixel
dimensions**. The same seed on a differently-sized display produces a different
flock. In a setup where a tablet configures a run that a large screen displays,
this bites immediately.

Normalising initial positions to 0..1 and scaling at draw time removes it.

### And a third thing that is secretly an initial condition

Line 206 sets initial velocity from `P.spd` — the parameter value *at the moment of
init*. So "speed" is both a behavioural parameter and part of the start state,
depending on when you touch it. That is exactly the "manually setting the start
values before the model begins" case, and it means the setup screen and the live
screen are genuinely different surfaces over the same names.

### What a reproducible run is made of

- the seed
- flock size
- field dimensions (or normalised positions)
- every parameter value at `init()`
- **the frame-indexed list of every change made afterward**

That last item is what makes an entire adventure replayable rather than just its
first instant — see below for why it must be frame-indexed.

---

## 3. The frame is the clock

Wall-clock time is not a property of the model. It is an accident of the machine
it ran on. **Frame 192 reproduces anywhere; `t = 3.2s` reproduces nowhere.**

Everything recorded should be indexed by frame.

The code already agrees where it counts. `checks` is reset at the top of every
`step()` (line 238) before any counting, so the number on the stats line is
already *per frame*. Reporting it per second would mostly measure the hardware.

**Gap:** there is a frame counter at line 329 (`fr`), but it is a rolling one used
for averaging fps, not a monotonic index. An absolute frame number would need
adding — one variable.

---

## 4. Pause, step, and capture are nearly free

The file is already shaped for this, and it is worth saying plainly because it
makes the instrument far cheaper than it sounds.

`step()` (line 234) advances the simulation exactly one frame. `loop(t)` (line 330)
does nothing but timing and then calls it under `requestAnimationFrame` (line 342).
The simulation tick is already separate from the frame loop.

So:

| Want | Cost |
|---|---|
| **pause** | stop calling `step()` |
| **single-step** | call `step()` once |
| **capture** | read the arrays between calls |

That is a switch, not a refactor.

*Note: there is no pause in this file today, and the older boids never had one
either — its buttons are spatial-hash, scatter, copy-link.*

### What there is to capture

Nothing new needs instrumenting. Every frame already computes:

- **`nb[i]`** (line 280) — each bird's current neighbour count. The quantity the
  colour encodes.
- **`checks`** — neighbour comparisons performed this frame.
- **step time in milliseconds.**

A freeze-and-capture would dump a **distribution of neighbour counts at an
instant** — a histogram a room can actually discuss, already sitting in memory.

---

## 5. `checks` is accidentally a clumping detector

Neighbour comparisons spike when birds crowd together — that is the whole reason
the spatial hash earns its keep. So `checks` rises and falls with how tightly the
flock is packed.

Which means the cheapest possible *"start logging when something interesting
happens"* trigger is a number already being computed and already on screen. Mean of
`nb[]` is the other obvious candidate, also free.

A condition trigger is just a predicate evaluated once per frame. Cheap. Whether
it is the right idea is an open question — but it does not need new machinery.

---

## 6. Recording has to work backwards

This is the strongest idea in the conversation and it falls straight out of
irreversibility.

**You cannot decide to record before the interesting thing happens.** By the time
you have seen it, it is gone, and the model will not give it back. A conventional
record button is therefore close to useless here — it only captures things you
predicted, which are the boring ones.

So *start recording* has to mean **keep what just flew by**: a rolling buffer
always holding the last N frames, discarding as it goes. Poking the log does not
begin a recording, it **rescues** one. Poking again marks where to stop.

That inverts the usual relationship. The log is not the output of recording; the
log is the thing you fish in. And it is why this wants a tablet — enough surface to
watch numbers fly past and still have somewhere to grab them.

Cost is a fixed block of memory and one write per frame.

---

## Open questions

- Does the instrument record **state** (positions and velocities, replayable as
  video) or **observations** (counts and distributions, replayable as data)? These
  have very different storage costs and very different uses.
- How long is the rolling buffer, and is that a user setting?
- Does a rescued recording export, and as what?
- Is a condition trigger actually wanted, or does poking the log cover it? Ease of
  implementation is not a reason to build something nobody asked for.
- Is `speed` presented twice — once as setup, once as live — or is that too
  confusing to be worth the fidelity?

## What is decided

Only this: **the frame is the clock**, and **parameters come in three classes, not
one**. Everything else above is a proposal.
