from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
}


def create_icon(size: int) -> Image.Image:
    scale = 4
    canvas = size * scale
    image = Image.new("RGB", (canvas, canvas), "#061719")
    draw = ImageDraw.Draw(image)

    radius = int(canvas * 0.215)
    draw.rounded_rectangle((0, 0, canvas - 1, canvas - 1), radius=radius, fill="#0a2628")
    draw.ellipse((-canvas * 0.07, -canvas * 0.07, canvas * 0.39, canvas * 0.39), fill="#123f3d")

    stroke = max(8, int(canvas * 0.055))
    pale = "#e6fcf7"
    accent = "#62dfc3"
    points = [
        (canvas * 0.426, canvas * 0.205),
        (canvas * 0.426, canvas * 0.435),
        (canvas * 0.226, canvas * 0.748),
        (canvas * 0.226, canvas * 0.84),
        (canvas * 0.774, canvas * 0.84),
        (canvas * 0.774, canvas * 0.748),
        (canvas * 0.574, canvas * 0.435),
        (canvas * 0.574, canvas * 0.205),
    ]
    draw.line([(canvas * 0.375, canvas * 0.205), (canvas * 0.625, canvas * 0.205)], fill=pale, width=stroke)
    draw.line(points, fill=pale, width=stroke, joint="curve")

    liquid = [
        (canvas * 0.295, canvas * 0.688),
        (canvas * 0.43, canvas * 0.676),
        (canvas * 0.54, canvas * 0.715),
        (canvas * 0.69, canvas * 0.695),
        (canvas * 0.774, canvas * 0.84),
        (canvas * 0.226, canvas * 0.84),
    ]
    draw.polygon(liquid, fill=accent)
    draw.ellipse((canvas * 0.415, canvas * 0.56, canvas * 0.47, canvas * 0.615), fill="#8ff2da")
    draw.ellipse((canvas * 0.535, canvas * 0.505, canvas * 0.575, canvas * 0.545), fill="#8ff2da")

    return image.resize((size, size), Image.Resampling.LANCZOS)


(ROOT / "icons").mkdir(exist_ok=True)
for filename, size in OUTPUTS.items():
    create_icon(size).save(ROOT / "icons" / filename, format="PNG", optimize=True)
