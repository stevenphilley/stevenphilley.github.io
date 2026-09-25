# Discovery records on the galaxy map

The map reads discovery records in the browser, from the same JSON or Steam `.hg` file as the bases. Nothing is uploaded. This note is the format the parser follows, and the fields it does not decode.

Research checked on 25 September 2026. The local key map is libMBIN **7.4.0.1** (`mapping.json` in this folder). The public game that week was No Man's Sky Cosmos **7.04** (21 September 2026). The nms-save samples cited below use save `Version` around **4720**. A newer save can add a `DiscoveryData-*` child the 7.4 map does not name. The parser still reads any child of the discovery manager that contains `Store`, `Record`, `Available`, or `Enqueued`.

## Where the records live

Current deobfuscated saves:

`DiscoveryManagerData` → `DiscoveryData-v1` → `Store` → `Record`

The same manager also has `Available` and `Enqueued` lists. All three are read. A second file dropped on the map is merged when it contains the same store. The player document with the most `PersistentPlayerBases` keeps the bases; discovery records from every file are combined.

Older or alternate layouts that are also accepted:

- `DiscoveryData` (no `-v1`) on the manager or at the top of the file
- A file that is itself a `Store` / `Record` / `Available` / `Enqueued` bucket
- `DiscoveryManagerData` nested under `BaseContext`, `ExpeditionContext`, `PlayerStateData`, or `CommonStateData`

Obfuscated Steam keys (libMBIN 7.4.0.1) rename to those names before parsing: `fDu` DiscoveryManagerData, `ETO` DiscoveryData-v1, `OsQ` Store, `?fB` Record, `brV` Available, `;FZ` Enqueued, `8P3` DD, `5L6` UA, `<Dn` DT, `bEr` VP, `q9a` DM, `q5u` CN, `ksu` OWS, `V?:` USN, `K7E` UID, `3I1` TS, `=wD` FL, `tiH` U, `bLr` C, `V?r` H, `B2h` RID.

`mf_save.hg` and `accountdata.hg` are not the discovery store. No separate discovery file showed up in the 7.4 mapping. If a tool exports discoveries on their own, drop that JSON beside the save.

## What one record contains

After the key map, a record looks like:

```json
{
  "DD": { "UA": "0x2205D058AC1D", "DT": "Planet", "VP": [] },
  "DM": { "CN": "" },
  "OWS": { "USN": "", "UID": "", "TS": 0, "PTK": "", "LID": "" },
  "FL": { "U": 0, "C": 0, "H": 0 },
  "RID": ""
}
```

`DT` values used here: `Planet`, `SolarSystem`, `Sector`, `Animal` (fauna), `Flora`, `Mineral`. `FL.U` above 0 means uploaded. `TS` is a Unix timestamp in seconds (milliseconds if the number is already that large). A custom name is `DM.CN` or `CustomName`.

## How UA becomes a map position

`UA` is the same 48-bit portal code as a base `GalacticAddress`: planet index, system index, voxel Y, Z, and X. Glyphs are `P-SSS-YY-ZZZ-XXX`. The existing base decoder is unchanged, and it still ignores bits above 48. Discovery decoding calls that decoder, then:

- An address object with `RealityIndex` uses that galaxy (`galaxySource: "reality"`).
- A packed integer larger than 48 bits treats bits 48–55 as a galaxy candidate (`galaxySource: "ua"`). A zero high byte means those bits are absent, so the galaxy stays unknown.
- An unknown galaxy is filled from the galaxy that holds the most of your bases (`galaxySource: "bases"`), or Euclid (`galaxySource: "euclid"`).

Records group by voxel X, Y, Z and system index. Unknown-galaxy records join the largest known galaxy group at those coordinates. Two known galaxies at the same coordinates stay separate. The status line lists other galaxies so a high byte does not hide systems on the Euclid view.

Planet `VP[1]` follows nms-graph: the low 16 bits are a `GcBiomeType` index, and bit 16 means infested. The enum order used here is libMBIN’s: Lush, Toxic, Scorched, Radioactive, Frozen, Barren, Dead, Weird, Red, Green, Blue, Test (index 11, skipped), Swamp, Lava, Waterworld, Gas Giant. The panel labels that as a reading of `VP`. It can disagree with a game version whose enum moved.

## What is not decoded

- Procedural planet, system, creature, plant, and mineral names. They are not in the save. Only a name you typed (`DM.CN` / `CustomName` / `Name`) is shown.
- Flora, fauna, and mineral `VP` values beyond the first integer, which is used only to tell two records apart. The panel shows a custom name when one was stored, and a count otherwise.
- Bits above bit 55. Only bits 48–55 are a galaxy candidate, and only when any bit above the 48-bit portal mask is set. nms-save does not interpret those bits; it passes reality 0 for a packed discovery `UA`. If every discovery in a real save shares one non-zero high byte, they will appear under that galaxy number and the status line will say so. Switch the galaxy menu. The map still opens on your bases’ galaxy.
- `Sector` records increment a count on the matching system and the panel mentions it. There is no sector filter. A system that is only sectors stays hidden while Planets and Systems are the only filters on, unless it also has a solar-system record.
- `RID` is used to skip a duplicate record. It is not shown. `PTK` (platform) is stored and not shown. `Available` and `Enqueued` are ingested the same way as `Store`; the panel does not say which list a record came from.
- `VisitedSystems` uses a different coordinate order and is not read.

## Sources

- This repo, `game/guides/no-mans-sky/mapping.json`, libMBIN 7.4.0.1 key map.
- [nms-save `model.rs` / `convert.rs`](https://docs.rs/nms-save/latest/nms_save/) — `DiscoveryManagerData`, raw discovery record, `FL.U`, `TS`, reality passed as 0, custom names only. Sample saves around `Version` 4720.
- [nms-core `address.rs`](https://docs.rs/nms-core/latest/nms_core/address/) — 48-bit layout; reality is a separate field. `from_packed` masks to 48 bits.
- [nms-graph `extract.rs`](https://docs.rs/nms-graph/latest/nms_graph/) — planet `VP` biome and infested bit; system and planet display names are not in the records; `Animal` is fauna.
- [libMBIN `GcBiomeType.cs`](https://github.com/monkeyman192/MBINCompiler/blob/development/libMBIN/Source/NMS/GameComponents/GcBiomeType.cs) — biome enum order.
- [r/NoMansSkyTheGame, “Starting planet listed in the JSON export”](https://www.reddit.com/r/NoMansSkyTheGame/comments/1j3ps22/starting_planet_listed_in_the_json_export_of_ones/) (March 2025) — the discovery hex string can include a galaxy byte; `Store`, `Available`, and `Enqueued` exist; the store is capped near 3,250 records. `VisitedSystems` writes YY and ZZZ in the other order and is not used here.
- [Steam, “How do I find a specific planet”](https://steamcommunity.com/app/275850/discussions/0/595140423952905979/?ctp=2) — composite `UA` hex includes a reality byte (`0xPSSSGGYYZZZXXX` in that post’s notation). This map still treats only bits 48–55 as that candidate, and only when they are set.
- [goatfungus/NMSSaveEditor issue 1300](https://github.com/goatfungus/NMSSaveEditor/issues/1300) — `mf_save.hg` is a small Steam metadata file, not the discovery store.
