import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
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
const themePath = "src/ui/theme.ts";
for (const [, file] of readFileSync(themePath, "utf8").matchAll(
  /require\("([^"]+)"\)/g,
)) {
  if (!existsSync(join("src/ui", file)))
    throw new Error(`Missing runtime image: ${file}`);
}
console.log(`${total} PNG assets verified; runtime image references resolve.`);
console.log(
  "Vocabulary images remain unmapped pending semantic review. Recorded audio is not yet supplied.",
);
