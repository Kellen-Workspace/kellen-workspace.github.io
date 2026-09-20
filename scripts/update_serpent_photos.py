"""扫描蛇类节点照片文件夹并生成静态网页可读取的 manifest.js。"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_ROOT = ROOT / "lab" / "serpent-phylogeny"
TAXON_ROOT = MODULE_ROOT / "taxa"
OUTPUT = MODULE_ROOT / "photos" / "manifest.js"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def display_title(path: Path) -> str:
    return path.stem.replace("_", " ").replace("-", " ").strip()


def build_manifest() -> dict[str, list[dict[str, str]]]:
    manifest = {}
    for folder in sorted(item for item in TAXON_ROOT.iterdir() if item.is_dir()):
        photo_folder = folder / "photos"
        if not photo_folder.is_dir():
            continue
        photos = []
        for image in sorted(photo_folder.iterdir(), key=lambda item: item.name.lower()):
            if image.is_file() and image.suffix.lower() in EXTENSIONS:
                photos.append({
                    "src": f"taxa/{folder.name}/photos/{image.name}",
                    "title": display_title(image),
                    "alt": display_title(image),
                })
        if photos:
            manifest[folder.name] = photos
    return manifest


if __name__ == "__main__":
    data = json.dumps(build_manifest(), ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text("/* 此文件由 scripts/update_serpent_photos.py 自动生成。 */\nwindow.SERPENT_PHOTOS=" + data + ";\n", encoding="utf-8")
    print(f"updated {OUTPUT}")
