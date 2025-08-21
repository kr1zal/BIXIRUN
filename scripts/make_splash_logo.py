#!/usr/bin/env python3
"""
Generate a solid black, transparent-background splash logo PNG from a source logo.

Input:  assets/images/logo-bixirun.png
Output: assets/images/splash-logo-black.png (1024x1024, centered, safe padding)

You can tweak the luminance threshold via env var SPLASH_THRESHOLD (default: 230).
"""

import os
from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = PROJECT_ROOT / "assets/images/logo-bixirun.png"
OUTPUT_PATH = PROJECT_ROOT / "assets/images/splash-logo-black.png"


def remove_background_and_solid_black(img: Image.Image, threshold: int) -> Image.Image:
    """Return RGBA image with transparent background and solid black logo.

    Any pixel with luminance > threshold becomes fully transparent.
    Remaining non-transparent pixels become solid black with full alpha.
    """
    rgba = img.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a < 8:
                px[x, y] = (0, 0, 0, 0)
                continue
            # sRGB luminance
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if lum > threshold:
                # treat as background
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (0, 0, 0, 255)

    return rgba


def trim_and_pad(img: Image.Image, canvas: int = 1024, content: int = 880) -> Image.Image:
    """Trim transparent edges and center on transparent square canvas.

    content: max content box size inside canvas (safe area padding)
    """
    # Trim
    bbox = img.split()[-1].getbbox()
    if bbox:
        img = img.crop(bbox)

    # Fit into content box
    img = ImageOps.contain(img, (content, content), method=Image.LANCZOS)

    # Paste into canvas
    canvas_img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    x = (canvas - img.width) // 2
    y = (canvas - img.height) // 2
    canvas_img.paste(img, (x, y), img)
    return canvas_img


def main() -> None:
    if not INPUT_PATH.exists():
        raise SystemExit(f"Input not found: {INPUT_PATH}")

    threshold = int(os.getenv("SPLASH_THRESHOLD", "230"))

    src = Image.open(INPUT_PATH)
    processed = remove_background_and_solid_black(src, threshold)
    out = trim_and_pad(processed)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUTPUT_PATH, format="PNG")
    print(f"Wrote {OUTPUT_PATH} ({out.width}x{out.height}) with threshold={threshold}")


if __name__ == "__main__":
    main()


