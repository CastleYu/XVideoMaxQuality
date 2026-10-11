"""生成扩展图标：开启为 X 蓝底，关闭为灰底；主体为播放三角 + HD 字样。

运行：python tools/icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


class Spec:
    ROOT = Path(__file__).resolve().parent.parent / "icons"
    SIZES = (16, 32, 48, 128)
    BASE = 512
    FONT = "C:/Windows/Fonts/arialbd.ttf"
    TEXT = "HD"
    WHITE = (255, 255, 255, 255)
    ON = ("on", (29, 155, 240, 255))
    OFF = ("off", (113, 118, 123, 255))
    FMT = "{name}-{size}.png"


class Painter:
    @staticmethod
    def draw(bg):
        n = Spec.BASE
        img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((0, 0, n - 1, n - 1), radius=n // 5, fill=bg)
        # 播放三角在上方，HD 字样在下方
        d.polygon([(n * 0.36, n * 0.14), (n * 0.36, n * 0.50), (n * 0.68, n * 0.32)], fill=Spec.WHITE)
        font = ImageFont.truetype(Spec.FONT, int(n * 0.38))
        box = d.textbbox((0, 0), Spec.TEXT, font=font)
        w, h = box[2] - box[0], box[3] - box[1]
        d.text(((n - w) / 2 - box[0], n * 0.58 - box[1]), Spec.TEXT, font=font, fill=Spec.WHITE)
        return img

    @staticmethod
    def run():
        Spec.ROOT.mkdir(exist_ok=True)
        for name, bg in (Spec.ON, Spec.OFF):
            big = Painter.draw(bg)
            for s in Spec.SIZES:
                big.resize((s, s), Image.LANCZOS).save(Spec.ROOT / Spec.FMT.format(name=name, size=s))


if __name__ == "__main__":
    Painter.run()
