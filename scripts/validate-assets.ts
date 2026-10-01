import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
const root = "assets/wordrush-v1-sprite-style-assets";
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
let total = 0;
for (const [category, count] of Object.entries(manifest.categories)) {
  const files = readdirSync(join(root, category)).filter((name) =>
    name.endsWith(".png"),
  );
  if (files.length !== count)
    throw new Error(`${category}: expected ${count}, found ${files.length}`);
  for (const file of files) {
    const bytes = readFileSync(join(root, category, file));
    if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
      throw new Error(`Invalid PNG: ${file}`);
  }
  total += files.length;
}
if (total !== manifest.assetCount) throw new Error("Manifest total mismatch");
for (const modulePath of [
  "src/ui/theme.ts",
  "src/data/pictures.ts",
  "src/data/audio.ts",
]) {
  for (const [, file] of readFileSync(modulePath, "utf8").matchAll(
    /require\("([^"]+)"\)/g,
  )) {
    if (!existsSync(join(dirname(modulePath), file)))
      throw new Error(`Missing runtime asset: ${file}`);
  }
}
const words = JSON.parse(readFileSync("src/data/words.json", "utf8")) as {
  id: string;
  imageId?: string;
}[];
const pictureSource = readFileSync("src/data/pictures.ts", "utf8");
for (const word of words) {
  if (word.imageId && !pictureSource.includes(`"${word.imageId}"`))
    throw new Error(`Missing picture mapping: ${word.id}`);
  for (const speed of ["normal", "slow"]) {
    const file = `assets/audio/${word.id}-${speed}.mp3`;
    const bytes = readFileSync(file);
    if (
      bytes.length < 1000 ||
      !(bytes.subarray(0, 3).toString() === "ID3" || bytes[0] === 255)
    )
      throw new Error(`Invalid audio: ${file}`);
  }
}
console.log(
  `${total} PNGs verified; ${words.filter((w) => w.imageId).length} explicit picture mappings; ${words.length * 2} pronunciation clips; runtime imports resolve.`,
);
