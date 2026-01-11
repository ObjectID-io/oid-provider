import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function cp(src, dst) {
  mkdirSync(join(dst, ".."), { recursive: true });
  copyFileSync(src, dst);
}

function main() {
  // clean
  if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
  if (existsSync("dist-cjs")) rmSync("dist-cjs", { recursive: true, force: true });

  // ESM build with declarations
  sh("npx tsc -p tsconfig.build.esm.json");

  // CJS build (JS only)
  sh("npx tsc -p tsconfig.build.cjs.json");

  // Copy CJS entry points into dist/ as .cjs files to match package.json exports
  cp("dist-cjs/index.js", "dist/index.cjs");
  cp("dist-cjs/react/index.js", "dist/react/index.cjs");
}

main();
