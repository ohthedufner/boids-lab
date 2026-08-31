# Boids: a history, the presets, and which knobs are ours

A sourced companion to `boids-panel-stories.md`. That file is the prose for the
panel; this one is the footnotes — every claim with a link, plus the material
that wasn't in it: a proper history with names, the provenance of the five
**presets** (they do have stories, all five), the background **variations**, and
an honest accounting of the controls in this toy that have **no ancestor at
all** — the ones we invented.

Three corrections to the panel copy were flagged inline, are collected at the
end, and have since been **applied** to `boids-panel-stories.md`. The old
caveat — *"this implementation contains additions beyond the classical lineage
whose provenance hasn't been fully mapped"* — is now mapped, and the panel copy
says so in the positive.

---

## Part 1 — A brief history, with names

### Before Reynolds: the idea without the graphics (1971–1982)

**W. D. Hamilton, 1971.** "Geometry for the Selfish Herd" (*Journal of
Theoretical Biology* 31:295–311) proposed that grouping needs no group-level
purpose at all: each animal simply shrinks its own *domain of danger* — the
region of space closer to it than to anyone else — by moving toward a neighbour.
The herd is a by-product of everyone being selfish. This is the philosophical
ancestor of every flocking model: **global pattern, local motive, no
coordinator**.
→ [Hamilton 1971 (PDF)](http://www.csun.edu/~dgray/BE528/Hamilton1971Selfish_herd.pdf) ·
[Selfish herd theory](https://en.wikipedia.org/wiki/Selfish_herd_theory)

**Ichiro Aoki, 1982.** A Japanese fisheries scientist published "A Simulation
Study on the Schooling Mechanism in Fish" (*Bulletin of the Japanese Society of
Scientific Fisheries* 48(8):1081–1088) — **five years before Reynolds**. Aoki's
fish used three interactions by distance zone: **approach, avoidance, parallel
orientation**, with stochastic speed and heading. His conclusion is the same one
boids is famous for: coherent group movement occurs although no individual has
knowledge of the whole school and there is no consistent leader.
→ [Aoki 1982 (J-STAGE)](https://www.jstage.jst.go.jp/article/suisan1932/48/8/48_8_1081/_article)

> **Correction to the panel copy (now applied).** The panel text said the
> two-zone refinement — flee the near, cooperate with the far — "entered the
> literature later and became standard." It's the other way round: the zone model
> **predates** Reynolds (Aoki 1982) and was formalised again by Couzin in 2002.
> Our `sr = vis * 0.42` inner bubble is Aoki's, not a post-Reynolds patch.

### Craig Reynolds, 1986–1987

**Craig W. Reynolds** (b. 15 March 1953) was already in the film-graphics world —
a scene programmer on *Tron* (1982) — when he joined the **Symbolics Graphics
Division**. His own account of the motive: *"I saw these natural systems through
a procedural lens: how could I write a program to simulate that?"*

He built boids in **1986** in **Symbolics Common Lisp**, using **Flavors** (the
Lisp Machine object system), on a **Symbolics 3600**. The paper landed the next
year: **"Flocks, Herds, and Schools: A Distributed Behavioral Model,"** *Computer
Graphics* 21(4), SIGGRAPH '87 Proceedings, pp. 25–34, Anaheim.
→ [Paper, full text](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/) ·
[PDF](https://www.red3d.com/cwr/papers/1987/SIGGRAPH87.pdf) ·
[Reynolds' boids page](https://www.red3d.com/cwr/boids/)

**The three rules, in his words and his order:**

> 1. **Collision Avoidance:** avoid collisions with nearby flockmates
> 2. **Velocity Matching:** attempt to match velocity with nearby flockmates
> 3. **Flock Centering:** attempt to stay close to nearby flockmates

"Separation / alignment / cohesion" are the later popular names, from his own
[boids page](https://www.red3d.com/cwr/boids/). The order is not decorative: he
arbitrated the rules by **prioritized acceleration allocation** — a fixed
acceleration budget spent in strict priority order until exhausted, so collision
avoidance always outranks the sociable rules.

**The name.** "Boid" is a contraction of **bird-oid object** — and a joke about
the stereotypical New York pronunciation of *bird*.
→ [Boids (Wikipedia)](https://en.wikipedia.org/wiki/Boids)

**The film.** ***Stanley and Stella in: Breaking the Ice*** premiered at the
SIGGRAPH '87 Electronic Theater — Symbolics Graphics Division in cooperation
with **Whitney/Demos Productions**. A bird and a fish; the flock and the school
were the point.

**The cost.** From the paper itself: 80 boids means **6,400 boid-to-boid
comparisons** per frame; on one Lisp Machine with no accelerator hardware that
ran at **about 95 seconds per frame**, and a ten-second (300-frame) motion test
took **about eight hours**. Reynolds names the problem in the same breath: *"The
complexity of the flocking algorithm described is basically O(N²)."*

### The same year, three states away: artificial life gets a name

**Christopher Langton** convened the first *Workshop on the Synthesis and
Simulation of Living Systems* — **Artificial Life I** — at Los Alamos in
**September 1987**, and gave the field its definition: the study of *"life as it
could be, rather than life as it is."* Boids arrived in the same season and
became the field's most-cited demonstration of emergence — complex global
behaviour from simple local rules, with nothing in the middle.
→ [Langton](https://en.wikipedia.org/wiki/Christopher_Langton) ·
[Boids in the ALife encyclopedia](https://alife.org/encyclopedia/software-platforms/boids/)

### Hollywood, 1992–1998

**Batman Returns (1992)** is the first big-screen boids job. **Andy Kopra** at
**VIFX** used boids for the bat swarms; **Andrea Losch** and **Paul Ashdown** at
**Boss Film** did the penguin army with Reynolds-derived tools; Reynolds himself
is credited on the video image crew. Kopra's summary of why: *"the naturalism
provided by a simulation that is not directly controlled by the animator."*
→ [A history of CG bird flocking](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/)

**The Lion King (1994).** The wildebeest stampede: roughly **800 animals**, a
2½-minute sequence, about **five CG engineers over 2½ years**, under artistic
supervisor **Scott Johnston**, using SoftImage models on SGI workstations driven
by a purpose-built herding / collision-avoidance system. It was the first time
procedural crowd simulation carried a **story point** rather than set dressing.
→ [Re-visit the CG of 1994's Lion King](https://beforesandafters.com/2019/07/17/before-you-see-the-new-cg-lion-king-re-visit-the-cg-of-1994s-lion-king/) ·
[IndieWire, 30 years on](https://www.indiewire.com/features/animation/the-lion-king-turns-30-disney-2d-classic-digital-caps-1235024678/)

> **Correction to the panel copy (now applied).** The Separation entry said
> Disney built the stampede "with boids-descendant crowd tech." Sources disagree on how direct
> that descent is: Disney wrote its **own** herd system rather than running
> Reynolds' code, and contemporary accounts describe a collision-avoidance
> particle system built in-house. Safe phrasing: *in the boids lineage, not from
> Reynolds' implementation.* The claim that separation is the hard part — keeping
> bodies from passing through each other on a cliff face — survives intact.

**1998:** Reynolds receives an **Academy Sci-Tech Award** (Scientific and
Engineering Award) *"for his pioneering contributions to the development of
three-dimensional computer animation for motion picture production."*
→ [Craig Reynolds (Wikipedia)](https://en.wikipedia.org/wiki/Craig_Reynolds_(computer_graphics)) ·
[SIGGRAPH history archive](https://history.siggraph.org/person/craig-reynolds/)

### Physics annexes the flock, 1995–2014

**Tamás Vicsek, András Czirók, Eshel Ben-Jacob, Inon Cohen, Ofer Shochet,
1995** — "Novel Type of Phase Transition in a System of Self-Driven Particles,"
*Phys. Rev. Lett.* 75(6):1226–1229. Strip boids to **constant speed + alignment
+ noise** and you get a genuine **phase transition**: turn the noise down and
rotational symmetry breaks spontaneously, the way magnetism appears in cooling
iron. This is the seed of the field now called **active matter**.
→ [PubMed](https://pubmed.ncbi.nlm.nih.gov/10060237/) ·
[Semantic Scholar](https://www.semanticscholar.org/paper/be6973a82ebb62e4a58d4494afc7742af5ae5588)

**John Toner and Yuhai Tu, 1995** — "Long-Range Order in a Two-Dimensional
Dynamical XY Model: How Birds Fly Together," *Phys. Rev. Lett.* 75:4326. The
continuum theory of the same phenomenon, and proof that flocks can hold
long-range order in two dimensions where an equilibrium system cannot. Flocking
is not just *like* physics; it is a **new kind** of physics.
→ [arXiv adap-org/9506001](https://arxiv.org/abs/adap-org/9506001v1)

**Iain Couzin, Jens Krause, Richard James, Graeme Ruxton, Nigel Franks, 2002** —
"Collective Memory and Spatial Sorting in Animal Groups," *J. Theor. Biol.*
218(1):1–11. Small changes to one individual-level zone width produce
**group-level phase changes** — swarm, torus, dynamic parallel, highly parallel —
and the transitions show **hysteresis**: the group's state depends on where it
has been. They called it *collective memory*.
→ [Full PDF](https://jmvidal.cse.sc.edu/library/couzin02a.pdf) ·
[PubMed](https://pubmed.ncbi.nlm.nih.gov/12297066/)

**STARFLAG, 2008** — Ballerini, Cabibbo, Candelier, Cavagna, Cisbani, Giardina,
Lecomte, Orlandi, **Parisi**, Procaccini, Viale, Zdravkovic: "Interaction ruling
animal collective behavior depends on **topological** rather than metric
distance," *PNAS* 105(4):1232–1237. Stereo photography of real starling flocks
over Rome — one reconstructed event had **1,246 birds** — showed each starling
tracks a fixed *number* of neighbours, **six to seven**, not everyone inside a
radius. (Giorgio Parisi, a co-author, took the 2021 Nobel Prize in Physics for
other work on complex systems.)
→ [PNAS 2008](https://www.pnas.org/doi/10.1073/pnas.0711437105) ·
[Cavagna, "The seventh starling"](https://rss.onlinelibrary.wiley.com/doi/full/10.1111/j.1740-9713.2008.00288.x) ·
[STARFLAG handbook](https://arxiv.org/pdf/0802.1668)

**Cavagna et al., 2010** — "Scale-free correlations in starling flocks," *PNAS*.
The correlation length grows with flock size: a flock has no characteristic
scale, so every bird is effectively in touch with every other.
→ [PNAS 2010](https://www.pnas.org/doi/abs/10.1073/pnas.1005766107)

**Attanasi et al., 2014** — "Information transfer and behavioural inertia in
starling flocks," *Nature Physics* 10:691–696. Turning waves cross a real flock
with a **linear dispersion law and negligible damping** — information moves like
a wave through a material, not like heat diffusing. This is Potts' 1984
chorus-line intuition confirmed with 3D data, and the theory predicts what the
data show: **the more ordered the flock, the faster news travels.**
→ [Nature Physics](https://www.nature.com/articles/nphys3035)

**Wayne Potts, 1984** (out of sequence here, but this is where it pays off) —
"The chorus-line hypothesis of manoeuvre coordination in avian flocks," *Nature*
309:344–345. Film of dunlin flocks showed manoeuvre waves propagating at **~3×
the speed individual reaction time allows**; birds watch the wave approaching and
time their entry, like a chorus line.
→ [Nature 1984](https://www.nature.com/articles/309344a0) ·
[Utah Biology summary](https://www.biology.utah.edu/bioundercover/the-chorus-line-hypothesis-of-manoeuvre-coordination-in-avian-flocks/)

### Back to engineering, 1999–2023

**Reynolds, 1999** — *Steering Behaviors For Autonomous Characters* (GDC): the
document that taught a generation of game developers how to move things.
→ [red3d.com/cwr/steer](https://www.red3d.com/cwr/steer/)

**Reynolds, 2000** — *Interaction with Groups of Autonomous Characters* (GDC),
which specifies **bin-lattice spatial subdivision**: divide space into bins, keep
each character's bin membership updated as it moves, and query only the bins the
perception sphere touches. **This is our spatial hash, by its original name, from
its original author.**
→ [PDF](https://www.red3d.com/cwr/papers/2000/pip.pdf)

**Vásárhelyi, Virágh, Somorjai, Nepusz, Eiben, Vicsek, 2018** — "Optimized
flocking of autonomous drones in confined environments," *Science Robotics*
3(20). **30 real drones**, outdoors, no central control, evolved parameters. The
line from Reynolds' 80 imaginary birds to thirty flying machines is unbroken.
→ [Science Robotics](https://www.science.org/doi/10.1126/scirobotics.aat3536) ·
[Project page](https://hal.elte.hu/~vasarhelyi/en/projects/sppevol/)

**2023** — Reynolds receives the International Society for Artificial Life's
**lifetime achievement award**, 37 years after the first flock.

---

## Part 2 — The sliders, sourced

The prose lives in `boids-panel-stories.md`. Here is the citation for each claim,
plus what the sources say that the prose didn't.

| Control | Range / default | Nearest ancestor | Source |
|---|---|---|---|
| Separation | 0–3 / 1.6 | Reynolds' **Collision Avoidance**; zone model from Aoki 1982 | [Reynolds 1987](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/), [Aoki 1982](https://www.jstage.jst.go.jp/article/suisan1932/48/8/48_8_1081/_article) |
| Alignment | 0–3 / 1.0 | Reynolds' **Velocity Matching**; the Vicsek model is alignment alone | [Vicsek 1995](https://pubmed.ncbi.nlm.nih.gov/10060237/) |
| Cohesion | 0–3 / 0.9 | Reynolds' **Flock Centering** | [Reynolds 1987](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/) |
| Vision | 14–130 px / 52 | Reynolds' "spherical zone of sensitivity" | [Reynolds 1987](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/), [Ballerini 2008](https://www.pnas.org/doi/10.1073/pnas.0711437105) |
| Speed | 0.4–7 / 2.6 | Reynolds' max-speed clamp — but our implementation is **Vicsek's** | [Reynolds 1999](https://www.red3d.com/cwr/steer/), [Vicsek model setup](https://arxiv.org/pdf/2105.08792) |
| Flock size | 50–4000 / 500 | Reynolds' O(N²) note; Vicsek's thermodynamic limit | [Reynolds 1987](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/) |
| Trails | 0.02–1 / 0.16 | **No scientific ancestor** — chronophotography, see Part 5 | [Xavi Bou](https://xavibou.com/about-ornithographies/) |
| Spatial hash | toggle / on | Reynolds' **bin-lattice spatial subdivision**, 2000 | [Reynolds 2000 (PDF)](https://www.red3d.com/cwr/papers/2000/pip.pdf) |

Four things that reading the 1987 paper against our own code turned up, none of
which are in the panel copy:

**Separation is inverse-square — almost, and so was Reynolds'.** Our code
weights the offset vector by `1/d²`; since the offset's own length grows with
distance, the resulting push falls off as `1/d` — one power gentler than the
weight suggests, but the same move Reynolds made. He reports in the paper that
replacing his spring-like (linear) model with **inverse-square distance
weighting** produced a better-damped, more natural flock, and that this
correlated with quantitative fish-schooling studies. We leaned the same way by
instinct; he got there by reading fish biology.

**Our Speed slider is Vicsek's, not Reynolds'.** Reynolds *clamps*: *"a maximum
acceleration, expressed as a fraction of the maximum speed, is used to truncate
over-anxious requests for acceleration."* Our engine **renormalises** velocity to
exactly `P.spd` every frame — constant speed, direction-only updates. That is
precisely the Vicsek convention, the simplification that made the phase
transition tractable. So the slider labelled *Speed* is the one place the toy
quietly sides with the physicists over its own author.

**Our Vision is the textbook simplification, twice over.** Reynolds specified a
sphere whose sensitivity falls off as an **inverse exponential of distance**, and
noted the field *"should realistically be exaggerated in the forward
direction."* We use a hard radius, no falloff, no blind spot behind the bird. And
Ballerini 2008 says real starlings don't use a radius at all. The slider is
therefore two steps from nature — worth saying out loud on the placard, because
the honesty is more interesting than the fidelity.

**The field is a torus, and that came from physics.** Birds leaving the right
edge re-enter on the left, and neighbour distances use the **minimum-image
convention** (`if (dx > hw) dx -= FW`). Reynolds' boids flew in bounded space
with obstacles. Periodic boundary conditions in a square box are the **Vicsek
model's** setup — the box's real geometry is a torus, and the particles move on
its surface. An engine-room detail that silently imports a statistical-mechanics
convention into a graphics toy.
→ [On-lattice Vicsek model in confined geometries](https://arxiv.org/pdf/2105.08792)

---

## Part 3 — Do the variations have stories? Yes. All five.

The presets read like moods. Each one is sitting on a named result.

### Flock — `sep 1.6 · ali 1.0 · coh 0.9 · vis 52 · spd 2.6 · 500`
The default, and the title of the paper: *Flocks, Herds, and Schools*. Nothing
more to claim — this is the balanced state the three rules were written to
produce, and it is the one Reynolds showed at SIGGRAPH.

### Swarm — `sep 0.7 · ali 0.35 · coh 2.2 · vis 78 · spd 2.0 · 900`
Low alignment, high cohesion, wide vision — a cohesive but **unpolarised** blob.
This is Couzin's **swarm state**, the first of his four: individuals stay
together with low group polarisation and no common heading. In his 2002 paper it
is the state you start from and leave as the alignment zone widens.
→ [Couzin 2002](https://jmvidal.cse.sc.edu/library/couzin02a.pdf)

### School — `sep 2.1 · ali 2.4 · coh 1.1 · vis 44 · spd 4.3 · 700`
The highest speed and the fiercest alignment in the panel, together — and that
pairing is an empirical result, not a taste. Across several fish species, higher
swimming speed measurably **raises group polarisation**: speed constrains turning
ability and reaction time, so alignment becomes the cheap solution. Couzin's
polarised "highly parallel" state and Tunstrøm's multistability work map the same
territory.
→ [Tunstrøm et al., Collective States, Multistability and Transitional Behavior in Schooling Fish](https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1002915) ·
[Swimming speed controls social interaction strength (Proc. B)](https://royalsocietypublishing.org/rspb/article/293/2072/20260146/481991/Swimming-speed-of-schooling-fish-controls-social)

### Gnats — `sep 2.6 · ali 0.0 · coh 0.5 · vis 30 · spd 1.5 · 400`
**Alignment exactly zero**, and the cloud still holds. This is the strongest
science in the preset row. Attanasi et al. tracked wild midge swarms in 3D and
found *"strong collective behaviour despite the absence of collective order"* —
correlations comparable to highly ordered vertebrate groups, with no shared
heading whatsoever. Ouellette's lab then went further and measured the swarm as a
**material**: a core condensed phase coexisting with a dilute vapour phase, a
finite Young's modulus and yield strength, and swarms that can be pulled apart
under tensile load into daughter swarms.
→ [Collective Behaviour without Collective Order in Wild Swarms of Midges (PLOS CB, 2014)](https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1003697) ·
[Phase Coexistence in Insect Swarms (PRL, 2017)](https://link.aps.org/doi/10.1103/PhysRevLett.119.178003) ·
[Mechanical spectroscopy of insect swarms (Sci. Adv.)](https://www.science.org/doi/10.1126/sciadv.aaw9305)

### Crystal — `sep 3.0 · ali 2.9 · coh 0.15 · vis 26 · spd 0.9 · 1400`
Maximum repulsion, near-maximum alignment, cohesion switched almost off, a crawl,
and the densest population. What comes out is a drifting lattice. The physics
term for this exists: **active crystals**, also called *flying crystals* and
*living crystals* — self-propelled particles that form phases with **positional**
order (a crystal) as well as **orientational** order (a polar flock), and which
under increasing drive migrate as a single ordered travelling object.

Honest caveat: this preset was tuned by eye and lands *near* that regime; nobody
derived it from the literature, and our packing is not a claimed reproduction of
any published result. "Crystal" is load-bearing in physics, and we're borrowing
it in good faith rather than earning it.
→ [Lattice-dependent orientational order in active crystals (2025)](https://arxiv.org/pdf/2506.16501) ·
[Active crystals and their stability](https://arxiv.org/pdf/1401.5332)

### And the preset row as a whole
The "phase diagram" claim in the existing coda is fair — Couzin's transitions are
real, and so is the **hysteresis**: sliding a parameter up and back down does not
retrace the same states. One qualification worth adding to the placard: our toy
*permits* that walk, it doesn't *demonstrate* it. Couzin measured hysteresis with
controlled ramps and repeated runs. A visitor dragging a slider is doing the
gesture, not the experiment. The invitation is honest; the proof isn't ours.

---

## Part 4 — The other variations: the background family

Separate from the five presets, the **parent project** (`dufner-dev-web` — this
lab is the flock extracted from it) holds four background variants of the same
engine. They are not in this repo, but they belong in the family record. Two of
them are behaviours rather than tunings, and neither has a research ancestor —
they're ours.

| File | What it is |
|---|---|
| `bg-boids-v1.html` | Static retune for ambient use — slower, sparser, longer trails |
| `bg-boids-v2.html` | Same idea, tighter vision, more birds, shorter trails |
| `bg-boids-v3.html` | **Wandering** — vision and speed overwritten every frame |
| `bg-boids-v4.html` | **Breathing** — cohesion and separation on a 90-second cycle |

**Wandering (v3).** Vision and speed each ride **two layered sines with
incommensurate periods** — roughly 67 s and 119 s for vision, 78 s and 134 s for
speed. Because those periods share no common multiple in any watchable span, the
combination is smooth, bounded, and **never quite repeats**: `vis` breathes
between 32 and 84, `spd` between 0.67 and 1.43. The flock's *character* changes
like weather instead of cycling like a loop.

**Breathing (v4).** Cohesion swells and relaxes on a single 90-second sine
(0.55 → 1.65), with separation moving **counter-phase** (1.50 ∓ 0.20) so the
release blooms outward instead of snapping.

Neither has a scientific lineage, and neither should pretend to. The nearest kin
is musical rather than biological — the generative-music trick of overlapping
loops of unequal length so a piece never repeats. That's an analogy we're
drawing, not a lineage we inherited. What *is* worth noting: these two files make
the parameters **time-varying**, which is the one thing neither Reynolds nor
Vicsek nor Couzin does. Their parameters are constants of the experiment. Ours
are a score.

---

## Part 5 — The controls that are genuinely ours

Sorted by how new they actually are, because "new" is doing different work in
each case.

### 1. The spatial-hash toggle with a live cost readout — **genuinely novel as an interface**
The *algorithm* is Reynolds' own bin-lattice, published in 2000. What has no
precedent is making it a **switch the visitor can flip**, with `checks` counting
the comparisons in real time next to it. At 4,000 birds the naive path is ~16
million pair-checks per frame and the panel shows you the number climbing. This
turns an **asymptotic complexity class into a physical sensation** — Big-O as a
light switch. Reynolds wrote the optimisation; nobody, as far as this research
found, ever built it as an exhibit.

### 2. Neighbour-count colouring — **ours, and now a citation**
Each bird's colour is `m = n/CROWD` mapped through a multi-stop ramp (blue →
teal → yellow → hot orange): the bird's hue is a live readout of **how many
neighbours it currently sees**. This isn't in the canon, and it's quietly the
most informative thing on screen — it renders the *social* variable rather than
the spatial one.

The saturation point used to be 9 — a number chosen because it looked right.
This doc originally suggested changing it to **7**, because Ballerini 2008 found
real starlings track six to seven neighbours — and the change has since been
made (`CROWD = 7` in `index.html`, citation in the comment above it, legend
strip in the panel). A fully hot bird now means *"this bird is seeing as many
neighbours as a real starling attends to"* — the colour scale stopped being
decorative and became a cited measurement. It was one character.

### 3. The permalink — **no ancestor in the science**
`Copy link` encodes all seven parameters into the URL hash and `readHash()` reads
them back, clamped to the slider bounds. **A state of the flock becomes an
address you can send someone.** The science has papers; the toy has coordinates.
Culturally this is shader/notebook lineage, not flocking lineage.

### 4. The glasswall remote — **ours, but not in this lab**
In the parent exhibit, `applyCmd()` listens on both a `BroadcastChannel` and a
server-sent-event stream, so the flock can be driven from a phone while it plays
full-screen on a TV, with `?remote=1` hiding the panel and the cursor. Every
flocking demo in the literature is a single-surface artifact, so **splitting the
controls from the display, across devices** is a genuinely new affordance for
this material — it's the one that turns a demo into an exhibit with a docent.
But it belongs to the multi-page exhibit (`dufner-dev-web`); this lab
deliberately stripped that plumbing, so it's recorded here for the family
history, not claimed as a feature of this page.

### 5. The visitor as predator — **the mechanism is old, the casting is ours**
The cursor pushes birds away within a 120 px radius, drawn as a faint orange
ring. Predator response is standard biology — Hamilton's selfish herd is the 1971
root — and Reynolds had obstacle avoidance and unaligned collision avoidance.
What's ours is **who** the predator is: the visitor's own hand, with its
influence made visible. The ring is the honest part; it shows the extent of your
own effect.

### 6. Flock size as a live slider — **common in demos, unusual at this range**
Reynolds identified N as the cost driver in 1987. Making it a **live, re-seeding
slider up to 4,000** turns his footnote into a physical control.

> **Correction to the panel copy (now applied).** The Flock-size entry claimed
> "roughly a five-million-fold improvement in boids-per-second." Recomputing from Reynolds'
> own figures: 80 boids ÷ 95 s = **0.84 bird-updates/second**; 4,000 birds at
> 60 fps = **240,000 bird-updates/second** — about **285,000×**. Measured in
> *pair comparisons* instead: 6,400 ÷ 95 s = 67/s versus ~9.6×10⁸/s for the naive
> path, about **14 million×**. The five-million figure matches neither metric.
> Quote either **~285,000× in birds per second** or **~14,000,000× in comparisons
> per second** — both are astonishing, and both are checkable.

### 7. Trails — **not new to demo-craft, absent from the canon**
The honest framing: a fade-alpha trail is standard practice in canvas demos, so
this isn't an invention. It is, however, **entirely absent from the scientific
lineage** — no flocking paper has a trail-persistence parameter, because trails
are about seeing, not about the model. The three ancestors named in the panel
copy (CRT phosphor, long-exposure photography, Marey's chronophotography) are
ancestors of the **image**, not of the algorithm — and Xavi Bou's *Ornitographies*
is the living proof, stacking sixty-frames-per-second video of real birds into
sculptural ribbons. Turning the slider down makes the same picture live. That
claim checks out; it just belongs to photography, not to boids.
→ [About Ornithographies](https://xavibou.com/about-ornithographies/) ·
[Hyperallergic on Bou's chronophotographs](https://hyperallergic.com/stunning-chronophotographs-capture-the-patterns-of-birds-in-flight/) ·
[Étienne-Jules Marey](https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey)

### 8. The deterministic seed — **small, and worth a sentence on the placard**
`rnd()` is a fixed-seed xorshift, so **Scatter** produces the same starting
configuration every time. Reproducibility is a scientific virtue this toy quietly
has and never mentions. Two visitors on two continents pressing Scatter watch the
same flock be born.

---

## Corrections collected

1. **Zone-model provenance** — the inner/outer zone split predates Reynolds
   (Aoki 1982); it did not enter the literature after him.
2. **The Lion King** — Disney built its own herd system under Scott Johnston;
   say *"in the boids lineage"*, not *"boids-descendant tech"* unqualified.
3. **The speed-up figure** — ~285,000× in birds/second, or ~14 million× in
   comparisons/second. Not five million.

All three are now applied in `boids-panel-stories.md` (August 2026).

And one addition rather than a correction: the panel's caveat about unmapped
provenance has been replaced with a **positive** claim — *seven of the eight
controls trace to a named paper; the eighth (Trails) traces to Marey; and three
affordances on this page — the hash toggle as UI, the neighbour-count colouring,
and the permalink — have no ancestor we could find at all* (a fourth, the
split-device remote, lives in the parent exhibit). That's a better sentence than
an apology.

---

## References

**Primary — Reynolds**
- [Flocks, Herds, and Schools: A Distributed Behavioral Model (1987), full text](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/) · [PDF](https://www.red3d.com/cwr/papers/1987/SIGGRAPH87.pdf)
- [Boids — Reynolds' own page](https://www.red3d.com/cwr/boids/)
- [Steering Behaviors For Autonomous Characters (1999)](https://www.red3d.com/cwr/steer/)
- [Interaction with Groups of Autonomous Characters (2000) — bin-lattice spatial subdivision](https://www.red3d.com/cwr/papers/2000/pip.pdf)
- [Craig Reynolds (Wikipedia)](https://en.wikipedia.org/wiki/Craig_Reynolds_(computer_graphics)) · [ACM SIGGRAPH history archive](https://history.siggraph.org/person/craig-reynolds/)
- [Boids Demo Reel 1 (Internet Archive)](https://archive.org/details/boids-demo-reel-1)

**Predecessors**
- [Hamilton, Geometry for the Selfish Herd (1971)](http://www.csun.edu/~dgray/BE528/Hamilton1971Selfish_herd.pdf)
- [Aoki, A Simulation Study on the Schooling Mechanism in Fish (1982)](https://www.jstage.jst.go.jp/article/suisan1932/48/8/48_8_1081/_article)
- [Potts, The chorus-line hypothesis (Nature, 1984)](https://www.nature.com/articles/309344a0)

**Physics of flocking**
- [Vicsek et al., Novel Type of Phase Transition in a System of Self-Driven Particles (1995)](https://pubmed.ncbi.nlm.nih.gov/10060237/)
- [Toner & Tu, How birds fly together (1995)](https://arxiv.org/abs/adap-org/9506001v1)
- [Couzin et al., Collective Memory and Spatial Sorting in Animal Groups (2002)](https://jmvidal.cse.sc.edu/library/couzin02a.pdf)
- [Ballerini et al., topological rather than metric distance (PNAS, 2008)](https://www.pnas.org/doi/10.1073/pnas.0711437105)
- [Cavagna, The seventh starling (Significance, 2008)](https://rss.onlinelibrary.wiley.com/doi/full/10.1111/j.1740-9713.2008.00288.x)
- [Cavagna et al., Scale-free correlations in starling flocks (PNAS, 2010)](https://www.pnas.org/doi/abs/10.1073/pnas.1005766107)
- [Attanasi et al., Information transfer and behavioural inertia in starling flocks (Nature Physics, 2014)](https://www.nature.com/articles/nphys3035)
- [On-lattice Vicsek model in confined geometries — periodic boundaries / torus](https://arxiv.org/pdf/2105.08792)

**Swarms without order**
- [Attanasi et al., Collective Behaviour without Collective Order in Wild Swarms of Midges (2014)](https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1003697)
- [Sinhuber & Ouellette, Phase Coexistence in Insect Swarms (PRL, 2017)](https://link.aps.org/doi/10.1103/PhysRevLett.119.178003)
- [Mechanical spectroscopy of insect swarms (Science Advances)](https://www.science.org/doi/10.1126/sciadv.aaw9305)

**Schools and speed**
- [Tunstrøm et al., Collective States, Multistability and Transitional Behavior in Schooling Fish (2013)](https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1002915)
- [Escobedo et al., Swimming speed of schooling fish controls social interaction strength (Proc. R. Soc. B, 2026)](https://royalsocietypublishing.org/rspb/article/293/2072/20260146/481991/Swimming-speed-of-schooling-fish-controls-social)

**Active crystals**
- [Lattice-dependent orientational order in active crystals (2025)](https://arxiv.org/pdf/2506.16501)
- [Active crystals and their stability](https://arxiv.org/pdf/1401.5332)

**Film, robots, and artificial life**
- [A history of CG bird flocking — befores & afters](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/)
- [Re-visit the CG of 1994's Lion King](https://beforesandafters.com/2019/07/17/before-you-see-the-new-cg-lion-king-re-visit-the-cg-of-1994s-lion-king/)
- [The Lion King turns 30 — IndieWire](https://www.indiewire.com/features/animation/the-lion-king-turns-30-disney-2d-classic-digital-caps-1235024678/)
- [Vásárhelyi et al., Optimized flocking of autonomous drones (Science Robotics, 2018)](https://www.science.org/doi/10.1126/scirobotics.aat3536)
- [Boids — ALife encyclopedia](https://alife.org/encyclopedia/software-platforms/boids/) · [Christopher Langton](https://en.wikipedia.org/wiki/Christopher_Langton)
- [Boids (Wikipedia) — etymology](https://en.wikipedia.org/wiki/Boids)

**Trails and chronophotography**
- [Xavi Bou, About Ornithographies](https://xavibou.com/about-ornithographies/)
- [Stunning Chronophotographs Capture the Patterns of Birds in Flight](https://hyperallergic.com/stunning-chronophotographs-capture-the-patterns-of-birds-in-flight/)
- [Étienne-Jules Marey](https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey)
