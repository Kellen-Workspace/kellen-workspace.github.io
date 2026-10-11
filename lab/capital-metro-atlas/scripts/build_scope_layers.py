"""Build official planning-scope layers for the capital functional circle and Xiongan."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "data" / "administrative" / "district.geojson"
OUT = ROOT / "data" / "planning"
TOWN_BASE = "https://geojsoncn.com/mapjson"

LANGFANG = {"131003", "131002", "131082", "131028", "131024", "131022", "131023"}
BAODING = {"130602", "130606", "130609", "130607", "130608", "130681", "130623", "130684", "130626"}
HUAILAI = {"130730"}
XIONGAN_COUNTIES = {"130638", "130629", "130632"}
TOWN_SOURCES = {
    "区县/沧州市-任丘市.json": {
        "鄚州镇": "130982104000",
        "苟各庄镇": "130982105000",
        "七间房乡": "130982205000",
    },
    "区县/保定市-高阳县.json": {"龙化乡": "130628204000"},
}


def read_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "capital-metro-atlas/1.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def town_url(path: str) -> str:
    return TOWN_BASE + "/" + "/".join(urllib.parse.quote(part) for part in path.split("/"))


def normalize_town(feature: dict, name: str, code: str) -> dict:
    return {
        "type": "Feature",
        "properties": {
            "id": f"xiongan_town_{code}",
            "name": name,
            "adcode": code,
            "category": "planning",
            "subcategory": "xiongan_managed_township",
            "admin_level": "township",
            "scope": "xiongan",
            "source": "GeoJSONcn 乡镇边界；规划范围依据《河北雄安新区规划纲要》",
            "source_date": str(date.today()),
            "updated_at": str(date.today()),
            "description": "纳入雄安新区规划范围并实行托管的外围乡镇。",
        },
        "geometry": feature["geometry"],
    }


def in_function_circle(code: str) -> bool:
    return (
        code.startswith("11")
        or code.startswith("12")
        or code in LANGFANG
        or code in BAODING
        or code in HUAILAI
        or code in XIONGAN_COUNTIES
    )


def main() -> None:
    districts = json.loads(ADMIN.read_text(encoding="utf-8"))["features"]
    by_code = {str(feature["properties"]["adcode"]): feature for feature in districts}
    missing = (LANGFANG | BAODING | HUAILAI | XIONGAN_COUNTIES) - set(by_code)
    if missing:
        raise RuntimeError(f"Missing district codes: {sorted(missing)}")

    xiongan = []
    for code in sorted(XIONGAN_COUNTIES):
        feature = json.loads(json.dumps(by_code[code]))
        feature["properties"]["scope"] = "xiongan"
        feature["properties"]["description"] = "雄安新区三县行政辖区，属于新区规划范围。"
        xiongan.append(feature)

    for path, wanted in TOWN_SOURCES.items():
        data = read_json(town_url(path))
        name_map = {
            str(item.get("properties", {}).get("NAME") or item.get("properties", {}).get("name")): item
            for item in data["features"]
        }
        for name, code in wanted.items():
            if name not in name_map:
                raise RuntimeError(f"Missing township geometry: {name}")
            xiongan.append(normalize_town(name_map[name], name, code))

    function_circle = []
    for feature in districts:
        code = str(feature["properties"]["adcode"])
        if in_function_circle(code):
            item = json.loads(json.dumps(feature))
            item["properties"]["scope"] = "capital_functional_circle"
            function_circle.append(item)
    function_circle.extend(json.loads(json.dumps(item)) for item in xiongan if item["properties"]["admin_level"] == "township")

    OUT.mkdir(parents=True, exist_ok=True)
    payloads = {
        "capital-functional-circle.geojson": {"type": "FeatureCollection", "features": function_circle},
        "xiongan-new-area.geojson": {"type": "FeatureCollection", "features": xiongan},
    }
    for name, payload in payloads.items():
        (OUT / name).write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    print(json.dumps({
        "functional_circle_features": len(function_circle),
        "xiongan_features": len(xiongan),
        "xiongan_names": [item["properties"]["name"] for item in xiongan],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
