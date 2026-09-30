#!/usr/bin/env python3
"""Remove detached sprite fragments from the edges of WordRush PNG assets.

The source pack contains a few atlas crops with a neighboring sprite still
visible at an edge.  This keeps the main artwork and removes only small alpha
components that touch the image boundary.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import argparse

ROOT = Path(__file__).resolve().parents[1] / "assets" / "wordrush-v1-sprite-style-assets"

def clean(path: Path) -> bool:
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    px = image.load()
    seen = bytearray(w * h)
    components = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] or px[x, y][3] < 16:
                continue
            seen[i] = 1
            q = deque([(x, y)])
            points = []
            touches_edge = False
            while q:
                cx, cy = q.popleft()
                points.append((cx, cy))
                touches_edge |= cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if not seen[ni] and px[nx, ny][3] >= 16:
                            seen[ni] = 1
                            q.append((nx, ny))
            components.append((len(points), touches_edge, points))

    # A detached neighboring sprite is small; preserve the principal artwork.
    threshold = max(12, int(w * h * 0.08))
    changed = False
    for size, touches_edge, points in components:
        if touches_edge and size <= threshold:
            for x, y in points:
                px[x, y] = (0, 0, 0, 0)
            changed = True
    # Remove any antialiased atlas residue that is still attached to a border
    # component. Keep the band conservative so the subject remains intact.
    relative = path.parent.name
    factor = 0.12 if relative == "avatars" else 0.06
    band = max(3, min(12, round(min(w, h) * factor)))
    for y in range(h):
        for x in range(w):
            if x < band or y < band or x >= w - band or y >= h - band:
                if px[x, y][3]:
                    px[x, y] = (0, 0, 0, 0)
                    changed = True
    if changed:
        image.save(path, optimize=True)
    return changed

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write cleaned files")
    args = parser.parse_args()
    files = sorted(ROOT.rglob("*.png"))
    changed = 0
    for path in files:
        if args.apply and clean(path):
            changed += 1
    print(f"Scanned {len(files)} PNG assets; cleaned {changed} files.")

if __name__ == "__main__":
    main()
