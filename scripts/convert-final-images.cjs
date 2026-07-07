const fs = require("fs");
const path = require("path");
const ASSETS = "E:/Antigravity/vamosjogando/src/assets";

async function convert(file) {
  for (const ext of [".png", ".jpg", ".jpeg"]) {
    const src = path.join(ASSETS, file + ext);
    if (!fs.existsSync(src)) continue;
    const buf = fs.readFileSync(src);
    try {
      const sharp = require(path.join(ASSETS, "..", "node_modules", "sharp"));
      const wp = await sharp(buf)
        .resize({ width: 1200, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(ASSETS, file + ".webp"), wp);
      console.log(`${file}.webp (${(wp.length/1024).toFixed(0)}KB)`);
    } catch(e) {
      console.log(`${file}: sharp error: ${e.message}`);
    }
    fs.unlinkSync(src);
    return;
  }
  console.log(`${file}: not found`);
}

async function main() {
  await convert("cronos-lazarus-game");
  await convert("bethesda-hq");
  await convert("nexus-jupiter-incident-game");
  await convert("nexus-jupiter-incident-bg");
  await convert("lenovo-yoga-ai-mini-product");
}

main().catch(console.error);
