"""Build Jing-Jin-Ji administrative GeoJSON for the static atlas."""

from __future__ import annotations

import json
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "administrative"
BASE = "https://geo.datav.aliyun.com/areas_v3/bound"
PROVINCES = {"110000": "北京市", "120000": "天津市", "130000": "河北省"}


def fetch(adcode: str, full: bool = False) -> dict:
    suffix = "_full" if full else ""
    request = urllib.request.Request(
        f"{BASE}/{adcode}{suffix}.json",
        headers={"User-Agent": "capital-metro-atlas/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def normalized(feature: dict, level: str, parent_code: str | None = None) -> dict:
    props = feature.get("properties", {})
    return {
        "type": "Feature",
        "properties": {
            "id": f"administrative_{props.get('adcode')}",
            "name": props.get("name", ""),
            "adcode": str(props.get("adcode", "")),
            "category": "administrative",
            "subcategory": level,
            "admin_level": level,
            "parent_code": parent_code or "",
            "center": props.get("center"),
            "centroid": props.get("centroid"),
            "children_num": props.get("childrenNum", 0),
            "source": "阿里云 DataV 地理数据服务",
            "source_date": str(date.today()),
            "updated_at": str(date.today()),
            "description": "行政区划可视化边界，不作为法定界线依据。",
        },
        "geometry": feature.get("geometry"),
    }


def collection(features: list[dict]) -> dict:
    return {"type": "FeatureCollection", "features": features}


def write(name: str, payload: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main() -> None:
    province_features, city_features, district_features, seat_features = [], [], [], []
    roots = {}
    for code in PROVINCES:
        root = fetch(code)["features"][0]
        roots[code] = root
        province_features.append(normalized(root, "province"))

    city_features.extend([
        normalized(roots["110000"], "city", "110000"),
        normalized(roots["120000"], "city", "120000"),
    ])
    hebei_cities = fetch("130000", full=True)["features"]
    city_features.extend(normalized(item, "city", "130000") for item in hebei_cities)

    district_parents = ["110000", "120000"] + [
        str(item["properties"]["adcode"]) for item in hebei_cities
    ]
    for parent_code in district_parents:
        district_features.extend(
            normalized(item, "district", parent_code)
            for item in fetch(parent_code, full=True)["features"]
        )

    for level, features in (("province", province_features), ("city", city_features), ("district", district_features)):
        for feature in features:
            props = feature["properties"]
            center = props.get("center")
            if not center:
                continue
            seat_features.append({
                "type": "Feature",
                "properties": {
                    "id": f"government_{props['adcode']}",
                    "name": props["name"],
                    "adcode": props["adcode"],
                    "category": "government_seat",
                    "subcategory": level,
                    "admin_level": level,
                    "parent_code": props["parent_code"],
                    "source": "阿里云 DataV center 字段",
                    "source_date": str(date.today()),
                    "updated_at": str(date.today()),
                    "description": "行政中心参考点；研究使用前应与当地政府公开地址复核。",
                },
                "geometry": {"type": "Point", "coordinates": center},
            })

    write("province.geojson", collection(province_features))
    write("city.geojson", collection(city_features))
    write("district.geojson", collection(district_features))
    write("government-seats.geojson", collection(seat_features))
    print(json.dumps({
        "province": len(province_features),
        "city": len(city_features),
        "district": len(district_features),
        "government_seat": len(seat_features),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
