import { execSync } from "node:child_process";
import { rmSync, existsSync, writeFileSync } from "node:fs";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
if (existsSync("dist-cjs")) rmSync("dist-cjs", { recursive: true, force: true });

sh("npx tsc -p tsconfig.build.esm.json");
sh("npx tsc -p tsconfig.build.cjs.json");

// root è "type":"module": marca dist-cjs come CommonJS
writeFileSync("dist-cjs/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
