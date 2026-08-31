# The Boids Panel — a field guide with provenance

Seven sliders and a toggle. Each looks like a tuning knob; each is a doorway
into forty years of research, film history, and physics that wasn't supposed
to be there. The descriptions below are of *this* toy's panel, live values and
all. The stories are where each knob came from — and what people found when
they turned it. One note from the curator: the provenance is mapped (the
sourced companion is `boids-history-and-provenance.md`) — seven of the eight
controls trace to a named paper; the eighth (Trails) traces to Marey's
chronophotography; and three affordances on this page — the spatial-hash
toggle as an interface, the neighbour-count colouring, and the permalink —
have no ancestor we could find at all.

---

## Separation *(0–3, default 1.6)*

**What it is.** How hard a bird steers away from neighbors that get too close.
In this toy, "too close" means inside an inner bubble 42% the size of its
vision radius — birds flee crowding in that inner zone while still cooperating
with the wider neighborhood.

**Where it came from.** It's the first rule Craig Reynolds wrote down in 1986
— he called it *collision avoidance*, and listed it first for a reason:
without it, the other two rules collapse the whole flock into a single point.
Separation is what makes a flock a *society* instead of a pile. The two-zone
refinement (flee the near, cooperate with the far) is even older than boids:
Ichiro Aoki's 1982 fish-schooling model used distance zones five years before
Reynolds, and Iain Couzin formalised them again in 2002. This toy carries it
in one line of code: `sr = vis * 0.42`.

**What it turned up.** Separation is the rule Hollywood needed most. When
Disney built the wildebeest stampede in *The Lion King* (1994) with crowd
tech in the boids lineage — an in-house herding and collision-avoidance
system, not Reynolds' code — the hard problem wasn't making hundreds of
animals run — it was making them *not pass through each other* on a cliff
face. Every rendered herd, army, and orc horde since owes its solidity to this
slider. Drag it to zero in the toy and watch bodies ghost through one another:
that's what every crowd shot would look like without it.

## Alignment *(0–3, default 1.0)*

**What it is.** How strongly a bird matches its neighbors' heading. This is
the difference between a *swarm* (milling, directionless) and a *flock*
(going somewhere together).

**Where it came from.** Reynolds' second rule, *velocity matching*. He noticed
that avoiding collisions is much easier when you're already moving the way
your neighbors are — alignment is separation's lazy, elegant cousin.

**What it turned up.** The strangest discovery in flocking science lives here.
In 1984, biologist Wayne Potts filmed dunlin flocks and found that turning
waves sweep through a flock about **three times faster** than any individual
bird's reaction time allows. His explanation, now called the *chorus-line
hypothesis*: birds don't react to their immediate neighbor — they see the
wave of turning coming from far across the flock and time their entry like
dancers watching a kick-line approach. Thirty years later, 3D-tracking
studies in Rome confirmed it: information travels through a starling flock
like a wave through a material, at constant speed, faster than any bird
flies. Alignment isn't just imitation — it's a medium that carries signals.

## Cohesion *(0–3, default 0.9)*

**What it is.** How strongly a bird drifts toward the center of its visible
neighbors. The gravity of the group.

**Where it came from.** Reynolds' third rule, *flock centering* — and his
quietest, most radical insight. Before boids, the common assumption was that
flocks follow a leader. Cohesion abolishes the leader: every bird steers
toward its own *local* average, nobody knows where the center of the whole
flock is, and yet the flock stays whole. No bird is in charge, so no bird is
a single point of failure — which is exactly why a predator can't decapitate
a murmuration.

**What it turned up.** Cohesion can hold a group together *entirely on its
own*. Laboratory studies of midge swarms (the little gnat clouds that hover
over lawns at dusk) show almost no alignment at all — each insect flies its
own chaotic path — yet the cloud holds its shape and position like a bound
object. Physicists who measured it found the swarm behaves like a strange
material, with an effective surface tension. Your **gnats** preset is that
finding made playable: alignment 0.0, modest cohesion, and the cloud still
*holds*. A crowd with no agreement and no direction — bound anyway.

## Vision *(14–130 px, default 52)*

**What it is.** The radius each bird can see — which decides *who counts as a
neighbor*. The three rules say what to do about neighbors; vision defines the
word. Narrow vision: nervous local cliques. Wide vision: one giant consensus
organism.

**Where it came from.** Reynolds' rules were always local — reacting to the
whole flock would be both unrealistic and computationally hopeless. Every
boids implementation since has needed a perception radius, and this slider is
that radius, honestly exposed. It also secretly runs the engine room: the
spatial hash bins birds into cells exactly one vision-radius wide, so each
bird only searches the neighborhood it can see.

**What it turned up.** Real starlings, it turns out, don't use a radius. In
2008 the STARFLAG project stereo-photographed thousands of starlings over
Rome's train station and reconstructed every bird's position in 3D — the
first time anyone had measured a real murmuration from the inside. The
result: each starling attends to its **six or seven nearest neighbors**,
regardless of how near or far they are. Vision in real flocks is a neighbor
*count*, not a distance — which keeps the flock robust when it stretches
thin or packs tight. The slider in this toy is the classic metric version;
the birds over Rome are running a subtly different algorithm, discovered
twenty years after Reynolds guessed.

## Speed *(0.4–7, default 2.6)*

**What it is.** The cruise speed the birds are clamped to — the tempo the
three rules must negotiate at.

**Where it came from.** Reynolds again: his boids clamp velocity and steering
force so bodies fly like birds rather than teleporting like particles. He
formalized this in his 1999 *Steering Behaviors* paper — the document that
taught a generation of game developers how to move characters, and the reason
this slider feels familiar to anyone who's chased a ghost in a video game.

**What it turned up.** Speed and agreement are physically coupled. In fish
schools, faster fish align more tightly — at speed, the cost of a collision
rises and the time to react shrinks, so polarization becomes survival. Your
presets know this: **school** pairs the panel's highest speed (4.3) with
fierce alignment (2.4); **crystal** pairs a crawl (0.9) with near-total
alignment and almost no cohesion — order without urgency, a lattice instead
of a school. And the toy holds a discovery you can perform yourself: crank
speed while shrinking vision, and the flock shatters — the birds literally
outrun their own information horizon. News of the turn can't spread faster
than the turners.

## Flock size *(50–4000, default 500)*

**What it is.** How many birds run the rules. Below ~100 you see individuals
with relationships; above ~1000 you see a fluid.

**Where it came from.** Reynolds' first boids film ran on a Symbolics Lisp
machine in 1986 with **80 boids at about 95 seconds per frame** — his flock
premiered in the 1987 animated short *Stanley and Stella in: Breaking the
Ice* after render sessions that ran overnight. This browser tab does 4000 at
sixty frames a second — roughly a 285,000-fold improvement in bird-updates
per second, or about 14-million-fold counting pair comparisons, achieved in
one human generation.

**What it turned up.** When N got big enough, the physicists arrived. In 1995
Tamás Vicsek stripped boids down to alignment-plus-noise and showed that
flocking is a genuine **phase transition** — order emerging from disorder the
way magnetism emerges in cooling iron. That paper seeded a whole field now
called *active matter*, which treats flocks, bacterial colonies, and crowds
as new states of matter. A toy about birds turned out to be a toy about
thermodynamics; slide the count up and you're not adding birds, you're
approaching the limit where biology becomes physics.

## Trails *(0.02–1, default 0.16)*

**What it is.** The only slider that touches no physics. Instead of wiping
the canvas each frame, the renderer paints a translucent coat of background —
so motion leaves a fading ghost. Low values turn the sky into a painting;
high values snap it back to the crisp present.

**Where it came from.** Three lineages converge here. CRT phosphor, which
kept glowing after the beam moved on, giving every old radar and
oscilloscope its comet tails. Long-exposure photography, which has always
seen what the eye can't. And the oldest: Étienne-Jules Marey, who in the
1880s photographed birds with multiple exposures on a single plate to study
flight — *chronophotography*, motion written as a trace. This slider is
Marey's instrument bolted onto Reynolds' birds.

**What it turned up.** Trails reveal structure that motion hides. Freeze any
instant of the flock and you see scattered dots; let the trails accumulate
and suddenly there are vortices, rivers, braids — the flock's *history* has
shape that its present doesn't show. Contemporary photographer Xavi Bou
builds his *Ornitographies* series on exactly this trick, stacking video
frames of real birds into sculptural ribbons across the sky. Turn trails up
in the toy and you're making the same image live — proof that the simulated
birds and the real ones leave the same handwriting.

## Spatial hash *(toggle, default on)*

**What it is.** The engine-room switch. On: birds are binned into a grid of
vision-sized cells and only check their neighbors' cells. Off: every bird
checks every bird, the honest naive algorithm.

**Where it came from.** Reynolds flagged the problem in the original 1987
paper: naive neighbor-finding grows as N², which is why his 80 boids took
95 seconds a frame. Spatial binning is the classic cure, standard in every
serious flock, game, and particle system since.

**What it turned up.** The toggle exists to let you *feel* a complexity
class. At 4000 birds, naive checking is sixteen million comparisons per
frame; flip the switch and watch the stats line pay the price in real time.
Most people learn Big-O notation from a whiteboard. This one's a light
switch.

---

## Coda: the five presets are a phase diagram

Flock, swarm, school, gnats, crystal — they read like moods, but they're
sitting on real science. In 2002, Iain Couzin showed that varying just the
alignment zone walks a simulated group through distinct *phases*: disordered
swarm, a rotating torus (real fish do this — barracuda mill in doughnuts),
and the polarized traveling group. Stranger still, the transitions show
**hysteresis**: sliding a parameter up and back down doesn't retrace the same
states. The group remembers where it's been — Couzin called it *collective
memory*. Your preset row is a tour of that phase diagram, and the sliders let
a visitor walk between phases by hand — passing, on the way, through states
that depend on which direction they came from.

That's the quiet thesis of the whole panel: these are toys, and they're
honestly called toys. But every knob is load-bearing science, every preset is
a discovered phase, and the stories are all true. Call them toys — and point,
quietly, to the story.
