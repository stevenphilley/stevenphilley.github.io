#!/usr/bin/env python3
"""Build the No Man's Sky technology catalog and the crafted-trade graph rows.

The handbook JSON is not committed. Pass the directory that contains
Technology_Table.json, Crafting_Table.json, Substance_Table.json, and
Product_Table.json (the JSON_Files folder from
https://github.com/ApexFatality93/NMS-Handbook ).

    python3 scripts/build-nms-technology.py /path/to/JSON_Files

Quantities are copied from those tables. Nothing in this script invents a
recipe amount. The same run adds crafted trade goods (Stasis Device and the
rest of the crafting-table profit tree) to graph-v2.json as inventory edges.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAPH_PATH = ROOT / "game" / "guides" / "no-mans-sky" / "data" / "graph-v2.json"
OUT_PATH = ROOT / "game" / "guides" / "no-mans-sky" / "data" / "technology.json"
NAMES_PATH = ROOT / "game" / "guides" / "no-mans-sky" / "data" / "nms-item-names.json"

# Starship launch fuel stays out of the material graph. The crafting table has
# a recipe; the graph's existing omission is kept on purpose.
OMIT_GRAPH_IDS = {"LAUNCHFUEL"}

CRAFT_GAPS = [
    "Starship Launch Fuel (LAUNCHFUEL) has a crafting-table recipe (40 Di-hydrogen and 1 Metal Plating) and stays out of the graph.",
    "Repair Kit (REPAIRKIT) is in the crafting table with an empty Ingredients list, so it has no recipe.",
    "Frigate Fuel (50 Tonnes), Frigate Fuel (200 Tonnes), and Surge Battery are WikiCategory NotEnabled in this extract.",
    "Platinum is not an ingredient of these inventory blueprints. The three-input refiner alloy-latticing rows (tritium, silver, gold, or platinum) stay out.",
    "Gamma Weed is the plant that yields Gamma Root. The recipes use Gamma Root.",
    "Marrow Bulb and Sac Venom are not ingredients of these crafting-table recipes. Sac Venom has no crafting recipe.",
]

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


def product_value(row: dict | None) -> int | None:
    if not row:
        return None
    raw = row.get("BaseValue")
    if raw is None or str(raw).strip() == "":
        return None
    number = float(str(raw).strip())
    if number <= 0 or number != int(number):
        raise SystemExit(f"bad BaseValue {raw}")
    return int(number)


def short_name(name: str) -> str:
    base = re.sub(r"\s*\([^)]*\)", "", name).strip()
    if len(base) <= 16:
        return base
    return base.split()[0]


def symbol_for(game_id: str, name: str) -> str:
    fixed = {"ASTEROID1": "Ag", "ASTEROID2": "Au", "ASTEROID3": "Pt"}
    if game_id in fixed:
        return fixed[game_id]
    words = re.findall(r"[A-Za-z]+", name)
    if len(words) >= 2:
        return (words[0][0] + words[1][0]).upper()
    if words:
        return words[0][:2].upper()
    return game_id[:2].upper()


def install_closure(tech: dict, craft: dict) -> set[str]:
    """Ids already pulled in because a player technology installs them."""
    needed: set[str] = set()

    def pull(game_id: str) -> None:
        if game_id in needed:
            return
        needed.add(game_id)
        row = craft.get(game_id)
        if not row:
            return
        for ingredient in row.get("Ingredients") or []:
            pull(ingredient["Id"])

    for game_id, row in tech.items():
        if row.get("Category") not in SLOT_OF:
            continue
        if row.get("Procedural") == "true":
            continue
        if is_damage(game_id):
            continue
        for ingredient in row.get("Requirements") or []:
            pull(ingredient["Id"])
    return needed


def crafted_product_ids(products: dict, craft: dict, item_names: dict, install_ids: set[str]) -> list[str]:
    """Crafting-table trade goods, plus other named products the install tree does not already require."""
    roots = []
    for game_id, row in products.items():
        if row.get("WikiCategory") != "Crafting":
            continue
        if game_id in OMIT_GRAPH_IDS:
            continue
        ingredients = (craft.get(game_id) or {}).get("Ingredients") or []
        if not ingredients:
            continue
        named = item_names.get(game_id) or {}
        if named.get("category") not in ("product", "trade good"):
            continue
        if row.get("Type") == "Tradeable" or (row.get("Type") == "Consumable" and game_id not in install_ids):
            roots.append(game_id)
    roots.sort()
    return roots


def recipe_closure(roots: list[str], craft: dict) -> set[str]:
    seen: set[str] = set()

    def walk(game_id: str) -> None:
        if game_id in seen:
            return
        seen.add(game_id)
        row = craft.get(game_id)
        if not row:
            return
        for ingredient in row.get("Ingredients") or []:
            walk(ingredient["Id"])

    for game_id in roots:
        walk(game_id)
    return seen


def classify_node(game_id: str, product: dict | None, is_substance: bool) -> tuple[str, str, str]:
    if is_substance:
        if game_id.startswith("ASTEROID"):
            return "resource", "minerals", "asteroid"
        return "resource", "minerals", "earth"
    ptype = (product or {}).get("Type") or ""
    if ptype == "Consumable":
        return "component", "consumables", "consumable"
    if ptype == "Component":
        return "component", "components", "parts"
    return "component", "products", "product"


def sync_crafted_goods(graph: dict, products: dict, craft: dict, substances: dict, roots: list[str]) -> None:
    """Add inventory craft nodes and edges. Existing refine rows are left in place."""
    by_name = {node["name"].lower(): node for node in graph["nodes"]}
    by_id = {node["id"]: node for node in graph["nodes"]}
    taken_alias = set()
    for node in graph["nodes"]:
        taken_alias.add(node["id"].lower())
        taken_alias.add(node["name"].lower())
        for alias in node.get("aliases") or []:
            taken_alias.add(str(alias).lower())

    def remember(node: dict) -> None:
        by_name[node["name"].lower()] = node
        by_id[node["id"]] = node
        taken_alias.add(node["id"].lower())
        taken_alias.add(node["name"].lower())
        for alias in node.get("aliases") or []:
            taken_alias.add(str(alias).lower())

    def add_alias(node: dict, alias: str) -> None:
        if not alias:
            return
        if alias.lower() in taken_alias and alias.lower() not in {a.lower() for a in node.get("aliases") or []} and alias.lower() != node["id"].lower() and alias.lower() != node["name"].lower():
            return
        aliases = node.setdefault("aliases", [])
        if alias not in aliases and alias.lower() not in {a.lower() for a in aliases}:
            aliases.append(alias)
            taken_alias.add(alias.lower())

    closure = recipe_closure(roots, craft)
    id_of: dict[str, str] = {}

    for game_id in sorted(closure):
        product = products.get(game_id)
        substance = substances.get(game_id)
        row = product or substance or craft.get(game_id) or {}
        name = row.get("NameLower_Text") or game_id
        existing = by_name.get(name.lower())
        worth = product_value(product or substance)
        if existing:
            id_of[game_id] = existing["id"]
            add_alias(existing, game_id)
            # Base value is recorded for product-table rows. Existing substances keep their blurbs and gain no value field.
            if product and worth is not None and "value" not in existing:
                existing["value"] = worth
            continue
        kind, category, group = classify_node(game_id, product, game_id in substances)
        base = slugify(name, game_id)
        chosen = base if base not in by_id else base + "-" + game_id.lower().replace("_", "-")
        blurb = one_line(row.get("Description_Text") or "") or (row.get("Subtitle_Text") or name)
        node = {
            "id": chosen,
            "name": name,
            "short": short_name(name),
            "symbol": symbol_for(game_id, name),
            "group": group,
            "category": category,
            "kind": kind,
            "aliases": [game_id],
            "blurb": blurb,
        }
        if worth is not None:
            node["value"] = worth
        graph["nodes"].append(node)
        remember(node)
        id_of[game_id] = chosen

    def pairs(edge: dict) -> list[tuple[str, int]]:
        return sorted((part["id"], part["qty"]) for part in edge.get("inputs") or [])

    for game_id in sorted(closure):
        row = craft.get(game_id)
        if not row or not (row.get("Ingredients") or []):
            continue
        out_id = id_of[game_id]
        inputs = []
        for ingredient in row["Ingredients"]:
            ing_id = ingredient["Id"]
            if ing_id not in id_of:
                raise SystemExit(f"{game_id} ingredient {ing_id} has no node")
            inputs.append({"id": id_of[ing_id], "qty": amount(ingredient["Amount"])})
        wanted = sorted((part["id"], part["qty"]) for part in inputs)
        crafts = [
            edge for edge in graph["edges"]
            if edge.get("kind") == "craft" and edge.get("out", {}).get("id") == out_id
        ]
        if crafts:
            if len(crafts) != 1 or pairs(crafts[0]) != wanted or crafts[0].get("out", {}).get("qty") != 1:
                raise SystemExit(f"craft edge for {out_id} does not match the crafting table: {crafts}")
            continue
        edge_id = "-".join([out_id] + [f"{part['id']}-{part['qty']}" for part in inputs])
        if any(edge.get("id") == edge_id for edge in graph["edges"]):
            raise SystemExit(f"edge id collision {edge_id}")
        graph["edges"].append({
            "id": edge_id,
            "name": row.get("NameLower_Text") or game_id,
            "kind": "craft",
            "inputs": inputs,
            "out": {"id": out_id, "qty": 1},
            "station": "inventory",
        })

    meta = graph.setdefault("meta", {})
    meta["era"] = (
        "No Man's Sky Wiki on Miraheze. Mineral ratios from the v1 refine list. "
        "The later refine and inventory craft rows follow the moodboard edge list. "
        "Crafted trade goods are the NMS-Handbook crafting table, commit "
        + HANDBOOK_COMMIT
        + ", "
        + HANDBOOK_DATE
        + "."
    )
    meta["disclaimer"] = (
        "Charging a technology is fuel. It is not a refiner recipe and it is not a craft row. "
        "Craft rows are made in station inventory. Wiring loom is bought, not crafted, so it has no edge. "
        "High-speed sublimation is the three-slot path to nitrogen salt, enriched carbon, and thermic condensate. "
        "Those three also have an inventory blueprint from the crafting table. "
        "Other three-input large-refiner rows, including alloy latticing, are left out. "
        "Silver and gold are gathered inputs. Platinum stays out. A later patch can change a recipe."
    )
    meta["omitted"] = (
        "Wiring loom. Portable refiner and starship launch fuel. Platinum. Cooking. "
        "Large-refiner recipes other than high-speed sublimation, including three-input alloy latticing. "
        "Repair Kit has an empty crafting-table ingredient list."
    )
    meta["tradeGoods"] = (
        "Inventory blueprints for crafted trade goods are copied from the NMS-Handbook crafting table, commit "
        + HANDBOOK_COMMIT
        + ", "
        + HANDBOOK_DATE
        + " (Remnant 6.2 line). Stasis Device, Quantum Processor, and Cryogenic Chamber match the Miraheze craft boxes. "
        "The raw bill uses the inventory blueprint, then the one-way refiner ladders "
        "(condensed carbon to carbon, ionised cobalt to cobalt, pure ferrite to ferrite dust, and the other primary ladders). "
        "Base value is the product table BaseValue."
    )
    meta["craftGaps"] = list(CRAFT_GAPS)
    sources = meta.setdefault("sources", [])
    have = {source.get("url") for source in sources}
    extra_sources = [
        {
            "name": "NMS-Handbook Crafting_Table.json — crafted trade goods",
            "url": BLOB_BASE + "Crafting_Table.json",
        },
        {
            "name": "NMS-Handbook Product_Table.json — base sell values",
            "url": BLOB_BASE + "Product_Table.json",
        },
        {
            "name": "No Man's Sky Wiki (Miraheze) — Stasis Device",
            "url": "https://nomanssky.miraheze.org/wiki/Stasis_Device",
        },
        {
            "name": "No Man's Sky Wiki (Miraheze) — Quantum Processor",
            "url": "https://nomanssky.miraheze.org/wiki/Quantum_Processor",
        },
        {
            "name": "No Man's Sky Wiki (Miraheze) — Cryogenic Chamber",
            "url": "https://nomanssky.miraheze.org/wiki/Cryogenic_Chamber",
        },
        {
            "name": "No Man's Sky Wiki (Miraheze) — Nitrogen Salt",
            "url": "https://nomanssky.miraheze.org/wiki/Nitrogen_Salt",
        },
        {
            "name": "No Man's Sky Wiki (Miraheze) — Aronium",
            "url": "https://nomanssky.miraheze.org/wiki/Aronium",
        },
    ]
    for source in extra_sources:
        if source["url"] not in have:
            sources.append(source)
            have.add(source["url"])


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build-nms-technology.py JSON_Files_DIR")
    directory = Path(sys.argv[1])
    tech = load(directory, "Technology_Table.json")
    craft = load(directory, "Crafting_Table.json")
    substances = load(directory, "Substance_Table.json")
    products = load(directory, "Product_Table.json")
    graph = json.loads(GRAPH_PATH.read_text(encoding="utf-8"))
    item_names = json.loads(NAMES_PATH.read_text(encoding="utf-8")).get("items") or {}
    extra_roots = crafted_product_ids(products, craft, item_names, install_closure(tech, craft))
    sync_crafted_goods(graph, products, craft, substances, extra_roots)

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
    for game_id in extra_roots:
        pull(game_id)

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
        product_item = {
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
        }
        worth = product_value(products.get(game_id))
        if worth is not None:
            product_item["value"] = worth
        add_item(product_item)

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
                "The crafting tree expands inventory recipes fully, including crafted trade goods such as Stasis Device. "
                "It expands a refiner step only along a fixed list of one-way ladders in graph-v2.json: ferrite dust to "
                "pure ferrite to magnetised ferrite, carbon to condensed carbon, sodium to sodium nitrate, cobalt to "
                "ionised cobalt, salt to chlorine, and copper to chromatic metal. Copper is the yellow-star path. "
                "Cadmium, emeril, and indium also make chromatic metal; those edges stay on the Refine page. "
                "Expansion loops are not walked. Nitrogen salt, enriched carbon, and thermic condensate use the "
                "inventory blueprint in this file (250 gas and 50 condensed carbon). Their high-speed sublimation "
                "refiner rows stay on the refine graph as a second way to make them."
            ),
            "omitted": [
                "Base-building parts (crafting table WikiCategory Construction).",
                "Damaged-slot technologies (ids containing DMG), OBSOLETE, and DUMMY_SCAN.",
                "Maintenance-category entries (portal glyphs and freighter maintenance slots).",
                "Procedural module Requirements templates.",
                "Cooking, except where a cooking product is an ingredient of an included recipe.",
                "Starship launch fuel, kept out of the refine graph.",
                "Repair Kit, whose crafting-table Ingredients list is empty.",
                "WikiCategory NotEnabled rows (Frigate Fuel 50 and 200 tonnes, Surge Battery).",
                "Three-input refiner alloy latticing. The inventory blueprint is the craft row.",
            ],
            "craftGaps": CRAFT_GAPS,
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
                {
                    "item": "Stasis Device",
                    "gameId": "ULTRAPROD2",
                    "install": "1 Quantum Processor + 1 Cryogenic Chamber + 1 Iridesite",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Stasis_Device",
                    "wikiEra": "Miraheze craft box. Page template Version Origins; release history through Outlaws. Value 15,600,000.",
                    "result": "Craft quantities and BaseValue 15600000 match the February 2026 crafting and product tables. Cosmos 7.04 was not re-extracted.",
                },
                {
                    "item": "Quantum Processor",
                    "gameId": "MEGAPROD2",
                    "install": "1 Circuit Board + 1 Superconductor",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Quantum_Processor",
                    "wikiEra": "Miraheze craft box. Page template Version Frontiers. Value 4,400,000.",
                    "result": "Craft quantities and BaseValue 4400000 match the February 2026 tables.",
                },
                {
                    "item": "Cryogenic Chamber",
                    "gameId": "MEGAPROD3",
                    "install": "1 Living Glass + 1 Cryo-Pump",
                    "wiki": "https://nomanssky.miraheze.org/wiki/Cryogenic_Chamber",
                    "wikiEra": "Miraheze craft box. Page template Version Prisms. Value 3,800,000.",
                    "result": "Craft quantities and BaseValue 3800000 match the February 2026 tables.",
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
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Stasis Device",
                    "url": "https://nomanssky.miraheze.org/wiki/Stasis_Device",
                },
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Quantum Processor",
                    "url": "https://nomanssky.miraheze.org/wiki/Quantum_Processor",
                },
                {
                    "name": "No Man's Sky Wiki (Miraheze) — Cryogenic Chamber",
                    "url": "https://nomanssky.miraheze.org/wiki/Cryogenic_Chamber",
                },
            ],
        },
        "slots": slots,
        "items": items,
    }

    GRAPH_PATH.write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    OUT_PATH.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {GRAPH_PATH} ({len(graph['nodes'])} nodes, {len(graph['edges'])} edges)")
    print(f"Wrote {OUT_PATH} ({len(items)} items)")
    print("counts", json.dumps(counts, indent=2))
    print("discrepancies", len(discrepancies))
    for row in discrepancies:
        print(" ", row)


if __name__ == "__main__":
    main()
