"""Create a colour-banded elevation overlay from Terrarium DEM tiles."""

from __future__ import annotations

import io
import json
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "data" / "administrative" / "province.geojson"
OUT = ROOT / "data" / "environment"
BOUNDS = [113.35, 36.0, 119.95, 42.75]
ZOOM, TILE_SIZE = 8, 256
TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
COLORS = (
    (-10000, 100, (59, 142, 91, 178)),
    (100, 300, (173, 184, 92, 184)),
    (300, 800, (190, 137, 67, 192)),
    (800, 20000, (112, 79, 66, 202)),
)


def world_pixel(lon: float, lat: float) -> tuple[float, float]:
    scale = TILE_SIZE * (2**ZOOM)
    x = (lon + 180) / 360 * scale
    lat = max(min(lat, 85.05112878), -85.05112878)
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * scale
    return x, y


def tile(x: int, y: int) -> Image.Image:
    request = urllib.request.Request(
        TERRARIUM.format(z=ZOOM, x=x, y=y),
        headers={"User-Agent": "capital-metro-atlas/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGB")


def draw_geometry(draw: ImageDraw.ImageDraw, geometry: dict, origin: tuple[int, int]) -> None:
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    for polygon in polygons:
        for index, ring in enumerate(polygon):
            points = []
            for lon, lat in ring:
                x, y = world_pixel(lon, lat)
                points.append((round(x - origin[0]), round(y - origin[1])))
            draw.polygon(points, fill=255 if index == 0 else 0)


def main() -> None:
    west, south, east, north = BOUNDS
    left, top = world_pixel(west, north)
    right, bottom = world_pixel(east, south)
    min_tx, max_tx = math.floor(left / TILE_SIZE), math.floor((right - 1) / TILE_SIZE)
    min_ty, max_ty = math.floor(top / TILE_SIZE), math.floor((bottom - 1) / TILE_SIZE)
    mosaic = Image.new("RGB", ((max_tx - min_tx + 1) * TILE_SIZE, (max_ty - min_ty + 1) * TILE_SIZE))
    for tile_y in range(min_ty, max_ty + 1):
        for tile_x in range(min_tx, max_tx + 1):
            mosaic.paste(tile(tile_x, tile_y), ((tile_x - min_tx) * TILE_SIZE, (tile_y - min_ty) * TILE_SIZE))

    crop = (
        round(left - min_tx * TILE_SIZE),
        round(top - min_ty * TILE_SIZE),
        round(right - min_tx * TILE_SIZE),
        round(bottom - min_ty * TILE_SIZE),
    )
    terrain = mosaic.crop(crop)
    result = Image.new("RGBA", terrain.size, (0, 0, 0, 0))
    source_pixels, result_pixels = terrain.load(), result.load()
    for y in range(terrain.height):
        for x in range(terrain.width):
            red, green, blue = source_pixels[x, y]
            elevation = red * 256 + green + blue / 256 - 32768
            for lower, upper, color in COLORS:
                if lower <= elevation < upper:
                    result_pixels[x, y] = color
                    break

    mask = Image.new("L", terrain.size, 0)
    draw = ImageDraw.Draw(mask)
    origin = (round(left), round(top))
    for feature in json.loads(ADMIN.read_text(encoding="utf-8"))["features"]:
        draw_geometry(draw, feature["geometry"], origin)
    result.putalpha(Image.composite(result.getchannel("A"), Image.new("L", result.size, 0), mask))

    OUT.mkdir(parents=True, exist_ok=True)
    result.save(OUT / "elevation-bands.png", optimize=True)
    metadata = {
        "bounds": BOUNDS,
        "coordinates": [[west, north], [east, north], [east, south], [west, south]],
        "zoom": ZOOM,
        "classification": ["<100 m", "100–300 m", "300–800 m", "≥800 m"],
        "source": "Mapzen Terrain Tiles on AWS Open Data",
        "method": "Terrarium DEM decoding; four-band classification; clipped to Beijing, Tianjin and Hebei province polygons.",
    }
    (OUT / "elevation-metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"width": result.width, "height": result.height, "tiles": (max_tx-min_tx+1)*(max_ty-min_ty+1)}))


if __name__ == "__main__":
    main()
