#!/usr/bin/env node
/**
 * Copy distribution-only extension files into dist/ and create a ZIP.
 *
 * Usage:
 *   node scripts/package-extension.mjs
 *   node scripts/package-extension.mjs --dry-run
 *   node scripts/package-extension.mjs --out-dir dist
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "new-tab-memo-board";

const ROOT_FILES = [
  "manifest.json",
  "app/background.js",
  "app/shared.js",
  "app/newtab.html",
  "newtab.css",
  "assets/clip/clip-save-modal.js",
  "assets/clip/clip-save-modal.css",
  "assets/clip/clip-save-toast.js",
  "assets/clip/clip-save-toast.css",
];

const ICON_FILES = [
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "icons/icon512.png",
  "icons/logo.svg",
];

function printHelp() {
  console.log(`Usage: node scripts/package-extension.mjs [options]

Collect distribution files into dist/<slug>-<version>/ and create a ZIP
with manifest.json at the archive root (Chrome Web Store compatible).

Options:
  --out-dir <path>  Output directory (default: dist/)
  --dry-run         List files only; do not copy or zip
  -h, --help        Show this help
`);
}

function parseArgs(argv) {
  const opts = { dryRun: false, outDir: join(root, "dist"), help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--out-dir") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--out-dir requires a path");
      }
      opts.outDir = value.startsWith("/") ? value : join(root, value);
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  return opts;
}

function loadJsFiles() {
  const orderPath = join(root, "js/load-order.json");
  const order = JSON.parse(readFileSync(orderPath, "utf8"));
  if (!Array.isArray(order) || order.length === 0) {
    throw new Error(`Invalid or empty js/load-order.json: ${orderPath}`);
  }
  return order.map((file) => `js/${file}`);
}

function loadVersion() {
  const manifestPath = join(root, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error(`manifest.json is missing "version": ${manifestPath}`);
  }
  return manifest.version;
}

function collectDistributionFiles() {
  return [...ROOT_FILES, ...ICON_FILES, ...loadJsFiles()];
}

function assertFilesExist(files) {
  const missing = files.filter((relPath) => !existsSync(join(root, relPath)));
  if (missing.length === 0) {
    return;
  }

  console.error("Missing required distribution files:");
  for (const relPath of missing) {
    console.error(`  ${relPath}`);
  }
  process.exit(1);
}

function copyFile(relPath, stagingDir) {
  const source = join(root, relPath);
  const destination = join(stagingDir, relPath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}

function createZip(stagingDir, zipPath) {
  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  const result = spawnSync("zip", ["-r", "-X", zipPath, "."], {
    cwd: stagingDir,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Failed to run zip: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error("zip command failed. Install zip (macOS: built-in).");
    process.exit(result.status ?? 1);
  }
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(String(error.message || error));
    printHelp();
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const files = collectDistributionFiles();
  assertFilesExist(files);

  const version = loadVersion();
  const bundleName = `${SLUG}-${version}`;
  const stagingDir = join(opts.outDir, bundleName);
  const zipPath = join(opts.outDir, `${bundleName}.zip`);

  if (opts.dryRun) {
    console.log(`Would pack ${files.length} files:`);
    console.log(`  Folder: ${stagingDir}`);
    console.log(`  ZIP:    ${zipPath}`);
    for (const relPath of files) {
      console.log(`  ${relPath}`);
    }
    process.exit(0);
  }

  if (existsSync(stagingDir)) {
    rmSync(stagingDir, { recursive: true, force: true });
  }
  mkdirSync(stagingDir, { recursive: true });

  for (const relPath of files) {
    copyFile(relPath, stagingDir);
  }

  mkdirSync(opts.outDir, { recursive: true });
  createZip(stagingDir, zipPath);

  console.log(`Packaged ${files.length} files.`);
  console.log(`  Folder: ${stagingDir}`);
  console.log(`  ZIP:    ${zipPath}`);
}

main();
