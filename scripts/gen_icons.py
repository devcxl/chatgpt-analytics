from pathlib import Path

from PIL import Image, ImageDraw

BASE_SIZE = 512
SCALE = 4
BACKGROUND = (28, 30, 52)
PANEL = (42, 45, 76)
LINE = (248, 250, 252)
ACCENT = (92, 230, 190)


def scaled_points(points):
    return [(round(x * SCALE), round(y * SCALE)) for x, y in points]


def draw_icon(path: Path, size: int) -> None:
    canvas_size = BASE_SIZE * SCALE
    image = Image.new("RGB", (canvas_size, canvas_size), BACKGROUND)
    draw = ImageDraw.Draw(image)

    # A quiet rounded square keeps the mark legible at browser-toolbar sizes.
    draw.rounded_rectangle(
        [40 * SCALE, 40 * SCALE, 472 * SCALE, 472 * SCALE],
        radius=116 * SCALE,
        fill=PANEL,
    )

    points = scaled_points([(126, 346), (214, 270), (298, 302), (388, 168)])
    line_width = 26 * SCALE
    node_radius = 22 * SCALE
    draw.line(points, fill=LINE, width=line_width, joint="curve")

    for x, y in points:
        draw.ellipse(
            [x - node_radius, y - node_radius, x + node_radius, y + node_radius],
            fill=ACCENT,
        )
        inner_radius = 7 * SCALE
        draw.ellipse(
            [x - inner_radius, y - inner_radius, x + inner_radius, y + inner_radius],
            fill=LINE,
        )

    image.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)


output_dir = Path("public/icon")
output_dir.mkdir(parents=True, exist_ok=True)
for icon_size in (16, 32, 48, 96, 128, 192, 256, 512):
    draw_icon(output_dir / f"{icon_size}.png", icon_size)
print("icons generated:", sorted(path.name for path in output_dir.glob("*.png")))
