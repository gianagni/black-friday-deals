// Bargain Beacon, a black-friday-deal-finder-01 entry (Node 22, standard
// library only). The site is this directory's app/ folder: plain static
// files a browser opens at app/index.html (an ES module, a stylesheet, no
// build step), its deals held in app/deals.js, each checked in this session
// against the store or a deals source naming the store. Nothing the site
// runs, styles or shows loads over the network; each deal links out to its
// store. This program hands the site in: it copies app/ and screenshots/
// from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads (your screenshots, the first load's files and
// bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to
// be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail loudly (instead of handing in an empty site) when app/ is missing.
if (!existsSync(join(rootDir, "app", "index.html"))) {
  throw new Error("app/index.html is missing; nothing to hand in");
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, "app"), join(outputDir, "app"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(rootDir, "screenshots"))) {
  cpSync(join(rootDir, "screenshots"), join(outputDir, "screenshots"), { recursive: true });
}

// Caps from the scorer's own reference (reference/gate.json): text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 files
// and directories in app/ or 16 MiB of app files).
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
