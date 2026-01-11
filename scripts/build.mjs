import { execSync } from "node:child_process";
import { rmSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function cp(src, dst) {
  mkdirSync(join(dst, ".."), { recursive: true });
  copyFileSync(src, dst);
}

if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
if (existsSync("dist-cjs")) rmSync("dist-cjs", { recursive: true, force: true });

sh("npx tsc -p tsconfig.build.esm.json");
sh("npx tsc -p tsconfig.build.cjs.json");

// Copy CJS outputs to dist/*.cjs to match package.json exports
cp("dist-cjs/index.js", "dist/index.cjs");
cp("dist-cjs/react/index.js", "dist/react/index.cjs");
