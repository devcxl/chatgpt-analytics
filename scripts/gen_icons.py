from PIL import Image, ImageDraw

SIZE = 512
BG = (142, 142, 160)      # ChatGPT gray
WHITE = (255, 255, 255)


def draw_icon(path, size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 512
    pad = 64 * s
    r = 64 * s
    # background rounded square
    d.rounded_rectangle([pad, pad, 512 - pad, 512 - pad], radius=r, fill=BG)
    # white chat bubble
    bx, by, bw, bh = 140 * s, 120 * s, 232 * s, 272 * s
    rr = 52 * s
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=rr, fill=WHITE)
    # bubble tail
    tx, ty, tw, th = bx, by + bh - 40 * s, 46 * s, 40 * s
    rr2 = 20 * s
    d.rounded_rectangle([tx, ty, tx + tw, ty + th], radius=rr2, fill=BG)
    img = img.convert("RGB")
    img.save(path)


import os
os.makedirs("public/icon", exist_ok=True)
for size in (16, 32, 48, 96, 128, 192, 256, 512):
    draw_icon(f"public/icon/{size}.png", size)
print("icons generated:", sorted(os.listdir("public/icon")))
