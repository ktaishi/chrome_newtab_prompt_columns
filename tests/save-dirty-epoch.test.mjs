import vm from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTestContext,
  installChromeStorageMock,
  loadDeleteFlowModules
} from "./helpers/load-modules.mjs";

const ctx = getTestContext();
const { shared: S, seedTestBoard, readColumns } = loadDeleteFlowModules();
const { saveState, markTileDirty, markStructureDirty } = ctx;

test("saveState keeps dirty tile text when edited during an in-flight structure save", async () => {
  const stored = S.makeInitialColumns();
  const tileId = stored[0].tiles[0].id;

  let releaseStructureSave;
  const structureSaveGate = new Promise((resolve) => {
    releaseStructureSave = resolve;
  });

  const store = installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 1
  });

  const originalSet = chrome.storage.local.set.bind(chrome.storage.local);
  chrome.storage.local.set = async (items) => {
    await originalSet(items);
    if (items[S.STORAGE_KEY] && releaseStructureSave) {
      const release = releaseStructureSave;
      releaseStructureSave = null;
      await structureSaveGate;
      release();
    }
  };

  seedTestBoard(stored);
  markStructureDirty();
  const structureSave = saveState();
  await Promise.resolve();
  await Promise.resolve();

  vm.runInContext(
    `
columns[0].tiles[0].text = "typed while structure save is in flight";
markTileDirty("${tileId}");
`,
    ctx
  );

  releaseStructureSave();
  await structureSave;

  assert.equal(
    vm.runInContext(`dirtyTileIds.has("${tileId}")`, ctx),
    true,
    "dirty flag must survive structure save"
  );

  await saveState();

  const persisted = await chrome.storage.local.get(S.STORAGE_KEY);
  const savedTile = persisted[S.STORAGE_KEY][0].tiles.find((item) => item.id === tileId);
  assert.equal(savedTile?.text, "typed while structure save is in flight");

  assert.equal(store.has(S.STORAGE_KEY), true);
});
