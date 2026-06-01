import vm from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTestContext,
  installChromeStorageMock,
  loadDeleteFlowModules
} from "./helpers/load-modules.mjs";

const ctx = getTestContext();
const { shared: S, seedTestBoard, readColumns, restoreSaveState } = loadDeleteFlowModules();
const { removeTile, saveState } = ctx;

test("saveBoardState persists tile deletion to chrome.storage when baseline is provided", async () => {
  const stored = S.makeInitialColumns();
  stored[0].tiles[0].text = "delete me";
  const deletedId = stored[0].tiles[0].id;
  const baseline = S.collectAllTileIds(stored);

  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 1
  });

  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const result = await S.saveBoardState({
    columns: local,
    structureDirty: true,
    dirtyTileIds: new Set(),
    localBaselineIds: baseline
  });

  assert.equal(result.columns[0].tiles.some((tile) => tile.id === deletedId), false);

  const persisted = await chrome.storage.local.get(S.STORAGE_KEY);
  assert.equal(persisted[S.STORAGE_KEY][0].tiles.some((tile) => tile.id === deletedId), false);
});

test("saveBoardState delete plus incoming clip keeps both behaviors", async () => {
  const stored = S.makeInitialColumns();
  const deletedId = stored[0].tiles[0].id;
  const baseline = S.collectAllTileIds(stored);
  const incomingTile = S.makeTile(S.CLIPPING_COLUMN_INDEX, 9, { text: "incoming clip" });

  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 2
  });

  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const result = await S.saveBoardState({
    columns: local,
    structureDirty: true,
    dirtyTileIds: new Set(),
    incomingTiles: [{ colIndex: S.CLIPPING_COLUMN_INDEX, tile: incomingTile }],
    localBaselineIds: baseline
  });

  const mergedIds = S.collectAllTileIds(result.columns);
  assert.equal(mergedIds.has(deletedId), false);
  assert.equal(mergedIds.has(incomingTile.id), true);
});

test("saveState integration removes deleted tile and updates in-memory columns", async () => {
  const stored = S.makeInitialColumns();
  stored[0].tiles[0].text = "to delete";
  const deletedId = stored[0].tiles[0].id;

  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 3
  });

  seedTestBoard(stored);
  vm.runInContext("columns[0].tiles.splice(0, 1); markStructureDirty();", ctx);

  const ok = await saveState();
  const columns = readColumns();

  assert.equal(ok, true);
  assert.equal(columns[0].tiles.some((tile) => tile.id === deletedId), false);

  const persisted = await chrome.storage.local.get(S.STORAGE_KEY);
  assert.equal(persisted[S.STORAGE_KEY][0].tiles.some((tile) => tile.id === deletedId), false);
});

test("removeTile does nothing when confirm is cancelled", async () => {
  seedTestBoard(S.makeInitialColumns());
  const beforeId = readColumns()[0].tiles[0].id;

  vm.runInContext(
    `
confirm = () => false;
saveState = async () => {
  __saveCalled = true;
  return true;
};
__saveCalled = false;
`,
    ctx
  );

  await removeTile(0, 0);

  assert.equal(readColumns()[0].tiles[0].id, beforeId);
  assert.equal(ctx.__saveCalled, false);
  restoreSaveState();
});

test("removeTile deletes tile and persists through saveState", async () => {
  const stored = S.makeInitialColumns();
  stored[0].tiles.push(S.makeTile(0, 1, { text: "keep me" }));

  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 4
  });

  seedTestBoard(stored);

  const deletedId = readColumns()[0].tiles[0].id;
  const keptId = readColumns()[0].tiles[1].id;

  vm.runInContext("confirm = () => true;", ctx);
  await removeTile(0, 0);

  const columns = readColumns();
  assert.equal(columns.some((column) => column.tiles.some((tile) => tile.id === deletedId)), false);
  assert.equal(columns[0].tiles.some((tile) => tile.id === keptId), true);

  const persisted = await chrome.storage.local.get(S.STORAGE_KEY);
  assert.equal(
    persisted[S.STORAGE_KEY].some((column) => column.tiles.some((tile) => tile.id === deletedId)),
    false
  );
});

test("removeTile on last tile in column inserts a new empty placeholder tile", async () => {
  const stored = S.makeInitialColumns();
  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 5
  });

  seedTestBoard(stored);

  vm.runInContext("confirm = () => true;", ctx);

  const beforeCount = readColumns()[0].tiles.length;
  await removeTile(0, 0);
  const columns = readColumns();

  assert.equal(columns[0].tiles.length, beforeCount);
  assert.equal(String(columns[0].tiles[0].text || "").trim(), "");
});

test("removeTile closes modal when deleting the active tile", async () => {
  const stored = S.makeInitialColumns();
  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 6
  });

  seedTestBoard(stored);

  vm.runInContext(
    `
activeModal = { colIndex: 0, tileIndex: 0 };
modalSaveTimer = setTimeout(() => {}, 60000);
tileDialog.open = true;
confirm = () => true;
`,
    ctx
  );

  await removeTile(0, 0);

  assert.equal(vm.runInContext("activeModal", ctx), null);
  assert.equal(vm.runInContext("modalSaveTimer", ctx), null);
  assert.equal(vm.runInContext("tileDialog.open", ctx), false);
});

test("pruneEmptyColumns removes empty columns beyond the default count", () => {
  const stored = S.makeInitialColumns();
  stored.push({
    id: "extra-col",
    title: "Extra",
    tiles: [S.makeTile(3, 0, { text: "" })]
  });

  seedTestBoard(stored);
  vm.runInContext("pruneEmptyColumns();", ctx);

  assert.equal(readColumns().length, S.COLUMN_COUNT);
});

test("removeTile on last tile in extra column removes the column", async () => {
  const stored = S.makeInitialColumns();
  stored.push({
    id: "extra-col",
    title: "Extra",
    tiles: [S.makeTile(3, 0, { text: "temporary" })]
  });

  installChromeStorageMock({
    [S.STORAGE_KEY]: stored,
    [S.STORAGE_REVISION_KEY]: 7
  });

  seedTestBoard(stored);
  vm.runInContext("confirm = () => true;", ctx);

  await removeTile(3, 0);

  assert.equal(readColumns().length, S.COLUMN_COUNT);
});
