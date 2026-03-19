import { execSync } from "node:child_process";
import { rmSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
if (existsSync("dist-cjs")) rmSync("dist-cjs", { recursive: true, force: true });

const tscBin = resolve("node_modules", "typescript", "bin", "tsc");
sh(`"${process.execPath}" "${tscBin}" -p tsconfig.build.esm.json`);
sh(`"${process.execPath}" "${tscBin}" -p tsconfig.build.cjs.json`);

// root è "type":"module": marca dist-cjs come CommonJS
writeFileSync("dist-cjs/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
