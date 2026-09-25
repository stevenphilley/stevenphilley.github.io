#!/usr/bin/env python3
"""Build game/guides/no-mans-sky/data/technology.json from an NMS-Handbook extract.

The handbook JSON is not committed. Pass the directory that contains
Technology_Table.json, Crafting_Table.json, Substance_Table.json, and
Product_Table.json (the JSON_Files folder from
https://github.com/ApexFatality93/NMS-Handbook ).

    python3 scripts/build-nms-technology.py /path/to/JSON_Files

Quantities are copied from those tables. Nothing in this script invents a
recipe amount.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAPH_PATH = ROOT / "game" / "guides" / "no-mans-sky" / "data" / "graph-v2.json"
OUT_PATH = ROOT / "game" / "guides" / "no-mans-sky" / "data" / "technology.json"

HANDBOOK_COMMIT = "142d9ffd8078944722243398202f22cbef47cd02"
HANDBOOK_DATE = "2026-02-20"
RAW_BASE = (
    "https://raw.githubusercontent.com/ApexFatality93/NMS-Handbook/"
    + HANDBOOK_COMMIT
    + "/JSON_Files/"
)
BLOB_BASE = (
    "https://github.com/ApexFatality93/NMS-Handbook/blob/"
    + HANDBOOK_COMMIT
    + "/JSON_Files/"
)

SLOT_OF = {
    "Suit": ("exosuit", "Exosuit"),
    "Weapon": ("multi-tool", "Multi-Tool"),
    "Ship": ("starship", "Starship"),
    "AllShips": ("starship", "Starship"),
    "AllShipsExceptAlien": ("starship", "Starship"),
    "RobotShip": ("starship", "Starship"),
    "AlienShip": ("living-ship", "Living Ship"),
    "Freighter": ("freighter", "Freighter"),
    "Exocraft": ("exocraft", "Exocraft"),
    "AllVehicles": ("exocraft", "Exocraft"),
    "Colossus": ("exocraft", "Exocraft"),
    "Mech": ("exocraft", "Exocraft"),
    "Submarine": ("exocraft", "Exocraft"),
}

VEHICLE = {
    "Mech": "Minotaur",
    "Submarine": "Nautilon",
    "Colossus": "Colossus",
    "Exocraft": "Exocraft",
    "AllVehicles": "Exocraft",
}

SKIP_IDS = {"OBSOLETE", "DUMMY_SCAN"}


def load(directory: Path, name: str) -> dict:
    path = directory / name
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise SystemExit(f"{name} is not an object")
    return data


def one_line(text: str) -> str:
    cleaned = re.sub(r"<[^>]*>", "", text or "")
    cleaned = cleaned.replace("<>", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return ""
    parts = re.split(r"(?<=[.!])\s+", cleaned, maxsplit=1)
    line = parts[0]
    if len(line) > 240:
        line = line[:237].rstrip() + "..."
    return line


def slugify(name: str, game_id: str) -> str:
    base = (name or "").lower().replace("'", "")
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    if not base:
        base = game_id.lower().replace("_", "-")
    return base


def amount(value) -> int:
    number = int(str(value).strip())
    if number <= 0:
        raise SystemExit(f"non-positive amount {value}")
    return number


def is_damage(game_id: str) -> bool:
    return "DMG" in game_id or game_id in SKIP_IDS


def blueprint_summary(row: dict) -> tuple[dict, list[str]]:
    shop = row.get("TechShopRarity") or ""
    race = row.get("DispensingRace") or ""
    try:
        cost = int(str(row.get("FragmentCost") or "0"))
    except ValueError:
        cost = None
    sold = shop not in ("", "Impossible")
    uncertain = []
    if sold:
        summary = (
            "Space Anomaly technology merchant. DispensingRace is "
            + race
            + ". TechShopRarity is "
            + shop
            + ". FragmentCost in the technology table is "
            + str(cost)
            + ". That field matched the Miraheze nanite price for Neural Stimulator and did not match Cadmium Drive, so it is not labelled a nanite price."
        )
        uncertain.append("fragment-cost-unit")
    elif row.get("Rarity") == "Always" and cost == 1 and row.get("PrimaryItem") == "true":
        summary = (
            "Not sold (TechShopRarity Impossible). Rarity Always, PrimaryItem, FragmentCost 1. "
            "Often the tech you start with or that a quest installs. No unlock table was in the extract."
        )
        uncertain.append("blueprint-unlock")
    else:
        summary = (
            "Not sold (TechShopRarity Impossible). How the blueprint is unlocked is not in the technology table."
        )
        uncertain.append("blueprint-unlock")
    return {
        "soldAtAnomaly": sold,
        "shopRarity": shop,
        "fragmentCost": cost,
        "dispensingRace": race,
        "summary": summary,
    }, uncertain


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build-nms-technology.py JSON_Files_DIR")
    directory = Path(sys.argv[1])
    tech = load(directory, "Technology_Table.json")
    craft = load(directory, "Crafting_Table.json")
    substances = load(directory, "Substance_Table.json")
    products = load(directory, "Product_Table.json")
    graph = json.loads(GRAPH_PATH.read_text(encoding="utf-8"))

    graph_by_name = {}
    for node in graph["nodes"]:
        graph_by_name[node["name"].lower()] = node["id"]

    def graph_id_for(game_id: str, name: str) -> str | None:
        return graph_by_name.get((name or "").lower())

    # Names for every id we might cite.
    names: dict[str, str] = {}
    blurbs: dict[str, str] = {}
    for game_id, row in substances.items():
        names[game_id] = row.get("NameLower_Text") or game_id
        blurbs[game_id] = one_line(row.get("Description_Text") or row.get("Subtitle_Text") or "")
    for game_id, row in products.items():
        names[game_id] = row.get("NameLower_Text") or game_id
        blurbs[game_id] = one_line(row.get("Description_Text") or row.get("Subtitle_Text") or "")
    for game_id, row in craft.items():
        names.setdefault(game_id, row.get("NameLower_Text") or game_id)
        if not blurbs.get(game_id):
            blurbs[game_id] = one_line(row.get("Description_Text") or row.get("Subtitle_Text") or "")

    player = []
    for game_id, row in tech.items():
        if row.get("Category") not in SLOT_OF:
            continue
        if row.get("Procedural") == "true":
            continue
        if is_damage(game_id):
            continue
        player.append((game_id, row))

    needed: set[str] = set()

    def pull(game_id: str) -> None:
        if game_id in needed:
            return
        needed.add(game_id)
        if game_id in craft:
            for ingredient in craft[game_id].get("Ingredients") or []:
                pull(ingredient["Id"])

    for _game_id, row in player:
        for ingredient in row.get("Requirements") or []:
            pull(ingredient["Id"])

    used_ids: set[str] = set()
    id_of_game: dict[str, str] = {}

    def claim(game_id: str, name: str) -> str:
        mapped = graph_id_for(game_id, name)
        if mapped:
            id_of_game[game_id] = mapped
            used_ids.add(mapped)
            return mapped
        base = slugify(name, game_id)
        chosen = base
        if chosen in used_ids:
            chosen = base + "-" + game_id.lower().replace("_", "-")
        used_ids.add(chosen)
        id_of_game[game_id] = chosen
        return chosen

    for game_id in sorted(needed):
        claim(game_id, names.get(game_id, game_id))

    discrepancies = []

    def recipe_for_product(game_id: str) -> dict | None:
        row = craft.get(game_id)
        if not row:
            return None
        inputs = []
        for ingredient in row.get("Ingredients") or []:
            ing_id = ingredient["Id"]
            if ing_id not in id_of_game:
                claim(ing_id, names.get(ing_id, ingredient.get("NameLower_Text") or ing_id))
            inputs.append({
                "id": id_of_game[ing_id],
                "qty": amount(ingredient["Amount"]),
                "gameId": ing_id,
            })
        recipe = {
            "outQty": 1,
            "inputs": inputs,
            "source": "crafting-table",
        }
        mapped = id_of_game.get(game_id)
        if mapped:
            graph_edges = [
                edge for edge in graph["edges"]
                if edge.get("kind") == "craft" and edge.get("out", {}).get("id") == mapped
            ]
            handbook_pairs = sorted((part["id"], part["qty"]) for part in inputs)
            graph_pairs = []
            if len(graph_edges) == 1:
                graph_pairs = sorted(
                    (part["id"], part["qty"]) for part in graph_edges[0].get("inputs") or []
                )
                if graph_edges[0].get("out", {}).get("qty") != 1:
                    graph_pairs = [("OUT_QTY", graph_edges[0]["out"]["qty"])]
            if graph_edges and handbook_pairs != graph_pairs:
                discrepancies.append({
                    "id": mapped,
                    "gameId": game_id,
                    "handbook": handbook_pairs,
                    "graph": graph_pairs,
                })
                recipe["graphDiffers"] = True
            elif graph_edges:
                recipe["matchesGraph"] = graph_edges[0]["id"]
        return recipe

    items = []

    def add_item(item: dict) -> None:
        items.append(item)

    for game_id in sorted(needed):
        item_id = id_of_game[game_id]
        name = names.get(game_id, game_id)
        if game_id in substances:
            add_item({
                "id": item_id,
                "gameId": game_id,
                "name": name,
                "symbol": game_id[:4],
                "kind": "resource",
                "slot": "resource",
                "slotLabel": "Resource",
                "subcategory": substances[game_id].get("Subtitle_Text") or "Substance",
                "upgrade": False,
                "procedural": False,
                "core": False,
                "blurb": blurbs.get(game_id) or name,
                "blueprint": None,
                "repair": None,
                "recipe": None,
                "graphId": item_id if item_id in graph_by_name.values() else None,
                "aliases": [game_id, game_id.lower()],
                "uncertain": [],
                "leaf": True,
            })
            continue
        recipe = recipe_for_product(game_id)
        kind = "product" if recipe else "gathered"
        slot = "component"
        label = "Component"
        blurb = blurbs.get(game_id) or ""
        if not recipe:
            blurb = (blurb + " " if blurb else "") + "No crafting-table recipe. Treated as gathered or bought."
        uncertain = [] if recipe else ["no-craft-recipe"]
        add_item({
            "id": item_id,
            "gameId": game_id,
            "name": name,
            "symbol": re.sub(r"[^A-Z0-9]", "", name.upper())[:4] or game_id[:4],
            "kind": kind,
            "slot": slot,
            "slotLabel": label,
            "subcategory": (products.get(game_id) or craft.get(game_id) or {}).get("Subtitle_Text") or kind,
            "upgrade": False,
            "procedural": False,
            "core": False,
            "blurb": blurb.strip(),
            "blueprint": None,
            "repair": None,
            "recipe": recipe,
            "graphId": item_id if any(node["id"] == item_id for node in graph["nodes"]) else None,
            "aliases": [game_id, game_id.lower(), name],
            "uncertain": uncertain,
            "leaf": recipe is None,
        })

    for game_id, row in sorted(player, key=lambda pair: (SLOT_OF[pair[1]["Category"]][0], pair[1].get("NameLower_Text") or "")):
        name = row.get("NameLower_Text") or game_id
        item_id = slugify(name, game_id)
        if item_id in used_ids:
            item_id = item_id + "-" + game_id.lower().replace("_", "-")
        used_ids.add(item_id)
        slot, slot_label = SLOT_OF[row["Category"]]
        subtitle = row.get("Subtitle_Text") or ""
        vehicle = VEHICLE.get(row["Category"])
        if vehicle:
            subcategory = vehicle + " · " + subtitle if subtitle else vehicle
        elif row["Category"] == "RobotShip":
            subcategory = "Sentinel ship · " + subtitle if subtitle else "Sentinel ship"
        else:
            subcategory = subtitle or (row.get("BaseStat") or "Technology")
        inputs = []
        for ingredient in row.get("Requirements") or []:
            ing_game = ingredient["Id"]
            if ing_game not in id_of_game:
                claim(ing_game, names.get(ing_game, ingredient.get("NameLower_Text") or ing_game))
                # A requirement can name something outside the first closure if claim raced.
                # claim() only assigns an id. The item itself must exist.
            inputs.append({
                "id": id_of_game[ing_game],
                "qty": amount(ingredient["Amount"]),
                "gameId": ing_game,
            })
        recipe = None
        if inputs:
            recipe = {
                "outQty": 1,
                "inputs": inputs,
                "source": "technology-table-requirements",
            }
        bp, uncertain = blueprint_summary(row)
        blurb = one_line(row.get("Description_Text") or "") or subtitle or name
        upgrade = row.get("Upgrade") == "true"
        add_item({
            "id": item_id,
            "gameId": game_id,
            "name": name,
            "symbol": re.sub(r"[^A-Z0-9]", "", game_id)[:4],
            "kind": "upgrade" if upgrade else "technology",
            "slot": slot,
            "slotLabel": slot_label,
            "subcategory": subcategory,
            "gameCategory": row["Category"],
            "upgrade": upgrade,
            "procedural": False,
            "core": row.get("Core") == "true",
            "blurb": blurb,
            "blueprint": bp,
            "repair": None,
            "recipe": recipe,
            "graphId": None,
            "aliases": [game_id, game_id.lower()],
            "uncertain": uncertain,
            "leaf": recipe is None,
        })

    procedural = []
    for game_id, row in sorted(tech.items()):
        if row.get("Procedural") != "true":
            continue
        if row.get("Category") not in SLOT_OF:
            continue
        slot, slot_label = SLOT_OF[row["Category"]]
        procedural.append({
            "id": "proc-" + game_id.lower().replace("_", "-"),
            "gameId": game_id,
            "name": "Procedural module " + game_id,
            "symbol": "PROC",
            "kind": "procedural",
            "slot": "procedural",
            "slotLabel": "Procedural module",
            "equipmentSlot": slot,
            "equipmentLabel": slot_label,
            "subcategory": slot_label + " · " + (row.get("BaseStat") or row["Category"]),
            "gameCategory": row["Category"],
            "baseStat": row.get("BaseStat") or "",
            "upgrade": row.get("Upgrade") == "true",
            "procedural": True,
            "core": False,
            "blurb": (
                "Procedurally generated S, A, B, or C class module from template "
                + game_id
                + ". Not a craftable blueprint. The technology table Requirements list is a template and is omitted."
            ),
            "blueprint": {
                "soldAtAnomaly": False,
                "shopRarity": row.get("TechShopRarity") or "",
                "fragmentCost": None,
                "dispensingRace": row.get("DispensingRace") or "",
                "summary": "Bought or found as a procedural upgrade module. Not crafted from a blueprint.",
            },
            "repair": None,
            "recipe": None,
            "graphId": None,
            "aliases": [game_id],
            "uncertain": [],
            "leaf": True,
        })

    # Requirements can name an id that was not in the first closure (should not
    # happen). Fill any stragglers so every ingredient has an item.
    known_games = {item["gameId"] for item in items}
    missing_items = []
    for item in items:
        recipe = item.get("recipe") or {}
        for part in recipe.get("inputs") or []:
            if part["gameId"] not in known_games and part["gameId"] not in {row["gameId"] for row in missing_items}:
                game_id = part["gameId"]
                name = names.get(game_id, game_id)
                missing_items.append({
                    "id": id_of_game[game_id],
                    "gameId": game_id,
                    "name": name,
                    "symbol": game_id[:4],
                    "kind": "gathered",
                    "slot": "component",
                    "slotLabel": "Component",
                    "subcategory": "Unresolved ingredient",
                    "upgrade": False,
                    "procedural": False,
                    "core": False,
                    "blurb": "Named by a recipe. No substance, product, or crafting row was found under this id.",
                    "blueprint": None,
                    "repair": None,
                    "recipe": None,
                    "graphId": None,
                    "aliases": [game_id],
                    "uncertain": ["unresolved-ingredient"],
                    "leaf": True,
                })
    items.extend(missing_items)
    items.extend(procedural)

    slots = [
        {"id": "exosuit", "label": "Exosuit"},
        {"id": "multi-tool", "label": "Multi-Tool"},
        {"id": "starship", "label": "Starship"},
        {"id": "living-ship", "label": "Living Ship"},
        {"id": "freighter", "label": "Freighter"},
        {"id": "exocraft", "label": "Exocraft"},
        {"id": "component", "label": "Components"},
        {"id": "resource", "label": "Resources"},
        {"id": "procedural", "label": "Procedural modules"},
    ]

    counts: dict[str, int] = {}
    for item in items:
        key = item["kind"] + ":" + item["slot"]
        counts[key] = counts.get(key, 0) + 1

    document = {
        "meta": {
            "game": "No Man's Sky",
            "extract": "NMS-Handbook JSON, commit " + HANDBOOK_COMMIT + ", " + HANDBOOK_DATE,
            "extractName": "Feb 2026 Update",
            "patchLine": "Remnant 6.2 (11 February 2026) is in this extract: the Gravitino Coil technology is present. The handbook commit does not name a build number. Remnant 6.24 (27 February 2026) and Cosmos 7.04 (21 September 2026) are later and were not re-extracted.",
            "spelling": "British, as in the game-file NameLower text and the existing refine graph.",
            "repair": (
                "The technology table stores one Requirements list. This file copies that list as the install recipe. "
                "It does not store a second repair list. Miraheze pages from 2020–2022 list a smaller repair cost for "
                "Neural Stimulator and Cadmium Drive. Those repair figures were not copied."
            ),
            "fragmentCost": (
                "FragmentCost is copied from the technology table. Neural Stimulator's 90 matches the Miraheze nanite "
                "price (Iteration: Selene, SentinelUp, 12 April 2022). Cadmium Drive's FragmentCost is 80, and that "
                "wiki lists 800 nanites (Iteration: Hyperion, SentinelUp). The unit is therefore left unverified."
            ),
            "primaryRefine": (
                "The crafting tree expands inventory recipes fully. It expands a refiner step only along a fixed list "
                "of one-way ladders in graph-v2.json: ferrite dust to pure ferrite to magnetised ferrite, carbon to "
                "condensed carbon, sodium to sodium nitrate, cobalt to ionised cobalt, salt to chlorine, and copper "
                "to chromatic metal. Copper is the yellow-star path. Cadmium, emeril, and indium also make chromatic "
                "metal; those edges stay on the Refine page. Expansion loops are not walked."
            ),
            "omitted": [
                "Base-building parts (crafting table WikiCategory Construction).",
                "Damaged-slot technologies (ids containing DMG), OBSOLETE, and DUMMY_SCAN.",
                "Maintenance-category entries (portal glyphs and freighter maintenance slots).",
                "Procedural module Requirements templates.",
                "Cooking, except where a cooking product is an ingredient of an included recipe.",
            ],
            "knownCycles": [],
            "discrepancies": discrepancies,
            "counts": counts,
            "crossChecks": [
                {
                    "item": "Neural Stimulator",
                    "gameId": "UT_JET",
                    "install": "100 Chromatic Metal + 100 Condensed Carbon",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Neural_Stimulator",
                    "wikiEra": "SentinelUp, 12 April 2022",
                    "result": "Install quantities match. Wiki nanite price 90 matches FragmentCost 90. Wiki repair (half) was not copied.",
                },
                {
                    "item": "Cadmium Drive",
                    "gameId": "HDRIVEBOOST1",
                    "install": "250 Chromatic Metal + 3 Wiring Loom",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Cadmium_Drive",
                    "wikiEra": "SentinelUp",
                    "result": "Install quantities match. Wiki nanite price 800 does not match FragmentCost 80.",
                },
                {
                    "item": "Jetpack",
                    "gameId": "JET1",
                    "install": "100 Ferrite Dust",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Jetpack",
                    "wikiEra": "Desolation, 22 September 2020",
                    "result": "Wiki repair lists 100 Ferrite Dust + 50 Cobalt. The February 2026 Requirements list is 100 Ferrite Dust only. The cobalt line was not added.",
                },
            ],
            "sources": [
                {
                    "name": "NMS-Handbook Technology_Table.json",
                    "url": BLOB_BASE + "Technology_Table.json",
                    "raw": RAW_BASE + "Technology_Table.json",
                },
                {
                    "name": "NMS-Handbook Crafting_Table.json",
                    "url": BLOB_BASE + "Crafting_Table.json",
                    "raw": RAW_BASE + "Crafting_Table.json",
                },
                {
                    "name": "NMS-Handbook Substance_Table.json",
                    "url": BLOB_BASE + "Substance_Table.json",
                    "raw": RAW_BASE + "Substance_Table.json",
                },
                {
                    "name": "NMS-Handbook Product_Table.json",
                    "url": BLOB_BASE + "Product_Table.json",
                    "raw": RAW_BASE + "Product_Table.json",
                },
                {
                    "name": "NMS-Handbook game file NMS_REALITY_GCTECHNOLOGYTABLE.MXML",
                    "url": "https://github.com/ApexFatality93/NMS-Handbook/blob/" + HANDBOOK_COMMIT + "/Game%20Files/NMS_REALITY_GCTECHNOLOGYTABLE.MXML",
                },
                {
                    "name": "Existing refine graph",
                    "url": "https://stevenphilley.com/game/guides/no-mans-sky/data/graph-v2.json",
                },
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Neural Stimulator",
                    "url": "https://nomanssky.miraheze.org/wiki/Neural_Stimulator",
                },
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Cadmium Drive",
                    "url": "https://nomanssky.miraheze.org/wiki/Cadmium_Drive",
                },
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Jetpack",
                    "url": "https://nomanssky.miraheze.org/wiki/Jetpack",
                },
                {
                    "name": "Hello Games — Remnant",
                    "url": "https://www.nomanssky.com/2026/02/no-mans-sky-remnant/",
                },
                {
                    "name": "Hello Games — Cosmos 7.04",
                    "url": "https://www.nomanssky.com/2026/09/cosmos-7-04/",
                },
            ],
        },
        "slots": slots,
        "items": items,
    }

    OUT_PATH.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(items)} items)")
    print("counts", json.dumps(counts, indent=2))
    print("discrepancies", len(discrepancies))
    for row in discrepancies:
        print(" ", row)


if __name__ == "__main__":
    main()
