# No Man's Sky technology catalog

`technology.json` is the client-side catalog for the moodboard’s Technology board. Recipes are copied from a game-file extract. Amounts are not filled in by hand.

## Game version

The extract is the NMS-Handbook commit [`142d9ffd8078944722243398202f22cbef47cd02`](https://github.com/ApexFatality93/NMS-Handbook/commit/142d9ffd8078944722243398202f22cbef47cd02) (20 February 2026, message “Feb 2026 Update”).

That commit includes the Gravitino Coil, which Hello Games added in [Remnant 6.2](https://www.nomanssky.com/2026/02/no-mans-sky-remnant/) (11 February 2026). The handbook commit does not name a build number. [Remnant 6.24](https://www.nomanssky.com/2026/02/remnant-6-24/) (27 February 2026) and [Cosmos 7.04](https://www.nomanssky.com/2026/09/cosmos-7-04/) (21 September 2026) are later and were not re-extracted.

## Sources

| Source | URL |
| --- | --- |
| Technology table JSON | https://github.com/ApexFatality93/NMS-Handbook/blob/142d9ffd8078944722243398202f22cbef47cd02/JSON_Files/Technology_Table.json |
| Crafting table JSON | https://github.com/ApexFatality93/NMS-Handbook/blob/142d9ffd8078944722243398202f22cbef47cd02/JSON_Files/Crafting_Table.json |
| Substance table JSON | https://github.com/ApexFatality93/NMS-Handbook/blob/142d9ffd8078944722243398202f22cbef47cd02/JSON_Files/Substance_Table.json |
| Product table JSON | https://github.com/ApexFatality93/NMS-Handbook/blob/142d9ffd8078944722243398202f22cbef47cd02/JSON_Files/Product_Table.json |
| Decompiled technology MXML | https://github.com/ApexFatality93/NMS-Handbook/blob/142d9ffd8078944722243398202f22cbef47cd02/Game%20Files/NMS_REALITY_GCTECHNOLOGYTABLE.MXML |
| Refine graph already in this repo | `game/guides/no-mans-sky/data/graph-v2.json` |
| Neural Stimulator (Miraheze) | https://nomanssky.miraheze.org/wiki/Neural_Stimulator |
| Cadmium Drive (Miraheze) | https://nomanssky.miraheze.org/wiki/Cadmium_Drive |
| Jetpack (Miraheze) | https://nomanssky.miraheze.org/wiki/Jetpack |

The handbook JSON is generated from MBINCompiler output of the reality tables. Install recipes are the technology table `Requirements` list. Component recipes are the crafting table `Ingredients` list. Shared component recipes (metal plating, hermetic seal, carbon nanotubes, microprocessor, antimatter, warp cell, and the rest of the refine graph’s craft rows) match `graph-v2.json`. The generator recorded zero quantity mismatches.

Regenerate with the handbook `JSON_Files` directory:

```
python3 scripts/build-nms-technology.py /path/to/JSON_Files
```

## What is included

Craftable technology (install recipe present, `Procedural` is false):

| Slot | Technology | Craftable upgrades |
| --- | ---: | ---: |
| Exosuit | 18 | 16 |
| Multi-Tool | 23 | 18 |
| Starship | 41 | 19 |
| Living Ship | 11 | 0 |
| Freighter | 5 | 7 |
| Exocraft (Minotaur, Nautilon, Colossus, and the other exocraft) | 32 | 12 |

That is 130 technologies and 72 craftable upgrades. Living Ship entries are the `AlienShip` rows (Singularity Cortex, Pulsing Heart, and the other organic installs). Minotaur is `Mech`. Nautilon is `Submarine`. Sentinel interceptor parts are starship rows with category `RobotShip`.

Also in the file, so those recipes resolve:

- 34 crafted products (Carbon Nanotubes, Metal Plating, Hermetic Seal, Antimatter, Wiring Loom’s inputs, Circuit Board is not required by these tech rows, Ion Battery, Warp Cell, Di-hydrogen Jelly, and the other closure products)
- 24 gathered or bought products with no crafting-table recipe (Wiring Loom, Storm Crystal, Walker Brain, and the rest)
- 46 substances
- 54 procedural modules

Procedural modules are the `Procedural: true` rows (the S/A/B/C templates such as `T_JET`). Their `Requirements` lists are templates, not player recipes, and are omitted. The board’s Procedural filter is the explicit list.

## How the tree walks

Inventory and install recipes expand fully, with batch multipliers. A refiner step is used only for these one-way edges in `graph-v2.json`:

- ferrite dust → pure ferrite → magnetised ferrite
- carbon → condensed carbon
- sodium → sodium nitrate
- cobalt → ionised cobalt
- salt → chlorine
- copper → chromatic metal (2 copper → 1)

Cadmium, emeril, and indium also refine into chromatic metal. Those edges stay on the Refine page. Expansion loops (oxygen multiplying a stack, chromatic expansion) are not walked.

## Not verified

- `FragmentCost` is copied from the technology table and is not labelled a nanite price. Neural Stimulator’s 90 matches the Miraheze page (Iteration: Selene, SentinelUp, 12 April 2022). Cadmium Drive’s `FragmentCost` is 80; that wiki lists 800 nanites from Iteration: Hyperion. The prices disagree.
- Items with `TechShopRarity` Impossible are marked not sold. Whether the blueprint is starting tech, a quest, or a Quicksilver or expedition unlock is not in the technology table. Rows with Rarity Always, PrimaryItem, and FragmentCost 1 are noted as often starting or quest tech. That is a hint, not an unlock-table fact.
- Repair is not a second list in the February 2026 technology table. The Miraheze Neural Stimulator and Cadmium Drive pages list a smaller repair cost. The Jetpack page (Desolation, 22 September 2020) lists a repair of 100 Ferrite Dust and 50 Cobalt; the February 2026 Requirements list is 100 Ferrite Dust only. Those older repair lines were not copied.
- nomanssky.fandom.com returned 403 to the fetch used here, so the cross-checks are the Miraheze copies, which themselves cite older updates.
- Cosmos 7.04 and Remnant 6.24 were not diffed against this extract.
- Base-building parts, damaged-slot technologies (`DMG` ids), `OBSOLETE`, `DUMMY_SCAN`, and the Maintenance category (portal glyphs and freighter maintenance slots) are omitted.
- Substances that are not in the refine graph (silver, gold, platinum, pugneum, and the rest) stay as leaves, even where a refiner recipe exists outside `graph-v2.json`.
