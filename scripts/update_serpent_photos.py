"""扫描蛇类照片与日志，生成 GitHub Pages 可读取的静态清单。"""
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_ROOT = ROOT / "lab" / "serpent-phylogeny"
TAXON_ROOT = MODULE_ROOT / "taxa"
PHOTO_OUTPUT = MODULE_ROOT / "photos" / "manifest.js"
LOG_OUTPUT = MODULE_ROOT / "logs" / "manifest.js"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


class LogMetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.values: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "meta":
            return
        values = dict(attrs)
        name = values.get("name", "")
        if name.startswith("log-") and values.get("content"):
            self.values[name[4:]] = values["content"] or ""


def display_title(path: Path) -> str:
    return path.stem.replace("_", " ").replace("-", " ").strip()


def build_photo_manifest() -> dict[str, list[dict[str, str]]]:
    manifest: dict[str, list[dict[str, str]]] = {}
    for folder in sorted(item for item in TAXON_ROOT.iterdir() if item.is_dir()):
        photo_folder = folder / "photos"
        if not photo_folder.is_dir():
            continue
        photos = []
        for image in sorted(photo_folder.iterdir(), key=lambda item: item.name.lower()):
            if image.is_file() and image.suffix.lower() in EXTENSIONS:
                title = display_title(image)
                photos.append({"src": f"taxa/{folder.name}/photos/{image.name}", "title": title, "alt": title})
        if photos:
            manifest[folder.name] = photos
    return manifest


def build_log_manifest() -> dict[str, list[dict[str, str]]]:
    manifest: dict[str, list[dict[str, str]]] = {}
    for taxon in sorted(item for item in TAXON_ROOT.iterdir() if item.is_dir()):
        log_root = taxon / "logs"
        if not log_root.is_dir():
            continue
        logs = []
        for page in sorted(log_root.glob("*/index.html")):
            parser = LogMetaParser()
            parser.feed(page.read_text(encoding="utf-8"))
            meta = parser.values
            if not meta.get("date") or not meta.get("title"):
                continue
            logs.append({"date": meta["date"], "title": meta["title"], "summary": meta.get("summary", ""), "type": meta.get("type", "学习日志"), "url": f"taxa/{taxon.name}/logs/{page.parent.name}/"})
        if logs:
            manifest[taxon.name] = sorted(logs, key=lambda item: item["date"], reverse=True)
    return manifest


def write_manifest(path: Path, variable: str, data: object) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"/* 此文件由 scripts/update_serpent_photos.py 自动生成。 */\nwindow.{variable}={payload};\n", encoding="utf-8")


if __name__ == "__main__":
    write_manifest(PHOTO_OUTPUT, "SERPENT_PHOTOS", build_photo_manifest())
    write_manifest(LOG_OUTPUT, "SERPENT_LOGS", build_log_manifest())
    print(f"updated {PHOTO_OUTPUT}")
    print(f"updated {LOG_OUTPUT}")
