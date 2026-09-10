# Owned Pipelines: Practice-Based Knowledge from Thirty Years of Hands-On Computing

**A Practice-Based Doctoral Dissertation (Self-Directed)**

**Author:** Steven Philley  
**Studio affiliation:** Color It Company LLC / Flux Studios  
**Location:** Campbell, California, United States  
**Contact:** steven@coloritcompany.com  
**Postal:** 500 East Hamilton Ave PMB #1116, Campbell, CA 95008  

**Document type:** Practice-based doctoral dissertation (self-directed), grounded in public artifacts and documented engineering practice.  
**Not an institutional degree award.** This work does not claim university enrollment, doctoral candidacy, dissertation committee approval, or a conferred PhD from any accredited institution. It synthesizes practitioner knowledge in the form and rigor of a doctoral monograph so that the knowledge can be examined, cited, revised, and transferred.

**Version:** Draft 1.2 (documentation-drift + technical appendices)  
**Date:** September 2026  
**Prior:** Draft 1.1 (2026-09-09); Draft 1.0 (2026-09-09)  

---

## Abstract

This practice-based doctoral dissertation synthesizes knowledge produced by owning computing pipelines end-to-end: from metal-adjacent graphics and input systems, through shipped games and tools, to platform economics and living networked culture. The primary evidence base is a verified public inventory of systems built and maintained by Steven Philley under Color It Company LLC / Flux Studios—most notably the Ra Engine (Vulkan 1.4 hardware ray-tracing editor and game engine; Steam app 4732830), Digiflux titles Launch Up and Laser Tag, the competitive tetromino title Ablockalypse (custom SDL engine), a worldwide active BBS directory, and adjacent media systems in photography and cultural learning sites.

The central claim is the *Owned Pipelines* thesis: durable practitioner knowledge arises when a maker retains vertical control of rendering, feel systems, distribution contracts, and community infrastructure long enough for those layers to talk back to one another. Ownership here is not ideology; it is an epistemic condition. When the same hands author acceleration structures, coyote-time jumps, Steam Early Access pricing, and a BBS connection-check directory, the feedback loops that normally fragment across specialists become available as reflective material.

Methodologically, the work follows practice-based research traditions (Schön’s reflective practice; Candy and Edmonds on practitioner research; extended in Drafts 1.1–1.2 via Candy 2019, Smith & Dean, Borgdorff, Nelson, Driscoll, Swink close readings, and related networked-culture works) while treating public artifacts, documentation, storefront statements, repository headers, and dated JSON snapshots as primary evidence. Private biography that cannot be verified from public sources is marked with *Practitioner note / open for author expansion* callouts rather than invented. Technical chapters stay close to digiflux.one documentation, Steam Early Access disclosures, Color It Company public pages, and related URLs.

**Keywords:** practice-based research; owned pipelines; Vulkan ray tracing; game feel; indie engine architecture; Digiflux; Ra Engine; terminal-first HCI; BBS preservation; reflective practice; GLTF; Steam Early Access economics; McCandless lighting; Lua hot-reload; competitive input; practice epistemology

---

## Declaration of Framing and Ethics

1. This document is a **self-directed practice-based doctoral dissertation**. It uses doctoral form as a vehicle for synthesizing and testing practitioner knowledge. It is **not** a claim of an awarded institutional PhD. Draft 1.2 does not change this framing.
2. Evidence priority: public URLs, storefront text, and published documentation outrank recollection. Where recollection would be required but is unpublished, the text uses expansion hooks.
3. No fabricated metrics, fake papers by the author, invented quotes, or simulated experiments appear herein.
4. Literature citations are to real, widely known works in reflective practice, graphics, HCI, game feel, and networked computing culture.
5. Commercial claims (price, Early Access duration, roadmap items) are quoted from public Steam / Digiflux / CIC materials as of the drafting window and may change; they are treated as design statements, not investment advice.

6. Contact and address details appear because they are published on Color It Company materials and identify the practice geographically; they are not an invitation to harass.
7. Where this draft names “Flux Studios under Color It Company LLC,” it follows Ra Engine documentation’s own attribution language.


---

## Reader's note for Draft 1.2

If you read Draft 1.1, start here for what densified:

1. **Documentation Drift as Epistemic Object** — $49.99↔$250; CameraUBO 24↔30; Lua 30↔48; Launch Up store↔manual (incl. wall-run pedagogy gap).
2. **Ablockalypse instruments with file:line cites** — `Input.h` 180/45; `Input.cpp` `check_timers`; `GameModel.cpp:153–207` wall-kick; `PlayState.cpp:34–63` gates; Appendix H cite card.
3. **Launch Up manual Ch01–08** as player pedagogy + Steam roadmap/polls/playtests process bullets.
4. **BBS Snapshot B** — 1322 systems / 1099 green (2026-09-10) + schema + three anonymized EN/DE/ZH patterns.
5. **Appendices F–H** — Lua 48-function catalog; competitive feel paired case studies; Input/wall-kick walk.
6. **Fair Ra vs Unity/Unreal** ownership epistemology table (non-caricature).
7. **Gaps kept honest** — Laser Tag AppID; Synchronet authorship; Steam SDK/ZH; digiflux `/products` 404; hipck excluded.

Disclaimer unchanged: self-directed practice-based doctoral dissertation — **not** an institutional PhD award.

---

## Table of Contents

1. [Title page & front matter](#owned-pipelines-practice-based-knowledge-from-thirty-years-of-hands-on-computing)  
2. [Abstract](#abstract)  
3. [Preface](#preface-self-taught-doctoral-framing-and-the-ethics-of-claiming-practice-knowledge)  
4. [Chapter 1 — Introduction](#chapter-1-introduction-the-problem-of-fragmented-pipelines)  
5. [Chapter 2 — Method](#chapter-2-method-practice-based-research-and-artifact-as-evidence)  
5a. [Documentation Drift as Epistemic Object](#documentation-drift-as-epistemic-object)  
6. [Chapter 3 — Historical and conceptual context](#chapter-3-historical-and-conceptual-context-from-bbs-culture-to-hardware-rt)  
7. [Chapter 4 — Owned rendering pipelines (Ra Engine)](#chapter-4-owned-rendering-pipelines-ra-engine-architecture-lighting-and-ui-philosophy)  
8. [Chapter 5 — Feel systems and shipping (Ablockalypse)](#chapter-5-feel-systems--shipping-ablockalypse-and-the-craft-of-competitive-input)  
9. [Chapter 6 — Platforms and markets (Digiflux)](#chapter-6-platforms--markets-one-seat-editing-and-early-access-as-design) *(incl. Launch Up manual Ch01–08 + Steam wall-run/roadmap)*  
10. [Chapter 7 — Living networks (BBS directory)](#chapter-7-living-networks-the-bbs-directory-as-preservation-and-systems-practice)  
11. [Chapter 8 — Media adjacency](#chapter-8-media-adjacency-photography-and-cultural-systems-as-attention-craft)  
12. [Chapter 9 — Synthesis](#chapter-9-synthesis-the-owned-pipelines-thesis)  
13. [Chapter 10 — Conclusion and future work](#chapter-10-conclusion-and-future-work)  
14. [Comparative engine ownership table](#comparative-engine-ownership-table-ra-vs-typical-rented-pipelines)  
15. [Failure modes register (expanded)](#failure-modes-register-expanded)  
16. [Glossary](#glossary)  
17. [References](#references)  
18. [Appendix A — Artifact inventory](#appendix-a-inventory-of-artifacts-with-urls)  
19. [Appendix C — Quotation bank](#appendix-c-quotation-bank-from-public-sources-for-author-approved-pull-quotes)  
20. [Appendix E — Change log](#appendix-e-change-log)  
21. [Appendix F — Lua API catalog](#appendix-f-lua-api-catalog-and-minimal-script-lifecycle)  
22. [Appendix G — Competitive feel instrument](#appendix-g-competitive-feel-instrument-paired-case-studies)  
22a. [Appendix H — Input/wall-kick file:line](#appendix-h-annotated-input-delayrepeat-and-wall-kick-walk-fileline)  
23. [Author revision checklist](#author-revision-checklist)

---

## List of Figures (textual)

| ID | Description |
| --- | --- |
| F1 | Owned Pipelines stack: metal → shaders/AS → editor UX → Lua/game feel → storefront/Workshop → living network |
| F2 | Ra Engine ray order: primary → reflection / refraction / GI with payload flags |
| F3 | Per-object BLAS + identity TLAS instances with world-space baked vertices |
| F4 | CameraUBO discipline as a cross-language contract (C++ ↔ SPIR-V) |
| F5 | Terminal-first F-key editor loop vs ImGui-over-viewport pattern |
| F6 | Digiflux one-seat editing model across Launch Up, Laser Tag, future titles |
| F7 | Ablockalypse feel loop: DAS/ARR-like delay/repeat → wall kicks → board dynamics |
| F8 | BBS directory as aggregation + connection-check light, not login proof |

## List of Tables (textual)

| ID | Description |
| --- | --- |
| T1 | Verified public artifact inventory |
| T2 | Ra Engine hardware tiers (docs) |
| T3 | Supported GLTF / KHR / RA extensions |
| T4 | Critical pitfalls documented by the engine |
| T5 | Launch Up feel constants (public) |
| T6 | Steam Early Access design statements for Ra Engine |
| T7 | Knowledge claims mapped to evidence types |
| T8 | Comparative engine ownership (conceptual) |
| T9 | Ablockalypse public feel defaults (Input.h) |
| T10 | BBS directory snapshot metrics (2026-09-09) |
| T11 | Lua API taxonomy clusters (48 functions) |
| T12 | Failure modes register (expanded) |
| T13 | Documentation drift register (COPY DRIFT cases) |
| T14 | SPIR-V shader roles (Ra) |
| T15 | bbslist.json schema / field frequencies |
| T16 | Lua API catalog by category (Appendix F) |
| T17 | Competitive feel constants paired (Appendix G) |

---

# Preface: Self-Taught Doctoral Framing and the Ethics of Claiming Practice Knowledge

Doctoral form usually travels with institutional sponsorship: coursework, candidacy exams, committee signatures, archival deposit. That machinery is real and valuable. It is also not the only way human beings have ever organized deep knowledge. Craft traditions, studio apprenticeships, sysop culture, and independent engineering lineages have long produced transferable knowing without a registrar’s stamp.

This dissertation chooses doctoral *form*—abstract, method, chapters, claims, references, glossary—because that form forces discipline: What is the question? What counts as evidence? What is transferable? What is merely personal preference? It refuses doctoral *credential theater*. The front matter says so twice so no skim-reader can miss it.

### Why “practice-based” rather than “autoethnography alone”

Practice-based research, as articulated in creative and computing domains, treats the artifact as a research outcome and the making process as a site of inquiry.[^candy-edmonds] Donald Schön’s reflective practitioner frames the complementary epistemology: professionals know more than they can say, and they know it in the midst of action—by conversing with materials that talk back.[^schon-1983]

Steven Philley’s public body of work is unusually suited to that frame. The Ra Engine documentation is not marketing fluff; it is a working operator’s manual that records pitfall tables, UBO field order, RADV quirks, and Lua contracts.[^ra-docs] Steam Early Access text for app 4732830 discloses roadmap items, pricing philosophy, and production use on Laser Tag and Launch Up.[^steam-ra] Ablockalypse’s public feature list exposes competitive input affordances.[^cic-home] The BBS directory page credits upstream lists and distinguishes connection checks from login tests.[^cic-bbs] These are *artifacts that already argue*.

### Ethics of claiming “thirty years”

Public materials establish a long arc of hands-on computing and a professional trail through Mobile Physician Technologies (C/Qt), Adobe Premiere Pro (SDE 4, C++), and founding Color It Company (C, SDL, Vulkan, AI-assisted programming).[^linkedin] A mid-1990s public BBS listing associates Steven Philley with Digital Aquarium in the 408 area.[^textfiles-408] That is enough to justify a *career-length practice* framing. It is **not** enough to invent a year-by-year bildungsroman.

> **Practitioner note / open for author expansion:** Insert first-person chronology of the pre-Adobe decades—machines owned, languages learned, BBS sysop practice, failed engines, teachers/peers—without inventing what is not remembered or documented. Prefer dated artifacts over memory.


### Public self-stated origins (blog evidence only)

Color It Company’s public development log supplies a small set of **SELF-STATED** early-computing vignettes. They are usable as the author’s own published statements; they are **not** independently archived school records. This draft cites them with URLs and refuses to invent intervening decades.

#### TRS-80 Color Computer 2 / Color BASIC (~age 10)

In the 2024-07-06 post “The beginning,” Philley writes that he began programming around age ten after his grandfather gave him a **TRS-80 Color Computer 2** purchased at an auction, and that his first lines were in **Color BASIC**.[^blog-beginning] The same post records an early epistemic shock: Color BASIC commands failed on his father’s machine running **MS BASIC**, producing overload at the discovery that “BASIC” was not one language.[^blog-beginning]

That vignette matters to Owned Pipelines less as nostalgia than as an early lesson in **toolchain plurality**: ownership of a learning path begins when a maker notices that the machine’s dialect is a contract, not a universal.

#### IBM 5150 second-grade lab (back-dated narrative post)

A separate post titled “The Start,” carrying a Blogger feed date of **1987-09-17**, narrates a second-grade computer lab of donated **IBM 5150** machines; the narrator describes recognizing a calling, running `DIR`, and launching a program ahead of the teacher’s paced instructions.[^blog-start]

**Epistemic caveat (required):** the 1987 timestamp is a *platform date on a narrative post*, not proof the text was authored in 1987. Treat it as a back-dated self-published recollection. Pair it with later public breadcrumbs (e.g., the mid-1990s Digital Aquarium listing on textfiles.com) as *separate* evidence layers—do not collapse them into a continuous invented CV.[^textfiles-408]

#### Final Fantasy–inspired game interest

The same 2024 “beginning” post states that in eighth grade Philley traded roughly seven games for the original **Final Fantasy**, and that playing it inspired a desire to make an RPG—with monsters, hit points, and the rest of the systemic craft.[^blog-beginning] This is a vocation statement, not a shipped RPG claim. It situates later tetromino and RT platformer shipping as one long interest in **authored systems under the fingers**, not as a sudden career pivot invented for Steam marketing.

#### Backend-engineer-to-games path (public framing)

Public LinkedIn-facing statements describe a primarily **backend-engineer** path exploring games, culminating in a custom **C++/SDL2** Steam Early Access tetromino title.[^linkedin-gdc] Combined with studio founding under Color It Company and later Vulkan RT work on Ra Engine, the public trail supports a *practice arc* from systems engineering into owned game pipelines. Exact employment chronologies remain hooks for author voice; this draft does not invent dates beyond what inventory and public posts already carry.[^inventory]

> **Practitioner note / open for author expansion:** Between Color BASIC and Color It Company, what machines, boards, jobs, and failed engines actually happened? Prefer dated artifacts. Keep the blog vignettes as published self-statements; thicken with private chronology only where you consent to publish it.



### Voice

The voice of this document aims to be warm, sharp, and rigorous: craftsman-founder, not brochure. Where the author’s private voice would make a claim stronger, the draft leaves a hook rather than ventriloquizing.

### A note on collaboration and solitude

Public materials depict a founder/C++ programmer practice under Color It Company LLC / Flux Studios. Whether days are literally solitary or intermittently collaborative is not something this draft invents. Ownership epistemology does not require hermitage; it requires that identity-bearing decisions remain answerable to a continuous practice. Hire, partner, publish—but do not orphan the handshakes.

### How to read if you are short on time

1. Front matter disclaimers  
2. Chapter 1 research questions  
3. Chapter 4 (Ra)  
4. Chapter 9 thesis  
5. Author revision checklist  

Then return for feel, markets, BBS, and media chapters as needed.


---

# Chapter 1. Introduction: The Problem of Fragmented Pipelines

## 1.1 The problem

Contemporary interactive software is typically assembled across fragmented pipelines. Rendering is leased from Unity or Unreal; feel is tuned inside someone else’s fixed-update loop; distribution is a Steam checkbox; community infrastructure is Discord rented monthly; lighting theory is a YouTube tutorial half-remembered. Each fragment works. Together they produce a peculiar epistemic blindness: almost nobody owns the full stack long enough to feel how a UBO layout error, a coyote-time constant, a seat price, and a Workshop promise co-determine one another.

For solo and small-studio makers, fragmentation has a second cost. Dependency surface area becomes identity. When the engine updates break your lighting, or the storefront algorithm changes discoverability, the studio’s knowledge evaporates because it never lived in the studio’s hands.

## 1.2 Research questions

**RQ1 — Ownership as epistemology.** What kinds of knowledge become available when one practitioner (or micro-studio) retains vertical control of rendering, editor UX, game scripting, shipping, and community systems?

**RQ2 — Artifact evidence.** How can public technical documentation, storefront design statements, and shipped titles function as primary evidence in practice-based research without fabricating private process?

**RQ3 — Transferability.** Which Owned Pipelines patterns (CameraUBO discipline, terminal-first editor philosophy, one-seat catalog editing, aggregation-as-preservation) transfer beyond Digiflux and Color It Company?

**RQ4 — Limits.** Where does public-artifact method fail, and how should a self-directed doctoral form mark those gaps ethically?

## 1.3 Contribution claims (practice knowledge)

This dissertation claims the following contributions as *practice knowledge*, not as institutional science results:

1. **The Owned Pipelines thesis** (Chapter 9): a transferable account of vertical pipeline ownership as a generator of reflective, shippable knowledge.
2. **A deep technical reading of Ra Engine** as a production RTX pipeline with no raster fallback, theatrical lighting commitments, per-object BLAS architecture, and terminal-first HCI (Chapter 4).
3. **A feel-systems reading of Ablockalypse** as competitive craft under a custom SDL engine (Chapter 5).
4. **A platform-design reading of Digiflux’s one-seat / permanent $49.99 / Early Access statements** as intentional economics, not accidental pricing (Chapter 6).
5. **A systems reading of the BBS directory** as living-network preservation practice (Chapter 7).
6. **An adjacency argument** that photography and cultural learning sites train the same attention craft as lighting and feel (Chapter 8).
7. **A methodological template** for self-directed practice-based dissertations that refuse credential theater while insisting on evidence discipline (Chapter 2).

## 1.4 Scope and non-claims

In scope: public Digiflux/Ra documentation; Steam disclosures; CIC/itch pages; BBS directory page; photography and panatau public sites; LinkedIn-public career framing; real secondary literature.

Out of scope / non-claims: private source code dumps; unpublished performance benchmarks; fabricated user metrics; hipck.com (not verified in the inventory pass); institutional PhD status; investment performance of any product.

## 1.5 Roadmap of chapters

Chapter 2 states method. Chapter 3 situates the work historically. Chapters 4–8 are artifact chapters. Chapter 9 synthesizes. Chapter 10 concludes with public-roadmap future work only.

## 1.6 Motivation in plain language

Ask a working programmer where “the product” lives. Answers scatter: in Git; in Jira; in the engine vendor’s roadmap; in the storefront feature checklist; in a Discord mod’s hands. Ask where *knowledge* lives, and the scattering worsens. Owned Pipelines is a stubborn answer: knowledge lives where responsibility is continuous enough to hurt when layers disagree.

The hurt is useful. When a Lua script moves a platform and the BLAS rebuild hitch teaches you something about level design density, that is knowledge. When a permanent seat price forces you to imagine a thousand careful buyers rather than ten enterprise contracts, that is knowledge. When a BBS connection light stays dark and you refuse to pretend the board is up, that is knowledge.

This dissertation gathers those hurts—already partially archived in public writing—and arranges them so another practitioner can learn faster than tribal myth allows.

## 1.7 Audience

- Independent engine and tools makers deciding what to own vs rent
- Practice-based researchers seeking artifact-as-evidence templates
- Graphics programmers curious about RT-only product constraints
- Game designers studying published feel constants
- Cultural technologists maintaining living network directories
- Steven Philley himself, as a mirror for revision

## 1.8 On length and density

Monograph length is not padding. Graphics and feel systems hide their lessons in detail. Where this draft is long, it is usually slow-reading a primary source that already existed (Ra docs, Steam EA FAQ, CIC pages, sdl2-blocks, bbslist.json). Draft 1.1 fills formerly short numerical feel gaps only where public headers expose defaults (180/45). Where it remains short—pre-Adobe private chronology, Laser Tag AppID, hipck—it is short on purpose because invention would be unethical.


---

# Chapter 2. Method: Practice-Based Research and Artifact-as-Evidence

## 2.1 Practice-based research stance

Linda Candy and Ernest Edmonds distinguish research *into*, *through*, and *for* practice, and argue for relating theory, practice, and evaluation without collapsing practitioner knowledge into lab science.[^candy-edmonds] Schön’s reflective conversation with the situation supplies the cognitive model: materials talk back; the practitioner reframes.[^schon-1983]

This dissertation is primarily research *through* practice, reconstructed from public traces of practice. It is not a controlled experiment. It is also not mere portfolio narration. Claims must (a) name an artifact, (b) show a public handle on that artifact, and (c) extract a transferable pattern.

## 2.2 Artifact-as-evidence protocol

For each major claim, the draft applies a four-step protocol:

1. **Locate** a public primary source (docs page, Steam text, studio page).
2. **Describe** the technical or design fact without embellishment.
3. **Interpret** the fact as practice knowledge (what it affords, what it forbids, what it teaches).
4. **Bound** the interpretation: what would falsify it; what is unknown.

Example: “Ra Engine has no rasterization fallback” is located in digiflux docs (“Every pixel is ray traced — there is no rasterization fallback”).[^ra-docs] Interpretation: ownership of an RT-only path forces lighting and scene authoring to stay inside RT constraints. Bound: performance numbers on specific titles are not published here as measured results.

## 2.3 Limits of public sources

Public docs are curated. Steam pages are persuasive as well as descriptive. LinkedIn compresses careers. BBS aggregation pages inherit upstream list errors. Therefore:

- Prefer *operator documentation* (pitfall tables, UBO field lists, build flags) over adjectives.
- Treat commercial promises as *design commitments*, revisable.
- Mark biography gaps explicitly.
- Do not infer private AI-assisted workflow details beyond the public skill tag “AI-assisted programming.”

> **Practitioner note / open for author expansion:** Describe the actual reflective loop used day-to-day (how bugs are journaled, how feel tests are run, how docs are updated when a pitfall is discovered). Public docs show *that* pitfalls are recorded; they do not show the human ritual that produces the table.

## 2.4 Literature use

Secondary literature is used for conceptual scaffolding, not as a fake co-authorship network. Core anchors:

- Reflective practice and practitioner research: Schön; Candy & Edmonds.[^schon-1983][^candy-edmonds]
- Affordances and HCI: Gibson; Norman.[^gibson-1979][^norman-doe]
- Graphics / RT: Akenine-Möller et al.; Pharr et al.; Vulkan / Khronos materials.[^rtr][^pbrt][^vulkan]
- Theatrical lighting: McCandless.[^mccandless]
- Game feel / engines: Swink; Gregory.[^swink][^gregory]
- Networked culture / BBS history: public archival projects such as textfiles.com and contemporaneous histories of early online culture.[^textfiles][^hafner-lyon]

## 2.5 Positionality


Additional practice-based and networked-culture anchors used in Draft 1.1 include Candy’s *Creative Reflective Practitioner*; Smith & Dean’s practice-led research collection; Borgdorff on artistic research and academia; Nelson’s practice-as-research protocols; Driscoll’s *Modem World*; Scott’s *BBS: The Documentary*; Anthropy’s zinester framing; *Ray Tracing Gems*; Juul’s *Half-Real*; Galloway’s *Protocol*; Rheingold’s *Virtual Community*; and Salen & Zimmerman’s *Rules of Play*.[^candy-2019][^smith-dean][^borgdorff][^nelson][^driscoll][^scott-bbs-doc][^anthropy][^rt-gems][^juul][^galloway][^rheingold][^salen-zimmerman]



The author of the practice is Steven Philley; this draft is written as a rigorous synthesis of his public practice for his revision. Third-person technical description is used for artifacts; first-person hooks are reserved for the author’s expansion so that voice remains authentic rather than simulated.

## 2.6 Success criteria for this draft

A successful draft (a) exists as a complete readable monograph, (b) disclaims institutional degree status, (c) accurately reflects digiflux/Steam/CIC public technical detail, (d) invents no private anecdotes or fake metrics, and (e) ends with a concrete author revision checklist.

## 2.7 Evidence grades

Not all public sources are equal. This draft uses an informal grade:

- **Grade A — Operator documentation:** pitfall tables, struct layouts, flag lists, API contracts (Ra docs, Lua API).
- **Grade B — Storefront technical disclosures:** EA feature inventories, system requirements, pricing statements (Steam).
- **Grade C — Studio marketing with concrete features:** Ablockalypse feature pillars, Digiflux one-seat copy.
- **Grade D — Career/profile compression:** LinkedIn roles and public posts.
- **Grade E — Interpretive adjacency:** photography and cultural sites as attention craft (clearly marked interpretive).

Claims in Chapter 4 lean on A/B. Claims in Chapter 8 lean on E and say so.

## 2.8 Writing rules used while drafting

1. If a number is not on a public page, do not type it.
2. If a memory would make the prose prettier, insert a practitioner note instead.
3. Prefer verbs of building (`bakes`, `rebuilds`, `aggregates`) over verbs of branding (`disrupts`, `reimagines`).
4. When Steam and docs disagree slightly (e.g., GPU tier phrasing), surface the difference rather than averaging fictionally.
5. Keep the degree disclaimer boring and repeated.

## 2.9 Relation to “research through design”

Research through design (RtD) communities often use prototypes as argument. Games and engines complicate RtD because they are long-lived products under market weather. This draft accepts that complication: Digiflux titles are prototypes *and* products. Their doubleness is not cleaned up; it is the point.


---



## 2.11 Draft 1.2 source discipline

Draft 1.2’s expansion discipline is explicit:

1. Prefer **file:line** cites from the vendor clone when discussing Ablockalypse algorithms.
2. Prefer **dated JSON snapshots** when citing BBS counts (1304/1092 on 2026-09-09; 1322/1099 on 2026-09-10).
3. Prefer **Steam as storefront of record** for price; inventory docs drift without averaging.
4. Prefer **lua-api** for function inventory (48) while recording hub “30” drift.
5. Treat Launch Up **manual** as feel pedagogy of record and Steam copy as marketing/process surface—even when they conflict.
6. Record digiflux `/products|/pricing|/about` **404** rather than inventing commercial microsites.
7. Leave Laser Tag AppID, Synchronet authorship, Steam SDK/ZH ship status, hipck, and childhood CV gaps **open**.

This discipline is the ethical twin of the Owned Pipelines thesis: surfaces must remain accountable under growth.

## 2.10 Self-directed doctoral form and artistic-research debates

Henk Borgdorff’s *Conflict of the Faculties* maps tensions between artistic research and academic legitimacy—useful caution for any self-directed “doctoral” monograph.[^borgdorff] Robin Nelson’s practice-as-research protocols emphasize documentation, critical reflection, and situated knowledge claims.[^nelson] Smith and Dean’s practice-led / research-led web describes iterative cycles rather than linear “results.”[^smith-dean]

This draft borrows those epistemic tools while refusing to smuggle a registrar’s signature. The ethical test is simple: would a careful reader, after the disclaimers, still think a university conferred a PhD? If yes, the document failed. Draft 1.1 keeps failing that failure mode on purpose—by repetition.




# Documentation Drift as Epistemic Object

> **Draft 1.2 major section.** Mismatches between Steam pages, digiflux operator docs, game manuals, repository headers, and dated JSON snapshots are treated here as *evidence about living systems*, not as errata to hide. This section elevates what Interlude A.6 began and what Chapters 4–7 already flag as **COPY DRIFT**.

## D.1 Why drift belongs in a practice-based dissertation

Institutional theses often prefer a single “correct” product definition. Living indie pipelines do not. A storefront must sell a fantasy; a manual must teach fail-states; operator docs must warn about RADV; a Lua quick-reference must grow when new functions land. When those surfaces disagree, the disagreement is **data** about:

1. **Audience partitioning** — marketers, players, and engine operators need different truths at different resolutions.
2. **Temporal layering** — docs and store pages are not updated atomically; feature landings leave fossils (CameraUBO 24→~30; Lua “30” vs “48”).
3. **Ownership honesty** — a rented pipeline’s drift is someone else’s problem; an owned pipeline’s drift is the practitioner’s reflective material.

Schön’s reflective practitioner meets the situation’s back-talk; documentation drift is back-talk *between representations*.[^schon-1983] Candy’s research-through-making frame supports treating the mismatch itself as an evaluable artifact of practice, not only the “resolved” product.[^candy-2019][^candy-edmonds]

## D.2 Drift register (public, dated)

| ID | Surfaces | Observed mismatch | Epistemic reading | Disposition in this monograph |
| --- | --- | --- | --- | --- |
| DR1 | Steam Ra vs digiflux commercial language | **$49.99/seat** permanent (Steam) vs **$250/seat** appearance in at least one docs fetch window | Storefront-of-record vs docs footer lag / alternate framing | Cite Steam for commercial claims; flag docs as COPY DRIFT; author reconcile |
| DR2 | Launch Up Steam vs Flux Studios manual | Store neon/explore / “no fail states” tone vs manual death plane Y=−5m, hazards, Exploring→Dead→Respawning | Marketing fantasy vs operator/player pedagogy | Present both; do not silently pick |
| DR3 | Launch Up Steam API platforms vs store requirement blocks | API Linux-true / Windows-false oddities beside dual-OS requirement copy | Platform metadata entropy | Record; do not invent ship matrix |
| DR4 | digiflux hub vs lua-api page | Hub “all 30” vs lua-api quick reference **48** functions | Growing API; stale hub sentence | Prefer lua-api catalog; flag hub drift |
| DR5 | CameraUBO field lists across doc revisions | Earlier **24** fields → later ~**30** with ambient-sky floats | Feature landing fossilized in UBO treaty | Dated readings; sacred field order remains |
| DR6 | Ablockalypse EA horizon vs calendar | EA text “until end of 2025” vs still-EA observation in 2026 drafting window | Schedule honesty surface | Accountability fact, not invented completion |
| DR7 | Hardware tier docs vs Steam minimum | Docs RTX **3060** primary / Steam **2060**-class floor | Desk machine vs market floor | Both true at different layers |

This table is Table **T13** in spirit: a first-class research instrument.

### Core triad (must not be averaged)

Draft 1.2 insists readers memorize three numeric drifts as epistemic objects—not errata:

1. **$49.99 ↔ $250** — Steam permanent seat vs docs-footer appearance.[^steam-ra][^draft12-pack]
2. **CameraUBO 24 ↔ 30** — earlier docs total ending at reach-indicator fields vs later total including six `ambientSky*` floats.[^ra-docs]
3. **Lua docs 30 ↔ 48** — hub “all 30” link text vs lua-api “Total: 48 functions.”[^lua-api]

Plus Launch Up wall-run / fail-state store↔manual splits (§6.21). The method crime would be silent reconciliation; the method virtue is dated dual citation.


## D.3 Method rule: cite both, reconcile only with author voice

Draft 1.2 hardens a rule already practiced in Draft 1.1:

1. **Never average** disagreeing public numbers ($49.99 and $250 do not become $150).
2. **Never delete** the less convenient surface to purify the thesis.
3. **Prefer storefront of record** for commercial promises when customers would rely on Steam.
4. **Prefer operator docs** for metal-adjacent truth (BLAS, RADV, UBO order, MangoHUD).
5. **Prefer manuals** for feel pedagogy when store copy is atmospheric.
6. **Date every snapshot** (BBS JSON counts change day to day; see Ch7).

## D.4 Drift as Owned Pipelines evidence

Owned Pipelines predicts cross-layer talk-back. Drift is talk-back *failing to synchronize*—which is still talk-back. The studio that publishes pitfall tables and BBS connection-check disclaimers is the same studio whose store and docs can temporarily disagree. The ethical upgrade is not perfection; it is **making drift legible**.

Juul’s *Half-Real* reminds us that games (and by extension game platforms) live between rules and fiction;[^juul] store fiction and manual rules can diverge without either being “fake,” but scholarly citation must name the split. Galloway’s *Protocol* reminds us that control hides in handshakes;[^galloway] documentation drift is a handshake failure between representations of the same system.

## D.5 What would *not* count as productive drift

- Inventing boards or metrics to fill gaps.
- Quietly rewriting yesterday’s Steam FAQ inside a dissertation to match today’s preference.
- Treating hipck.com rumors as public artifacts.
- Collapsing Laser Tag’s announced status into a fabricated AppID.

Productive drift is **public, checkable, and dated**. Everything else remains a GAP or a refusal.

## D.6 Section claim

**Claim CD:** In a living owned pipeline, mismatches among Steam, docs, manuals, headers, and JSON snapshots are epistemic objects. Practice-based research should inventory them (Table T13), refuse silent reconciliation, and let author voice—not the drafting agent—perform any final product-definition repair.

---

# Chapter 3. Historical and Conceptual Context: From BBS Culture to Hardware RT

## 3.1 Networked culture before the feed

Before the social feed, networked computing culture was often *placeful*: dial a number, land in a board, read messages, download a file, talk to a sysop. Bulletin Board Systems were social machines with scarcity (phone lines, baud rates) and strong local identity. Archival projects such as Jason Scott’s textfiles.com preserve lists, files, and cultural residue of that world.[^textfiles] A public 408-area listing records Digital Aquarium (1996) with Steven Philley’s name—evidence of participation in that culture, not a novelistic retelling.[^textfiles-408]

Color It Company’s contemporary worldwide active BBS directory is not nostalgia cosplay; it is a systems project that aggregates live public lists (Telnet BBS Guide and companions, Synchronet, regional directories), attributes sources, and runs connection checks while explicitly refusing to invent unpublished private boards.[^cic-bbs] Chapter 7 returns to this as preservation practice.

## 3.2 Professional tools as training in pipelines

Public career framing places Philley in C/Qt work at Mobile Physician Technologies and as Software Development Engineer 4 on Adobe Premiere Pro (C++).[^linkedin] Premiere is a canonical “owned by the org, leased by the individual” pipeline: deep C++ craft inside a vast commercial cathedral. The practice lesson is double-edged. Large products teach discipline—threading, media pipelines, performance paranoia—while also teaching how little of the total stack a single engineer owns.

> **Practitioner note / open for author expansion:** What Premiere (and prior professional work) taught about shipping discipline, code review, and the difference between owning a subsystem and owning a product. Keep concrete; avoid mythic origin stories.

## 3.3 Indie engines and the return of ownership

Jason Gregory’s *Game Engine Architecture* maps the sprawling subsystems of modern engines.[^gregory] Unity and Unreal democratized production and, simultaneously, normalized dependency. Indie counter-movements—custom SDL engines, homemade renderers, tiny Lua-scripted runtimes—reclaim ownership at the cost of breadth.

Ablockalypse’s custom SDL engine and Ra Engine’s Vulkan RT stack sit in that counter-movement, but with different ambitions: one is competitive 2D feel craft; the other is a full hardware RT editor/runtime that ships games and sells seats.

## 3.4 Ray tracing leaves the offline farm

Physically based and real-time rendering literature charts the long migration of ray tracing from offline film path tracers toward interactive hardware pipelines.[^pbrt][^rtr] Khronos’s Vulkan ray-tracing extensions made hardware RT a first-class real-time API surface.[^vulkan] Ra Engine’s public stance—Vulkan 1.4, `VK_KHR_ray_tracing_pipeline`, no raster fallback—places it in the “RT as the renderer, not a demo pass” camp.[^ra-docs][^steam-ra]

## 3.5 Theatrical light in a computational age

Stanley McCandless’s classic stage-lighting method emphasizes controlled visibility, modeling form, and composition—not merely “more light.”[^mccandless] Ra Engine’s documentation explicitly invokes McCandless-informed theatrical lighting alongside inverse-square attenuation, ACES options, and depth fog.[^ra-docs] That citation matters culturally: it refuses the idea that a physically inspired falloff curve alone constitutes lighting design.

## 3.6 Affordances, feel, and terminal-first HCI

Gibson’s affordances and Norman’s later HCI popularization remind us that interfaces are ecological, not merely graphical.[^gibson-1979][^norman-doe] Steve Swink’s *Game Feel* argues that interactive sensation is a designed object.[^swink] Ra Engine’s terminal-first UI (ANSI, F-keys, no ImGui over the viewport) is an affordance bet: creator attention should stay on the ray-traced image and keyboard grammar, not on floating editor chrome.[^ra-docs] Ablockalypse’s configurable delay/repeat and wall kicks are feel bets of a different genre.[^cic-home]

## 3.7 Conceptual bridge to the Owned Pipelines thesis

Across BBS culture, pro tools, indie engines, hardware RT, theatrical lighting, and feel systems, one pattern repeats: **knowledge densifies where responsibility is continuous**. The following chapters examine that densification in concrete systems.

## 3.8 Digression: what “thirty years” can mean without a diary

Even without a fabricated timeline, public fragments already sketch duration:

- 1990s networked culture participation breadcrumb (Digital Aquarium listing)
- Professional C/C++ practice through medical/mobile tooling and Adobe Premiere Pro
- Founding and running Color It Company with shipped SDL and Vulkan products into the mid-2020s
- Parallel media practices in photography and cultural learning sites

“Thirty years of hands-on computing,” as a title phrase, should be read as a **career-length craft claim under revision**, not as a stopwatch audited to the month. The author’s expansion can tighten or modestly retitle if the arithmetic of memory differs.

## 3.9 The indie tool winter and the seat

Indie tools face a recurring winter: free expectations, Steam discovery volatility, and competing against zero-price giants. Ra’s permanent $49.99 seat and one-seat catalog editing are answers forged in that winter. They may fail commercially and still succeed as clear design hypotheses—another reason practice-based research must separate **knowledge clarity** from **market victory**.

## 3.10 Terminal culture as historical rhyme

BBS terminals, ANSI art, sysop keyboards, and Ra’s ANSI F-key editor rhyme across decades. The rhyme is not aesthetic cosplay; it is a recurring bet that **keyboard-addressable systems** keep operators close to state. GUI overlays can be wonderful; they can also become a fog between operator and machine. Ra’s refusal of ImGui-over-viewport is intelligible against that longer history of terminal operator craft.



---


## 3.11 Modem-world literacy for a 2026 directory

Kevin Driscoll’s *The Modem World* reconstructs social-media prehistory through bulletin-board and modem cultures, arguing that many “new” network habits have older operator genealogies.[^driscoll] Jason Scott’s *BBS: The Documentary* remains a primary audiovisual ethnography of boards, sysops, and warez-adjacent mythologies—cite as documentary, not as peer-reviewed monograph.[^scott-bbs-doc] Together they license Ch7’s seriousness: a 2026 JSON directory with 1304 probed systems is contemporary systems work inside a long arc, not a Halloween costume.




## 3.12 Close reading: Driscoll’s *Modem World* and the 2026 directory

Kevin Driscoll’s *The Modem World: A Prehistory of Social Media* (Yale, 2022) reframes modem-era sociality as a prehistory of later platforms rather than a closed folk tale.[^driscoll] Read beside Color It Company’s worldwide BBS directory, three transferrable lessons emerge—paraphrased, not quoted as if they were about Digiflux:

1. **Boards were infrastructures of attention**, not only “chat before Discord.” Aggregation, reachability, and sysop labor were always socio-technical.
2. **Protocol plurality** (dial-up, Telnet, later gateways) is historically normal; a 2026 directory that filters Telnet/SSH/Web/Dial-up is continuing that plurality rather than cosplaying a single golden age.
3. **Lists are political.** Who is indexed, credited, and probe-visible shapes who counts as “still here.” CIC’s “not invented here” and connection≠login disclaimers are contemporary answers to list-politics problems Driscoll’s history makes newly sharp.

This monograph does not claim Driscoll studied coloritcompany.com/bbs. It claims the directory is *intelligible* inside the scholarly conversation Driscoll advances—especially when paired with Jason Scott’s archival and documentary work.[^scott-bbs-doc][^textfiles]

## 3.13 Close reading: Swink’s *Game Feel* as instrument literacy

Steve Swink’s *Game Feel* argues that interactive sensation can be designed, tuned, and broken—treated as a craft object rather than ineffable juice.[^swink] Against the public CIC corpus, Swink supplies vocabulary for what Ablockalypse and Launch Up already publish as numbers and options:

- **Ablockalypse** exposes delay/repeat defaults (**180** / **45** ms) and wall-kick toggles; releasenotes version the feel instrument.[^input-h][^ablock-releasenotes]
- **Launch Up** publishes jump velocity **8.5**, coyote **0.15s**, jump buffer **0.12s**, gravity **−18.0**, and height scoring **100 pts/m**.[^launchup-manual][^ra-docs]

Swink’s contribution here is not a fake endorsement; it is a **literacy baseline**: readers trained by *Game Feel* can audit these constants as design claims. Salen & Zimmerman’s *Rules of Play* and Juul’s *Half-Real* further license reading board-size options and death-plane rules as rule-systems players inhabit—not mere content chrome.[^salen-zimmerman][^juul]

## 3.14 Close reading: Candy’s *Creative Reflective Practitioner*

Linda Candy’s *The Creative Reflective Practitioner* (Routledge, 2019/2020) deepens the Candy & Edmonds practitioner-research program by centering making, reflection, and evaluation as intertwined rather than sequential.[^candy-2019][^candy-edmonds] For this self-directed doctoral form, Candy’s framing supports three methodological moves already practiced in Chapters 2 and 4–7:

1. **Artifacts as outcomes** — pitfall tables, releasenotes, bbslist.json, and Steam EA FAQs count as research products, not only marketing debris.
2. **Evaluation without lab cosplay** — coherence, inspectability, shipping existence, and ethical bounding (degree disclaimer; BBS probe disclaimer) substitute for invented NPS studies.
3. **Reflection as public discipline** — hot-reload’s experiment-state vs `set_var` commitment-state is a Candy-compatible reflective loop instrumented in software.[^lua-api]

Borgdorff’s caution about artistic research and academic legitimacy remains the ethical brake: borrowing Candy’s epistemic tools must not smuggle a registrar’s signature.[^borgdorff]

---

# Chapter 4. Owned Rendering Pipelines: Ra Engine Architecture, Lighting, and UI Philosophy

Ra Engine is the densest public artifact in this dissertation’s inventory: a Vulkan 1.4 hardware ray-tracing scene editor and game engine built at Flux Studios under Color It Company LLC, documented at digiflux.one/docs/, and listed on Steam as app 4732830.[^ra-docs][^steam-ra] It is not presented here as “the best engine.” It is presented as an *owned* engine—one whose constraints, pitfalls, and philosophies are authored by the same practice that ships games on top of it.

## 4.1 Design stance: RT as the renderer

The documentation’s opening claim is unambiguous: Ra uses a full hardware ray-tracing pipeline; every pixel is ray traced; there is no rasterization fallback.[^ra-docs] Steam copy reinforces the same identity: “not baked, not approximated — in real time as you build.”[^steam-ra]

That stance is an ownership choice with epistemic consequences:

- **Lighting cannot hide in a deferred raster cheatsheet.** If reflections, refractions, and GI are RT paths, scene authors learn RT economics directly.
- **Editor and runtime share a truth.** What you see while placing a spot light is the same class of image the player gets.
- **Platform requirements become honest.** Fedora Linux-first notes, RTX 3060 development minimum in docs, Steam minimum stating RTX 2060-class / RX 6600 / Arc A380 with `VK_KHR_ray_tracing_pipeline` required—these are not afterthoughts; they are the product’s ontology.[^ra-docs][^steam-ra]

### Hardware tiers (from docs)

| Tier | GPU | Notes |
| --- | --- | --- |
| Development / Minimum (docs) | NVIDIA RTX 3060 | Primary dev target; per-object BLAS architecture |
| Supported | AMD RX 6600 | RDNA2 hardware RT; RADV `primitiveOffset` quirks |
| Supported | Intel Arc A380 | Xe-HPG; validated with Mesa ANV |

Steam’s minimum list additionally cites NVIDIA RTX 2060 class as a stability floor for the Early Access state.[^steam-ra] The slight docs/storefront difference is itself practice evidence: storefronts speak in market tiers; internal docs speak in the machine on the desk.

## 4.2 Pipeline architecture: recursive ray order

Rays dispatch from `raygen.rgen` and recurse through closest-hit and miss shaders. Documented recursive order per primary ray:[^ra-docs]

1. **Reflections** — mirror and glossy bounces; shadow rays depth-gated at bounce ≤ 1.
2. **Refractions** — enter/exit pairs tracked via `fromRefraction` in `RayPayload`; suppresses reflection spawning inside refraction chains.
3. **GI** — single bounce, multi-sample (Off / 1 / 2 / 4). `fromGI` skips shadow rays on GI hits; a correct 2× Monte Carlo scale factor is applied.

After tracing, a post-`imageStore` pass in raygen draws the crosshair over the tonemapped image—an unusually literal reminder that HUD is part of the RT image contract, not a separate Immediate Mode layer floating above “the real frame.”

### Tonemapping & color

| Setting | Behavior |
| --- | --- |
| ACES On | Filmic S-curve; rolls off highlights |
| ACES Off | Linear passthrough; vivid theatrical look |
| Gamma On | sRGB ~2.2 |
| Gamma Off + ACES Off | Documented preferred default: pure linear, maximum vibrancy |

The preferred default is a taste claim with engineering teeth. Many engines default to “filmic everything.” Ra documents a theatrical preference for linear vibrancy when ACES is off—consistent with McCandless-informed stage thinking where controlled contrast and color intention matter more than obligatory film emulation.[^mccandless][^ra-docs]

## 4.3 Acceleration structures: per-object BLAS discipline

Ra uses a **per-object BLAS** architecture. Each `SceneObject` owns a `PerObjectBLAS` (`VkAccelerationStructureKHR`, buffer, memory). The TLAS holds one instance per BLAS with **identity transforms** because vertex positions are world-space baked via `applyAllObjectTransforms()` before BLAS build.[^ra-docs]

Consequences:

- `gl_ObjectToWorldEXT` is identity and intentionally unused in active shaders—documented as a pitfall if misunderstood.
- Index addressing in closest-hit uses `gl_InstanceCustomIndexEXT` as `firstIndex` into a global index buffer with `gl_PrimitiveID`.
- Rebuild API surface is explicit: `buildObjectBLAS`, `buildAllBLASes`, `buildTLAS`, `destroyAllBLASes`.
- Registration order matters: objects registered after `buildAllBLASes()` are missing from the TLAS—another documented pitfall.

This is textbook ownership knowledge. A rented engine might hide AS updates behind “mark static/dynamic.” Here the practitioner must know when a move rebuilds what. Lua’s `set_object_position` documentation even warns that moving objects triggers BLAS/TLAS rebuild work—game logic authors inherit the graphics cost model.[^lua-api]

### AMD RADV note

On RADV, `primitiveOffset` is silently ignored. The documented fix is dedicated per-object `HOST_VISIBLE` index buffers with `primitiveOffset=0`.[^ra-docs] That sentence alone is worth more to a working graphics programmer than a dozen abstract slides on “cross-vendor RT.”

## 4.4 CameraUBO: the social contract (24→30 fields across doc revisions)

Ra’s `CameraUBO` is a fixed-order struct that must match across C++ host and all shader files. Earlier public docs enumerated twenty-four fields spanning view/proj inverses, light count, frame counter, AA controls, reflection/GI toggles, emissive strength, fog density, ACES/gamma flags, and highlight/HUD/reach-indicator fields; later live docs extend the treaty with ambient-sky floats (see field-count drift note below).[^ra-docs][^expansion-pack]

Any mismatch yields **silent data corruption**—wrong settings on the GPU with no validation error. Two fields (`reachIndicatorEnabled`, `reachIndicatorNorm`) are declared in `closesthit.rchit` for layout sync even though consumed in raygen.

This is one of the purest Owned Pipelines lessons in the entire corpus: **the UBO is a treaty**. Cross-language layout is not a detail; it is governance. Large teams invent code generators and shader reflection to survive this. A solo owned pipeline survives by ritualized discipline and documentation that treats field order as sacred.

## 4.5 Materials, lights, and GLTF as longevity strategy


### CameraUBO field-count drift as documentation epistemology

Draft 1.0 recorded twenty-four CameraUBO fields from an earlier docs reading. Live digiflux documentation in the Draft 1.1 window lists a longer treaty that additionally carries ambient-sky floats consumed by `miss.rmiss` (top and horizon RGB), bringing the public field list to on the order of **thirty** entries when sky authorship is included.[^ra-docs][^expansion-pack]

That drift is not an embarrassment; it is **evidence**. Operator documentation is a living artifact. When Lua gains `set_ambient_color` and the miss shader gains sky controls, the UBO treaty grows. A practice-based dissertation must prefer *dated readings* over pretending the docs were always identical. The pedagogical constant remains: **field order is sacred**; silent mismatch still yields silent corruption.



### Extensions

Supported scene format is GLTF 2.0 via tinygltf, with:[^ra-docs]

| Extension / extra | Purpose |
| --- | --- |
| `KHR_lights_punctual` | Point and spot lights |
| `KHR_materials_transmission` | Glass / refractive |
| `KHR_materials_ior` | IOR for transmission |
| `RA_materials_reflectivity` | Ra-specific reflectivity scalar |
| `_MATERIALINDEX` | Per-vertex material index for multi-material meshes |
| Node extras `ra_label`, `ra_euler`, `ra_scale`, `ra_group` | Editor identity, euler degrees, scale (min 0.01), grouping |

Open scene format is a longevity bet. Binary-only proprietary scenes die with the tool. GLTF plus carefully named extras keeps the door open for interchange while allowing Ra-specific authoring data.

### Light loading pitfall

TinyGLTF exposes `node.light` (integer). Raw JSON stores the reference under `node.extensions.KHR_lights_punctual.light`. Docs warn: never read lights from the generic extensions map in C++; use `node.light` only.[^ra-docs] That is the kind of sentence that only appears when someone has eaten the bug.

### Lighting model

Physically based inverse-square attenuation: `illuminance = intensity / distance²`. Calibration advice: start low; intensity 10 fully illuminates within ~3 metres.[^ra-docs] Light culling uses `influenceRadius = sqrt(light.intensity * 1000.0)`. Glass/zero-roughness safety clamps GGX alpha to `max(roughness², 1e-4)` to avoid NaNs.

McCandless is not implemented as an automatic three-point rig; it is a *theory commitment* guiding intensity discipline and theatrical intent inside a physically attenuated RT world.

## 4.6 Shader system and build workflow

Shader stages: `raygen.rgen` (active), `raygen_aa.rgen` (kept in sync, not active), `closesthit.rchit`, `miss.rmiss`.[^ra-docs] Shader changes require `./compile_shaders.sh`; C++ incremental builds use `-MMD -MP` via Makefile; `go.sh` orchestrates run flags:

| Flag | Effect |
| --- | --- |
| `--skip-compile` | Use existing binary |
| `--no-mango` | Disable MangoHUD (**always required**; overlay segfaults on Vulkan teardown) |
| `--play` | Interactive scene picker / play mode |
| `--fullscreen` | Session-only fullscreen via conf toggle |
| `--clean` | Full recompile |
| `--validate` | Vulkan validation layers |

Linux-first (Fedora), X11+GLFW notes, and the MangoHUD hard rule are not chrome—they are the grain of the wood. Owned pipelines document the grain.

## 4.7 Terminal-first UI philosophy

Ra’s editor is ANSI terminal text with an F-key menu system. **No ImGui over the viewport.**[^ra-docs][^steam-ra]

| Key | Menu / action |
| --- | --- |
| F1 | Console View — 500-line ring buffer of stdout/stderr, ANSI-stripped then recolored |
| F2 | Video settings (ACES, Gamma, GI samples, fog, reflections…) |
| F3 | Scene hierarchy |
| F4 | Fly mode |

Hierarchy operations include object/light add submenus (keypad hold patterns), snap-to-ground via Möller–Trumbore from the bottom face, grab mode (`~`), group grab (Alt+G), delete (Alt+D), group select (Enter). Fly mode uses WASD, Space/C up-down, Q/E roll, Shift 2× speed; view matrix must use `cameraUp` or roll never reaches the GPU.[^ra-docs]

### HCI reading

Against the dominant pattern of Dear ImGui overlays, Ra makes a Gibsonian affordance claim: the primary visual ecological niche is the RT image; the editor should be a keyboard instrument beside it, not a translucent city of widgets on top of it.[^gibson-1979][^norman-doe] Console View’s tee-streambuf design (render via `origCout_` to avoid recursive capture) shows the same seriousness applied to logging UX as to BLAS builds.

GLFW detail: `glfwSetCharCallback` does not fire when `GLFW_CURSOR_DISABLED` is active on X11; all text input uses `keyCallback` + `keyToChar()`.[^ra-docs] Feel and HCI meet OS reality.

## 4.8 Lua as the soft membrane

Game logic lives in Lua scripts under `scripts/`, exposed through a global `engine` table, hot-reloaded by `stat()` mtime checks each frame.[^lua-api] Contract: `init`, `update(dt)`, `shutdown`, optional `get_status_line`.

Hot-reload tears down `lua_State` and calls `init` again. **Lua locals die; `engine.set_var` / `get_var` (C++-side floats) survive.** That single design choice teaches a durable systems lesson: decide explicitly which state is ephemeral and which is durable across the reflective loop of edit-reload-play.

The public API surface is large (docs enumerate on the order of 48 functions): camera, physics, input, transforms, emissives, visibility, AABB overlaps, scene load, checkpoints, HUD, ray cast, tags/props, standalone game objects, ambient sky color.[^lua-api]

Launch Up patterns in the docs—prefix discovery of hazards, goal pad pop-in, checkpoint emissive flash, score = height × 100—show Lua as production craft, not demo glue.

### Physics constants (public)


### 4.8.1 Full public API taxonomy (~48 functions)

The Lua API reference’s quick-reference table enumerates on the order of **forty-eight** `engine.*` functions.[^lua-api] The hub docs page has also been observed to say “all 30” in one place—an internal **copy drift** that this dissertation treats as documentation-as-artifact epistemology: prefer the dedicated lua-api quick reference for inventory, and record the mismatch rather than inventing a false average.[^expansion-pack]

| Cluster | Representative functions | Practice lesson |
| --- | --- | --- |
| Camera | `get/set_camera_position`, `get_camera_forward`, `get_camera_right` | In Launch Up–class titles the player *is* the camera |
| Physics | `get_physics_state`, `set_vertical_velocity`; gravity **−18.0** | Feel constants published beside theatrical light |
| Input | `get_input` → `key_down`, `key_just_pressed`, mouse deltas | Edge-triggered one-shots vs held state |
| Time | `get_time`, `get_delta_time` | Animation / emissive pulse authorship |
| Scene objects | find/exists; get/set transform; emissive; visible; AABB; overlaps | Triggers and hazards share RT geometry |
| Queries | `find_objects_by_prefix`, `get_all_object_names` | Naming contracts (`platform_hazard_`) |
| Scenes | `load_scene` (deferred; re-`init`) | Level progression without leaking IDs |
| Checkpoints | `set/get_checkpoint` | Mercy as first-class API |
| Vars / HUD | `set/get_var`, `print_status`, `set_hud_data` | Commitment state vs experiment state |
| Ray cast | `cast_ray`, `get_object_rest_center` | Hitscan / pivot discipline for Laser Tag–class queries |
| Tags / props | mesh `ra_tag` / `ra_props` helpers | Data-driven gameplay inside GLTF |
| Standalone game objects | separate ID space; active/prop APIs | Entities without mesh payload |
| Ambient sky | `set_ambient_color` → miss shader | Lighting authorship from script |

**Documented limitation:** visibility and collision are not yet unified—hidden objects may still block the player.[^lua-api] Publishing the limitation is stronger research behavior than silent hope.

### 4.8.2 Worked BLAS rebuild lifecycle (from public docs)

A concrete ownership loop, reconstructed only from documented APIs:[^ra-docs][^lua-api]

1. Author places or moves a mesh in the terminal hierarchy (or Lua calls `set_object_position`).
2. Vertices are world-space relevant; moves that ignore `originalVertices` snapshot risk float drift (pitfall table).
3. Per-object BLAS rebuild (`buildObjectBLAS` / related) updates the moved object’s acceleration structure.
4. TLAS rebuild incorporates instances (identity transforms under the bake discipline).
5. Next frame’s raygen sees the new world; Lua continues `update(dt)`.

Game authors inherit graphics cost through the soft membrane: **moving a platform is not free**. Level density becomes an economic decision, not only an aesthetic one.

### 4.8.3 Lighting calibration as theatrical discipline

Docs prescribe inverse-square attenuation and calibration advice: start low; intensity 10 fully illuminates within ~3 metres; `influenceRadius = sqrt(light.intensity * 1000.0)` culls distant lights.[^ra-docs] Combined with McCandless-informed theatrical language and the preferred vivid default when ACES/Gamma are off, Ra teaches that **physical falloff is necessary but not sufficient**—taste still chooses the theatrical image.

### 4.8.4 Expanded F-key editor map (public)

| Key | Role |
| --- | --- |
| F1 | Console View — stdout/stderr ring buffer, ANSI-stripped then recolored |
| F2 | Video settings — ACES, Gamma, GI samples, fog, reflections |
| F3 | Scene hierarchy — groups, add object/light submenus, grab, snap |
| F4 | Fly mode — WASD, Space/C, Q/E roll, Shift 2× |

HierarchyView’s constructor even takes `keyRepeatDelay` and `keyRepeatRate`—the same *family* of motor-control parameters Ablockalypse exposes to players, here aimed at editor operators.[^ra-docs][^input-h]



Engine gravity is documented as **−18.0 m/s²**. Launch Up documents **coyote time 0.15s** and **100 pts/metre** height scoring.[^ra-docs][^lua-api] These numbers are feel commitments published as facts.

## 4.9 Production use and commercial identity

Ra is actively used to develop Laser Tag and Launch Up.[^steam-ra][^ra-docs] Steam Early Access states a 6–12 month EA window, permanent **$49.99/seat** pricing (not introductory), and one seat unlocking editing across Digiflux titles.[^steam-ra] Three build targets are named: Ra Engine (editor), Digiflux runner (game), and dev/validation.

Revenue share terms appear on docs: 2% annually over $100K, 1% annually over $1M, resetting each year, terms permanent.[^ra-docs]

Chapter 6 treats the market design; here the relevant architectural point is that **the engine’s commercial wrapper is part of the pipeline**—not an afterthought bolted on by a publisher relations team that never read `CameraUBO`.

## 4.10 Critical pitfalls as knowledge crystals


### 4.9.1 Commercial copy drift (price)

Steam Early Access text for Ra Engine states a permanent **$49.99/seat** price and explicitly denies introductory discounting.[^steam-ra] Digiflux documentation has also been observed, in at least one Draft 1.1 fetch window, to mention a **$250/seat** figure in footer/commercial language.[^expansion-pack] This dissertation treats **Steam as the storefront of record for commercial claims** and records the docs appearance as **COPY DRIFT**—not silently averaged, not invented away. Author revision should reconcile or explain the mismatch.



The docs’ pitfall table is a practice-based research goldmine:[^ra-docs]

| Pitfall | Symptom | Fix |
| --- | --- | --- |
| Using `gl_ObjectToWorldEXT` | Unnecessary / wrong mental model | World-space baked vertices |
| Register SceneObject after BLAS build | Missing from TLAS | Register first |
| CameraUBO field mismatch | Silent wrong GPU values | Lock field order |
| Light node via extensions map | Lights not loading | Use `node.light` |
| GLFW char callback + locked cursor | Dropped text | `keyToChar` path |
| GGX roughness 0 | NaNs | Clamp alpha |
| Move via delta without snapshot | Float drift | Snapshot `originalVertices` |
| RADV `primitiveOffset` | Wrong indexing | Per-object buffers, offset 0 |

Schön’s “situation’s back-talk” is literally tabulated here.[^schon-1983] The practitioner did not merely solve bugs; they promoted them into communal memory.

## 4.11 Chapter claim

**Claim C4:** Ra Engine demonstrates that a solo/micro-studio can own a hardware RT pipeline deeply enough to publish operator-grade knowledge (AS strategy, UBO treaties, vendor quirks, terminal-first HCI, Lua hot-reload state policy) while shipping real games on that pipeline. The knowledge product is not only the binary; it is the disciplined public documentation of constraints.

> **Practitioner note / open for author expansion:** Recount one concrete lighting or AS debugging night that changed a docs pitfall row—what the image looked like wrong, what the wrong mental model was, what corrected it. Keep it technical and dated if possible.

---


## 4.12 Object groups, grab mode, and scene hygiene

Ra’s hierarchy supports named groups via `ra_group` extras. Enter selects a group header; subsequent edits apply to members; Alt+G grabs whole groups; the scene name turns red on unsaved changes.[^ra-docs] These are small features with large pipeline consequences: authors can think in assemblies, not only primitives, without leaving the terminal grammar.

Grab mode (`~`) and snap-to-ground (G) encode physical intuition into editor verbs. Snap uses Möller–Trumbore raycast from the bottom face—another case where a classic graphics algorithm becomes a daily authoring keystroke rather than an interview question.

## 4.13 Three build targets as product architecture

Steam EA lists three build targets: Ra Engine (editor), Digiflux runner (game), and dev/validation.[^steam-ra] Splitting editor from runner is an ownership classic: players should not pay complexity taxes; developers should not lose tools. Validation builds make truth-seeking a first-class artifact rather than a local hack.

## 4.14 Ambient sky and miss shader authorship

Lua can set ambient sky top and horizon colors consumed by `miss.rmiss`.[^lua-api] That means mood direction lives in script while miss shading remains a renderer responsibility—another handshake. Night purple vs sunset orange becomes a level-author verb without shader recompile.

## 4.15 Tags, props, and standalone game objects

Beyond meshes, Ra documents tagged mesh objects (`ra_tag`, `ra_props`) and standalone game objects (`ra_type=game_object`) with separate ID spaces.[^lua-api] This is entity design growing inside an RT scene editor rather than bolted on from a general ECS product. Hitscan via `cast_ray` further shows gameplay queries sharing the same geometric truth as rendering—an Owned Pipelines ideal that many hybrid engines only approximate.

Known limitation documented: hidden objects may still collide physically—visibility and collision not yet unified.[^lua-api] Publishing the limitation is stronger research behavior than silently hoping nobody notices.

## 4.16 What Ra refuses

Every engine is defined by refusals:

- Refuses raster fallback
- Refuses ImGui-over-viewport as default editor philosophy
- Refuses silent MangoHUD coexistence
- Refuses unordered UBO drift
- Refuses (for now) pretending GLB is done if EA says it is still upcoming
- Refuses per-title editor SKU fragmentation via one-seat catalog bet

Refusals are teachable. They are also costly. This dissertation does not claim the refusals are universally correct—only that they are coherent and documented.


## 4.17 Systems maturation notes (public docs window into 2026)

Live Ra documentation in the expansion window notes ongoing systems work (moving platforms, undo stack, light gizmos, third-person camera paths, per-object collision work, horizontal mesh collision, ray visibility masks, game objects, tags) as the engine continues to serve Digiflux titles.[^ra-docs][^expansion-pack] This monograph does not treat every in-flight system as finished research; it treats the **public naming of unfinished systems** as part of Early Access honesty.

Draft 1.2 source pack further lists named maturation items from richer digiflux fetches: moving platforms (`groundObjectId` + anchor); undo stack (~25-slot deque); light helper gizmos (F6) with `RAY_MASK_HELPER`; third-person camera (V); per-object collision (Alt+C / `ra_collision`); horizontal mesh collision; standalone game objects + tags; ambient sky UBO tail; F5 hot-reload scene.[^draft12-pack] Each named incomplete system is a **research promissory note** the public record can later audit—preferable to silent roadmap fog.





## 4.18 Worked example: recursive ray order as taste-under-budget

Public docs prescribe a recursive order per primary ray: reflections first (mirror/glossy; shadow rays depth-gated at bounce ≤ 1), then refractions (enter/exit pairs via `fromRefraction`, suppressing reflection spawning inside refraction chains), then GI (single bounce; Off/1/2/4 samples; `fromGI` skips shadow rays on GI hits; 2× Monte Carlo scale).[^ra-docs]

Read slowly as practice knowledge:

1. **Order is politics.** Putting reflections before refractions before GI encodes which visual promises the product refuses to drop first when the frame budget screams.
2. **Flags are compressed design docs.** `fromGI` and `fromRefraction` are not merely optimizer tricks; they are written permissions to bias the image in named ways.
3. **Crosshair-after-tonemap** in raygen collapses “game HUD” and “renderer” into one image contract—the same philosophical family as terminal-first refusal of ImGui fog over the viewport.

A rented pipeline might bury equivalent decisions in closed denoiser presets. Ra’s public order lets another practitioner disagree *specifically*.

## 4.19 Expanded pitfall commentary (knowledge crystals, revisited)

Each pitfall row is a transferable micro-essay:[^ra-docs]

| Pitfall | Deeper reading |
| --- | --- |
| `gl_ObjectToWorldEXT` unused | World-bake discipline means a “normal” RT tutorial habit becomes a footgun; docs must unteach. |
| Register after `buildAllBLASes` | Lifetime/order bugs are ownership taxes; frameworks hide them, solo pipelines must name them. |
| CameraUBO mismatch | Silent corruption is worse than crash; documentation must amplify mute back-talk. |
| Light via extensions map | TinyGLTF’s `node.light` vs raw JSON path is interoperability archaeology. |
| GLFW char callback + locked cursor | HCI meets OS reality; fly-mode exclusivity breaks text entry assumptions. |
| GGX roughness 0 → NaN | Perfect mirrors are numerical weapons; clamp is theatrical hygiene. |
| Delta moves without snapshot | Float drift as product aesthetics (“cursed scenes”). |
| RADV `primitiveOffset` ignored | Cross-vendor RT is not a slide; it is a dedicated buffer strategy. |

Schön’s reflective practitioner is often narrated as memoir. Here it is **tabular**. Candy’s research-through-making frame supports treating that table as outcome, not appendix detritus.[^schon-1983][^candy-2019]




## 4.20 Ambient sky floats and miss-shader authorship

When CameraUBO grows ambient-sky top/horizon RGB fields and Lua exposes `set_ambient_color`, mood direction becomes a scriptable treaty rather than a buried shader edit.[^lua-api][^ra-docs] Night purple versus sunset orange can ship as level authoring without SPIR-V recompile—another soft-membrane win. Documentation drift from 24 to ~30 fields is the fossil of that feature landing.




## 4.21 McCandless operationalization (beyond branding)

Ra documentation markets “theatrical-quality lighting informed by McCandless theory.”[^ra-docs][^mccandless] Draft 1.2 asks what that means *operationally* in a Vulkan RT pipeline—without inventing an automatic three-point rig that the docs do not claim.

Stanley McCandless’s classic stage method organizes light for visibility, modeling (form), and composition—not for filmic highlight roll-off as a default metaphysics. Ra’s public stack maps that stance into concrete knobs:

1. **Inverse-square attenuation as discipline** — `illuminance = intensity / distance²`; start low; intensity 10 ≈ full illumination within ~3 m.[^ra-docs] Theatrical intention without calibration becomes white-out; physics without intention becomes muddy neutrality.
2. **Influence-radius culling** — `sqrt(intensity * 1000.0)` skips distant lights without shadow rays—computational composition of the light plot.
3. **ACES Off + Gamma Off preferred default** — vivid linear theatrical look documented as preferred when both are off; filmic S-curve available but not obligatory.[^ra-docs]
4. **Emissive GI as stage glow** — cyan platforms and crystal materials in Launch Up’s public art direction cast bounce light; Lua `set_object_emissive` makes glow an authoring verb.[^launchup-manual][^lua-api]
5. **Ambient sky top/horizon** — `set_ambient_color` → `miss.rmiss` treats the void as a light plot choice (night purple vs sunset orange), not only a clear-color clear.[^lua-api]
6. **Photography adjacency** — stevenphilley.com sequences of orchard light and coastal weather externalize the same attention to color temperature outside the GPU (Ch8).[^photo]

McCandless here is **not** a checkbox feature named `EnableMcCandless()`. It is a theory commitment that biases defaults, calibration advice, and refusal of “filmic everything.” Interlude B.5’s filmic-vs-stage fork is the philosophical twin of this operational list.

Hub marketing line (near-quote): “Theatrical-quality lighting informed by McCandless theory. … Inverse-square attenuation, calibrated intensities.”[^ra-docs][^draft12-pack] Operationalization list above is the translation of that line into knobs. **Explicit denial:** public docs do **not** ship an automatic three-point McCandless preset.

### Cross-read: Launch Up Manual Ch08 as McCandless-adjacent player literacy

Manual Chapter 08 teaches players that cyan emissive platforms cast real bounce light, that F2 GI samples (Off/1/2/4) and reflections are tunable, that ACES off is the studio-recommended vivid default, and that exponential depth fog shapes vertical shafts.[^launchup-manual] That is McCandless-informed *taste distribution*: the same theatrical preferences encoded in CameraUBO flags are explained to players as performance/look choices. Ownership means the lighting theory does not stop at the artist’s desk—it reaches the F2 menu and the manual.



## 4.22 Full F-key / editor pedagogy (operator curriculum)

Terminal-first UI is often summarized as “no ImGui.” Draft 1.2 reads the F-key map as a **curriculum**—what an operator must learn to author RT scenes without overlay cities.[^ra-docs]

### F1 — Console View as trust surface
A 500-line ring buffer captures stdout/stderr; ANSI stripped for storage then recolored by line type; real terminal still receives original coloured output via tee streambuf; `ConsoleView::render()` writes via `origCout_` to avoid recursive capture.[^ra-docs] Pedagogy: logging is part of the instrument, not a side channel. Scroll keys (↑↓, PgUp/PgDn, Home/End) teach operators to *read* the engine while looking at it.

### F2 — Video settings as taste under budget
ACES, Gamma, GI samples (Off/1/2/4), fog, reflections—the same knobs Launch Up’s manual tells players to lower on weaker hardware.[^launchup-manual] Pedagogy: theatrical image quality is a **negotiated economy**, not a fixed screenshot lie.

### F3 — Hierarchy as assembly thinking
Groups (`ra_group`), Enter-to-select-header, Alt+G group grab, `~` grab, G snap-to-ground (Möller–Trumbore from bottom face), KP+/KP* add submenus, Alt+D delete with GPU buffer rebuild, red unsaved scene name.[^ra-docs] Pedagogy: scenes are assemblies; invalidation is visible; save hygiene is chromatic.

`HierarchyView` constructor order—scene manager, lights, flags, callbacks (delete/add/save/TLAS rebuild/snap/material), materials pointer, **keyRepeatDelay / keyRepeatRate**—fossils the claim that motor control and acceleration-structure invalidation belong in one type signature.[^ra-docs]

### F4 — Fly mode as embodied camera
WASD, Space/C, Q/E roll, Shift 2×; view matrix must use `cameraUp` or roll never reaches the GPU.[^ra-docs] Pedagogy: the camera is a body; roll is real; hardcoded world-up is a lie.

### GLFW / X11 text-input pitfall as HCI exam
`glfwSetCharCallback` silent under `GLFW_CURSOR_DISABLED`; `keyToChar()` in keyCallback is mandatory.[^ra-docs] Pedagogy: OS grain beats GUI assumptions—same family of lesson as RADV’s silent `primitiveOffset` ignore.

## 4.23 BLAS rebuild lifecycle (narrative form)

Section 4.8.2 listed steps; Draft 1.2 narrates the lifecycle as a day-in-the-life of a moving hazard:[^ra-docs][^lua-api]

1. **Authoring** — GLTF node named `platform_hazard_03` loads; `SceneObject` registered; `buildAllBLASes()` / `buildTLAS()` establish identity instances over world-baked vertices.
2. **Play** — Lua `init()` discovers hazards via `find_objects_by_prefix("platform_hazard_")`.
3. **Motion** — each `update(dt)`, `set_object_rotation` / `set_object_position` / breathe-scale runs; docs warn moving objects trigger per-object BLAS and TLAS rebuild work.
4. **Discipline** — moves that ignore `originalVertices` snapshot accumulate float drift (pitfall); `get_object_rest_center` exposes load-time centroid for pivot-true placement across hot-reloads.
5. **Teardown / full rebuild** — `destroyAllBLASes()` before full rebuild or shutdown; registration-after-build remains a silent missing-object failure mode.

Ownership lesson: **feelful motion is graphics work**. Level density, spinner counts, and emissive pulses are frame-budget politics the soft membrane cannot hide.

## 4.24 SPIR-V shader roles (public file map)

| File | Stage | Role in the owned image |
| --- | --- | --- |
| `raygen.rgen` → `raygen_rgen.spv` | Ray generation | Active pipeline; primary rays; post-`imageStore` tonemap + crosshair |
| `raygen_aa.rgen` | Ray generation | Kept in sync; **not** compiled into active pipeline |
| `closesthit.rchit` | Closest hit | Material eval; light culling; GI/reflection/refraction dispatch; UBO layout sync fields |
| `miss.rmiss` | Miss | Sky / environment; ambient-sky floats from UBO / Lua |

Compile ritual: `./compile_shaders.sh` after any `.rchit` / `.rgen` / `.rmiss` / `.rint` change; C++ Makefile does **not** auto-detect shader edits.[^ra-docs] That separation is culture: shaders are a first-class product surface with their own build gate—another Owned Pipelines handshake.

*Ray Tracing Gems* and *Real-Time Rendering* supply the literacy baseline for why per-stage responsibilities matter;[^rt-gems][^rtr] Ra’s public map makes those responsibilities **named files in a small studio**, not only chapter headings in a textbook.

## 4.25 Linux / RADV / Arc platform notes as research surface

Public docs and Steam requirements jointly sketch a multi-vendor RT desk:[^ra-docs][^steam-ra]

| Platform note | Practice content |
| --- | --- |
| Fedora Linux first | Dev ontology, not portability afterthought |
| Vulkan 1.4 / `VK_KHR_ray_tracing_pipeline` | Hard requirement; no raster fallback |
| NVIDIA RTX 3060 docs primary / 2060-class Steam floor | Desk vs market tiers (DR7) |
| AMD RX 6600 + RADV | `primitiveOffset` silently ignored → per-object `HOST_VISIBLE` index buffers, offset 0 |
| Intel Arc A380 + Mesa ANV | Explicit validation claim |
| MangoHUD | Segfault on Vulkan teardown → `--no-mango` always |
| X11 + GLFW cursor lock | Char callback failure → `keyToChar` |
| Validation | `--validate` / `VK_LAYER_KHRONOS_validation` as truth-seeking build |

Cross-vendor RT is often a slide. Here it is a **buffer strategy and a launcher flag**. That densifies Claim C4.

---

# Chapter 5. Feel Systems & Shipping: Ablockalypse and the Craft of Competitive Input

If Ra Engine is ownership of light and structure, Ablockalypse is ownership of *touch*. Public materials describe a competitive tetromino game with a custom SDL engine, shipped on Steam and itch.io (Windows/Linux), emphasizing fluid competitive play.[^cic-home][^itch-ablock][^linkedin-gdc]

## 5.1 Why a custom SDL engine for tetrominoes?

Genre familiarity can trick makers into underestimating systems depth. Competitive piece-drop games are input instruments. Timing, repeat rates, wall kicks, board geometry, and gamepad equivalence dominate player judgment. A custom SDL engine makes those parameters first-class rather than fighting a general engine’s UI-first update loop.

Public feature pillars:[^cic-home]

- Multiple input support (keyboard and gamepad)
- Dynamic playing area (configurable board size)
- Competitive design orientation
- Configurable controls: adjust **input delay and repeat rates**
- Wall kick system
- Block editor
- Audio/visual presentation aimed at sustained sessions

itch.io tags reinforce: custom-engine, sdl, tetromino; builds published for Linux and Windows development packages.[^itch-ablock]

## 5.2 Feel as a designed object

Swink’s *Game Feel* treats sensation as something that can be authored, tuned, and broken.[^swink] Ablockalypse’s public commitment to configurable delay/repeat (DAS/ARR-like) is exactly that authorship. Competitive communities historically care about Delayed Auto Shift and Auto Repeat Rate families of parameters; exposing delay/repeat configuration signals respect for that literacy even when marketing copy uses plain language.

Wall kicks are likewise not a checkbox—they are a legality grammar for rotations near collision. Shipping a wall kick system means choosing a rules family and living with its edge cases.

> **Practitioner note / open for author expansion:** Document the exact delay/repeat model, default values, wall-kick table lineage (which classic rules inspired it), and how playtests changed them. Cite your own notes or commits if available; do not invent numbers here.

## 5.3 Dynamic boards and the block editor

Dynamic playing area and a block editor extend the game from “a fixed official instrument” toward “a tunable competitive toolkit.” That resonates with Owned Pipelines: the maker owns not only the runtime but the authoring of pieces and spatial constraints. Esports-facing rhetoric on the CIC site (“built from the ground up for competitive play and esports”) should be read as design intention; this draft does not invent tournament metrics.[^cic-home]

## 5.4 Shipping as research method

LinkedIn-public writing places Ablockalypse in a GDC visit narrative: a backend-leaning engineer exploring games, releasing a tetris-inspired Steam Early Access title on a custom C++/SDL2 engine.[^linkedin-gdc] That public sentence matters methodologically. Shipping is when feel claims meet strangers. Practice-based research without shipping risks becoming private aesthetics.

Roadmap items publicly listed for Ablockalypse (Simplified Chinese support, Career Mode, Adventure Mode, Match-3 style mode, two-player head to head, enhanced VFX) show iterative product thinking without requiring us to treat the roadmap as completed work.[^cic-ablock-features]

## 5.5 Cross-talk with Ra

Ablockalypse and Ra look unrelated—2D SDL puzzle vs Vulkan RT platform/shooter tools. The Owned Pipelines reading sees kinship:

- Both refuse to outsource the layer that defines identity (input feel; RT image).
- Both publish enough parameter truth for others to understand the instrument.
- Both exist inside the same studio economics: Color It Company as independent media & games in Campbell, CA.[^cic-home]

## 5.6 Dual-channel release (Steam + itch)

Publishing on Steam and itch.io, with Linux and Windows builds on itch, mirrors a distribution ownership instinct: do not pin a competitive instrument to a single storefront culture.[^itch-ablock][^cic-home] itch’s name-your-own-price posture versus Steam’s EA commercial posture can coexist as channels with different social contracts. This draft records the dual presence without inventing sales splits.

## 5.7 Chapter claim

**Claim C5:** Competitive feel systems are a first-class research site for practice-based computing knowledge. Ablockalypse’s custom SDL stack and public emphasis on wall kicks, configurable delay/repeat, dynamic boards, and gamepad parity exemplify ownership of the input-performance loop—the haptic cousin of Ra’s CameraUBO treaty.


---


## 5.8 Public source architecture (`electrosy/sdl2-blocks`)

The GitHub repository `electrosy/sdl2-blocks` is a rare gift for practice-based research: a shipped Steam title whose custom engine structure is publicly browsable.[^sdl2-blocks] README authorship names **Steven Philley**; the tagline calls it a “Block Falling & Locking Game.”[^sdl2-readme]

### Top-level layout (VERIFIED)

| Path | Role |
| --- | --- |
| `sdl2-blocks.cpp` | Entry |
| `makefile` | g++ `gnu++1z`; links SDL2, SDL2_image, SDL2_ttf, SDL2_mixer |
| `inc/` + `src/` | Headers / implementations |
| `inc/State/` + `src/State/` | State machine (Intro, Menu, Play, Pause, Options, KeyboardOptions, LanguageOptions, BlockEditor, HighScores, Credits, GameOver, …) |
| `inc/UI/` + `src/UI/` | UIElement, UIMenu, UIWidget, TextEntry, UI_Tile |
| `inc/gfx/` + `src/gfx/` | Video, Font, Renderable(s) |
| `Input.*`, `Timer.*`, `Command.*`, `Board.*`, `Block.*`, `GameModel.*`, `GameController.*`, `LanguageModel.*`, `ConfigIO.*`, `Audio.*` | Feel / model / I/O |
| `keyboard-config*.csv`, `gamepad-config*.csv`, `blocks*.csv` | Data-driven bindings and piece definitions |
| `assets/lang/en.csv`, `es.csv` | Localization |
| `releasenotes.txt` | Versioned feel/feature changelog |
| `.github/workflows/` | CI build workflows |

**Namespace:** `ley::` throughout—an owned vocabulary for commands, timers, and states.

### Why this structure is research evidence

Fragmented Unity projects often bury feel inside opaque Update loops and plugin stacks. Here the feel-bearing types are *named*: `Input`, `Timer`, `Command`, `Board`, `Block`, and a explicit state machine folder. Ownership shows up as **type geography**.

## 5.9 Delay/repeat defaults (now citable)

Public header `inc/Input.h` defines:[^input-h][^expansion-pack]

| Constant | Value | Role |
| --- | --- | --- |
| `KEY_DELAY_TIME_DEFAULT` | **180** | Initial delay before auto-repeat (DAS-like) |
| `KEY_REPEAT_TIME_DEFAULT` | **45** | Subsequent repeat period (ARR-like) |

`InputPressed` owns two `ley::Timer` objects (delay + repeat). Bindings use `std::multimap` of scancode+context → (modifiers, Command), with a separate pad-bindings map. Header copyright dating includes **Feb/14/2020**, indicating engine work predating Steam Early Access (2021-07-16).[^input-h][^steam-ablock]

These numbers fill the Draft 1.0 “do not invent DAS” gap **from public source**, not from recollection. Players can still retune delay/repeat in options; releasenotes show gamepad parity with keyboard delay/repeat as of 0.6.5.4.[^ablock-releasenotes]

### Swink-style framing without fake esports metrics

Steve Swink’s *Game Feel* treats interactive sensation as a designed object.[^swink] Ablockalypse’s public instrument exposes the knobs Swink would recognize—delay, repeat, wall kicks, board geometry—while this dissertation **refuses** to invent tournament DAS charts or percentile clear times. The research claim is architectural: **feel parameters are first-class, data-driven, and versioned**.

Katie Salen and Eric Zimmerman’s *Rules of Play* likewise frames games as rule systems players inhabit;[^salen-zimmerman] Juul’s *Half-Real* reminds us that rules and fiction co-constitute play.[^juul] Ablockalypse’s board-size options and block editor shift the *rules instrument* toward player/author reconfiguration without requiring a mythic “genre revolution” narrative.

## 5.10 Blog × source concordance (2025 input essay)

The 2025-04-07 development-log post “My input system for Ablockalypse” describes, in first person, a multimap of scancode+modifier → command; dual timers per key; skipping SDL key-repeat events (`if (!event.key.repeat)`); and a pipeline `pollEvents` → command queue → `processCommands` / state-machine update.[^blog-input]

That narrative **matches** the public source architecture. Practice-based method gains a triangulation: SELF-STATED process writing ↔ VERIFIED repository ↔ Steam feature surface (configurable delay/repeat, controller support).

Default keyboard CSV bindings publicly include movement (`LEFT`/`RIGHT`/`DOWN`), rotations (`R` clockwise, `E`/`UP` counter-clockwise), `SPACE` drop, volume on `-`/`=`, and debug commands—evidence that the shipped instrument is also a developer instrument.[^kbd-csv]

## 5.11 Releasenotes as reflective practice log

`releasenotes.txt` is a Schönian archive in miniature:[^ablock-releasenotes][^schon-1983]

| Version | Public notes (compressed) |
| --- | --- |
| 0.7.1 | Remap keyboard/gamepad in UI; start-level option; wall-kick fix (CCW-only bug) |
| 0.7.0.6 | Quick-drop cooldown; gamepad remap via file; levels up to 31 with 10ms gravity |
| 0.7.0.3 | Block editor; Y-axis alignment for piece entry |
| 0.6.7.0 | Wallkick and wallkick options |
| 0.6.5.4 | Gamepad uses same delay/repeat as keyboard; guide-grid colors; localization of Board Size / Input Delay / Input Repeat / Guide Grid labels |
| 0.6.3.04 | Spanish language selection |

Feel evolution is **dated**. Wall kicks arrive, then break for one rotation direction, then get fixed—the situation’s back-talk made into a changelog row.

The 0.7.0.4 line “Removed the cats.” (alongside new textures/logo/menu) is not fluff—it is reflective practice voice surviving in a shipping log: aesthetic commitments enter and exit the product with version stamps.[^ablock-releasenotes][^draft12-pack] Candy’s research-through-making frame treats such entries as evaluation traces, not only jokes.[^candy-2019]


## 5.12 Localization as shipping craft

The 2025-02-28 “Localization” post describes CSV key/value files under `./assets/lang/`, a `LanguageModel::loadLanguageData` loader, and `getWord` with padding, justification, and capitalization modes; Spanish completed in options; Steam SDK auto-language and Simplified Chinese named as next intents.[^blog-localization]

Steam store languages for app **1674300** list English plus Spanish (Spain) and Spanish (Latin America).[^steam-ablock] Whether Steam SDK auto-detect and Simplified Chinese have fully shipped remains a **GAP** for author confirmation; the *intent trail* is public.

## 5.13 Custom license as ownership artifact

The **Ablockalypse Source Code License** (copyright Steven Philley **2025**) grants viewing/learning and local non-commercial compile/run, welcomes PRs, and restricts commercial use, derivatives, and redistribution outside the original repository unless a commercial license is negotiated via `steven@coloritcompany.com`.[^sdl2-license] CONTRIBUTING.md requires contributors to grant Philley a perpetual license (optional CLA).[^sdl2-contributing]

Contrast: Ra Engine ships as a commercial Steam seat with public *docs* but not a public engine source tree in this inventory. Ablockalypse publishes source under a *custom* license rather than MIT/Apache default. Both are ownership postures; they are not the same posture.

License text further marks “AS IS” disclaimer, rights reserved, and that terms are “subject to change with future releases”—a living legal membrane parallel to living docs.[^sdl2-license][^draft12-pack] Practice-based reading: ownership is not only renderer control; it is **license craft** that keeps learning access open while reserving commercial derivatives for negotiated consent.


## 5.14 Steam shipping surface (App 1674300)

Verified storefront facts:[^steam-ablock][^expansion-pack]

- Early Access release **2021-07-16**; developer/publisher Color It Company
- Price **$4.99**; Windows + Linux; full controller support
- Custom-engine marketing (“No input lag, no jank”); adjustable board size; combos; Grid Guide; nine EA levels
- **AI Generated Content Disclosure:** Adobe Firefly used for store marketing banners and the game title logo
- EA text has stated a likely Early Access period “until the end of 2025,” with Simplified Chinese among possible full-version languages

**Honesty surface for 2026 readers:** if the title remains in Early Access after a publicly suggested end-2025 horizon, that slip is itself part of the public record—an accountability fact, not a reason to invent completion metrics.

Anna Anthropy’s *Rise of the Videogame Zinesters* frames small-tool, author-owned game making as cultural practice;[^anthropy] Ablockalypse’s dual Steam+itch presence and public source reading room fit that lineage without requiring zinester cosplay.




## 5.15 Board, blocks.csv, and the block editor as instruments

Public `Board` concepts (dynamic `setSize`; default conceptual width on the order of 10 with height 20 + buffer; scoring constants) and CSV piece definitions (`blocks-default.csv` / `blocks.csv`) show the tetromino instrument as **data-addressable**.[^expansion-pack][^sdl2-blocks] Releasenotes credit a Block Editor state and Y-axis alignment fixes when pieces enter play—evidence that authoring tools and runtime feel co-evolve in one repo.[^ablock-releasenotes]

Steam marketing’s adjustable board size and Grid Guide are not orphan features; they map onto options labels that localization files also carry (board size help text mentioning ranges such as 8×8 through larger boards appears in lang assets per expansion pack inspection).[^expansion-pack][^steam-ablock]

## 5.16 Command vocabulary as shared language

Default keyboard CSV commands include not only `left`/`right`/`down`/`drop`/`clockwise`/`cclockwise`, but volume, transparency, console, pause, fullscreen, and a ring of debug commands (`debugclear`, `debugfill`, `debugnextlevel`, …).[^kbd-csv] The instrument is simultaneously a player-facing competitive tool and a developer-facing probe. Owned Pipelines predicts that double duty: when the same hands ship and debug, command enums become a studio dialect.

Gamepad config CSVs and releasenotes’ gamepad remap / delay-repeat parity work show the same dialect extended to controllers—full controller support on Steam is then a storefront truth with a repository genealogy.[^steam-ablock][^ablock-releasenotes]

`inc/Command.h`’s `enum class Command` spans movement, rotate CW/CCW, drop, pause, volume/transparency, debug*, UI_*, fullscreen, and more—evidence of **one vocabulary** across play, block editor, and UI states.[^sdl2-blocks][^draft12-pack] Localization then translates *labels* for that vocabulary; it does not fork the command ontology. Feel research implication: internationalization sits beside the instrument rather than rewriting it.


## 5.17 CI and `ship-it.sh` as distribution craft

The repository includes GitHub Actions workflows and a `ship-it.sh` script at top level—signals that shipping is automated enough to leave traces, even if this monograph does not reverse-engineer private secrets from those files.[^sdl2-blocks] Combined with itch.io and Steam dual-channel presence, Ablockalypse demonstrates small-studio release engineering as part of feel research: an untuned build cannot answer feel questions for strangers.

## 5.18 What Chapter 5 still will not invent

Still open for Steven (checklist residue): wall-kick *historical lineage naming* relative to guideline/SRS systems (algorithm now walked from public source in §5.21); exact determinism/RNG policy for competitive integrity; player-visible exploit list; whether Steam SDK language auto-select shipped. Draft 1.2’s advance: **defaults 180/45**, `ley::` geography, wall-kick code walk, localization CSV craft, and Firefly disclosure ethics are no longer missing.




## 5.19 Gravity ladder and start-level options (releasenotes)

Public releasenotes record levels extending to **31** with a **10ms gravity** step in the 0.7.0.6 line, plus UI remapping and start-level selection in 0.7.1.[^ablock-releasenotes] Those notes matter because they show competitive difficulty as a **versioned schedule**, not a single mystic curve. Players who enable wall kicks, retune delay/repeat away from 180/45, and pick a start level are co-authors of the instrument’s momentary rule set—within bounds the studio still owns.

Steam’s “first 9 levels” Early Access framing and the later 31-level note can coexist as staged content growth; cite releasenotes for the higher ladder and storefront text for the EA packaging claim without inventing which build a given customer owns today.[^steam-ablock][^ablock-releasenotes]




## 5.19b MVC intent and game-loop phases (public)

Entry `sdl2-blocks.cpp` states an intentional MVC philosophy: `GameModel` (Model), `Video` (View), `GameController` (Controller); `main` wires model → video → controller → `runGameLoop()`.[^sdl2-blocks][^draft12-pack]

`GameController.cpp:35–126` orders each frame: frameStart → **RENDER** (board in Play/Pause/GameOver; stateMachine.render; top layer) → **PRESENT** → **GET INPUT** (`pollEvents` → command queue) → pop one command → **INPUT PROCESSING** (`processCommands`; stateMachine.update; `processStates`) → **CLEAR** → **LOCK FRAME RATE**. Feel research lesson: input is a named phase with its own timers, not an anonymous `Update()` side effect.

---

## 5.20 `ley::` architecture walk (file-referenced)

Draft 1.2 walks the public `electrosy/sdl2-blocks` tree as a **geography of ownership**—namespace `ley::` throughout.[^sdl2-blocks]

| Concern | Public loci | Why it matters |
| --- | --- | --- |
| Entry / build | `sdl2-blocks.cpp`, `makefile` (`gnu++1z`, SDL2 + image/ttf/mixer) | Minimal, readable stack |
| Feel timers | `inc/Input.h` (`KEY_DELAY_TIME_DEFAULT=180`, `KEY_REPEAT_TIME_DEFAULT=45`), `InputPressed` dual `ley::Timer`, `src/Input.cpp` | DAS/ARR-like instrument |
| Commands | `Command.*`, keyboard/gamepad CSV configs | Shared dialect for player + debug |
| Model | `GameModel.*`, `Board.*`, `Block.*` | Rules + geometry |
| Wall kicks | `GameModel::rotateWithKick` in `src/GameModel.cpp`; `mWallKickOn` default **true**; options UI + `ConfigIO` `wallkickon` | Feel legality as toggleable grammar |
| States | `inc/State/*` — Intro, Menu, Play, Pause, Options, KeyboardOptions, LanguageOptions, BlockEditor, HighScores, Credits, GameOver… | Explicit mode machine |
| Localization | `LanguageModel.*`, `assets/lang/en.csv`, `es.csv` (~55 keys each) | Shipping craft |
| Reflection log | `releasenotes.txt` | Versioned research diary |
| Distribution | `.github/workflows/`, `ship-it.sh`, Steam 1674300, itch | Dual-channel release |

Type geography is the argument: feel is not an orphan `Update()`; it has headers.

## 5.21 Wall-kick code walk (public `rotateWithKick`) — file:line cites

Local clone path: `/workspace/dissertation/vendor/sdl2-blocks` (shallow mirror of `electrosy/sdl2-blocks`).[^sdl2-blocks][^draft12-pack]

### Call sites and flags

| Concern | Path:lines (vendor clone) |
| --- | --- |
| Default ON | `inc/GameModel.h:98` — `bool mWallKickOn = true;` |
| API | `inc/GameModel.h:181–184` — `rotateWithKick` / get/set |
| Core algorithm | `src/GameModel.cpp:153–207` — `GameModel::rotateWithKick` |
| Soft probe | `src/GameModel.cpp:209–237` — `rotateBlock` / `canRotate` |
| Play dispatch | `src/State/PlayState.cpp:34–63` — CW/CCW both gated by `getWallKickOn()` |
| Options commit | `src/State/OptionMenuState.cpp` ~`commitWallKickOn` |
| Persist | `src/ConfigIO.cpp:29,60` — key `wallkickon` on/off |
| Introduced / fixed | `releasenotes.txt` 0.6.7.0; 0.7.1 CCW-only bug fix |

### PlayState gate (both directions)

In `PlayState.cpp:34–63`, `Command::cclockwise` and `Command::clockwise` each branch: if `getWallKickOn()` then `rotateWithKick(false|true)`; else plain `rotateBlock(...).first`; on success play `sfx::swoosh`. Releasenotes 0.7.1’s “CCW-only” bug is intelligible only because **both** branches exist in the public dispatch.[^ablock-releasenotes]

### Algorithm (`GameModel.cpp:153–207`)

1. `kick = 0`; `MAX_KICK = min(boardWidth/2, BLOCK_SIZE)` (`:158–159`).
2. `result = rotateBlock(r)` (`:161`).
3. If `!mActiveBlock.getCanRotate()` return (`:170–172`) — single-orientation pieces short-circuit.
4. While `!result.first` and kick within ±`MAX_KICK` (`:174`):
   - If `result.second` is `"block"` or `"board_bottom"` → **abort** (`:179–180`) — kicks address **side** collisions, not floor/stack jams.
   - Else if piece `x < boardWidth/2` and `kick >= 0` → `kick += 1`; `moveBlock(Command::right)`; log `"Kick right"` (`:188–191`).
   - Else if `x >= boardWidth/2` and `kick <= 0` → `kick -= 1`; `moveBlock(Command::left)`; log `"Kick left"` (`:195–198`).
   - Retry `rotateBlock(r)` (`:203`).
5. Return `result.first` (`:206`).

**Comment fossils** (Schönian material, not invented intent): TODOs at `:156` (multi-kick), `:163–168` (block-editor generality), `:175–176` (side heuristics).[^schon-1983]

Design reads: this is a **center-relative iterative nudge**, **not** a published SRS offset table. Do not import Tetris Guideline tables without evidence (**GAP**: historical lineage naming).

## 5.21b Input `check_timers` + 180/45 (file:line)

| Symbol / behavior | Path:lines | Value / note |
| --- | --- | --- |
| `KEY_DELAY_TIME_DEFAULT` | `inc/Input.h:33` | **180** |
| `KEY_REPEAT_TIME_DEFAULT` | `inc/Input.h:34` | **45** |
| `InputPressed` timers | `inc/Input.h:47–48` | `mDelayTimer`, `mRepeatTimer` |
| Model mirrors | `inc/GameModel.h:87–88` | `mKeyDelay` / `mKeyRepeat` |
| Skip SDL auto-repeat | `src/Input.cpp:210` | `if(!event.key.repeat)` |
| `check_timers` lambda | `src/Input.cpp:132–172` | Push when **both** delay & repeat expired |
| Call site | `src/Input.cpp:283` | End of `pollEvents` |
| Non-repeating cmds | `Input.cpp:144–147` (kbd), `:163–166` (pad) | No auto-repeat for `enter`, `UI_back`, `UI_enter`, `pause` |
| Header date | `Input.h:1–6` | Copyright **2020**; Date Feb/14/2020 |

**Sequence (DAS/ARR-like):** KEYDOWN with `!event.key.repeat` → insert `InputPressed` + reset timers → queue immediate command → … → `check_timers()` runs both timers; when both expired, lookup command (unless UI/pause class) and push + reset repeat timer → `GameController` pops queue → `PlayState` / model.

SELF-STATED blog concordance (additional quotes):[^blog-input]

> “I have two timers associated with every key. I can check which modifiers are pressed when the key is initially pressed as well as when the key needs to be automatically repeated.”

> “At the end of the input phase of the game loop I check the timers to see if any additional input needs to be added to the command queue.”

> “Notice how it skips over key repeats. This is where I start to handle the delay and repeat timers.”

## 5.22 Localization CSV systems craft (deepen)

`LanguageModel::loadLanguageData` builds paths `./assets/lang/{language}.csv`; `getWord(field, pad, left, capitalizationtype)` supports padding, justification, and capitalization modes (first letter / every word).[^blog-localization][^sdl2-blocks] Public `en.csv` / `es.csv` carry ~55 keys spanning HUD (`score`, `lines`, `level`, `combo`), menus, board-size help text (`8x8 and 25x22`), and feel labels (`input options`, delay/repeat, guide grid, `counter clockwise`, `quick drop`).

Craft claims:

1. **CSV as locale membrane** — translators (or the author + Google Translate + human review, per blog) touch data, not C++.
2. **UI geometry awareness** — padding/capitalization exist because terminal-ish / fixed layouts need string shaping, not only replacement.
3. **Steam surface concordance** — store lists English + Spanish (Spain) + Spanish (Latin America);[^steam-ablock] Simplified Chinese and Steam SDK auto-language remain **intent/GAP**.
4. **Same studio ethic as BBS aggregation** — do not invent strings; load them.

### File:line + SELF-STATED parameter contract

| Piece | Path / source |
| --- | --- |
| Loader | `src/LanguageModel.cpp:20–41` — `./assets/lang/{language}.csv`; comma split |
| ISO map | `LanguageModel.cpp:10–12` — `en`→English, `es`→Spanish |
| API | `inc/LanguageModel.h` — `capitalizationtype::{capitalizeFirst, capitalizeWords, capitalizeNone}`; `getWord(field, pad, left, capType)` |
| Missing key | `LanguageModel.cpp:70–73` — fallback to field string + `SDL_Log` |
| Consumers | LanguageOptions, KeyboardOptions, HighScores, Credits, PlayState status, GameOver |

Blog (SELF-STATED; note blog typo `gitWord` vs code `getWord`):[^blog-localization]

> “The first parameter is the key for the word, the second is a padding value, the 3rd whether the word should be left or right justified and the 4th a capitalization style.”

> “You can capitalize the first word in the string, all words in the string or none.”

> “Next I will add some functionality to use the Steam SDK to detect the users language based on their Steam preferences … I will also work on Simplified Chinese because a large portion of steam users are on Simplified Chinese.”

**GAP unchanged:** Steam SDK auto-language / Simplified Chinese ship status not confirmed publicly (store languages today: English + Spanish Spain + Spanish LatAm).[^steam-ablock][^draft12-pack]

CSV i18n is an owned data contract parallel to Ra’s GLTF extras/`ra_tag` — shipping craft as membrane design, not only menu translation.


## 5.23 Releasenotes as versioned research log (method claim)

Beyond the table in §5.11, Draft 1.2 asserts a method status: `releasenotes.txt` is a **primary research diary** for feel systems—dated, terse, failure-inclusive (CCW wall-kick bug), and co-located with source.[^ablock-releasenotes] Nelson’s practice-as-research protocols and Candy’s reflective practitioner both license such diaries as documentation of making;[^nelson][^candy-2019] this one happens to be public and grepable.

## 5.24 Steam Firefly disclosure as ethics of AI-assisted marketing

Steam’s AI Generated Content Disclosure for Ablockalypse states that Adobe Firefly materials were used for store marketing banners and the game title logo.[^steam-ablock] Draft 1.2 reads that sentence as **ethics of AI-assisted marketing**, adjacent to—but not identical with—AI-assisted programming skill tags elsewhere:

- **Disclosure over ambience** — the storefront names the tool and the asset class.
- **Scope bounding** — marketing/logo, not a claim that gameplay code is generated.
- **Owned Pipelines tension** — assistants may accelerate surfaces; identity-bearing layers (feel defaults, wall-kick grammar, pricing ethics, BBS disclaimers) still require accountable human authorship (E.12).

This draft invents no Firefly workflow diary; it treats the Steam disclosure itself as the public ethical artifact.

## 5.25 Board-size instrument (public lang + options)

Localization help strings document legal board ranges on the order of **8×8 through 25×22** with `10x20`-style examples.[^sdl2-blocks] Combined with `Board` dynamic `setSize` and Steam’s adjustable board-size marketing,[^steam-ablock] the competitive instrument includes **spatial reconfiguration** as a first-class option—Swink/Salen literacy again, without fake tournament brackets.[^swink][^salen-zimmerman]

Mark checklist: board-size legal ranges are now partially filled from public lang assets; exact default runtime size and editor file-format details still welcome author confirmation.

### Board.h scoring / size constants (VERIFIED)

Public `inc/Board.h` (copyright **2024**): `BOARDSIZE_BUFFER = 3`; conceptual width **10**; height **20 + buffer**; `PTS_DROP = 5`; line multipliers `PTS_2LINE_MULT/3/4` = 5/15/45; `NEW_LVL_AT_LINES = 10`; `setSize(int,int)` dynamic.[^sdl2-blocks][^draft12-pack] `GameModel_setup.cpp` calls `setSize(width, height + BOARDSIZE_BUFFER)`. Defaults now citable; player-facing options still retune width/height within lang-documented ranges.

### Hard-drop cooldown as accidental-input hygiene

`PlayState.cpp:106–111` gates hard drop with `mLastHardDrop` timing; releasenotes 0.7.0.6 add “quick drop cool down which prevents accidental drop.”[^sdl2-blocks][^ablock-releasenotes][^draft12-pack] Feel research reading: mercy is not only coyote-time in 3D—competitive 2D instruments also need **anti-misfire** timing. Same studio that publishes Launch Up jump buffer publishes Ablockalypse drop cooldown—paired mercy grammars across genres.



---

# Chapter 6. Platforms & Markets: One-Seat Editing and Early Access as Design

Engines are not only renderers; they are contracts. Digiflux.one / Ra Engine’s public commercial design is unusually explicit, which makes it analyzable as practice knowledge rather than mere storefront noise.

## 6.1 The one-seat catalog bet

Steam and Digiflux messaging converge: **one seat unlocks level editing across the Digiflux.one catalog**—Laser Tag arenas, Launch Up levels, and future titles—forever relative to that seat’s promise.[^steam-ra][^ra-docs]

This is a platform affordance:

- Players of a free title (Laser Tag) have a clear upgrade path into authorship.
- The engine avoids per-game editor SKUs.
- Workshop vision (build, play, adjust lights, share) becomes coherent only if the editor is shared infrastructure.

Compare the opposite pattern: each game ships a bespoke editor or none at all. Digiflux bets that **editor ownership centralized in Ra** compounds.

## 6.2 Price as philosophy

Ra Engine is **$49.99 per seat**, described as permanent—not an introductory EA discount. Steam EA FAQ: goal is volume, not margin; early adopters get the same deal forever.[^steam-ra]

In indie tool markets, temporary cheapness often trains customers to wait. Permanent low-and-honest pricing is a design choice about trust and community composition: attract builders who will actually open GLTF scenes, not bargain hunters timing a sale.

Docs also state revenue share: 2% annually over $100K, 1% annually over $1M, yearly reset, permanent terms.[^ra-docs] This draft records the public terms without forecasting revenue.

**Commercial surface geography:** as of the Draft 1.2 source pack (2026-09-10), `https://digiflux.one/products`, `/pricing`, and `/about` return **404**.[^draft12-pack] The public commercial story therefore lives on **Steam (storefront of record)** plus digiflux **docs footer** language (including COPY DRIFT $49.99↔$250 appearances)—not on separate marketing microsites. Absence of `/pricing` is itself multi-surface publishing evidence.


## 6.3 Early Access as controlled incompleteness

Steam EA text is a methodological document disguised as marketing:[^steam-ra]

- **Why EA:** production-ready for supported workflows; used to develop Laser Tag and Launch Up; ship now while expanding features with user input.
- **Duration:** approximately 6–12 months.
- **Full version deltas:** spot light cone editor with gizmos; full GLB loading; expanded Lua API; third-person camera; denoiser for glossy reflections; more docs/examples; Steam Workshop integration.
- **Current state:** full hardware Vulkan 1.4 RT (reflections, refractions, emissive GI); ACES and exponential depth fog; real-time scene editor features; GLTF 2.0 load/save; point/spot lights; Lua hot reload; terminal-first UI; three build targets; stable on RTX 2060-class hardware.
- **Community involvement:** production work on titles drives tooling; discussion board feedback; rolling roadmap.

Schön might call EA a formalized reflective conversation with a wider situation.[^schon-1983] The risk is also real: EA can become eternal. The public 6–12 month bound is therefore part of the ethical design surface—whether met or revised, it is a claim the practice can be held to.

## 6.4 Titles as platform proofs

**Launch Up** — vertical platformer / FPS-platformer hybrid: height-based scoring at 100 pts/metre; coyote time 0.15s; jump gravity −18; tutorial scene with rising platforms and goal pad; Lua-driven progression across multiple level GLTFs.[^ra-docs][^lua-api]

**Laser Tag** — free RTX arena shooter; level editing via Ra; Workshop sharing envisioned; public LinkedIn updates describe it as in-progress toward Steam.[^steam-ra][^linkedin-lasertag]

Games are not merely content; they are **integration tests that customers can feel**. An engine without shipped games is a demo. An engine with games is a pipeline.

## 6.5 Linux-first storefront honesty

System requirements lead with Fedora Linux (or equivalent), Vulkan RT-capable GPUs, and modest storage.[^steam-ra] Many commercial tools bury Linux as an afterthought. Ra’s Linux-first posture matches the documented development reality (Fedora, RADV/ANV notes, MangoHUD conflicts). Market honesty reduces support entropy—another ownership dividend.


## 6.6 Revenue share as pipeline continuity

Docs state revenue share terms (2% annually over $100K; 1% annually over $1M; yearly reset; permanent terms).[^ra-docs] Whatever one thinks of the percentages, the structural idea is continuity: the engine maker remains economically coupled to successful catalog titles without claiming ownership of those titles’ creative direction. Combined with one-seat editing, Digiflux sketches a **thin platform**—editor + catalog + Workshop ambition—rather than a maximal app store fantasy.

## 6.7 Free Laser Tag / paid Ra as onboarding funnel

Public positioning: Laser Tag free; editing requires Ra.[^steam-ra] This is a classic freemium-adjacent funnel, but oriented toward **authorship** rather than cosmetics. The moral quality of that funnel will depend on Workshop moderation and communication honesty during EA—future evaluative work for the public record.

## 6.8 Chapter claim

**Claim C6:** Digiflux’s one-seat editing model, permanent $49.99 pricing, and time-bounded Early Access disclosures are not peripheral business details; they are design parameters of the same owned pipeline as BLAS builds and coyote time. Platform economics can be practiced as craft.


> **Practitioner note / open for author expansion:** Why $49.99 specifically? What alternatives were rejected (subscription, per-title editors, free engine + paid games only)? What Workshop governance principles do you intend when integration lands?


---


## 6.8b Steam Ra audience and “own the pipeline” rhetoric (App 4732830)

Beyond price and EA duration, Steam About/feature language for Ra Engine supplies transferable platform claims:[^steam-ra][^draft12-pack]

- “Every Digiflux.one game is fully editable in Ra Engine.”
- Laser Tag arenas + Workshop; Launch Up level edit; “Every future Digiflux.one title — One seat … forever.”
- Terminal-first / “no overlay UI” / ANSI posture as marketed identity.
- “Theatrical Lighting Design — Inverse-square … ACES … emissive multi-sample GI … tunable depth fog.”
- Three build targets in EA current-state list (editor / Digiflux runner / dev).
- Audience framing: Laser Tag players; hobbyists; studios wanting a “Vulkan-native RTX pipeline they can own” — “**No licensing tiers. One seat per developer.**”
- Permanent-price quote: “Ra Engine is $49.99 per seat and will stay there. This is not an introductory price — it is the permanent price. The goal is volume, not margin.”

API platforms flag: **Linux-only** (`windows: false`) in the sampled Steam API response—consistent with Linux-first honesty, even when marketing copy elsewhere speaks to broader GPU classes.[^draft12-pack]

These bullets densify Claim C6: market rhetoric and renderer ontology are co-authored on the same storefront page.

---

## 6.9 Workshop vision from Steam text

Ra Engine’s Early Access disclosures name **Steam Workshop integration** for Digiflux.one titles among full-version plans, alongside spot-cone gizmos, GLB loading, expanded Lua, third-person camera, and a glossy-reflection denoiser.[^steam-ra] Store copy sketches the loop in plain language: build a Laser Tag arena, hit play, run through it, adjust lights, share on Workshop.[^steam-ra]

Workshop is therefore not a vague “community features” checkbox; it is the **distribution valve** for the one-seat authorship bet. Until it ships, it remains a design hypothesis on the public roadmap—future work Chapter 10 can audit against.

## 6.10 Launch Up as platform proof (App 4705880) — and a product-definition mismatch

Launch Up is Steam app **4705880**, developer/publisher Color It Company, coming-soon / Early Access intent.[^steam-launch] Digiflux docs and the public manual at coloritcompany.com/launchup/ publish feel constants that this monograph already treats as Grade-A operator facts: jump gravity **−18.0**, coyote **0.15s**, height score **100 pts/metre**, tutorial goal pad near **Y = 26.5m**, on the order of **17** rising platforms in level 1.[^ra-docs][^launchup-manual][^expansion-pack]

Manual-side feel detail available publicly also includes jump velocity **8.5**, jump buffer **0.12s**, and a death-plane / hazard / respawn framing.[^expansion-pack]

**COPY DRIFT (must not be silently fixed):** Steam marketing copy has emphasized neon exploration language and “no fail states,” while the Flux Studios manual describes death plane, hazards, and Exploring→Dead→Respawning loops.[^expansion-pack][^inventory] Platform API flags have also shown Linux-true / Windows-false oddities beside store requirement blocks mentioning both—another drift surface. Scholarly citation must present both texts; **author resolution is a GAP**.

## 6.11 Ablockalypse EA economics beside Ra

Ablockalypse’s $4.99 EA seat on Steam (app 1674300) and Ra’s $49.99 permanent tool seat are different instruments in one studio economy: a playable competitive puzzle versus a creator RT editor.[^steam-ablock][^steam-ra] Permanent-price rhetoric appears in both ecosystems (Ablockalypse: price likely unchanged through EA and release; Ra: “not an introductory price”). The shared craft is **refusing sale-trained cynicism** as a design stance—success still empirical.

## 6.12 Laser Tag — announced funnel, AppID GAP

Public Ra/Digiflux materials describe **Laser Tag** as a free RTX arena shooter whose arenas are editable in Ra and intended for Workshop sharing.[^steam-ra] No dedicated Color It Company / Digiflux Laser Tag Steam AppID was found in the inventory/expansion passes.[^expansion-pack][^inventory] This draft therefore treats Laser Tag as **announced production use + marketing funnel**, not as a shipped storefront artifact. Hook for Steven: add AppID and ship dates when live.

## 6.13 Early Access as ethical surface across titles

| Title | Public EA / timing claim | Honesty note |
| --- | --- | --- |
| Ra Engine | ~6–12 months EA | Auditable bound |
| Launch Up | ~6–12 months EA (store) | Auditable bound |
| Ablockalypse | Likely EA until end of 2025 (store text) | If still EA in 2026, the record shows slip |

Practice-based research does not require perfect schedule adherence; it requires **schedules that can be checked**.




## 6.14 One-seat editing as design research (not only pricing)

The one-seat claim—“edit every Digiflux.one title”—is a research design about **where authorship lives**.[^steam-ra] Instead of shipping a unique editor SKU per game (or none), Digiflux proposes a shared instrument. Consequences:

1. **Level-design skill compounds** across Laser Tag arenas and Launch Up verticals.  
2. **Lua taxonomy stability** becomes a platform promise; breaking `engine.set_hud_data` breaks multiple titles.  
3. **Workshop** (roadmap) becomes intelligible: shared editor + per-title content pipes.  
4. **Support burden centralizes**—pitfall tables and F-key grammar must serve multiple game fantasies.

Jesper Juul’s half-real framing helps: Digiflux sells both a real tool (rules/instrument) and fictional worlds (Laser Tag, Launch Up); the seat is the passport between them.[^juul] Anthropy’s zinester ethos resonates with “hobbyist developers who want hardware ray tracing without general-purpose engine overhead” as Steam audience copy, without requiring anti-Unity polemic.[^anthropy][^steam-ra]

## 6.15 Linux-first requirements as market selection

Ra’s storefront/system requirements leading with Fedora (or equivalent) and Vulkan RT-capable GPUs select for a practitioner public.[^steam-ra] That selection is design research: it trades mass-market ease for reduced support entropy and honest alignment with documented RADV/ANV development reality. Launch Up’s platform-flag oddities (API Linux-true/Windows-false vs broader store requirement language) remain flagged drift—not silently “fixed” here.[^expansion-pack]

## 6.16 Revenue share + permanent seat as coupled hypotheses

Docs’ revenue-share schedule (2% annually over $100K; 1% annually over $1M; yearly reset; permanent terms) couples to the permanent seat price as a thin-platform hypothesis: keep creator ownership of titles while retaining a light economic handshake with the engine maker.[^ra-docs] Whether the percentages are “right” is not this dissertation’s forecast; whether they are **legible enough to debate** is the practice-knowledge win.




## 6.17 Close reading: Launch Up Flux Studios Game Manual (public)

The public Launch Up manual (First Edition, Flux Studios / Color It Company LLC) is Grade-A operator documentation for a Digiflux title—feel constants, state machine, hazards, and scoring published before (or beside) general release.[^launchup-manual]

### Feel constants (manual)

| Parameter | Public value | Design reading |
| --- | --- | --- |
| Jump velocity | **8.5** | Arc authorship |
| Coyote time | **0.15s** | Mercy after leaving ground |
| Jump buffer | **0.12s** | Mercy before landing |
| Death plane | **Y = −5m** | Hard fail threshold |
| Height score | **100 pts/metre** | Spatial economy |
| Sprint | Shift **2×** | Matches Ra fly-mode speed multiplier philosophy |

Manual pedagogy explains coyote and buffer in player language: confident movement is rewarded; early Space chains jumps; hold vs tap produces full arc vs hop.[^launchup-manual] That is Swinkian feel teaching published as a game manual, not as an academic paper.[^swink]

### Game states (manual)

Exploring → (fall below Y=−5m) → Dead (score frozen) → automatic Respawn at checkpoint.[^launchup-manual] This directly contradicts any store copy that implies the absence of fail states; Draft 1.1 therefore keeps the store↔manual mismatch as COPY DRIFT rather than picking a favorite.[^expansion-pack]

### Grounding and hazards

A **five-point ground cast** (center + four footprint corners) is documented for edge standing reliability.[^launchup-manual] Hazards named in the manual—Pendulum Hammer, Rotating Cube Cluster, Flail & Mace, Void Shaft, Crystal Formations—establish that moving contact kills instantly (no hit points). Crystals are environmental only. Level 1 (“The Lower Lattice”) is framed as teaching by platforms, with a ~26m lesson horizon in inscription prose that rhymes with docs’ 26.5m goal pad figure.[^launchup-manual][^ra-docs]

### Controls rhyme with Ra editor grammar

WASD, Space, Shift sprint, F1/F2/F4 appear in the game manual—the same F-key family as the Ra editor—while ESC pauses.[^launchup-manual][^ra-docs] Players of Digiflux titles inherit terminal-adjacent literacy. Owned Pipelines predicts that rhyme: one seat, one grammar.

### Why this manual matters to Ch6

Platform economics (one seat, Workshop, EA) are empty without titles that teach their own instruments. Launch Up’s manual is the **player-facing twin** of Ra’s pitfall table: both externalize back-talk. The remaining scholarly duty is for Steven to reconcile marketing fantasy tone with manual severity so citations do not fork the product.





## 6.18 Manual voice as worldbuilding-without-metrics

Launch Up’s manual opens with diegetic inscriptions (“The Lattice was built to reach something…”) and an “Axiom Fragment” framing Level 1 as teaching-by-platforms toward roughly twenty-six metres.[^launchup-manual] That literary layer sits atop Grade-A constants (8.5 / 0.15 / 0.12 / Y=−5). Practice-based reading keeps both: fiction motivates ascent; numbers govern mercy and death. Steam marketing that erases death/hazards is then visible as tone drift against an already-public manual ontology.




## 6.19 Level 1 “Lower Lattice” numbers and player pedagogy

The manual’s Level 1 chapter publishes concrete spatial economy:[^launchup-manual]

| Quantity | Value |
| --- | --- |
| Platforms | **17** ascending corridor |
| Goal height | **26.5m** |
| Max height score | **2,650** (at 100 pts/metre) |

Route notes teach calibration on the first three wide pads, anticipation on offset mid-section pads, and tighter final clusters possibly guarded by pendulum/rotating obstacles on higher difficulty passes.[^launchup-manual] Art direction is explicit: warm orange walls, cool cyan emissive platforms, purple crystal accents—“the path is cyan, the world is orange.”

### Advanced techniques as published feel literacy

Manual Chapter 07 teaches looking up to plan two–three platforms ahead; using the **0.12s** jump buffer ~0.1s early; trusting five-point edge lands; waiting full hazard rotations instead of forcing gaps; sprinting back after respawn because peak height score persists across deaths in a run.[^launchup-manual] This is competitive-feel pedagogy without inventing esports stats—the same honesty standard Chapter 5 applies to Ablockalypse’s 180/45 defaults.

### Manual Chapter 08: teaching Ra to players

The manual tells players Launch Up runs on Ra Engine’s Vulkan 1.4 hardware RT path and explains F2 knobs—GI samples Off/1/2/4, reflections toggle, max bounces, ACES on/off with studio-recommended vivid default off—plus RTX 2060-class / Arc A380 / RX 6600 support language.[^launchup-manual][^steam-ra] That is Owned Pipelines in the wild: **the game manual becomes engine documentation for a player public**, collapsing Ch4 and Ch6.




## 6.20 Launch Up manual Ch01–08 as player pedagogy (Draft 1.2)

The Flux Studios / Color It Company **Launch Up Game Manual · First Edition** is a public curriculum, not only a feature list.[^launchup-manual][^draft12-pack]

| Ch | Title | Pedagogical substance |
| --- | --- | --- |
| 01 | The World & Your Mission | Lattice lore; “There is no down.”; climb/score/survive frame |
| 02 | Controls | WASD, Space, Mouse, Shift **2×**; ESC/F1/F2/F4; F2 tip for RTX/GI on weaker hardware |
| 03 | Core Mechanics | Jump **8.5** / coyote **0.15s** / buffer **0.12s**; Exploring→Dead→Respawn; death plane **Y=−5m**; **five-point ground cast** |
| 04 | Scoring | **100 pts/metre**; peak persists across death; stage clear bonus |
| 05 | Hazards | Pendulum, rotating cube cluster, flail/mace, void shaft, crystals; contact = instant kill (no HP) |
| 06 | Level 1 — Lower Lattice | **17** platforms; goal **26.5m**; max height score **2,650**; orange/cyan/purple art direction |
| 07 | Advanced Techniques | Look-ahead; buffer timing ~0.1s; edge work; hazard patience; score sprint after respawn |
| 08 | Ra Engine & RTX Graphics | Emissive GI, RT shadows, reflections, exponential fog; F2 GI Off/1/2/4; ACES off = studio-recommended vivid default |

Short public pedagogy (paraphrase/near-quote):[^launchup-manual]

- Coyote time “rewards confident movement” by remembering recent groundedness.
- Death plane at Y=−5m is an explicit fail geography.
- Five-point ground cast (center + four footprint corners) teaches edge literacy.
- “Contact with any moving obstacle kills instantly — there are no hit points.”
- ACES off recommended for vivid linear theatrical look (Ch08 ↔ Ra docs taste fork).

Chapter 08 is also **engine literacy for players**: the same F2 knobs operators use become player performance tools—Owned Pipelines handshake between editor and title.

## 6.21 Steam Launch Up (4705880): wall-run, roadmap, polls — and drift

Steam Early Access / about text for App **4705880** adds process and movement claims not saturated in the manual:[^steam-launch][^draft12-pack]

**Movement / content (store):**

> “A solid, performant first-person movement system with running, jumping, **wall-running**, and satisfying launches”

Also: multiple visual themes (pink/cyan, crimson, orange, purple, etc.); controller and keyboard/mouse support.

**Community process (store):**

> “Keep a public roadmap (updated monthly)”  
> “Run community polls for prioritizing new realms, color themes, and mechanics”  
> “Host occasional playtests and feedback streams”

**COPY DRIFT addendum (DR2 extended):**

| Store surface | Manual surface |
| --- | --- |
| “No enemies, no fail states” | Death plane; instant-kill hazards; Dead state |
| **Wall-running** in EA current-state bullets | Manual Ch02–03 pedagogically emphasize jump/coyote/buffer; wall-run **not** detailed |
| “Infinite neon cube realms” | Level 1 = 17 platforms / 26.5m Lattice |

Draft 1.2 treats **wall-run store claim vs thin manual pedagogy** as the same honesty surface as fail-states drift: cite both; do not invent a wall-run constant table the manual does not publish. Author product-definition repair remains a GAP.

**Platform process craft:** monthly roadmap + polls + playtests are Digiflux *platform* verbs applied to a single title—EA as designed conversation (Schön), not only feature drip.[^schon-1983]

API categories noted: Camera Comfort; Playable without Timed Input; Single-player; Family Sharing. Platforms API Linux-true / Windows-false beside possible dual-OS requirement copy remains soft drift.[^draft12-pack]

---

# Chapter 7. Living Networks: The BBS Directory as Preservation and Systems Practice

## 7.1 The problem of “dead culture” narratives

Popular histories sometimes freeze Bulletin Board Systems in amber: a 1980s–1990s prologue that ends when the Web arrives. Archival reality is messier. Boards persist; protocols mutate (dial-up to Telnet/SSH/web gateways); languages and regions continue; sysops keep the lights on. The cultural mistake is to treat living networks as finished folklore.

Color It Company’s worldwide active BBS directory at coloritcompany.com/bbs positions itself against that mistake.[^cic-bbs]

## 7.2 What the directory is (and is not)

Public page claims, carefully bounded:[^cic-bbs]

- It aggregates systems **currently published in live public BBS lists** fetched for the page.
- It includes boards across many languages (Chinese, Spanish, Portuguese, Russian, German, Japanese, and others named on the page).
- It is **not** a claim to list every unpublished private board.
- Primary credit: Telnet BBS Guide, with companion files and the Synchronet public list; also folded sources include 8-Bit Boyz directory, Chinese-language Telnet BBS List, Dock Sud Latinoamerica list, FLY BBS Russian telnet list, Commodore 64 BBS List, and The BBS List.
- Names, hosts, ports, sysops, locations, and language tags come from those pages and location/source hints and are **not invented**.
- The “light” on each card is a **connection check from this directory, not a login test**.

Those sentences are an ethics protocol disguised as UI copy. Aggregation without attribution is extraction. Connection checks without the login disclaimer would overclaim. Inventing boards would vandalize the historical record.

## 7.3 Systems practice reading

Technically, the directory is a classic integration system:

1. **Ingest** heterogeneous public lists.
2. **Normalize** fields enough to filter (language, connection type, software, status).
3. **Probe** connectivity and display status buckets (up in 24h / 72h, not reached, not checked).
4. **Present** search and filters without erasing provenance.

That pipeline rhymes with Ra’s documentation discipline. In both cases, the craft is making messy reality queryable without lying about uncertainty.

## 7.4 Continuity with personal networked history

A public mid-1990s listing on textfiles.com’s 408 BBS list associates Steven Philley with Digital Aquarium in Saratoga, CA.[^textfiles-408] This dissertation treats that as a verifiable breadcrumb of participation in BBS culture—not as license to invent sysop war stories.

> **Practitioner note / open for author expansion:** If you wish, narrate Digital Aquarium (years active, software stack, what you learned about users, moderation, telephony scarcity). Stick to what you remember and any retained files; mark uncertainties.

## 7.5 Preservation vs. platform enclosure

Modern community life often means renting enclosure: Discord servers, algorithmically ranked feeds, account bans as infrastructure risk. A BBS directory that points outward to independently operated systems is a different political economy of attention. It does not solve moderation at planetary scale. It does keep a map of exits.

Jason Scott’s archival work and related textfiles efforts model a complementary virtue: keep the bits and the lists.[^textfiles] CIC’s directory adds the *liveness* probe—preservation of the present tense.

## 7.6 Operator kinship between engine docs and directory copy

Ra’s pitfall table and the BBS directory’s disclaimer share a tone: *precise about failure modes*. One says MangoHUD will segfault you; the other says a green light is not a login. Both refuse the marketing habit of ambient overclaim. That tonal kinship is evidence for the thesis that one practice can carry ethics of exactness across domains.

## 7.7 Chapter claim

**Claim C7:** The worldwide active BBS directory demonstrates Owned Pipelines thinking applied to cultural infrastructure: aggregate with credit, probe without overclaiming, and treat living networked computing as ongoing systems practice rather than closed nostalgia.


---


## 7.8 Snapshot metrics (bbslist.json, 2026-09-09)

The live data artifact `https://coloritcompany.com/bbs/bbslist.json` on the inventory date reported:[^bbs-json][^expansion-pack]

| Field | Value |
| --- | --- |
| `generated` | 2026-09-09 |
| `probedAt` / `newProbedAt` | same-day UTC timestamps |
| `count` | **1304** systems |
| `statusCounts` | green **1092**, red **212**, yellow 0, unchecked 0 |
| Top languages | English 841; Unknown 153; German 59; Chinese 51; Spanish 33; … |
| Top software | Synchronet **417**; Mystic **229**; Custom 60; Worldgroup 45; Enigma ½ 41; … |

Observed per-system fields include `name`, `sysop`, `location`, `software`, `language`, `telnet`, `port`, `sshPort`, `web`, `modem`, `login`, `status`, `checkedAt`, `lastOk`.[^bbs-json]

These numbers will change; cite them as a **dated snapshot**, not eternal census.

## 7.9 Seventeen credited sources (aggregation ethics)

JSON `sources` enumerates on the order of **seventeen** credited upstreams (name + URL + file + observed date), including Telnet BBS Guide (and SyncTERM/dial companions), Synchronet public lists, 8-Bit Boyz, Chinese-language Telnet BBS List, Dock Sud Latinoamerica, FLY BBS Russian list, Commodore 64 BBS List, The BBS List, Japanese grass-roots lists (balloon-jp), Midnight Driving wiki, Wikipedia 草の根BBS hosts, Brazil’s RBT national list, FidoNet Región 34 España, and BBSlink.[^bbs-json][^cic-bbs]

On-page method language (paraphrased tightly from the directory) insists:[^cic-bbs]

1. The directory lists systems **currently published in live public BBS lists** fetched for the page—not every unpublished private board.
2. Names, hosts, ports, sysops, locations, and languages come from those pages and careful location cues—they are **not invented here**.
3. The card light is a **connection check**, **not a login test**.
4. Telnet boards can open in an in-browser client at `/telnet/`.

Kevin Driscoll’s *The Modem World* and Jason Scott’s *BBS: The Documentary* supply historical literacy for why such aggregation still matters;[^driscoll][^scott-bbs-doc] Howard Rheingold’s *Virtual Community* and Alexander Galloway’s *Protocol* frame networked sociality and control after decentralization as living theoretical problems, not closed folklore.[^rheingold][^galloway]

## 7.10 Connection-check epistemology

A green light answers a narrow question: *did this directory’s probe reach something that looks open?* It does not answer: *can you log in, is the sysop kind, is the board’s culture safe, is the banner honest?* Distinguishing those questions is **UI as epistemology**. Status filters (Up 24h / Recent 72h / Down / Not checked) further refuse false certainty when probes are stale.[^cic-bbs]

## 7.11 Multilingual living field

Language counts in the snapshot show an English-majority but non-monolingual field—German, Chinese, Spanish, Nordic languages, Japanese, Portuguese, Russian, and others appear as first-class filter dimensions.[^bbs-json] Preservation that only indexes English boards would mis-describe the contemporary Telnet world. Aggregation ethics includes **language plurality as method**, not as garnish.




## 7.12 ETL heterogeneity as preservation labor

Upstream formats implied by source credits—CSV dumps, HTML directories, SyncTERM `.lst` files, XML dial directories, wiki tables—mean the directory is an **ETL plant**, not a curated museum label list.[^bbs-json][^cic-bbs] Normalization into a common JSON object (`name`, `telnet`, `port`, `software`, `language`, `status`, …) is the scholarly act: make a multilingual, multi-protocol field queryable without inventing rows.

Galloway’s protocol theory reminds us that control after decentralization often hides in the handshake;[^galloway] CIC’s public handshake is unusually explicit about what it does *not* control (login success, private boards, upstream truth).

## 7.13 Synchronet ecology without false authorship

Software counts dominated by Synchronet (417 in the snapshot) then Mystic (229) describe the living field the directory observes.[^bbs-json] Inventory discipline still holds: operating an aggregator is **not** authorship of Synchronet core.[^inventory] Confusing those roles would be a category error as serious as claiming a Steam page equals an institutional PhD.

## 7.14 In-browser Telnet and the ethics of convenience

Directory copy notes Telnet boards opening in an in-browser client at `/telnet/`.[^cic-bbs] Convenience can become enclosure; here the client is a doorway back to independently operated systems rather than a replacement social network. That architectural choice rhymes with Ra’s “open GLTF scenes” bet: prefer interchange and exits.




## 7.15 Sysop field sparsity and what absence teaches

In the 2026-09-09 snapshot, `sysop` is populated for on the order of half the rows (field frequency ~531 / 1304), while `telnet` is nearly universal (~1300) and `web`/`sshPort` are sparser.[^bbs-json] Absence is data: upstream lists do not always know the human operator. A directory that leaves `sysop` empty rather than inventing a name enacts the same ethic as “not invented here.”




## 7.16 Schema of `bbslist.json` (Draft 1.2)

The live artifact `https://coloritcompany.com/bbs/bbslist.json` exposes a stable-enough schema for scholarly citation.[^bbs-json]

### Top-level object

| Field | Role |
| --- | --- |
| `generated` | Calendar date of generation (e.g. `2026-09-10`) |
| `probedAt` | UTC timestamp of connection-check pass |
| `count` | Integer system count |
| `statusCounts` | `{green, yellow, red, unchecked}` tallies |
| `languageCounts` | Map language → count |
| `sources` | Array of credited upstream descriptors |
| `systems` | Array of board objects |

`sources[]` entries (17) typically carry `name`, `url`, `file`, and `observed` date—e.g. Telnet BBS Guide pointing at a `bbslist.csv` companion.[^bbs-json][^draft12-pack] That micro-schema is aggregation ethics made machine-readable: every foldable list is a first-class credited object, not a footer afterthought.


### Per-system object (union of observed keys)

| Field | Approx. presence (2026-09-10 snapshot) | Notes |
| --- | --- | --- |
| `name` | 1322/1322 | Display identity |
| `status` | 1322/1322 | Probe result bucket |
| `checkedAt` | 1322/1322 | Probe timestamp |
| `language` | 1322/1322 | Including `Unknown` |
| `telnet` | 1316/1322 | Dominant connection surface |
| `software` | 1301/1322 | Synchronet-heavy field |
| `port` | 1260/1322 | |
| `location` | 1163/1322 | |
| `lastOk` | 1099/1322 | Matches green count in this snapshot |
| `login` | 912/1322 | Credential *hint* from upstream—not a CIC login test |
| `sysop` | 532/1322 | Sparse on purpose when upstream lacks it |
| `web` | 356/1322 | |
| `sshPort` | 237/1322 | |
| `modem` | 50/1322 | Dial-up residue still indexed |

### Snapshot B (Draft 1.2 window, 2026-09-10)

| Field | Value |
| --- | --- |
| `generated` | 2026-09-10 |
| `probedAt` | 2026-09-10T00:20:30Z |
| `count` | **1322** |
| `statusCounts` | green **1099**, red **223**, yellow 0, unchecked 0 |
| Top languages | English 841; Unknown 160; German 62; Chinese 51; Spanish 35; Swedish 25; Portuguese 23; … |
| Top software | Synchronet **418**; Mystic **230**; Custom 61; Worldgroup 45; Enigma 1/2 41; … |

Compare Snapshot A (2026-09-09: 1304 / 1092 green).[^bbs-json] Day-scale movement is itself evidence: the directory is a **present-tense** archive. Cite dated snapshots; never pretend a single eternal census.

## 7.17 Ethics of connection probes (expanded)

Probe ethics, restated as design constraints:[^cic-bbs]

1. **Narrow question** — reachability from the directory’s vantage, not authentication success, culture safety, or banner honesty.
2. **UI labeling** — “connection check … not a login test” must remain adjacent to the light.
3. **No invention** — empty `sysop` stays empty; sparse modem fields stay sparse.
4. **Credit** — seventeen upstream sources named in JSON and on-page.
5. **Non-enclosure** — in-browser `/telnet/` is a doorway outward, not a replacement social graph.
6. **Status humility** — Up 24h / Recent 72h / Down / Not checked refuse false certainty.

Galloway’s handshake politics and Rheingold’s community ethnography both sharpen why a green light without these constraints would be a control fantasy.[^galloway][^rheingold]

## 7.18 Multilingual aggregation as method (not garnish)

Language filters and `languageCounts` make plurality operational. A directory that only celebrated English Synchronet boards would mis-describe the 2026 Telnet world. Chinese-language lists, Dock Sud Latinoamerica, FLY BBS Russian, Japanese grass-roots, RBT Brazil, and FidoNet Región 34 España are not decorative credits—they are **ETL inputs** that change what the map can know.[^bbs-json][^cic-bbs]

Driscoll’s modem-world literacy (Ch3 §3.12) pairs here: indexing is historical practice continued, not nostalgia LARP.

## 7.19 Preservation without nostalgia cosplay

Nostalgia cosplay would freeze aesthetics (ANSI art museums only), erase multilingual present tense, invent sysops, or hide upstream credit behind a boutique brand. CIC’s directory instead:

- Aggregates **live** public lists.
- Probes **now**.
- Credits **by name**.
- Distinguishes **connection ≠ login**.
- Leaves sparse fields **sparse**.

That is preservation as systems practice—Claim C7 densified. Jason Scott’s *BBS: The Documentary* and textfiles archives remain complementary historical virtues;[^scott-bbs-doc][^textfiles] liveness probes add the present tense those archives cannot forever supply alone.

## 7.19b Three anonymized system patterns (no PII dump)

To illustrate schema without dumping personal identities, Draft 1.2 records **patterns** observed in the 2026-09-10 snapshot (field combinations, not named boards):[^bbs-json][^draft12-pack]

1. **EN Synchronet / green** — `software=Synchronet`; `language=English`; `status=green`; telnet port often non-23; login hint present; `lastOk` aligned with `probedAt`.
2. **DE Mystic / green** — `software=Mystic`; `language=German`; telnet + web present; `status=green`.
3. **ZH Custom / green** — `software=Custom`; `language=Chinese`; port 23; `status=green`.

These patterns teach multilingual Synchronet/Mystic/Custom ecology without extracting sysop names into the monograph. Ethics rule unchanged: no invented rows; no login tests; Synchronet core authorship still **unclaimed**.


## 7.21 Aggregation labor as Owned Pipelines kinship

Why does a Vulkan RT studio operate a worldwide BBS directory? The Owned Pipelines answer is kinship of **operator exactness**:

1. **Heterogeneous ingest** — CSV, HTML, SyncTERM lists, wiki tables → one JSON schema (Ch7 §7.16).
2. **Uncertainty UI** — green/red lights + “not a login test” + Not-checked buckets.
3. **Credit as protocol** — seventeen `sources[]` objects with URLs/files/observed dates.
4. **Present-tense archive** — Snapshot A 1304/1092 (2026-09-09) → Snapshot B 1322/1099 (2026-09-10).
5. **Refusal of cosplay** — multilingual living field; sparse `sysop`; no invented boards.

Ra’s pitfall table and the directory’s probe disclaimer share a tone: amplify mute failure modes before marketing smooths them over. That tonal kinship is evidence for the thesis that one practice can carry ethics of exactness from SPIR-V UBO treaties to Telnet reachability maps.

Galloway’s *Protocol* would note that control after decentralization often hides in the handshake;[^galloway] CIC’s public handshake is unusually explicit about what it does *not* certify. Driscoll’s *Modem World* supplies the historical literacy that makes a 2026 directory intelligible as continuation rather than costume.[^driscoll]

---

## 7.20 What Chapter 7 still refuses

- Claiming Color It Company authored Synchronet.
- Inventing Digital Aquarium war stories beyond the textfiles breadcrumb + author hook.
- Treating 1322 as eternal.
- Equating directory operation with sysop identity for listed boards.

---

# Chapter 8. Media Adjacency: Photography and Cultural Systems as Attention Craft

## 8.1 Why adjacency belongs in a computing dissertation

A narrow software monograph might ignore stevenphilley.com and panatau.com. This practice-based dissertation includes them because attention is the shared substrate of lighting, feel, and cultural explanation. The same maker who calibrates inverse-square intensities also sequences California light from warm to cool and builds cultural learning structure for Romanian history, crafts, dialect, and maps.[^photo][^panatau][^inventory]

## 8.2 Photography as lighting practice outside the GPU

stevenphilley.com presents photography arranged warm to cool—“from golden hour through open Pacific”—with pieces such as Orchard Last Light, Storm Clearing, Bare Canopy, Filtered Fire, Motion at Dark, and coastal studies (Sky Study, Rock Spire, Limestone Shore, Pacific Terminus).[^photo] Caption voice emphasizes hour, weather, and place: warmth at the edge of day; the coast’s indifference to the viewer.

McCandless asked stage lighting to model form and compose visibility.[^mccandless] Photography asks related questions with photons that will not recompile. For a ray-tracing practitioner, the adjacency is obvious: exposure, color temperature, fog, and reflection are not only shader flags; they are habits of noticing.

> **Practitioner note / open for author expansion:** Which photographic sessions most directly changed how you place lights in Ra? Name locations and lighting problems (e.g., dusk orchard bounce vs Pacific cliff rim light) and map them to engine controls (ACES off vibrancy, fog density, emissive GI samples).

## 8.3 panatau.com as cultural systems design

panatau.com is publicly characterized in the verified inventory as a Romania cultural learning site—history lessons, crafts, dialect, maps—media/systems craft adjacent to games.[^inventory]

Even without dumping the site’s full curriculum into this chapter, the structural claim is available: **teaching culture requires information architecture**. Lessons, maps, and dialect materials are content pipelines. They demand the same virtues as engine docs: clear boundaries, progressive disclosure, respect for sources, refusal to invent.

## 8.4 Studio identity beyond a single genre

Color It Company’s public identity—“Independent Media & Games,” “We make games, tools, and experiences worth playing”—already refuses pure genre lock-in.[^cic-home] Ablockalypse, Ra/Digiflux, BBS directory, photography, and cultural learning are not brand dilution if the thesis is Owned Pipelines; they are multiple surfaces of one craft of attention and systems.

## 8.4b Studio hub vs Digiflux surfaces (2026-09-10)

coloritcompany.com (scanned Draft 1.2 window) presents “Independent Media & Games,” Campbell CA contact block, Ablockalypse (Steam & itch), an “Untitled Project / Something new is in development” teaser, and outbound links (Steam, itch, Discord, YouTube, X, Facebook, GitHub `sdl2-blocks`, Blog, ArtStation, BBS, Opportunities).[^cic-home][^draft12-pack]

Notably, the hub scan does **not** prominently list Ra Engine / Launch Up / Digiflux—those live on digiflux.one + Steam. That split is **studio multi-surface identity**: CIC as media/games face; Digiflux as engine/platform face; same LLC practice underneath. Owned Pipelines readers should not demand a single homepage that contains every artifact; they should demand *traceable* surfaces (which this inventory supplies).

---

## 8.5 Studio as multi-surface practice

Color It Company’s Campbell address and contact lines on public pages situate the work in a real place, not a misty “remote collective.”[^cic-home] Place matters for photography (California light) and for BBS history (408-area breadcrumb). Owned Pipelines includes *where* the operator sits: the same metro continuum from Saratoga/Campbell listings to present PMB address is a geographic rhyme the author may unpack.

panatau.com’s cultural learning brief in the inventory—history, crafts, dialect, maps—suggests curriculum design as yet another pipeline: source respect, sequencing, and progressive disclosure. Games teach through levels; cultural sites teach through lessons; engines teach through docs. The isomorphism is the chapter’s wager.

## 8.6 Chapter claim

**Claim C8:** Photography and cultural learning sites are not digressions from engine research; they train and express the same disciplined attention that theatrical RT lighting and competitive feel require. Media adjacency is part of the epistemology of ownership.


---


## 8.7 Photography site structure (stevenphilley.com)

The public photography site presents **Vol. I — California Light**: nine images arranged warm to cool—“from golden hour through open Pacific.”[^photo] Sequence as published:

1. Orchard, Last Light — golden hour, Northern California  
2. Storm Clearing — dusk, broken clouds  
3. Bare Canopy — winter orchard, twilight  
4. Filtered Fire — sun through dormant branches  
5. Motion at Dark — long exposure, crimson sky  
6. Sky Study — early evening, open sky  
7. Rock Spire — Pacific coast, midday  
8. Limestone Shore — Santa Cruz coastline  
9. Pacific Terminus — cliff edge, open water  

Caption voice emphasizes hour, weather, and place: warmth at the edge of day; the coast’s indifference. Site chrome includes themes navigation and a “hover to reveal color” interaction—attention choreography adjacent to theatrical RT lighting controls (ACES/Gamma toggles, fog, emissive).[^photo]

Optional low-weight adjacency: the 2015 “Jammin’ away.” blog post (“I love playing guitar!”) marks multi-surface studio life without carrying technical argument.[^blog-guitar]

## 8.8 panatau.com as systems pedagogy

panatau.com presents a multi-section Romania cultural site: Pictures, History lessons, Timeline, Store, Maps, Recipes, Words/Dialects, Orthodoxy, Crafts, Music, House/Well/Wooden churches, Games, Market, Rivers, Harvest, Year, Proverbs, ro.net, plus themed CSS modes (Voroneț / Dusk / Folk / Wood).[^panatau]

History is taught as **short lessons, not a single hero story**—e.g., Latin that stayed after Dacia; three lands rather than one court; painted monastery walls as public books; union chronologies; a century read slowly.[^panatau] That pedagogy is information architecture: progressive disclosure, refusal of invented national myth as the only spine, and visual theming as orientation.

**Authorship GAP:** the public page does not prominently byline “Steven Philley”; inventory association rests on roster/domain trail. Confirm before stronger first-person claims.[^inventory]

Read as Owned Pipelines adjacency: cultural learning sites, like engine docs and BBS directories, are pipelines that must credit sources, sequence attention, and refuse fabrication.




## 8.9 Lesson architecture on panatau.com (public curriculum sketch)

Public lesson cards on the home surface include, among others:[^panatau]

1. **The Latin that stayed** — Dacia, Trajan, Latin grammar persistence amid later lexical layers.  
2. **Three lands, not one court** — Wallachia, Moldavia, Transylvania as arrangement rather than premature nation-museum.  
3. **Why the walls are painted** — exterior frescoes as public books; Voroneț blue as pigment that held.  
4. **How the country was put together** — 1859 Cuza union; 1918 Transylvania; young modern borders.  
5. **A century, read slowly** — kingdom, dictatorship, Axis shifts, communism, 1989; ask who speaks.  
6. Further lessons (e.g., Thrace and Dacia) continue the slow curriculum.

The site’s own disclaimer-like pedagogy—“Imagined art” beside lessons; pictures “not evidence” but a way to stay with the place—mirrors BBS/engine exactness: **do not pretend images are proof beyond what they are**.[^panatau] Themes (Voroneț / Dusk / Folk / Wood) are orientation systems, akin to ACES/Gamma theatrical modes in Ra: same content, different atmospheric contract.

Guitar blog adjacency remains optional and low-weight.[^blog-guitar]




# Chapter 9. Synthesis: The Owned Pipelines Thesis

## 9.1 Statement of the thesis

**Owned Pipelines thesis.** Practitioner knowledge in interactive computing becomes uniquely dense, transferable, and ethically accountable when the same practice retains vertical responsibility across consecutive layers of a pipeline—hardware-adjacent rendering and input, authoring tools, shipped product feel, distribution contracts, and living community infrastructure—long enough for those layers to generate reciprocal constraints (back-talk) that the practitioner must document and design with.

Ownership, in this sense, is not a purity spiral against using libraries (Ra uses tinygltf, GLFW, Lua, Vulkan). Ownership means **not outsourcing the identity-bearing layer** and not orphaning the feedback that identity-bearing layers produce.

## 9.2 The stack (Figure F1 in prose)

1. **Metal / API reality** — Vulkan 1.4 RT, vendor quirks (RADV), validation, MangoHUD conflicts.
2. **Representation** — per-object BLAS, world-space baking, CameraUBO treaties, GLTF+KHR+RA extras.
3. **Authoring HCI** — terminal-first F-key editor, fly mode, hierarchy groups.
4. **Soft logic** — Lua hot-reload with explicit durable vars.
5. **Feel** — coyote time, gravity, scoring; and separately, tetromino delay/repeat and wall kicks.
6. **Product proofs** — Launch Up, Laser Tag, Ablockalypse.
7. **Contract** — $49.99 permanent seat, one-seat catalog editing, EA bounds, revenue share terms.
8. **Living network** — BBS directory aggregation + connection ethics.
9. **Attention craft** — photography and cultural systems.

Fragmented pipelines optimize each layer locally. Owned pipelines optimize the *handshakes*.

## 9.3 Knowledge claims mapped to evidence (Table T7)

| Claim | Evidence type | Primary handles |
| --- | --- | --- |
| RT-only renderer as identity | Operator docs + Steam | digiflux.one/docs/; app 4732830 |
| AS/UBO discipline as governance | Pitfall tables, struct lists | Ra docs §§03–04, §11 |
| Terminal-first HCI as affordance bet | Feature docs + Steam bullets | Ra docs §08; Steam features |
| Lua state policy as reflective loop support | Lua API docs | digiflux.one/docs/lua-api |
| Feel ownership in puzzle craft | CIC/itch feature lists | coloritcompany.com; itch.io |
| Market design as craft | EA FAQ + pricing text | Steam Ra Engine page |
| Preservation ethics in aggregation | Directory disclaimer copy | coloritcompany.com/bbs |
| Attention adjacency | Public media sites | stevenphilley.com; panatau.com |

## 9.4 Relation to reflective practice literature

Schön’s reflection-in-action describes the online dance with a situation’s back-talk.[^schon-1983] Ra’s pitfall table is back-talk archived. Candy and Edmonds’s insistence on relating theory, practice, and evaluation supports treating shipped systems and public docs as evaluable outcomes, not merely expressive artifacts.[^candy-edmonds]

Gibson/Norman affordances clarify why UI philosophy and feel constants are epistemological, not cosmetic.[^gibson-1979][^norman-doe] Swink and Gregory provide vocabulary for feel and engine subsystem ownership.[^swink][^gregory] McCandless bridges theatrical judgment into computational light.[^mccandless]

## 9.5 Transferability patterns

Without claiming universal laws, the practice yields portable patterns:

1. **Document silent failures harder than loud ones** (UBO mismatch > segfault).
2. **Publish vendor quirks as first-class content** (RADV primitiveOffset).
3. **Make durable vs ephemeral state explicit** across hot-reload boundaries.
4. **Prefer open interchange formats** for scenes you want to outlive a binary.
5. **Price tools like instruments you will still stand behind next year.**
6. **Let games be the integration tests.**
7. **When aggregating culture, credit sources and bound your probes.**
8. **Keep an attention practice outside the IDE** (light, place, culture) so lighting and feel do not become purely numerical.

## 9.6 What ownership is not

- Not a refusal of engines for everyone else.
- Not a moral ranking of Unity/Unreal users.
- Not a guarantee of market success.
- Not a substitute for collaboration or for reading the graphics literature.
- Not an institutional PhD.

## 9.7 Limits revisited

Public-artifact method cannot recover private mentoring, unlogged experiments, or emotional labor. hipck.com remains unverified in the inventory pass and is excluded from claims.[^inventory] Pre-Adobe decades remain hooks. Performance metrics not published by the author are not invented here.

## 9.8 Chapter claim

**Claim C9:** Across Ra, Digiflux economics, Ablockalypse feel, BBS directory ethics, and media adjacency, the Owned Pipelines thesis holds as a coherent practice-based account: vertical responsibility creates denser knowing because constraints propagate and are forced into documentation, product shape, and public accountability.

## 9.9 A short manifesto for practitioners (optional creed)

1. Own the layer that makes your work recognizable.
2. Document silent failures first.
3. Let products test tools continuously.
4. Price as if you must look buyers in the eye next year.
5. Credit upstream culture when you aggregate.
6. Keep an attention practice that is not a screen of code.
7. Mark what you do not know.
8. Do not rent your epistemology.

This creed is not in the public CIC pages; it is a synthesis device of this monograph and should be adopted only if Steven’s revision endorses it in first person.

## 9.10 Comparative sketches (non-empirical)

Without pretending to systematic comparison:

- **General engines** maximize breadth and plugin ecology; ownership of identity layers is optional and often lost.
- **Minimal SDL games** maximize feel ownership, sometimes at the cost of content pipeline leverage.
- **Ra/Digiflux** attempts a mid-path: narrow but deep RT ownership, open scenes, Lua membrane, catalog economics.
- **BBS directory** shows ownership applied to cultural maps rather than frames per second.

These sketches invite future comparative appendices; they do not substitute for them.


---


## 9.11 Synthesis after Draft 1.1 evidence thickening

Draft 1.1 densifies the thesis with citable feel numbers (180/45), a public SDL architecture map (`ley::` State/UI/gfx/Input), Steam/AI disclosure ethics, BBS snapshot metrics, Lua API taxonomy, and honest copy-drift flags ($49.99 vs $250; Launch Up store↔manual). The Owned Pipelines claim does not become “proven” in a laboratory sense; it becomes **harder to dismiss as vibe**. Each new public handle is another place constraints talk back across layers.

Linda Candy’s later monograph on the creative reflective practitioner, Smith & Dean’s practice-led research web, Borgdorff’s artistic-research faculty conflicts, and Nelson’s practice-as-research protocols supply additional language for why doctoral *form* can travel with artifacts even when institutional candidacy does not.[^candy-2019][^smith-dean][^borgdorff][^nelson] This self-directed dissertation borrows that epistemic seriousness while repeating: **not a conferred PhD**.

## 9.12 Comparative sketch sharpened

See also the dedicated comparative ownership table below. Mid-path reading of Ra/Digiflux stands clearer beside Ablockalypse’s source-available custom license and Unity/Unreal’s rented breadth: different ownership contracts, different failure modes, shared need for identity-bearing layer responsibility.




## 9.13 Layer-by-layer reciprocity (post–Draft 1.1)

Revisit Figure F1 with new handles:

1. **Metal/API** — Vulkan RT; RADV notes; MangoHUD ban.  
2. **Representation** — per-object BLAS; CameraUBO growth 24→~30; GLTF extras.  
3. **Authoring HCI** — F1–F4; HierarchyView key-repeat parameters.  
4. **Soft logic** — 48-function Lua taxonomy; hot-reload mortality of locals.  
5. **Feel** — Launch Up 0.15s coyote / −18 gravity; Ablockalypse **180/45** delay/repeat.  
6. **Product proofs** — Ablockalypse 1674300; Launch Up 4705880; Laser Tag announced-only.  
7. **Contract** — $49.99 permanent (Steam); docs $250 drift flagged; AI Firefly disclosure.  
8. **Living network** — 1304/1092 BBS snapshot; 17 sources; connection≠login.  
9. **Attention craft** — nine-image California sequence; panatau lesson architecture.

Reciprocity examples now citable: Lua moves trigger BLAS cost; editor key-repeat philosophy echoes player delay/repeat; BBS disclaimer tone matches engine pitfall tone; photography warm→cool sequencing rhymes with ACES/Gamma theatrical choice.

## 9.14 Against purity spirals

Ownership epistemology fails if it becomes contempt for people who rent engines to ship joyful games. The thesis is narrower: **if** you claim deep knowing about feel, light, markets, or preservation, **then** vertical responsibility and public exactness are how that knowing becomes examinable. Unity teams can meet that bar inside subsystems; Ra/Ablockalypse are simply unusually legible case studies because their public artifacts argue in operator prose.




## 9.15 Draft 1.2 synthesis addendum — drift, catalogs, and disconfirmation

Draft 1.2 densifies Owned Pipelines along three axes:

1. **Documentation Drift as Epistemic Object** — mismatches become Table-T13-style evidence.
2. **Technical appendices** — Lua API catalog + competitive feel instrument pair Launch Up constants with Ablockalypse 180/45 and wall-kick grammar.
3. **Expanded falsifiability** — explicit disconfirmers (including drift denial and credential smuggling) protect the thesis from mystique.

The stack metaphor (metal → shaders/AS → editor → Lua/feel → storefront → living network) now has sharper failure modes at the storefront↔docs and probe↔login joints. Reciprocity still holds when those joints are *named*.

Additional Draft 1.2 densifiers folded from `02-draft12-sources.md`: file:line `check_timers` / `rotateWithKick` / `PlayState` cites; Launch Up manual Ch01–08 pedagogy; Steam wall-run + monthly roadmap/polls; BBS Snapshot B **1322/1099** + anonymized EN/DE/ZH patterns; digiflux `/products` **404** as commercial-surface geography; fair Ra vs Unity/Unreal ownership table; Appendix H cite card. Word count grows by *handles*, not adjectives.


---

# Chapter 10. Conclusion and Future Work

## 10.1 Recapitulation

This self-directed practice-based doctoral dissertation asked what knowledge appears when pipelines are owned. Using only verified public artifacts and real literature, it read Ra Engine as an RT-owned renderer with terminal-first HCI and Lua membrane; Ablockalypse as feel ownership; Digiflux as market-design craft; the BBS directory as living-network systems ethics; and photography/cultural sites as attention adjacency. It advanced the Owned Pipelines thesis and refused institutional degree theater.

## 10.2 Future work (public roadmap only)

From Steam Early Access disclosures and Digiflux docs, future work already on the public record includes:[^steam-ra][^ra-docs]

- Spot light cone editor with visual gizmos
- Full GLB loading support
- Expanded Lua scripting API
- Third-person camera system
- Denoiser for glossy reflections
- Additional documentation and example scenes
- Steam Workshop integration for Digiflux.one titles
- Continued production on Laser Tag (free RTX arena shooter; Workshop editing via Ra) and Launch Up level/tooling depth
- Ablockalypse roadmap themes (localization, modes, multiplayer, VFX) as publicly listed intentions[^cic-ablock-features]

This dissertation’s research future, distinct from product roadmap, includes: author-expanded first-person chronology; measured performance appendices if/when the author publishes numbers; comparative studies with other owned indie engines; and longitudinal evaluation of whether the 6–12 month EA bound and Workshop promises hold—an accountability study the public record will enable.


## 10.3 Contributions restated for skimmers

1. Owned Pipelines thesis as practice epistemology  
2. Technical monograph reading of Ra Engine public architecture  
3. Feel-systems reading of Ablockalypse public craft  
4. Market-design reading of Digiflux seat/EA statements  
5. Preservation-ethics reading of the BBS directory  
6. Attention-adjacency reading of photo/cultural sites  
7. Self-directed doctoral form with repeated non-credential framing  

## 10.4 Closing

Computing culture did not begin in app stores, and it will not end in them. Somewhere between a Telnet banner, a CameraUBO field list, a coyote-time constant, and a Pacific cliff photograph, a single practice can still choose to own the handshakes. That choice is not a degree. It is a discipline. This monograph exists to make that discipline examinable.

If the author later deposits a revised edition with first-person chronology and measured appendices, the public-artifact spine of Draft 1.0 should remain intact: still verifiable, still disclaimer-first, still allergic to fake precision.


---


---

# Interlude A. Deep Dive Worked Examples from Public Docs

This interlude densifies Chapters 4–6 with worked readings of public examples. No private metrics are invented; code and constants are those already published on digiflux.one.

## A.1 Launch Up as an owned feel–render handshake

Launch Up is the clearest public proof that Ra’s RT pipeline and Lua membrane are not parallel hobbies. Docs describe a vertical FPS platformer with height-based scoring at **100 points per metre**, **coyote time 0.15s**, and engine gravity **−18.0**. The tutorial scene `scenes/launch_up_tutorial1.gltf` contains rising platforms and a goal pad at **Y = 26.5m**.

Read as practice knowledge:

1. **Score is spatial.** Binding score to height makes the world Y-axis into an economic axis. The HUD API (`engine.set_hud_data(score, height)`) institutionalizes that binding in the RT image.
2. **Coyote time is mercy with a number.** 150ms of forgiveness is a competitive-feel constant published beside theatrical lighting—an Owned Pipelines handshake between compassion in input and severity in light.
3. **Gravity −18** is steeper than “Earthlike −9.8,” a common platformer choice favoring readable arcs. Publishing it lets others reason about jump height and hang time without reverse-engineering a binary.
4. **Goal pad authorship** in Lua (hide → tiny scale → lerp to 1.0 → finish throb) shows that juiciness is script-side while GI/emissive response remains renderer-side. When checkpoint glows flash orange at high emissive intensity, they literally feed RTX GI—feel becomes light.

The Lua docs’ bulk discovery pattern (`find_objects_by_prefix("platform_hazard_")`) further encodes a naming contract into the pipeline: **scene authors and scripters share a grammar**. That grammar is ownership infrastructure.

### A.1b Manual pedagogy vs store wall-run (Draft 1.2)

Appendix G and §6.20–6.21 now treat the Launch Up manual’s Ch01–08 as a **feel curriculum** (coyote/buffer/death plane/five-point cast/hazard bestiary/Level 1 numbers/F2 RT literacy). Steam’s additional “wall-running” current-state bullet is recorded as COPY DRIFT relative to thin manual pedagogy—not as a fabricated constant. The handshake claim still holds for the *documented* feel set; wall-run awaits either manual depth or author clarification.


## A.2 Hot-reload as epistemology

Hot-reload is usually sold as convenience. Ra’s documented behavior makes it an epistemic device:

- `stat()` every frame detects mtime change.
- `shutdown()` → destroy `lua_State` → fresh state → bind API → run file → `init()`.
- Locals die; `set_var` floats in C++ survive.
- On syntax/runtime error, previous working state is kept; further reloads suppressed until next save.

This is Schönian instrumentation. The practitioner converses with a live situation; the system distinguishes **experiment state** (Lua locals) from **commitment state** (C++ vars). Scene loads defer to next frame and re-call `init()`, teaching authors not to cache object IDs across transitions.

Compare fragile patterns in many engines where “enter play mode” destroys half your mental model without telling you which half. Ra documents the mortality of state.

## A.3 Ray payload flags as design compression

`fromGI` and `fromRefraction` are tiny integers/flags with large design meaning:

- GI rays skip shadow rays → halves secondary cost, accepting a biased but shippable look.
- Refraction chains suppress reflection spawning without breaking enter/exit pairs → prevents combinatorial explosion inside glass.

These are not only optimizations; they are **taste under budget**. Owned pipelines must encode taste in flags because there is no separate rendering department to absorb the politics of “good enough GI.”

## A.4 Console View as creator trust

F1 Console View captures a 500-line ring buffer, strips ANSI for storage, recolors by severity, and still tees original colored output to the real terminal. Rendering writes through `origCout_` to avoid recursive capture.

Why this matters: creator tools either respect logs or fight them. An RT engine that segfaults under MangoHUD and simultaneously offers a first-class scrollable console is making a coherent claim—**instrumentation must be native, not parasitic**.

## A.5 One-seat economics as level-design democracy

If Laser Tag is free and arenas are editable only with Ra, the $49.99 seat is not merely a tool purchase; it is a **franchise key** for authorship. Workshop (roadmap) then becomes the distribution valve. The political reading is mild but real: free-to-play shooter meets paid creator instrument, without claiming exploitative battle-pass machinery that the public record does not describe.

The permanent price statement tries to short-circuit EA cynicism. Whether successful is an empirical question for later; as design rhetoric it is already analyzable.

---


## A.6 Documentation drift as first-class evidence

Draft 1.1 elevates copy drift from nuisance to method object; **Draft 1.2 promotes it to a major section** (“Documentation Drift as Epistemic Object”) with Table T13-style register. Short form remains here:

| Drift | Sources | Handling |
| --- | --- | --- |
| Lua “30” vs ~48 | digiflux hub vs lua-api quick reference | Prefer quick reference; note hub lag |
| CameraUBO 24 vs ~30 | earlier reading vs ambient-sky fields | Date the reading; keep treaty lesson |
| Ra $49.99 vs $250 | Steam vs docs footer observation | Steam commercial record; flag docs |
| Launch Up tone | Steam fantasy vs manual hazards/death | Present both; author resolves |
| Ablockalypse EA end-2025 | Store text vs 2026 still-EA possibility | Accountability surface |

Research through practice must love dated URLs more than smooth brochures.[^expansion-pack]

## A.7 Ablockalypse session skeleton (public)

Conceptually, from blog + source concordance:[^blog-input][^sdl2-blocks]

1. SDL events arrive; KEYDOWN ignores OS repeats.  
2. Binding multimap resolves scancode+modifiers → `ley::Command`.  
3. Delay/repeat timers (defaults 180/45) may enqueue additional commands.  
4. `GameController` pops queue; updates video fullscreen flags; dispatches to model/state machine.  
5. Board/block systems advance under gravity/level rules; wall kicks apply if enabled.  
6. Localization layer supplies strings for options labels players actually see.

That skeleton is enough for another engineer to recognize the instrument without this monograph inventing DAS folklore charts.



# Interlude B. Extended Literature Conversation (Without Fake Citations)

## B.1 Schön’s back-talk and the pitfall table

Schön describes practitioners who reframe when materials talk back. Most engineering blogs perform this as story. Ra’s pitfall table performs it as **tabular institutional memory**. Each row pairs symptom and fix—convertible into onboarding, into future-you protection, into dissertation evidence.

The silent failures (UBO mismatch, RADV primitiveOffset ignored) are especially Schönian: the situation’s back-talk is muted, so the practitioner must amplify it in docs or be gaslit by their own GPU.

## B.2 Candy & Edmonds: evaluation without lab cosplay

Practitioner research requires relating theory, practice, and evaluation. This dissertation evaluates by:

- Internal coherence (does the stack’s constraints match its rhetoric?)
- Public inspectability (can a reader verify claims at URLs?)
- Shipping existence (games and storefront pages exist)
- Ethical bounding (disclaimers on BBS page; degree disclaimer here)

It does **not** evaluate by inventing user studies or NPS scores.

## B.3 Gibson/Norman: terminal-first as ecological niche

If the viewport is the ecological field where meaning lives (reflections, fog, emissive bleed), then overlay-heavy editors are invasive species. Terminal-first UI keeps the niche clean at the cost of discoverability for GUI-native users. That trade is honest when marketed to “developer-native workflow” audiences, as Steam copy does.

## B.4 Swink: feel constants as publishable research objects

Game feel literature argues sensation can be designed. Publishing coyote time, gravity, and scoring rates treats feel constants like shader constants—versionable, criticizable, improvable. Ablockalypse’s configurable delay/repeat goes further by handing the instrument knobs to players.

## B.5 McCandless vs. filmic defaults

Filmic tonemapping defaults encode a cinema metaphysics. McCandless encodes a stage metaphysics: visibility, modeling, composition. Ra’s documented preference for Gamma Off + ACES Off as vivid theatrical default is a philosophical fork expressed in three boolean-like UBO fields.

## B.6 Real-Time Rendering / PBRT / Vulkan as literacy, not decoration

Citing Akenine-Möller et al., Pharr et al., and Khronos is not name-dropping. They mark literacy baselines. Ra’s public docs assume a reader who can survive BLAS talk. This dissertation mirrors that literacy rather than translating everything into soft metaphor.

## B.7 Network history without romantic fog

Hafner & Lyon’s internet origin narrative and textfiles-style BBS archives remind us that networks were always socio-technical systems with operators. CIC’s directory is contemporary operator work: maps, probes, credits. The through-line from Digital Aquarium’s public listing to a worldwide directory is suggestive continuity—completed only when the author expands it honestly.

---


## B.8 Draft 1.1 literature cohort (roles, not name-drops)

| Work | Role in this monograph |
| --- | --- |
| Candy 2019 *Creative Reflective Practitioner* | Extends making-as-research beyond 2010 Leonardo article |
| Smith & Dean 2009 | Practice↔research cyclic web for multi-artifact corpus |
| Borgdorff 2012 | Warns against fake academic legitimacy; hardens disclaimer ethic |
| Nelson 2013 PaR | Documentation/reflection protocols for Ch2 success criteria |
| Driscoll 2022 *Modem World* | Scholarly BBS/modem prehistory for Ch3/Ch7 |
| Scott 2005 *BBS: The Documentary* | Audiovisual cultural source; non-monograph citation type |
| Anthropy 2012 *Zinesters* | Indie authorship frame for custom tools / small seats |
| *Ray Tracing Gems* 2019 | Hardware-RT craft companion to Ch4 literacy |
| Juul 2005 *Half-Real* | Rules/fiction; EA incompleteness; Digiflux seat as passport |
| Galloway 2004 *Protocol* | Control after decentralization; directory handshake politics |
| Rheingold 1993 *Virtual Community* | Early online community ethnography adjacent to boards |
| Salen & Zimmerman 2003 *Rules of Play* | Design fundamentals vocabulary beside Swink feel |

These works thicken method and context; they are not pretended co-authorship of Ra or Ablockalypse.




# Interlude C. Methodological Audit Trail

To help future revisers (including Steven) audit this draft:

1. **Primary technical assertions about Ra** were cross-checked against digiflux.one/docs/ and lua-api pages during drafting (September 2026 window).
2. **Commercial assertions** were cross-checked against Steam app 4732830 Early Access FAQ text.
3. **Ablockalypse features** were taken from coloritcompany.com and itch.io public pages.
4. **BBS ethics language** was paraphrased carefully from coloritcompany.com/bbs.
5. **Photography sequencing** paraphrased from stevenphilley.com.
6. **No performance milliseconds, player counts, revenue figures, or private emails** were invented.
7. **hipck.com** excluded.
8. Where LinkedIn is used, it is for public role framing and publicly posted product statements only.
9. Draft 1.2 additionally cross-checked file:line cites against `/workspace/dissertation/vendor/sdl2-blocks` and refresh facts in `/workspace/dissertation/02-draft12-sources.md` (BBS 1322/1099; Launch Up Steam wall-run/roadmap/polls; digiflux `/products` 404).

If a URL changes, replace handles in References and Appendix A; do not silently “update” factual claims without re-reading sources.

---

# Chapter 4 Supplement — Architecture Patterns Worth Stealing (Ethically)

These patterns are transferable *ideas*, not an invitation to copy proprietary code:

1. **World-bake + identity instances** when you want simpler closest-hit math and can afford rebuilds on moves.
2. **UBO field-order linter ritual** (even if manual): print a shared header comment block in every shader.
3. **Payload flags for path economics** (`fromGI`, `fromRefraction`) as first-class design docs.
4. **Hot-reload with explicit durable store** instead of pretending script VMs keep your childhood intact.
5. **Pitfall tables in public docs** as community onboarding.
6. **`--no-mango` style hard rules** when overlays violate lifetime contracts.
7. **Open scene format + small custom extras** rather than opaque binary scenes.
8. **Games as continuous integration** for the editor that edits them.

---

# Chapter 5 Supplement — Competitive Craft Checklist (for author completion)

When expanding Ablockalypse materials, fill these without inventing:

- [x] Default DAS-like delay (ms) — **180** from `inc/Input.h` (Draft 1.1)
- [x] Default ARR-like repeat (ms or Hz) — **45** from `inc/Input.h` (Draft 1.1)
- [x] Wall-kick *algorithm* walk — public `rotateWithKick` (Draft 1.2); [ ] historical ruleset *name*/SRS lineage still author GAP
- [x] Board size *legal range hints* — lang CSV ~8×8–25×22 (Draft 1.2); [ ] exact default runtime size author confirm
- [x] Gamepad delay/repeat parity — releasenotes 0.6.5.4; [ ] dead-zone numerics if any still GAP
- [ ] Block editor file format (author)
- [ ] Determinism notes for competitive integrity (if any)
- [ ] Known exploit/edge-case list (player-visible)

Draft 1.2 fills algorithm/range evidence from public source; lineage naming, determinism, and exploit lists still await author voice.

---

# Chapter 9 Supplement — Falsifiability (Draft 1.2 expansion)

The Owned Pipelines thesis is a practice claim, not a law of nature. Draft 1.2 expands disconfirmation conditions so the thesis cannot hide behind vibe.

## Falsifiers (would weaken or break the thesis)

1. **Docs↔ship silence** — Public docs diverge sharply from shipped behavior *without acknowledgment* (the opposite of productive COPY DRIFT inventory).
2. **Production-use hollow** — Digiflux titles stop using Ra while marketing still claims production use.
3. **One-seat reneging** — Quiet conversion of one-seat catalog access into undisclosed per-title editor fees.
4. **Directory bad faith** — BBS directory invents boards, fabricates sysops, or hides upstream credit.
5. **Ownership cosplay** — Practice outsources identity-bearing layers (AS strategy, feel defaults, pricing ethics, preservation disclaimers) while still claiming ownership epistemology.
6. **Drift denial** — Steam/docs/manual mismatches are silently “fixed” in rhetoric without fixing surfaces or dating changes (anti-method relative to Chapter “Documentation Drift as Epistemic Object”).
7. **Probe overclaim** — Connection lights are marketed as login tests or safety certifications.
8. **Credential smuggling** — Future editions erase the self-directed / non-institutional PhD disclaimer while keeping doctoral branding.

## Non-falsifiers (do *not* by themselves kill the thesis)

- EA schedule slip *with* public acknowledgment.
- CameraUBO field growth (24→~30) when docs track the treaty.
- Day-scale BBS count movement (1304→1322).
- Small review counts or modest commercial outcomes.
- Author-voiced product-definition repair of Launch Up store↔manual drift.

## Positive stress tests (what would *strengthen* the thesis)

- Laser Tag ships with a real AppID and continues Ra Workshop editing promises.
- Ra EA exits on a disclosed timeline with Workshop policies published.
- Ablockalypse feel defaults remain inspectable across versions (or changelogs explain shifts).
- BBS directory retains credit + probe epistemology under growth.
- Author chronology expansion that adds artifacts, not vibes.

Falsifiability keeps a practice-based dissertation from becoming unfalsifiable mystique.




---

# Extended Chapter Commentary: Reading the Public Record as a Monograph

The sections below intentionally lengthen the dissertation toward monograph scale by slow reading—staying with public materials until transferable claims stabilize. They do not introduce new unverified biography.

## E.1 Why “doctoral form” without a registrar

Universities bundle three things that are often conflated: (1) supervised training, (2) credential signaling, and (3) archival genres for knowledge. This document borrows (3), declines to fake (2), and leaves (1) as the author’s lifelong self-supervision plus whatever mentors they later name in expansion hooks.

The ethical hazard of self-directed “doctoral” language is obvious: readers might skim the title and miss the disclaimer. That is why the disclaimer appears in the title block, the declaration section, the abstract adjacency, and the closing line. Repetition here is not vanity; it is harm reduction.

Practice-based fields already recognize artifact-centered doctorates inside institutions. The wager of this draft is that the *epistemic* portion of that tradition—artifact, reflection, situated claim, bibliography—can travel outside the registrar if and only if credential claims do not smuggle along.

## E.2 The inventory as corpus

Ordinary dissertations sometimes treat a single system as case study. Here the corpus is plural but bounded:

- One RT engine/editor with unusually complete public operator docs
- Two Digiflux game proofs (Launch Up detailed; Laser Tag publicly positioned)
- One custom-SDL competitive puzzle title
- One living network directory with explicit ethics
- Two media-adjacent sites (photo; cultural learning)
- A public professional trail (Qt → Premiere → CIC founder)

Plurality matters. Owned Pipelines would be weaker if it only romanticized rendering. Feel, markets, and networks are where ownership claims often quietly die.

## E.3 Slow reading: `go.sh` as culture

Consider the humble launcher. Flags like `--skip-compile`, `--no-mango`, `--play`, `--validate`, `--clean` encode a studio culture:

- Iteration speed is sacred (`--skip-compile`).
- Known lethal overlays are banned, not wished away (`--no-mango`).
- Play and edit are close (`--play`, scene positional args, `.last_scene` memory).
- Truth-seeking tools are available (`--validate`).
- Scorched-earth rebuild remains an option (`--clean`).

Cultures that do not write launchers like this often hide equivalent knowledge in tribal Discord lore. Publishing the launcher flags is a knowledge-management act.

## E.4 Slow reading: HierarchyView constructor as HCI archaeology

The documented `HierarchyView` constructor takes a long ordered parameter list: scene manager, lights pointer, lights-need-update flag, callbacks for light delete/add, object add, save, TLAS rebuild, snap-to-ground, material update, materials pointer, key repeat delay, key repeat rate.

That list is a fossil record of editor responsibilities. Callbacks for TLAS rebuild and snap-to-ground sitting beside key-repeat parameters show graphics invalidation and human motor control in one type signature. Owned pipelines collapse layers until the type signatures look “too busy.” Busy can be honest.

## E.5 Slow reading: move-from-snapshot against float drift

Pitfall: moving objects via delta without snapshot yields float drift. Fix: always move from `originalVertices` snapshot + new position. Lua further exposes `get_object_rest_center` as the immutable load-time centroid for consistent pivots across hot-reloads.

This is numerical analysis as product design. Many shipped tools accumulate microscopic transform rot until scenes “feel cursed.” Documenting snapshot discipline is how a solo practice refuses cursed scenes.

## E.6 Slow reading: influence radius culling

`influenceRadius = sqrt(light.intensity * 1000.0)` skips distant lights without shadow rays. Combined with inverse-square calibration advice, the engine teaches authors to think in intensities that mean something in metres. Theatrical instinct plus physical falloff plus computational culling become one loop.

## E.7 Steam EA as a design document genre

Engineers often ignore storefront FAQ answers. For practice-based research they are gold: they force developers to narrate incompleteness, timeline, pricing, and community process under a public audience. Ra’s EA answers are unusually concrete (feature lists now vs later; 6–12 months; permanent price). This dissertation treats that concreteness as a virtue regardless of future schedule slip—because concreteness can be audited.

## E.8 Ablockalypse and the politics of “yet another tetromino”

Genre fatigue is real. The practice answer visible in public copy is not “revolutionize genre,” but **instrument quality**: wall kicks, configurable delay/repeat, dynamic board, block editor, gamepad parity. That is craft ideology: the world may not need another tetromino, but players need good instruments, and instruments are justified by feel precision.

Shipping on both Steam and itch, Windows and Linux, further mirrors Ra’s Linux-honest posture.

## E.9 BBS directory filters as theory

Filters for connection type (Telnet, SSH, Web, Dial-up), software, status windows (24h/72h), and language are not merely UX chips. They operationalize a theory of the contemporary BBS field: multi-protocol, multi-lingual, partially reachability-known. “Not checked” as a first-class status prevents false certainty—an epistemological UI choice.

## E.10 Photography sequencing as argument

Arranging images warm to cool is an argument about time of day and color temperature. Engine authors who only ever see ACES previews can forget that human sequencing of light is older than GPU queues. Keeping a public photo sequence online externalizes that memory.

## E.11 Toward a curriculum of ownership

If this monograph were used as a teaching artifact (informally), a curriculum might be:

1. Read Ra pitfall table aloud; implement a tiny Vulkan sample that fails similarly.
2. Tune a jump with published coyote/gravity style constants; write a paragraph on mercy vs difficulty.
3. Price a hypothetical tool with permanent vs temporary discounts; defend the choice.
4. Aggregate a tiny public dataset with credits and probe disclaimers.
5. Shoot five photographs for lighting reference; place analogous lights in any RT or PBR scene.

That curriculum needs no fake degree program; it needs discipline.

## E.12 On AI-assisted programming (bounded)

Public career tags include AI-assisted programming. This draft does **not** invent a workflow. It notes only that assistance tools, like engines, can become rented pipelines that erode ownership if accepted uncritically. The Owned Pipelines thesis implies a stance: assistants may accelerate typing; they must not become the unexamined author of identity-bearing layers (AS strategy, feel constants, pricing ethics, preservation disclaimers).

> **Practitioner note / open for author expansion:** Describe your actual AI-assisted boundaries in CIC work—review rituals, rejection patterns, what you never outsource.

## E.13 Word on transfer to other domains

Though examples are games/graphics-heavy, Owned Pipelines patterns transfer to:

- Audio toolchains (DSP ownership vs endless plugin stacks)
- Robotics (sensing → planning → actuation handshakes)
- Creative writing platforms (editor ↔ publish ↔ community moderation)
- Scientific visualization (data schema ↔ renderer ↔ paper figures)

Wherever layers co-determine meaning, vertical responsibility densifies knowledge.

## E.14 Final stress test of claims C4–C9

- **C4 (Ra depth):** Supported by extensive public docs; strongest claim in the monograph.
- **C5 (feel ownership):** Supported at feature level; Draft 1.2 supplies public defaults (180/45), wall-kick algorithm walk, and Launch Up constant table—still thin on private playtest metrics (correctly).
- **C6 (market craft):** Strongly supported by Steam EA text; outcomes unknown.
- **C7 (BBS ethics):** Strongly supported by directory self-description.
- **C8 (media adjacency):** Interpretive but grounded in public sites; causal photo→engine links need author voice.
- **C9 (synthesis):** Holds as coherent reading of C4–C8; not a statistical law.

## E.15 Acknowledgements posture

A self-directed draft still depends on upstream publics: Khronos; GLTF ecosystem; Telnet BBS Guide and other list maintainers; Steam as distribution infrastructure; readers who enforce the degree disclaimer. Author expansion should thank humans by name where appropriate—without inventing mentors who were not there.




---

# Annotated Field Commentary: CameraUBO as Treatise

The following commentary walks the publicly documented CameraUBO fields as a miniature treatise on what an owned RT editor must continuously tell the GPU.[^ra-docs] Field names are from docs; commentary is interpretive practice knowledge.

1. **viewInverse / projInverse** — Camera basis for primary ray generation. Ownership implication: fly-mode roll must truly update the basis (`cameraUp`), or later fields become lies painted on a wrong ray.
2. **numLights** — Bridges CPU light list and shader loops; culling still happens per-hit via influence radius.
3. **frameCounter** — Time’s integer heartbeat for stochastic patterns and debugging.
4. **aaSamples / jitterStrength / aaPattern** — Anti-aliasing as first-class UBO policy, not only a swapchain afterthought.
5. **reflectionsEnabled / maxBounces / glossySamples** — Reflection economy knobs; taste under budget.
6. **emissiveStrength** — Global lever on emissive contribution to the theatrical image.
7. **fogDensity** — Depth fog as atmosphere authorship (Steam also names exponential depth fog).
8. **giSamples** — Off/1/2/4 multi-sample single-bounce GI; discrete steps teach authors about cost cliffs.
9. **acesEnabled / gammaEnabled** — Color management metaphysics in two switches; preferred vivid theatrical default documented when both off.
10. **highlightFirstVertex / highlightVertexCount / highlightStyle** — Selection/debug highlighting encoded beside beauty settings—editor truth and frame beauty share a buffer.
11. **flyCrosshairEnabled** — Crosshair drawn in raygen post-pass; play/edit HUD inside RT.
12. **hudEnabled / hudScore / hudHeight** — Launch Up’s spatial economy wired into the same treaty.
13. **reachIndicatorEnabled / reachIndicatorNorm** — Interaction affordance visualization; layout-synced even where not consumed.

A rented pipeline often splits these concerns across five subsystems with five GUIs. Ra’s treaty says: one struct, one order, one chance to silently corrupt everything. That severity is pedagogical.

---

# Annotated Walkthrough: A Public Lua Session Skeleton

Using only patterns published in the Lua API docs, a canonical Launch-Up-like session looks like this conceptually:[^lua-api]

1. Engine loads scene GLTF; builds per-object BLASes; binds Lua.
2. `init()` restores `launch_up.score` / peak / level from `get_var`, finds `goal_pad`, discovers hazards by prefix, resets scales, may hide goal.
3. Each `update(dt)`: read input once; update spinners; track peak height; set HUD; test overlaps; maybe `load_scene` next level.
4. On checkpoint: `set_checkpoint`, emissive flash, scale pop.
5. On death/respawn: teleport to checkpoint; zero vertical velocity.
6. On hot-reload mid-play: locals vanish; vars persist; `init` rediscovers IDs—level authors learn to name nodes stably.
7. On shutdown: write vars back.

The session is a research instrument: it forces stable naming, durable state policy, and RT-side emissive feedback into everyday level craft.

---

# Risk Register for the Owned Pipelines Practice

| Risk | Why it matters | Mitigation visible in public record | Residual unknown |
| --- | --- | --- | --- |
| Vendor RT driver quirks | Silent wrong frames | RADV notes, pitfall table | Future vendors |
| Solo bus factor | Knowledge concentration | Public docs as bus-factor insurance | Docs lag |
| EA schedule slip | Trust erosion | Stated 6–12 months bound | Actual dates |
| Workshop moderation load | Community harm | Not yet fully specified publicly | Policies TBD |
| Genre fatigue (tetromino/RT demos) | Market indifference | Instrument-quality focus | Outcomes |
| Overclaiming living BBS map | Cultural damage | Credit + connection≠login disclaimer | Upstream list errors |
| Credential misread of this PDF/MD | Ethical harm | Repeated degree disclaimers | Skimmers |
| digiflux `/products` 404 | Buyers hunt missing pages | Steam + docs footer remain commercial surfaces | Future microsites |
| Launch Up wall-run pedagogy gap | Store promises under-taught mechanics | Flag as COPY DRIFT; author repair | Player confusion |

---

# Style Notes for Steven’s Voice Pass

When replacing hooks, prefer:

- Concrete nouns (BLAS, coyote, Telnet, orchard dusk)
- Short sentences after long technical paragraphs
- Admitting taste (“I want linear vibrancy”) beside physics
- Humor that punches systems, not people
- Zero LinkedIn-speak (“leverage synergies”)

Avoid:

- Invented testimonials
- Fake precision (“37% faster”)
- Mythic lone-genius framing that erases upstream lists, Khronos, and players




---

# Appendix B. Suggested Figure Captions for a Future Illustrated Edition

If Steven later exports diagrams, these captions are ready:

**Figure F1.** Owned Pipelines stack diagram from Vulkan/AS through Lua feel into seat pricing and BBS aggregation.  
**Figure F2.** Primary ray branching with reflection, refraction (`fromRefraction`), and GI (`fromGI`) flags.  
**Figure F3.** Per-object BLAS boxes feeding identity TLAS instances after world-space bake.  
**Figure F4.** CameraUBO as a vertical treaty spanning C++ header and SPIR-V layouts.  
**Figure F5.** Split-screen contrast: ImGui overlay paradigm vs ANSI F-key terminal-first editor beside clean RT viewport.  
**Figure F6.** One Digiflux seat unlocking Laser Tag and Launch Up editing paths into Workshop.  
**Figure F7.** Ablockalypse loop: input delay/repeat → rotation with wall kicks → board reconfiguration.  
**Figure F8.** BBS card UI: upstream credit line + connection light + explicit non-login disclaimer.

---

# Appendix C. Quotation Bank from Public Sources (for author-approved pull-quotes)

Pull-quotes below are paraphrased tightly from public pages; verify wording against live URLs before poster use.

1. Ra docs: every pixel ray traced; no rasterization fallback.  
2. Ra docs: always pass `--no-mango`; MangoHUD segfaults on teardown.  
3. Ra docs: CameraUBO mismatches cause silent data corruption.  
4. Steam: $49.99 per seat and will stay there; not an introductory price.  
5. Steam: one seat covers every Digiflux.one title, current and future.  
6. Steam: Early Access approximately 6 to 12 months.  
7. Steam roadmap items: spot cone editor, GLB, expanded Lua, third-person camera, denoiser, Workshop.  
8. CIC BBS: light is a connection check, not a login test; names not invented here.  
9. Launch Up docs: 100 pts/metre; coyote time 0.15s; gravity −18.  
10. Photography site: images arranged warm to cool—from golden hour through open Pacific.

11. Blog (“The beginning.”): TRS-80 Color Computer 2; Color BASIC ~age 10; MS BASIC shock; Final Fantasy RPG desire.  
12. Blog (“The Start”): IBM 5150 second-grade lab calling vignette (back-dated post caveat).  
13. Blog (input system): multimap bindings; dual delay/repeat timers; skip SDL key repeats.  
14. `Input.h`: `KEY_DELAY_TIME_DEFAULT = 180`; `KEY_REPEAT_TIME_DEFAULT = 45`.  
15. Steam Ablockalypse: Adobe Firefly disclosure for banners and title logo; EA since 2021-07-16; $4.99.  
16. Steam Ra: “$49.99 per seat and will stay there. This is not an introductory price.”  
17. Steam Ra: one seat covers every Digiflux.one title, current and future; Workshop planned.  
18. CIC BBS JSON snapshot (2026-09-09): 1304 systems; 1092 green / 212 red.  
19. CIC BBS page: connection check ≠ login test; names not invented here.  
20. Ablockalypse Source Code License (2025): view/learn/non-commercial run; commercial use by negotiation.  
21. Docs drift note: hub “30 functions” vs lua-api ~48 quick-reference; CameraUBO 24→~30 with ambient sky.  
22. Launch Up manual/docs: coyote 0.15s; gravity −18; 100 pts/metre; jump buffer 0.12s (manual pack).

---

# Appendix C Supplement — Draft 1.2 Pull-Quotes (author-approved candidates)

Short public strings suitable for pull-quotes after Steven’s approval (do not invent):[^blog-input][^blog-localization][^launchup-manual][^steam-ra][^steam-launch][^cic-bbs][^draft12-pack]

**Input / feel (blog + manual):**

- “I have two timers associated with every key.”
- “At the end of the input phase of the game loop I check the timers…”
- “Coyote time means you can jump for a brief window after walking off a platform edge…”
- “The death plane sits at Y = −5 metres.”
- “The engine uses a five-point ground cast…”
- “Contact with any moving obstacle kills instantly — there are no hit points.”

**Localization (blog):**

- “The first parameter is the key for the word, the second is a padding value…”
- Steam SDK + Simplified Chinese intent sentence (cite as intent, not shipped fact).

**Platform (Steam):**

- “Ra Engine is $49.99 per seat and will stay there. This is not an introductory price…”
- “No licensing tiers. One seat per developer.”
- Launch Up: wall-running / monthly roadmap / community polls / playtests bullets.
- Ablockalypse Firefly disclosure sentence (marketing banners + logo).

**BBS (directory):**

- Connection check ≠ login test.
- “Not invented here” provenance stance.

**Docs drift caution for quoters:** never quote $250 as Steam price; never quote hub “30” as the Lua inventory of record without the 48 footnote.

---

# Appendix D. How to Cite This Document

Because this is **not** an institutional dissertation, citations should not imply university deposit. Suggested citation form:

> Philley, Steven. *Owned Pipelines: Practice-Based Knowledge from Thirty Years of Hands-On Computing.* Practice-based doctoral dissertation (self-directed). Color It Company LLC / Flux Studios, Campbell, CA. Draft 1.2, September 2026. Markdown monograph.

Do **not** cite as “PhD dissertation, [University].”

---

# Appendix E. Change Log

| Version | Date | Notes |
| --- | --- | --- |
| Draft 1.0 | 2026-09-09 | Initial public-artifact synthesis monograph created at `/workspace/dissertation/Steven_Philley_Practice_Based_Dissertation.md` |
| Draft 1.1 | 2026-09-09 | Word count **24652** (`wc -w`; Draft 1.0 was 14942). Expansion from public sources pack (`01-expansion-sources.md`) + live fetches: Preface blog self-statements; Ch4 Lua/UBO/price-drift/ray-order/pitfall commentary; Ch5 sdl2-blocks architecture + Input.h 180/45 + releasenotes + license + Firefly disclosure + board/CI notes; Ch6 Workshop/Launch Up/Laser Tag GAP/EA honesty/one-seat research; Ch7 BBS 1304/1092 + 17 sources + ETL/protocol ethics; Ch8 photo/panatau structure; Ch9 reciprocity synthesis; comparative ownership table; expanded failure register; Interlude drift table; twelve added literature works; densification toward monograph scale. |
| Draft 1.2 | 2026-09-10 | Word count **34523** (`wc -w`). Folds `02-draft12-sources.md` + vendor line cites. Adds major section **Documentation Drift as Epistemic Object** (T13 drift register); Ch3 close readings (Driscoll, Swink, Candy); Ch4 McCandless operationalization, full F-key pedagogy, BLAS lifecycle narrative, SPIR-V roles, Linux/RADV/Arc notes; Ch5 `ley::` file walk, public wall-kick code walk, localization CSV craft, Firefly ethics deepen, board-size instrument; Ch7 `bbslist.json` schema + field frequencies + Snapshot B (1322/1099 on 2026-09-10) + probe ethics / multilingual / anti-nostalgia cosplay; Ch9 falsifiability expansion + Draft 1.2 synthesis addendum; **Appendix F** Lua API catalog (48) + minimal script lifecycle; **Appendix G** competitive feel paired case studies (Launch Up × Ablockalypse); refreshed Author Revision Checklist (✅/🔶/❌). Honest COPY DRIFT flags retained. No hipck claims; no Laser Tag AppID invention. |



## 10.5 Future work clarified from public roadmap only

Product-public:

1. Ra EA deliverables already named: spot cone editor/gizmos, full GLB, expanded Lua, third-person camera, denoiser, more docs/examples, **Steam Workshop** for Digiflux titles.[^steam-ra]
2. Continued production use on **Launch Up** (app 4705880) and **Laser Tag** (announced; AppID GAP).[^steam-launch][^expansion-pack]
3. Ablockalypse intentions publicly trailed: more levels/modes, Simplified Chinese, Steam-SDK language detect (blog intent; ship status GAP), feel remapping already landing in 0.7.x notes.[^steam-ablock][^blog-localization][^ablock-releasenotes]

Research-public (this monograph’s next honest moves):

1. Author first-person chronology between Color BASIC and CIC (hooks already planted).  
2. Resolve Launch Up store↔manual definition and Ra $49.99↔$250 docs drift in Steven’s voice.  
3. Publish Laser Tag AppID when live; optional measured appendices (frame times, BLAS rebuild costs, BBS probe methodology paper).  
4. Longitudinal audit of EA time bounds across Ra/Launch Up/Ablockalypse.  
5. Confirm or omit panatau authorship and hipck entirely.

Hardware-RT craft literature such as *Ray Tracing Gems* remains recommended literacy for readers extending Ch4 claims into their own engines.[^rt-gems]




# Comparative Engine Ownership Table (Ra vs Typical Rented Pipelines)

This table is a **conceptual contrast**, not a bench mark and not a moral ranking of Unity/Unreal users. Fairness rule: rented engines provide extraordinary leverage; ownership epistemology asks what identity-bearing knowledge remains in the studio’s hands.

| Dimension | Ra Engine / Digiflux (public posture) | Typical Unity / Unreal rented posture (idealized) | Ablockalypse custom SDL (public) |
| --- | --- | --- | --- |
| Renderer identity | Vulkan 1.4 hardware RT only; no raster fallback claimed | Hybrid raster+optional RT features; broad target matrix | 2D SDL rendering; feel-first |
| Editor HCI | Terminal-first ANSI / F-keys; no ImGui over viewport | Rich GUI editors, marketplace overlays | Custom UI under `ley::UI` / gfx |
| Scene longevity | GLTF 2.0 + KHR + RA extras | Engine-native scenes + exporters; ecosystem lock-in risk varies | CSV piece defs + local assets |
| Script membrane | Lua hot-reload; durable `set_var` policy documented | C#/Blueprints/etc. with vendor update weather | C++ `ley::` game code; CSV bindings |
| Commercial seat | Steam seat; **$49.99** permanent per storefront (docs drift noted) | Editor free tiers + runtime/royalty programs (vendor-specific; changeable) | Game priced **$4.99** EA; source under custom 2025 license |
| Source posture | Public operator docs; engine binary commercial | Engine source access depends on tier/program | Public GitHub source, non-commercial default |
| Failure visibility | Pitfall tables, RADV notes, UBO silent-corruption warnings | Vendor forums, release notes, shared community lore | Releasenotes + blog input essay |
| Platform bet | One seat edits Digiflux catalog; Workshop planned | Store-wide ecosystems already exist | Dual Steam + itch shipping |

**Non-strawman note:** Unreal/Unity teams can practice deep ownership *inside* subsystems. The contrast is about **default epistemic incentives**, not about talent.

## Fair Ra vs Unity/Unreal ownership epistemology (Draft 1.2 sharpening)

The following restates the contrast as *ownership epistemologies*, keeping competitor cells **high-level and fair** (not caricatures; not moral failure). Ra/Steam cells are Grade-A public claims; Unity/Unreal cells are general industry knowledge unless primary vendor docs are cited.[^steam-ra][^ra-docs][^draft12-pack][^gregory]

| Dimension | Ra (public claims) | Typical Unity/Unreal seat (fair, high-level) |
| --- | --- | --- |
| Renderer ownership | Full custom Vulkan 1.4 RT; **no raster fallback** (docs) | Engine vendor owns core renderer; project configures features/quality |
| Editor HCI | Terminal-first ANSI / F-keys; explicitly **no ImGui overlay** | Rich GUI editors (ImGui/Slate/Editor UI families) |
| Scene format | GLTF 2.0 + KHR + RA extras as first-class | Proprietary scenes + optional glTF pipelines / exporters |
| Script membrane | Lua hot-reload; C++ persist vars; ~**48** `engine.*` | C# / Blueprints / large engine API surfaces |
| Licensing rhetoric | One seat / permanent **$49.99** / “no licensing tiers” (Steam) | Seat + royalty / subscription ecosystems (verify current vendor terms before quoting specifics) |
| Platform focus | Linux-first Fedora; RT GPU class called out | Multi-platform first-class targets |
| Catalog promise | One seat edits every Digiflux title | Per-project / store ecosystems differ by product |

**Fairness rule:** rented engines provide extraordinary leverage and literacy; Owned Pipelines asks which identity-bearing layers remain in the *studio’s* hands long enough to talk back. A Unreal team that owns its gameplay framework deeply is not “wrong”—it practices a different default dependency weather. Ra’s public bet is that AS strategy, UBO treaties, feel constants, seat price, and Workshop promises can co-reside in one practice’s reflective field.



# Failure Modes Register (Expanded)

| ID | Failure mode | Domain | Public signal / mitigation | Residual risk |
| --- | --- | --- | --- | --- |
| F1 | Silent UBO layout mismatch | Ra graphics | Docs warn; field-order ritual | Human drift as fields grow 24→30 |
| F2 | Vendor RT quirk (RADV `primitiveOffset`) | Ra graphics | Pitfall table; per-object index buffers | New GPUs/drivers |
| F3 | MangoHUD overlay teardown segfault | Ra tooling | `--no-mango` hard rule | Other overlays |
| F4 | BLAS/TLAS rebuild hitch from Lua moves | Ra feel/graphics handshake | Docs warn `set_object_position` cost | Level-design density abuse |
| F5 | Visibility≠collision | Ra gameplay | Documented limitation | Player confusion |
| F6 | Wall-kick one-sided bug | Ablockalypse feel | Releasenotes 0.7.1 fix | Future rotation edge cases |
| F7 | Accidental hard drop | Ablockalypse feel | Quick-drop cooldown option (0.7.0.6) | Defaults still author-tunable |
| F8 | Localization incompleteness | Shipping | ES shipped; ZH intent; Steam SDK auto GAP | Market coverage |
| F9 | EA schedule slip | Markets/ethics | Public bounds exist to be checked | Trust erosion |
| F10 | Price/docs copy drift ($49.99 vs $250) | Markets/docs | Flagged in Draft 1.1 | Reader confusion |
| F11 | Launch Up store↔manual mismatch | Product definition | Flagged; author resolution GAP | Mis-citation |
| F12 | Laser Tag AppID absence | Platform funnel | Announced only | Overclaim risk |
| F13 | BBS upstream list error propagation | Cultural infra | Credits + non-invention claim | Inherited false boards |
| F14 | Connection light over-read as login proof | Cultural infra | Explicit disclaimer | User misunderstanding |
| F15 | Credential misread of this monograph | Ethics | Repeated non-PhD disclaimers | Skimmers |
| F16 | Solo bus factor | Studio | Public docs as partial insurance | Docs lag |
| F17 | AI asset distrust | Shipping ethics | Steam Firefly disclosure for Ablockalypse | Disclosure fatigue |
| F18 | hipck rumor leakage into claims | Epistemology | Excluded until verified | Gossip pressure |




# Annotated Public Quotations Appendix Growth (Draft 1.1 Commentary)

The quotation bank in Appendix C is not decorative. Each pull-quote is a **handle** another researcher can re-fetch. Draft 1.1 grows the bank because Owned Pipelines knowledge is unusually concentrated in short public sentences that already carry operator force.

## Q.1 On childhood self-statements as evidence grade D/E hybrid

TRS-80 / Color BASIC / IBM 5150 / Final Fantasy lines are SELF-STATED.[^blog-beginning][^blog-start] They authorize Preface vocation framing; they do not authorize invented employment years. The correct scholarly use is: *show the public mythos the practitioner has already published*, then leave chronological meshwork to the author. Back-dating caveats on the 1987-feed post prevent cargo-cult archival citation.

## Q.2 On feel numbers as Grade A once headers are public

Before Draft 1.1, delay/repeat lived as marketing adjectives (“configurable”). After citing `KEY_DELAY_TIME_DEFAULT = 180` and `KEY_REPEAT_TIME_DEFAULT = 45`, the instrument becomes criticizable.[^input-h] Critics may argue 180/45 is too soft or too sharp for modern guideline play; that argument is now possible without reverse engineering a binary. Swink’s vocabulary fits; Salen & Zimmerman’s rules-as-designed-system fits; neither requires fake leaderboard science.[^swink][^salen-zimmerman]

## Q.3 On AI disclosure as shipping ethics

Steam’s Firefly disclosure for Ablockalypse banners and logo is a small sentence with large methodological weight.[^steam-ablock] Practice-based research that ships in public markets must treat disclosure texts as primary sources alongside shaders and timers. Hiding generative marketing assets would corrupt the same exactness ethic that powers pitfall tables and BBS “not invented here” copy.

## Q.4 On BBS counts as ephemeral but citable

1304 / 1092 / 212 will rot.[^bbs-json] Citation must carry the snapshot date (2026-09-09). The durable claim is methodological: aggregation + probe + multilingual filters + login humility. Driscoll and Scott supply historical ears; Galloway and Rheingold supply theoretical ones; CIC supplies an operator implementation.[^driscoll][^scott-bbs-doc][^galloway][^rheingold]

## Q.5 On commercial drift as teachable moment

$49.99 (Steam) versus an observed $250 docs footings is exactly the sort of seam practice-based monographs should *preserve* rather than iron flat.[^steam-ra][^expansion-pack] Likewise Launch Up’s relaxing-store versus hazard-manual seam.[^expansion-pack] Smoothness is often how knowledge dies.

---

# Extended Ch4/Ch5 Crosswalk: Two Engines, One Studio Dialect

| Concern | Ra Engine (public) | Ablockalypse (public) | Shared dialect |
| --- | --- | --- | --- |
| Input timing | HierarchyView `keyRepeatDelay` / `keyRepeatRate` | Player-facing delay/repeat defaults 180/45 | Motor control is first-class |
| Authoring | Terminal F-keys; GLTF extras | Block editor state; CSV pieces/bindings | Authors edit the instrument |
| Hot change | Lua `stat()` hot-reload | Options remaps; config CSVs | Change without full mythic rebuild |
| Public memory | Pitfall table | Releasenotes.txt + blog essays | Back-talk archived |
| License/seat | Steam seat; docs public | Custom 2025 source license | Ownership without default MIT reflex |
| Shipping surface | Digiflux titles as proofs | Steam 1674300 + itch | Strangers complete the experiment |

This crosswalk is the Owned Pipelines thesis in tabular form: identity-bearing layers remain answerable to one practice even when product genres diverge (RT platform tool vs competitive tetromino).

---

# Extended Ch6 Research Note: Early Access as Incomplete Contract

Early Access is often dismissed as marketing fog. Read against Nelson’s PaR documentation ethic and Juul’s rules/fiction split, EA disclosures become **incomplete contracts published on purpose**.[^nelson][^juul]

Ra’s contract publishes: production use on named titles; 6–12 month aspiration; feature delta list; permanent price; one-seat catalog scope; Linux/Vulkan RT requirements.[^steam-ra] Ablockalypse’s contract publishes: comment-driven EA; end-2025 likelihood language; Firefly disclosure; board-size/custom-engine promises.[^steam-ablock] Launch Up’s contract publishes movement/realm expansion intentions beside a manual that already specifies coyote, buffer, death plane, and scoring.[^steam-launch][^launchup-manual]

The researchable question is not “did marketing sound nice?” It is: **which clauses can a third party audit later?** Draft 1.1 answers: many. Laser Tag’s missing AppID shows the opposite—announcement without storefront handle—and is therefore held at GAP.[^expansion-pack]

---

# Extended Ch7 Field Sketch: What 17 Sources Imply

Crediting seventeen upstream lists is not pedantry.[^bbs-json] It encodes a politics of knowledge:

1. **No single canonical BBS census exists**—only federated public lists.  
2. **Regional lists matter** (JP grass-roots, BR RBT, ES FidoNet R34, CN telnet list, LatAm Dock Sud, RU FLY).  
3. **Protocol plurality** (Telnet/SSH/Web/Dial-up filters) matches modem-world historical plurality updated for 2020s transports.  
4. **Software diversity** beyond Synchronet (Mystic, Worldgroup, Enigma, WWIV, Wildcat, …) prevents “Synchronet = BBS” false synecdoche.  
5. **Operator humility** (“not invented here”) is enforceable in UI copy and JSON provenance alike.

Compare enclosed platforms that present a single search box with opaque ranking: the BBS directory’s uglier honesty is the feature.

---

# Preface Addendum: What “backend engineer exploring games” licenses

The public GDC-adjacent self-description—primarily backend engineer exploring games, custom C++/SDL2 EA tetromino—licenses a reading of Ablockalypse as **systems craft entering genre space**, not as a pure design-school artifact.[^linkedin-gdc] It also explains kinship with Ra’s operator-doc culture: both smell like engineers who document handshakes. It does **not** license inventing Adobe-era war stories; those remain practitioner hooks.[^inventory]

Combined with Color BASIC plurality shock and Final Fantasy systems desire, the public origin set is sufficient to motivate the thesis title’s “hands-on computing” phrase while still awaiting a non-fabricated thirty-year mesh.

---

# Reading Path for Draft 1.1 (updated)

1. Front-matter disclaimers (still non-negotiable)  
2. Preface self-stated origins + ethics of thirty years  
3. Ch4 Ra (ray order, UBO drift, Lua 48, pitfalls)  
4. Ch5 Ablockalypse (ley:: map, 180/45, license, Firefly)  
5. Ch6 platform contracts + drift flags  
6. Ch7 BBS method + snapshot  
7. Comparative ownership table + failure register  
8. Ch9 reciprocity synthesis  
9. Author revision checklist (remaining GAPs)

---

# Colophon Word-Count Note (Draft 1.1)

Baseline Draft 1.0: **14942** words (`wc -w`). Draft 1.1: **24652**. Draft 1.2 expands in place from public sources only (drift chapter, technical appendices, chapter thickenings). If honest density cannot reach the aspirational ~35k–45k band without fluff, the monograph stops at true density and reports the actual count—fabrication of anecdotes or metrics is forbidden even to hit a number.




## 10.6 Closing accountability list (public only)

Hold Draft 1.2 to these checkable public commitments—no private metrics required:

1. Ra seat price on Steam remains the commercial citation until docs/$250 drift is author-resolved.[^steam-ra]  
2. Launch Up manual fail-states/hazards remain citeable even if store tone differs.[^launchup-manual]  
3. Ablockalypse delay/repeat defaults remain **180/45** until a future public header changes them.[^input-h]  
4. BBS snapshots are dated: **1304 / 1092 green** (2026-09-09) and **1322 / 1099 green** (2026-09-10)—not eternal.[^bbs-json]  
5. Laser Tag stays announced-without-AppID until a store page appears.[^expansion-pack]  
6. Childhood blog posts stay SELF-STATED with the 1987 back-date caveat.[^blog-beginning][^blog-start]  
7. This file remains a **self-directed** practice-based dissertation—not an institutional PhD award.



# Glossary

**ACES** — Academy Color Encoding System style filmic tonemapping option in Ra.  
**ARR / DAS-like controls** — Auto-repeat / delayed auto-shift style input timing parameters; Ablockalypse publicly exposes configurable delay/repeat.  
**BLAS / TLAS** — Bottom- and Top-Level Acceleration Structures in Vulkan RT.  
**CameraUBO** — Fixed-order uniform buffer bridging C++ host and RT shaders in Ra.  
**Coyote time** — Grace period after leaving ground during which jump still registers; Launch Up: 0.15s.  
**Digiflux** — Platform/catalog around Ra Engine and associated titles.  
**GLTF 2.0** — Open scene format used by Ra with KHR and RA extensions.  
**Owned Pipelines** — This dissertation’s thesis term for vertically responsible practice across stack layers.  
**Per-object BLAS** — Ra architecture giving each scene object its own BLAS with world-baked vertices.  
**Practice-based doctoral dissertation (self-directed)** — Doctoral-form synthesis of practitioner knowledge without institutional degree award.  
**Ra Engine** — Vulkan 1.4 hardware RT editor/game engine by Color It Company / Flux Studios (Steam 4732830).  
**Terminal-first UI** — ANSI/F-key editor philosophy without ImGui over the viewport.  
**tinygltf** — GLTF loader used by Ra.  
**ley::** — Namespace used throughout Ablockalypse (`sdl2-blocks`) for commands, timers, states, and systems.  
**KEY_DELAY_TIME_DEFAULT / KEY_REPEAT_TIME_DEFAULT** — Public Ablockalypse input defaults 180 / 45 (`inc/Input.h`).  
**COPY DRIFT** — Disagreement between two public CIC sources; cited, not silently reconciled.  
**Connection check** — BBS directory probe of reachability; explicitly not a login test.  
**Documentation drift / COPY DRIFT** — Disagreement between public CIC surfaces (e.g., $49.99↔$250; CameraUBO 24↔30; Lua 30↔48; Launch Up store↔manual); cited as epistemic object.  
**check_timers** — Ablockalypse end-of-`pollEvents` lambda (`Input.cpp:132–172,283`) implementing DAS/ARR-like repeat after dual-timer expiry.  
**rotateWithKick** — Public center-relative wall-kick routine (`GameModel.cpp:153–207`); not claimed as SRS.  
  

---

# References

## Primary public artifacts

[^ra-docs]: Flux Studios / Color It Company LLC. *Ra Engine Documentation*. https://digiflux.one/docs/ (accessed drafting window, 2026).  
[^lua-api]: Flux Studios / Color It Company LLC. *Ra Engine — Lua API Reference*. https://digiflux.one/docs/lua-api (accessed 2026).  
[^steam-ra]: Color It Company. *Ra Engine* on Steam (App ID 4732830). https://store.steampowered.com/app/4732830/Ra_Engine/ (accessed 2026).  
[^cic-home]: Color It Company. Studio home / Independent Media & Games. https://coloritcompany.com/ (accessed 2026).  
[^cic-ablock-features]: Color It Company. Ablockalypse public feature and roadmap presentation (studio pages). https://coloritcompany.com/ (accessed 2026).  
[^itch-ablock]: Color It Company. *Ablockalypse* on itch.io. https://coloritcompany.itch.io/ablockalypse (accessed 2026).  
[^cic-bbs]: Color It Company. *Worldwide active BBS directory*. https://coloritcompany.com/bbs (accessed 2026).  
[^photo]: Steven Philley. Photography site. https://stevenphilley.com/ (accessed 2026).  
[^panatau]: *panatau.com* — Romania cultural learning site (public). https://panatau.com/ (inventory-verified presence; consult live site for current curriculum).  
[^linkedin]: Steven Philley. LinkedIn profile (public career framing: Color It Company; Adobe Premiere Pro SDE 4; Mobile Physician Technologies). https://www.linkedin.com/in/steven-philley-7133b6225  
[^linkedin-gdc]: Steven Philley. LinkedIn post on GDC visit and Ablockalypse custom C++/SDL2 engine (public). https://www.linkedin.com/posts/steven-philley-7133b6225_i-went-to-gdc-for-the-first-time-it-was-activity-7310101326204452864-YnEJ  
[^linkedin-lasertag]: Steven Philley. LinkedIn post on Ra Engine video and Laser Tag as free Steam-bound title (public). https://www.linkedin.com/posts/steven-philley-7133b6225_check-out-the-latest-video-of-ra-engine-activity-7486447671352885264-wmn_  
[^textfiles-408]: textfiles.com. *408 BBS List* entry noting Digital Aquarium (1996), Steven Philley, Saratoga, CA. http://bbslist.textfiles.com/408/  
[^textfiles]: Scott, Jason / textfiles.com. BBS and early digital culture archival materials. http://textfiles.com/  
[^inventory]: Practice inventory memo used for this dissertation draft: `/workspace/dissertation/00-inventory.md` (internal drafting aid summarizing publicly verifiable artifacts).  
[^digiflux]: Digiflux platform site. https://digiflux.one/  

## Secondary literature (real works)

[^schon-1983]: Schön, Donald A. *The Reflective Practitioner: How Professionals Think in Action*. Basic Books, 1983.  
[^candy-edmonds]: Edmonds, Ernest, and Linda Candy. “Relating Theory, Practice and Evaluation in Practitioner Research.” *Leonardo* 43, no. 5 (2010): 470–476. See also Candy & Edmonds’s broader practitioner-research program in art and technology.  
[^gibson-1979]: Gibson, James J. *The Ecological Approach to Visual Perception*. Houghton Mifflin, 1979.  
[^norman-doe]: Norman, Donald A. *The Design of Everyday Things*. (Revised edition.) Basic Books, 2013 (orig. 1988 as *The Psychology of Everyday Things*).  
[^rtr]: Akenine-Möller, Tomas, Eric Haines, and Naty Hoffman. *Real-Time Rendering*. 4th ed. A K Peters / CRC Press, 2018.  
[^pbrt]: Pharr, Matt, Wenzel Jakob, and Greg Humphreys. *Physically Based Rendering: From Theory to Implementation*. 3rd/4th ed. MIT Press / online editions.  
[^vulkan]: Khronos Group. *Vulkan Specification* and ray-tracing extension documentation (`VK_KHR_ray_tracing_pipeline` and related). https://www.khronos.org/vulkan/  
[^mccandless]: McCandless, Stanley. *A Method of Lighting the Stage*. Theatre Arts Books (classic editions; orig. 1932 and later revisions).  
[^swink]: Swink, Steve. *Game Feel: A Game Designer’s Guide to Virtual Sensation*. Morgan Kaufmann, 2009.  
[^gregory]: Gregory, Jason. *Game Engine Architecture*. 3rd ed. A K Peters / CRC Press, 2018.  
[^hafner-lyon]: Hafner, Katie, and Matthew Lyon. *Where Wizards Stay Up Late: The Origins of the Internet*. Simon & Schuster, 1996. (Contextual history of early networked computing culture; complement to BBS-specific archives.)  

[^blog-beginning]: Steven Philley. “The beginning.” *Steven's Development Log* (Blogger), 2024-07-06. https://blog.coloritcompany.com/2024/07/blog-2.html  
[^blog-start]: Steven Philley. “The Start.” *Steven's Development Log* (Blogger), feed date 1987-09-17 (back-dated narrative post; not treated as 1987 authorship proof). https://blog.coloritcompany.com/1987/09/the-start-when-i-started-second-grade.html  
[^blog-input]: Steven Philley. “My input system for Ablockalypse.” *Steven's Development Log*, 2025-04-07. https://blog.coloritcompany.com/2025/04/my-input-system-for-ablockalypse.html  
[^blog-localization]: Steven Philley. “Localization.” *Steven's Development Log*, 2025-02-28. https://blog.coloritcompany.com/2025/03/localization.html  
[^blog-guitar]: Steven Philley. “Jammin' away.” *Steven's Development Log*, 2015-06-24. https://blog.coloritcompany.com/2015/06/jammin-away.html  
[^sdl2-blocks]: Philley, Steven. *Ablockalypse* source repository `electrosy/sdl2-blocks`. https://github.com/electrosy/sdl2-blocks  
[^sdl2-readme]: Philley, Steven. README — Ablockalypse / sdl2-blocks. https://github.com/electrosy/sdl2-blocks/blob/master/README.md  
[^sdl2-license]: Philley, Steven. *Ablockalypse Source Code License* (2025). https://github.com/electrosy/sdl2-blocks/blob/master/LICENSE  
[^sdl2-contributing]: Philley, Steven. CONTRIBUTING.md — Ablockalypse. https://github.com/electrosy/sdl2-blocks/blob/master/CONTRIBUTING.md  
[^input-h]: Philley, Steven. `inc/Input.h` — `KEY_DELAY_TIME_DEFAULT` / `KEY_REPEAT_TIME_DEFAULT` (public source). https://github.com/electrosy/sdl2-blocks  
[^ablock-releasenotes]: Philley, Steven. `releasenotes.txt` in sdl2-blocks. https://github.com/electrosy/sdl2-blocks/blob/master/releasenotes.txt  
[^kbd-csv]: Philley, Steven. `keyboard-config-default.csv` in sdl2-blocks. https://github.com/electrosy/sdl2-blocks/blob/master/keyboard-config-default.csv  
[^steam-ablock]: Color It Company. *Ablockalypse* on Steam (App ID 1674300). https://store.steampowered.com/app/1674300/Ablockalypse/  
[^steam-launch]: Color It Company. *Launch Up* on Steam (App ID 4705880). https://store.steampowered.com/app/4705880/Launch_Up/  
[^launchup-manual]: Color It Company / Flux Studios. Launch Up public manual. https://coloritcompany.com/launchup/  
[^bbs-json]: Color It Company. Worldwide active BBS directory data. https://coloritcompany.com/bbs/bbslist.json (snapshot cited 2026-09-09).  
[^expansion-pack]: Internal drafting aid: `/workspace/dissertation/01-expansion-sources.md` (public extracts compiled 2026-09-09).  
[^draft12-pack]: Internal drafting aid: `/workspace/dissertation/02-draft12-sources.md` (public technical mining compiled 2026-09-10; vendor clone `vendor/sdl2-blocks`).  

[^candy-2019]: Candy, Linda. *The Creative Reflective Practitioner: Research Through Making and Practice.* Routledge, 2019/2020.  
[^smith-dean]: Smith, Hazel, and Roger T. Dean, eds. *Practice-led Research, Research-led Practice in the Creative Arts.* Edinburgh University Press, 2009.  
[^borgdorff]: Borgdorff, Henk. *The Conflict of the Faculties: Perspectives on Artistic Research and Academia.* Leiden University Press, 2012.  
[^nelson]: Nelson, Robin. *Practice as Research in the Arts: Principles, Protocols, Pedagogies, Resistances.* Palgrave Macmillan, 2013.  
[^driscoll]: Driscoll, Kevin. *The Modem World: A Prehistory of Social Media.* Yale University Press, 2022.  
[^scott-bbs-doc]: Scott, Jason, dir. *BBS: The Documentary.* 2005 (eight episodes). Documentary source on BBS culture.  
[^anthropy]: Anthropy, Anna. *Rise of the Videogame Zinesters.* Seven Stories Press, 2012.  
[^rt-gems]: Haines, Eric, and Tomas Akenine-Möller, eds. *Ray Tracing Gems: High-Quality and Real-Time Rendering with DXR and Other APIs.* Apress, 2019.  
[^juul]: Juul, Jesper. *Half-Real: Video Games between Real Rules and Fictional Worlds.* MIT Press, 2005.  
[^galloway]: Galloway, Alexander R. *Protocol: How Control Exists after Decentralization.* MIT Press, 2004.  
[^rheingold]: Rheingold, Howard. *The Virtual Community: Homesteading on the Electronic Frontier.* Addison-Wesley, 1993 (rev. eds. exist).  
[^salen-zimmerman]: Salen, Katie, and Eric Zimmerman. *Rules of Play: Game Design Fundamentals.* MIT Press, 2003.  

---

# Appendix A. Inventory of Artifacts with URLs

| Artifact | What it is | URL / handle | Role in dissertation |
| --- | --- | --- | --- |
| Ra Engine docs | Operator documentation | https://digiflux.one/docs/ | Ch4 primary |
| Ra Lua API | Scripting contract | https://digiflux.one/docs/lua-api | Ch4/Ch6 |
| Digiflux site | Platform home | https://digiflux.one/ | Ch6 |
| Ra on Steam | EA, pricing, roadmap | https://store.steampowered.com/app/4732830/Ra_Engine/ | Ch4/Ch6/Ch10 |
| Steam community hub | Community surface | https://steamcommunity.com/app/4732830 | Contextual |
| Launch Up | Digiflux title (via docs/Steam) | Documented through digiflux.one/docs/ and Steam ecosystem | Ch4/Ch6 |
| Laser Tag | Free RTX arena shooter (public statements) | Steam-bound; LinkedIn + Steam Ra page | Ch6/Ch10 |
| Ablockalypse (CIC) | Competitive tetromino | https://coloritcompany.com/ | Ch5 |
| Ablockalypse (itch) | Downloadable builds | https://coloritcompany.itch.io/ablockalypse | Ch5 |
| CIC studio site | Independent Media & Games | https://coloritcompany.com/ | Throughout |
| BBS directory | Living aggregation + checks | https://coloritcompany.com/bbs | Ch7 |
| Photography | California light studies | https://stevenphilley.com/ | Ch8 |
| panatau | Romania cultural learning | https://panatau.com/ | Ch8 |
| LinkedIn | Public career framing | https://www.linkedin.com/in/steven-philley-7133b6225 | Preface/Ch3 |
| textfiles 408 list | Digital Aquarium breadcrumb | http://bbslist.textfiles.com/408/ | Ch3/Ch7 |
| CIC blog | SELF-STATED development log | https://blog.coloritcompany.com/ | Preface/Ch5 |
| sdl2-blocks | Ablockalypse public source | https://github.com/electrosy/sdl2-blocks | Ch5 |
| BBS JSON | Live directory data | https://coloritcompany.com/bbs/bbslist.json | Ch7 |
| Launch Up Steam | App 4705880 | https://store.steampowered.com/app/4705880/Launch_Up/ | Ch6 |
| Launch Up manual | Feel/mechanics public manual | https://coloritcompany.com/launchup/ | Ch6 |
| Expansion pack | Drafting extracts | `/workspace/dissertation/01-expansion-sources.md` | Method aid |
| Draft 1.2 source pack | File:line mining + Steam/BBS refresh | `/workspace/dissertation/02-draft12-sources.md` | Method aid |
| sdl2-blocks vendor clone | Local shallow clone for line cites | `/workspace/dissertation/vendor/sdl2-blocks` | Ch5 appendices |
| Contact / address | CIC public contact | steven@coloritcompany.com; 500 East Hamilton Ave PMB #1116, Campbell CA 95008 | Front matter |

### Explicit gaps (non-inventory)

| Item | Status |
| --- | --- |
| hipck.com | Not verified in inventory pass — no claims |
| Full pre-Adobe 30-year private chronology | Open for author expansion |
| Unpublished benchmarks / private quotes | Excluded by ethics protocol |
| Internal Ra source tree | Not required for this public-artifact draft |
| Laser Tag dedicated Steam AppID | Announced only — GAP |
| Synchronet core authorship | Unverified — do not claim |
| Steam SDK auto-language / Simplified Chinese | Blog intent only — GAP |
| digiflux.one/products|/pricing|/about | **404** (2026-09-10) — commercial story on Steam + docs footer |
| Launch Up wall-run constants | Store EA yes; manual pedagogy thin — COPY DRIFT / GAP |

---


# Appendix F. Lua API Catalog and Minimal Script Lifecycle

> **Draft 1.2 technical appendix.** Catalogued from public digiflux Lua API documentation (quick-reference total: **48** functions). Hub pages that still say “all 30” are COPY DRIFT—prefer this catalog’s source page.[^lua-api][^expansion-pack]

## F.1 Script contract

| Function | Required? | When |
| --- | --- | --- |
| `init()` | yes | Load, every hot-reload, after `load_scene` |
| `update(dt)` | yes | Each frame before render; `dt` capped |
| `shutdown()` | yes | Engine exit; last chance for `set_var` |
| `get_status_line()` | optional | Terminal status footer (~80 chars) |

Isolation claim (docs): Lua never includes Vulkan/GLFW/engine headers; all access via `engine` global.[^lua-api]

## F.2 Hot-reload state machine (annotated)

Every frame `stat()` on the script file; on mtime change:

1. `shutdown()` on current state  
2. Destroy `lua_State`  
3. Fresh state + re-bind API  
4. Run script  
5. `init()` again  

**Epistemic split:** Lua locals = experiment state (die). `engine.set_var` / `get_var` = commitment state (C++ floats; survive). Syntax/runtime error → keep previous working state; suppress reloads until next save.[^lua-api]

## F.3 Catalog by category

### Camera (4)

| Function | Returns | Notes |
| --- | --- | --- |
| `get_camera_position()` | x,y,z | Player = camera in FP titles |
| `set_camera_position(x,y,z)` | — | Teleport; pair with zero vertical velocity |
| `get_camera_forward()` | x,y,z | Look dir |
| `get_camera_right()` | x,y,z | Strafe basis |

### Physics (2)

| Function | Returns | Notes |
| --- | --- | --- |
| `get_physics_state()` | table | `is_grounded`, `is_jumping`, `vertical_velocity` |
| `set_vertical_velocity(v)` | — | Jump / cancel fall; gravity **−18.0** m/s² |

### Input & time (4)

| Function | Returns | Notes |
| --- | --- | --- |
| `get_input()` | table | `key_down`, `key_just_pressed`, mouse deltas |
| `get_time()` | double | Wall-clock animations |
| `get_delta_time()` | float | Same as `dt` |
| *(key constants)* | globals | `KEY_SPACE`, `KEY_W/A/S/D`, `KEY_R`, `KEY_N`, arrows, ESC, ENTER, `KEY_LEFT_SHIFT`, … |

### Scene object transforms & visuals (14+)

| Function | Notes |
| --- | --- |
| `find_object` / `object_exists` | ID 0 = missing |
| `get/set_object_position` | Move triggers BLAS/TLAS rebuild |
| `get/set_object_rotation` | Euler degrees YXZ; spinner pattern 45°/s |
| `get/set_object_scale` | Uniform or non-uniform; min 0.01 |
| `set_object_emissive` | Drives RTX GI |
| `set_object_visible` | Hidden still collides (documented limitation) |
| `get_object_aabb` / `get_player_aabb` / `player_overlaps_object` | Triggers |

### Queries, scenes, checkpoints, vars, HUD (10)

| Function | Notes |
| --- | --- |
| `find_objects_by_prefix` / `get_all_object_names` | Naming contracts |
| `load_scene(path)` | Deferred; re-`init` |
| `set/get_checkpoint` | Respawn |
| `set/get_var` | Durable floats; namespace keys (`launch_up.score`) |
| `print_status` / `set_hud_data(score, height)` | Terminal + viewport HUD |

### Ray casting & rest center (2)

| Function | Notes |
| --- | --- |
| `cast_ray(ox,oy,oz, dx,dy,dz, maxDist, excludeId)` | hit, id, point, normal, dist |
| `get_object_rest_center(id)` | Immutable load-time centroid |

### Tags / props on meshes (5)

`get/set_object_tag`, `find_objects_by_tag`, `get/set_object_prop`

### Standalone game objects (8)

Separate ID space (`ra_type=game_object`): `find_game_object`, `find_game_objects_by_tag`, get/set position, tag, active, props.

### Ambient sky (1)

`set_ambient_color(topRGB…, horizonRGB…)` → UBO tail / `miss.rmiss`

**Total:** 48 functions per lua-api quick reference.[^lua-api]

## F.4 Annotated minimal script lifecycle

```lua
-- Minimal owned-pipeline-friendly skeleton (patterns from public docs)
local goal_id, score = 0, 0.0

function init()
  score = engine.get_var("demo.score", 0.0)
  goal_id = engine.find_object("goal_pad")  -- re-discover every init
end

function update(dt)
  local inp = engine.get_input()           -- read once
  local _, y, _ = engine.get_camera_position()
  score = y * 100.0
  engine.set_hud_data(score, y)
  if goal_id ~= 0 and engine.player_overlaps_object(goal_id) then
    engine.print_status("LEVEL COMPLETE")
  end
  if inp.key_just_pressed[KEY_R] then
    local cx, cy, cz = engine.get_checkpoint()
    engine.set_camera_position(cx, cy, cz)
    engine.set_vertical_velocity(0.0)
  end
end

function shutdown()
  engine.set_var("demo.score", score)      -- commitment state
end
```

Lifecycle beats: bind → `init` discover → `update` feel/HUD → optional hot-reload (locals die; vars live) → `shutdown` commit. See also Interlude A.2 and the annotated Launch Up session walkthrough earlier in this monograph.

## F.5 Research use of this appendix

Appendix F is not an SDK mirror for its own sake. It is evidence that Digiflux titles share a **soft membrane** thick enough to author feel, lighting mood, and progression without recompiling SPIR-V—while still inheriting BLAS costs when objects move.

## F.6 Documented `launch_up.lua` patterns (public docs)

Public lua-api documentation annotates production patterns from `scripts/launch_up.lua`:[^lua-api][^draft12-pack]

| Pattern | Technique |
| --- | --- |
| Bulk hazard discovery | `find_objects_by_prefix("platform_hazard_")` in `init` |
| Spinner | **45°/s** Y rotation accumulated with `dt` |
| Breathe scale | `1.0 + 0.08 * sin(t * 2.5)` on hazard scales |
| Goal pad reveal | `set_object_visible` + start scale 0.1 + lerp toward 1.0 |
| Finish throb | scale oscillates ~1.0–1.15 |
| Checkpoint feedback | emissive orange flash (~4 Hz fade) + scale pop over 0.5s |
| Level table | `LEVELS` array of GLTF paths; `load_scene` + `set_var` before transition |
| Persist | `launch_up.score` / `peak_height` / `level` via `set_var`/`get_var` |

**Known limitation (docs):** “Physics collision is currently unaffected by visibility — hidden objects still block the player.” Publishing the limitation is research-grade honesty.

Hot-reload quote (docs): Lua variables do not survive hot-reload; only `engine.set_var()` values (C++-side) survive—experiment vs commitment state again.


---

# Appendix G. Competitive Feel Instrument — Paired Case Studies

> **Draft 1.2 technical appendix.** Pairs Launch Up public manual/engine constants with Ablockalypse public input/wall-kick systems as two instruments from one studio.[^launchup-manual][^input-h][^sdl2-blocks]

## G.1 Case study A — Launch Up (Ra / Lua feel)

| Constant / system | Public value | Source |
| --- | --- | --- |
| Jump velocity | **8.5** | Launch Up manual |
| Coyote time | **0.15 s** | Manual + digiflux docs |
| Jump buffer | **0.12 s** | Manual |
| Gravity | **−18.0 m/s²** | digiflux / Lua docs |
| Grounding | Five-point ground cast | Manual |
| Death plane | **Y = −5 m** | Manual |
| Height score | **100 pts / metre** | Manual / docs |
| Level 1 | 17 platforms; goal **26.5 m**; max height score **2,650** | Manual |
| Sprint | Shift **2×** | Manual |
| Editor rhyme | F1 / F2 / F4 | Manual (Ra grammar) |
| Hazard motion (docs pattern) | Spinner **45°/s**; breathe scale | lua-api patterns |

**Instrument character:** vertical mercy (coyote/buffer) + hard fail (death plane / one-touch hazards) + spatial economy (height scoring). Store marketing that soft-pedals fail-states remains COPY DRIFT against this table (DR2).

## G.2 Case study B — Ablockalypse (SDL / `ley::` feel)

| Constant / system | Public value | Source |
| --- | --- | --- |
| Delay default | **180** ms | `inc/Input.h` `KEY_DELAY_TIME_DEFAULT` |
| Repeat default | **45** ms | `KEY_REPEAT_TIME_DEFAULT` |
| Timers | Dual `ley::Timer` per `InputPressed` | `Input.h` |
| SDL key-repeat | Skipped (`!event.key.repeat`); custom timers own ARR-like behavior | Blog 2025 + source |
| Wall kick default | **on** (`mWallKickOn = true`) | `GameModel.h` |
| Wall kick algorithm | Center-relative iterative nudge; abort on block/bottom; `MAX_KICK` from board width / `BLOCK_SIZE` | `GameModel::rotateWithKick` |
| Board size help range | ~**8×8 … 25×22** | lang CSV |
| Gravity ladder | Levels to **31**; **10 ms** gravity step noted | releasenotes 0.7.0.6 |
| Gamepad parity | Same delay/repeat as keyboard | releasenotes 0.6.5.4 |
| Header date | Input system **2020-02-14** predates Steam EA 2021-07-16 | `Input.h` / Steam |

**Instrument character:** horizontal/rotational legality + tunable DAS/ARR-like knobs + optional spatial reconfiguration (board size, block editor).

## G.3 Paired reading (Owned Pipelines)

| Layer | Launch Up | Ablockalypse |
| --- | --- | --- |
| Metal-adjacent | Vulkan RT image is the feel stage | SDL2 + custom command queue |
| Mercy | Coyote + buffer | Wall kicks + retunable delay/repeat |
| Hard edge | Death plane / one-touch hazards | Lock-down / board collision (no invented RNG claims) |
| Authoring | GLTF + Lua hot-reload | CSV bindings/blocks + BlockEditor state |
| Versioning | Manual + docs constants | `releasenotes.txt` |
| Disclosure ethics | Store↔manual drift flagged | Firefly marketing disclosure on Steam |

Swink’s *Game Feel* licenses reading both as designed sensation objects;[^swink] Salen & Zimmerman license reading both as rule instruments players inhabit.[^salen-zimmerman] Neither case study invents esports metrics.

## G.4 Author gaps still open

- SRS/guideline lineage for wall kicks (algorithm public; historical naming not claimed).
- Determinism / competitive integrity policy.
- Player-visible exploit list.
- Whether Steam SDK auto-language shipped for Ablockalypse.
- Author resolution of Launch Up store↔manual product definition.

---

# Appendix H. Annotated Input Delay/Repeat and Wall-Kick Walk (file:line)

> **Draft 1.2.** Condenses §5.21 / §5.21b into a cite-ready appendix. Paths relative to `/workspace/dissertation/vendor/sdl2-blocks`.[^sdl2-blocks][^draft12-pack]

## H.1 Defaults and types

```text
inc/Input.h:33  KEY_DELAY_TIME_DEFAULT  = 180
inc/Input.h:34  KEY_REPEAT_TIME_DEFAULT = 45
inc/Input.h:43–55  class InputPressed { mDelayTimer; mRepeatTimer; ... }
inc/Input.h:40  KeyBindingsType = multimap<scancode+context, (mod, Command)>
inc/GameModel.h:87–88  mKeyDelay / mKeyRepeat initialized from defaults
inc/GameModel.h:98  mWallKickOn = true
```

## H.2 `check_timers` contract (`src/Input.cpp`)

1. `:210` — on `SDL_KEYDOWN`, require `!event.key.repeat` before starting timers / pushing.
2. `:132–172` — `check_timers` lambda: run delay + repeat timers; if **both** expired, lookup command; skip auto-repeat for `enter`, `UI_back`, `UI_enter`, `pause`; reset repeat timer.
3. `:283` — `check_timers()` invoked at end of `pollEvents`.

Blog SELF-STATED match: dual timers; end-of-input-phase timer check; skip SDL repeats.[^blog-input]

## H.3 Wall-kick call graph

```text
PlayState.cpp:34–63
  cclockwise / clockwise
    if getWallKickOn() -> GameModel::rotateWithKick(false|true)
    else               -> rotateBlock(...).first
GameModel.cpp:153–207  rotateWithKick
  MAX_KICK = min(boardWidth/2, BLOCK_SIZE)
  abort on fail "block"|"board_bottom"
  else nudge toward opposite board-center side + retry rotate
ConfigIO.cpp:29,60  persist wallkickon
releasenotes 0.6.7.0 introduce; 0.7.1 CCW-only fix
```

**Non-claim:** algorithm ≠ SRS guideline table.

## H.5 Soft-rotate probe and line clear (adjacent algorithms)

`canRotate` (`GameModel.cpp:226–237`) probes by rotating, testing `canPut`, and rotating back—classic speculative transform without committing illegal state.[^sdl2-blocks] Line clear / board shift (`GameModel.cpp:238–259`) completes the lock grammar. Together with `rotateWithKick` and `check_timers`, these routines form the competitive instrument’s public core. Future author notes may add RNG/determinism policy; this appendix stops at what the repository already shows.


## H.4 Contrast: player feel knobs vs Ra editor key-repeat

| Surface | Parameters | Audience |
| --- | --- | --- |
| Ablockalypse options | delay/repeat (defaults 180/45); wallkick on/off | Players |
| Ra `HierarchyView` ctor | `keyRepeatDelay`, `keyRepeatRate` (docs) | Editor operators |

Same *family* of motor-control concern across pipeline layers—Owned Pipelines rhyme.

---

# Author Revision Checklist

Use this list to inject first-person thirty-year knowledge without breaking the no-fabrication rule. Each item is a place the draft already reserved for your voice.

**Legend:** ✅ filled from public sources in Drafts 1.1–1.2 · 🔶 partial · ❌ still needs Steven’s private/author voice

1. ❌ **Preface chronology hook** — Write a dated arc from earliest machines/BBS era through Qt work, Premiere, and founding CIC. Prefer artifacts (disks, posts, release tags) over vibes. *(Blog self-statements present; year-by-year CV still open.)*  
2. ❌ **Chapter 3 Premiere/pro tools lesson** — One to three concrete shipping disciplines you still use in Ra/Ablockalypse.  
3. ❌ **Chapter 4 “debugging night” hook** — Narrate a specific RT/AS/lighting failure that created a pitfall-table row.  
4. 🔶 **Chapter 5 feel numbers** — ✅ Defaults **180/45** from `Input.h`; ✅ wall-kick algorithm walk from public `rotateWithKick`; ❌ historical SRS/guideline lineage; ❌ playtest diary; ❌ determinism/exploit list.  
5. 🔶 **Chapter 6 pricing/Workshop rationale** — ✅ Public $49.99 Steam philosophy quoted; 🔶 $49.99 vs $250 docs drift needs your reconcile; ❌ first-person “why this number”; ❌ Workshop governance principles.  
6. ❌ **Chapter 7 Digital Aquarium** — Optional sysop memoir bounded by memory honesty.  
7. ❌ **Chapter 8 photo→lighting map** — Tie named photographs to Ra lighting controls.  
8. ❌ **Metrics appendix (optional)** — Frame times / BLAS costs / EA seats only if measured and consented.  
9. 🔶 **AI-assisted practice** — ✅ Steam Firefly marketing disclosure cited; ❌ programming-assistant boundaries diary.  
10. 🔶 **Title finalization** — Working title stable; refine after chronology length clear.  
11. ❌ **hipck.com** — Verify or permanently omit (still excluded).  
12. ❌ **Tone pass** — Craftsman-founder voice pass on hooks.  
13. 🔶 **Launch Up store↔manual** — ✅ Both cited as COPY DRIFT; ❌ your product-definition resolution.  
14. ❌ **Laser Tag AppID** — Add when store page live (do not invent).  
15. ❌ **panatau.com authorship** — Confirm byline/ownership for Ch8 claims.  
16. ✅ **Lua API / CameraUBO counts** — Catalogued; 48-function preference + 24→~30 UBO drift flagged.  
17. ✅ **BBS schema + probe ethics** — Draft 1.2 schema/field frequencies + dual snapshots.  
18. ✅ **Documentation Drift chapter** — Major section added; still needs your ongoing drift repairs as products change.  
19. ✅ **Wall-kick / `check_timers` file:line** — Public algorithm + Input.cpp cites filled; ❌ SRS lineage naming still open.  
20. ✅ **Launch Up manual Ch01–08 pedagogy + Steam wall-run/roadmap/polls** — cited; ❌ store↔manual product-definition repair still yours.  
21. ❌ **digiflux.one `/products` `/pricing` `/about`** — **404** as of Draft 1.2 source pack; commercial story lives on Steam + docs footer—do not invent pages.  
22. ❌ **Synchronet core authorship** — still unverified; directory ≠ engine author.

---

*End of Draft 1.2 — Practice-based doctoral dissertation (self-directed). Not an institutional degree award.*


---


---

# Afterword for Future Empirical Appendices

Draft 1.0 deliberately withheld numbers the public record did not provide; Draft 1.1–1.2 add only numbers now citable from public headers, storefronts, manuals, and JSON snapshots (e.g., Input.h 180/45; Launch Up 8.5/0.15/0.12/−18/100; BBS 1304/1092 and 1322/1099). Future empirical appendices—if Steven measures and publishes them—might include:

1. **Frame-time tables** for `material_showcase_v2.gltf` and Launch Up tutorial on RTX 3060, RX 6600, and Arc A380 at named resolutions and GI sample settings.
2. **BLAS rebuild cost** when moving N objects per frame from Lua.
3. **Hot-reload latency** distribution on save.
4. **Ablockalypse input timing** defaults and percentile clear times from public builds (only with player consent ethics).
5. **BBS directory** reachability statistics over a stated month, with methodology for probes.
6. **EA timeline audit** against the 6–12 month public bound.

Until those exist, readers should treat architectural claims as qualitative practice knowledge with high documentary support, and commercial/performance outcomes as open.

This afterword exists so the monograph’s silence on metrics cannot be mistaken for ignorance of evaluation—only for refusal to counterfeit it.

# Colophon

Typeset as Markdown for revision velocity. Primary evidence window: September 2026 public web sources listed in References and Appendix A, deepened via `/workspace/dissertation/01-expansion-sources.md` and `/workspace/dissertation/02-draft12-sources.md`, live digiflux/Steam/GitHub/BBS/blog/manual fetches, and local shallow clone of `electrosy/sdl2-blocks` under `/workspace/dissertation/vendor/sdl2-blocks`. Author: Steven Philley. Studio: Color It Company LLC / Flux Studios, Campbell, California. This file is **Draft 1.2** of a practice-based doctoral dissertation (self-directed). It is not a university thesis deposit and not a conferred PhD credential.

**Draft 1.2 word count:** see Appendix E changelog row (computed with `wc -w`). Target band ~35k–45k *if and only if* content stayed substantive; fabrication forbidden to hit the number. Prefer stopping short over padding.

