#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "shared.test.mjs",
    "tests/domain.test.mjs",
    "tests/delete-flow.test.mjs",
    "tests/speech-input.test.mjs",
    "tests/speech-polish.test.mjs"
  ],
  { cwd: root, stdio: "inherit" }
);

process.exit(result.status ?? 1);
