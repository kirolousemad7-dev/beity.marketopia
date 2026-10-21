import { copyFile, mkdir } from "node:fs/promises";

await mkdir("public/assets/vendor", { recursive: true });
await copyFile(
  "node_modules/jquery/dist/jquery.min.js",
  "public/assets/vendor/jquery.min.js",
);
console.log(
  "Browser assets ready in public/assets. No Node.js runtime is needed on the server.",
);
