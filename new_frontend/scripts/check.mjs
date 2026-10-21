import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await check(path);
    else if (/\.m?js$/.test(path)) {
      const result = spawnSync(process.execPath, ["--check", path], {
        encoding: "utf8",
      });
      if (result.status !== 0) throw new Error(result.stderr);
    }
  }
}
await check("public/assets/js");
await check("scripts");
console.log("JavaScript syntax checks passed.");
