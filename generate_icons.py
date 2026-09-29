"""Generate every icon size listed in Contents.json (+ PWA sizes) from one source image.
Usage: python generate_icons.py [icon.png]   (source should be >= 1024x1024)
Without a source file it draws a placeholder 'F' on #424242."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

BG, FG = "#424242", "#fbfbfb"
src_path = sys.argv[1] if len(sys.argv) > 1 else None

def placeholder(size=1024):
    im = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size*.6))
    except Exception: f = ImageFont.load_default()
    d.text((size/2, size/2), "F", font=f, fill=FG, anchor="mm")
    return im

src = Image.open(src_path).convert("RGBA") if src_path else placeholder()
os.makedirs("icons", exist_ok=True)

sizes = {int(i["expected-size"]) for i in json.load(open("Contents.json"))["images"]}
sizes |= {48, 96, 192, 256, 384, 512}
for s in sorted(sizes):
    src.resize((s, s), Image.LANCZOS).save(f"icons/{s}.png")

# maskable: artwork inside the central 80% safe zone on solid background
for s in (192, 512):
    canvas = Image.new("RGBA", (s, s), BG)
    inner = src.resize((int(s*.8), int(s*.8)), Image.LANCZOS)
    canvas.paste(inner, ((s-inner.width)//2, (s-inner.height)//2), inner)
    canvas.save(f"icons/maskable-{s}.png")
src.resize((180, 180), Image.LANCZOS).save("icons/apple-touch-icon.png")
src.resize((32, 32), Image.LANCZOS).save("icons/favicon-32.png")
print("done", len(os.listdir("icons")), "icons")
