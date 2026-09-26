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
| Stasis Device (Miraheze) | https://nomanssky.miraheze.org/wiki/Stasis_Device |
| Quantum Processor (Miraheze) | https://nomanssky.miraheze.org/wiki/Quantum_Processor |
| Cryogenic Chamber (Miraheze) | https://nomanssky.miraheze.org/wiki/Cryogenic_Chamber |
| Nitrogen Salt (Miraheze) | https://nomanssky.miraheze.org/wiki/Nitrogen_Salt |
| Aronium (Miraheze) | https://nomanssky.miraheze.org/wiki/Aronium |

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

- 67 crafted products. That is the install-recipe closure (Carbon Nanotubes, Metal Plating, Hermetic Seal, Antimatter, Ion Battery, Warp Cell, Di-hydrogen Jelly, and the rest) plus the crafted trade goods below.
- 24 gathered or bought products with no crafting-table recipe (Wiring Loom, Storm Crystal, Walker Brain, and the rest)
- 53 substances (the previous 46, plus Pyrite, Sulphurine, Radon, Nitrogen, Cactus Flesh, Solanium, and Star Bulb, which the trade-good recipes name and the install tree did not)
- 54 procedural modules

Procedural modules are the `Procedural: true` rows (the S/A/B/C templates such as `T_JET`). Their `Requirements` lists are templates, not player recipes, and are omitted. The board’s Procedural filter is the explicit list.

## Crafted trade goods

The same generator copies inventory blueprints from `Crafting_Table.json` onto `graph-v2.json` and into this catalog. The set is every product-table row with `WikiCategory` Crafting and `Type` Tradeable, plus named products or trade goods of type Consumable that an install recipe does not already require. Quantities are the crafting-table `Ingredients` amounts. `BaseValue` from `Product_Table.json` is stored as `value`.

Stasis Device (`ULTRAPROD2`) is 1 Quantum Processor, 1 Cryogenic Chamber, and 1 Iridesite. Base value 15,600,000. Quantum Processor (`MEGAPROD2`) is 1 Circuit Board and 1 Superconductor (4,400,000). Cryogenic Chamber (`MEGAPROD3`) is 1 Living Glass and 1 Cryo-Pump (3,800,000). Lubricant, Living Glass, Circuit Board, Heat Capacitor, Poly Fibre, Glass, and the three gas products were already nodes. Their existing craft or refiner edges were kept when the quantities matched. Nitrogen Salt, Enriched Carbon, and Thermic Condensate keep the high-speed sublimation refiner row (100 gas, 10 condensed carbon, 5 chlorine) and gain the inventory blueprint (250 gas and 50 condensed carbon).

The raw bill uses the inventory blueprint, then the one-way ladders. One Stasis Device expands to 300 Frost Crystal, 200 Solanium, 100 Cactus Flesh, 200 Star Bulb, 500 Sulphurine, 500 Nitrogen, 500 Radon, 600 Carbon, 50 Faecium, 400 Gamma Root, 50 Paraffinium, 50 Phosphorus, 50 Dioxite, and 300 Cobalt. The 600 carbon is 300 condensed carbon at 2 carbon each. The 300 cobalt is 150 ionised cobalt at 2 cobalt each. Condensed carbon and ionised cobalt do not remain on the bill.

Miraheze craft boxes match those three recipes and the two checked intermediates (Nitrogen Salt 250 + 50, value 50,000; Aronium 50 Paraffinium + 50 Ionised Cobalt, value 25,000). The wiki page templates are older than this extract: Stasis Device is stamped Origins (release history through Outlaws), Quantum Processor Frontiers, Cryogenic Chamber Prisms, Nitrogen Salt Prisms, Aronium Interceptor. They do not name a 2026 build. The quantities match the handbook commit of 20 February 2026, which includes Remnant 6.2. Cosmos 7.04 was not re-extracted.

Also added from the same product table, because they are named products with a crafting recipe and were in neither catalog: Explosive Drones, Holographic Analyser, Mineral Compressor, Fuel Oxidiser, Mind Control Device, Frigate Fuel (100 Tonnes), and Starshield Battery. Their crafted ingredients (Quantum Computer, Hydraulic Wiring, Solar Mirror) are on the graph as well. Walker Brain and Quad Servo stay gathered. Gold and silver are gathered inputs with no refiner row.

## Still not in either catalog

- Starship Launch Fuel (`LAUNCHFUEL`) has a crafting-table recipe (40 Di-hydrogen and 1 Metal Plating). It stays out of the graph, with the portable refiner and wiring loom.
- Repair Kit (`REPAIRKIT`) is in the crafting table with an empty `Ingredients` list.
- Frigate Fuel (50 Tonnes), Frigate Fuel (200 Tonnes), and Surge Battery are `WikiCategory` NotEnabled in this extract.
- Platinum is not an ingredient of these inventory blueprints. The three-input refiner alloy-latticing rows (tritium, silver, gold, or platinum beside the stellar metal and ferrite or cobalt) stay off the graph.
- Gamma Weed (`RADIOPLANT`) is the planter. Recipes use Gamma Root, the harvest.
- Marrow Bulb and Sac Venom are not ingredients of these recipes. Sac Venom has no crafting-table recipe.
- Cooking, base-building parts, and trade goods with no crafting recipe (Albumen Pearl and the rest) stay out.

## How the tree walks

Inventory and install recipes expand fully, with batch multipliers. A refiner step is used only for these one-way edges in `graph-v2.json`:

- ferrite dust → pure ferrite → magnetised ferrite
- carbon → condensed carbon
- sodium → sodium nitrate
- cobalt → ionised cobalt
- salt → chlorine
- copper → chromatic metal (2 copper → 1)

Cadmium, emeril, and indium also refine into chromatic metal. Those edges stay on the Refine page. Expansion loops (oxygen multiplying a stack, chromatic expansion) are not walked. Crafted trade goods expand through the inventory blueprint first. The gas-product refiner rows are the other way to make nitrogen salt, enriched carbon, and thermic condensate. They are not the raw bill.

## Not verified

- `FragmentCost` is copied from the technology table and is not labelled a nanite price. Neural Stimulator’s 90 matches the Miraheze page (Iteration: Selene, SentinelUp, 12 April 2022). Cadmium Drive’s `FragmentCost` is 80; that wiki lists 800 nanites from Iteration: Hyperion. The prices disagree.
- Items with `TechShopRarity` Impossible are marked not sold. Whether the blueprint is starting tech, a quest, or a Quicksilver or expedition unlock is not in the technology table. Rows with Rarity Always, PrimaryItem, and FragmentCost 1 are noted as often starting or quest tech. That is a hint, not an unlock-table fact.
- Repair is not a second list in the February 2026 technology table. The Miraheze Neural Stimulator and Cadmium Drive pages list a smaller repair cost. The Jetpack page (Desolation, 22 September 2020) lists a repair of 100 Ferrite Dust and 50 Cobalt; the February 2026 Requirements list is 100 Ferrite Dust only. Those older repair lines were not copied.
- nomanssky.fandom.com returned 403 to the fetch used here, so the cross-checks are the Miraheze copies, which themselves cite older updates.
- Cosmos 7.04 and Remnant 6.24 were not diffed against this extract.
- Base-building parts, damaged-slot technologies (`DMG` ids), `OBSOLETE`, `DUMMY_SCAN`, and the Maintenance category (portal glyphs and freighter maintenance slots) are omitted.
- Silver and gold are gathered inputs on the refine graph and stay leaves. Platinum, pugneum, and the other substances that are still not in the graph stay leaves, even where a refiner recipe exists outside `graph-v2.json`.
