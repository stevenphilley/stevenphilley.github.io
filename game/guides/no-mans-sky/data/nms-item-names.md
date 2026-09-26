# No Man's Sky item names

`nms-item-names.json` maps a save item id to its English in-game name. The logistics planner and the galaxy map load it in the browser. It is separate from `graph-v2.json`, which stays the refine and crafting graph.

A slot id may start with `^` and may end in `#` plus a procedural seed (`^UP_LASER4#52847`). Lookup strips both and uses the base id. The seed is not part of the name. Class (C, B, A, S, or X for Illegal / Suspicious) is copied from the English name. The trailing digit is not a class: `UP_ENGY1` is a B-class hazard-protection module.

Installed technologies sometimes use a `YOURSHIP_`, `YOURSUIT_`, `YOURMULTI_`, `YOURFREIG_`, or `YOURVEHIC_` alias that is not a row in the technology table. Those aliases follow the list in nmstoolkit `icon_provider.py` (for example `YOURSHIP_PULSEDRIVE` is `SHIPJUMP1`, Pulse Engine).

An id with no English name is reworded. The caret is stripped, underscores become spaces, and a digit is split from the letters around it (`NOT_A_CROP_9` becomes “Not A Crop 9”). The save id stays in the tooltip. It is not written next to the name. Nothing is invented for that case.

Harvested crops and their seeds are in this file. `PLANT_TOXIC` is Fungal Mould and `SNOWPLANT` is the Frostwort seed. Gravitino Ball is `GRAVBALL`. There is no `PLANT_GRAV` id in the substance or product table.

`technology.json` (NMS-Handbook, 20 February 2026, Remnant 6.2) is a second source for a display name. When a save id is an alias of a craftable technology or product in that catalog, and this file has no row, the logistics planner and the map use the catalog’s English name. That covers `GRAVITYGUN` (Gravitino Coil), `VEHICLE_SCOPE` (Cyclops Scope), `EXO_PLOUGH` (Excavation Blade), and `T_SHIP_ATLAS` (Aeron Starship Trail). The generated label `Procedural module …` is not an in-game name and is not shown. `SPIDERBRAIN` is still only the id in both sources, so it stays unmapped.

## Source

Primary catalogue: [pljeroen/nmstoolkit `items.json`](https://github.com/pljeroen/nmstoolkit/blob/3b3ea491e6b8e905fbcb409768e66ac84d0d409a/src/nmstoolkit/data/items.json), commit `3b3ea491e6b8e905fbcb409768e66ac84d0d409a`, committed 2026-02-14.

That file is an MBINCompiler extract of:

- `NMS_REALITY_GCPRODUCTTABLE`
- `NMS_REALITY_GCSUBSTANCETABLE`
- `NMS_REALITY_GCTECHNOLOGYTABLE`
- `NMS_REALITY_GCPROCEDURALTECHNOLOGYTABLE`

joined to English localisation. The file does not embed a game version. It includes Corvette parts from the Voyagers update.

Cross-check: [AssistantNMS/WebApp](https://github.com/AssistantNMS/WebApp) `public/assets/data/developerDetails.json` joined to the en-us `*.lang.json` files. `meta.json` records game version **6.01**, build **19773093**, generated **2025-08-28**, update **Voyagers**.

Where both sources have a usable English name, the toolkit name is kept. The two lists mostly disagree on British versus American spelling (Ionised / Ionized, Fibre / Fiber). The toolkit spelling matches the material graph on this site. One content mismatch: `TWITCH_PET18` is “I. Protoubnea Egg” in the February 2026 toolkit and “F. Graspaeeum Egg” in the August 2025 Assistant extract. The toolkit name is the one stored.

`EXO_REFINER` (“Mineral Processing Rig”, technology) is the only id filled from AssistantNMS. The toolkit extract had no usable English name for it.

`%NAME%` template rows use that same record’s subtitle (`U_TECHBOX_*`, `U_TECHPACK_*`). A name that is still a localisation key (`*_NAME_L`) is left unmapped. Markup such as `<IMG>…<>` is stripped. “Destablised Sodium” (`CATAPROD3`) is the game’s own spelling.

## Version gap

The public game on 2026-09-25 is No Man's Sky Cosmos **7.04** (2026-09-21). This name list is older than that. Ids added after the 2026-02-14 toolkit catalogue are not in the file. `mapping.json` in this folder is the libMBIN 7.4.0.1 save-key map. It does not contain item names, and this list does not change it.

## Counts

- Mapped: **4437**
- Unresolved: **80** (listed below and in `unresolvedIds` in the JSON)

Each mapped row is `{ "name", "category", "group" }` and, when the English name states one, `"class"`. Categories are coarse: raw resource, product, technology, curiosity, trade good, fish, building part, customisation, cooking, item. `group` is the game’s own category, title-cased.

## Unresolved ids

These rows exist in the toolkit extract, but the stored name is a localisation key rather than English. The page rewords the id and keeps the raw id visible. Do not guess a name for them.

| Id | Stored name key |
| --- | --- |
| `CHART_BUILDER` | `UI_STARCHART_BUILDER_NAME_L` |
| `WORLDSMB_SOUL` | `UI_WORLDSMB_SOUL_NAME_L` |
| `U_CRFIGHT1`–`U_CRFIGHT4` | `UT_CR_FIGHT_NAME_L` |
| `U_CRSCI1`–`U_CRSCI4` | `UT_CR_SCI_NAME_L` |
| `U_CRTRADE1`–`U_CRTRADE4` | `UT_CR_TRADE_NAME_L` |
| `U_CRMINE1`–`U_CRMINE4` | `UT_CR_MINE_NAME_L` |
| `BRIDGECONNECTOR` | `UI_BRIDGECONNECT_NAME_L` |
| `B_SHL_D` | `BLD_BIG_SHL_D_NAME_L` |
| `B_BTRU_A`, `B_BTRU_B`, `B_BTRU_C` | `BLD_BIG_BTRU_*_NAME_L` |
| `B_STR_E_E`, `B_STR_E_Y_E` | `BLD_BIG_STR_STR_E_NAME_L` |
| `B_GEN_4`, `B_GEN_5` | `BLD_BIG_GEN_4_NAME_L`, `BLD_BIG_GEN_5_NAME_L` |
| `CORRIDOR_WINDOW`, `HEALTHPLANT`, `NPCEXPLORER001` | `BLD_PRT_FOUNDATION_L` |
| `SET_CONSTRUCT`, `SET_CLASS_S`, `SET_CLASS_A`, `SET_CLASS_B` | `BLD_SET_CONSTRUCT_NAME_L` |
| `SET_GROUNDDECAL` | `BLD_SET_GROUNDDECAL_NAME_L` |
| `SET_MAYORTERM` | `BLD_SET_MAYORTERM_NAME_L` |
| `SET_MONUMENT`, `SET_MONUMENT_FA`, `SET_SFXCONST_S0`–`S2`, `S_TOWER`, `S_TOWER_FA`, `S_TOWER_C`, `S_TOWER_B`, `S_TOWER_B_FA`, `B_TOWER`, `B_TOWER_C`, `B_TOWER_B`, `SET_T_MONU`, `SET_T_MONU_FA`, `SET_F_MONU`, `SET_F_MONU_FA`, `SET_B_MONU`, `SET_B_MONU_FA`, `B_ROBOTARM`, `SET_FISHPOND` | `BLD_SET_MONUMENT_NAME_L` |
| `SET_INT_SUMMARY` | `BLD_SET_INT_SUMMARY_NAME_L` |
| `SET_STAFFBUILD` | `BLD_SET_STAFFBUILD_NAME_L` |
| `SET_INT_SHIPSAL` | `BLD_SET_INT_SHIPSAL_NAME_L` |
| `B_CANOPY_WALL1` | `BLD_B_CANOPY_WALL1_NAME_L` |
| `B_CANOPY_WALL2` | `BLD_B_CANOPY_WALL2_NAME_L` |
| `B_WALL_SUPPORTS` | `BLD_B_WALL_SUPPORTS_NAME_L` |
| `SPIDERBRAIN` | `UI_SPIDERBRAIN_NAME_L` |
| `CV_FIT1`–`CV_FIT4` | `UT_CR_FIGHT_NAME_L` |
| `CV_SCI1`–`CV_SCI4` | `UT_CR_SCI_NAME_L` |
| `CV_TRA1`–`CV_TRA4` | `UT_CR_TRADE_NAME_L` |
| `CV_INV1`–`CV_INV4` | `UT_CR_MINE_NAME_L` |

The full id list, one per row, is `unresolvedIds` in `nms-item-names.json`.
