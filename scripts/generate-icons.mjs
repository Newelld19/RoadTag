import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "RoadTag.png");
const bg = { r: 244, g: 239, b: 230, alpha: 1 };

await mkdir(path.join(root, "public", "icons"), { recursive: true });

async function writeIcon(size, filename, padding = 0) {
  const inner = Math.max(1, Math.round(size * (1 - padding * 2)));
  const icon = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: bg })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toFile(path.join(root, filename));
}

await writeIcon(192, "public/icons/icon-192.png");
await writeIcon(512, "public/icons/icon-512.png");
await writeIcon(512, "public/icons/icon-512-maskable.png", 0.12);
await writeIcon(180, "public/apple-touch-icon.png");
await writeIcon(32, "public/favicon.png");
console.log("Wrote PWA icons from RoadTag.png");
