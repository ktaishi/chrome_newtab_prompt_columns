import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDeleteFlowModules } from "./helpers/load-modules.mjs";

const ctx = loadDeleteFlowModules();
const resolveTileInsertTarget = (...args) => globalThis.resolveTileInsertTarget(...args);

function expectInsertTarget(actual, expected) {
  assert.equal(actual.colIndex, expected.colIndex);
  assert.equal(actual.tileIndex, expected.tileIndex);
}

function createMockTile(index, top, height) {
  return {
    dataset: { tileIndex: String(index) },
    classList: { contains: () => false },
    getBoundingClientRect: () => ({
      top,
      bottom: top + height,
      height,
      left: 0,
      right: 100
    })
  };
}

function createMockTileList(tiles, listTop = 100, listHeight = 400) {
  const tileList = {
    getBoundingClientRect: () => ({
      top: listTop,
      bottom: listTop + listHeight,
      left: 0,
      right: 100
    }),
    querySelectorAll: (selector) => {
      if (selector === ".tile:not(.dragging)") {
        return tiles;
      }
      return [];
    },
    querySelector: () => null,
    contains: () => true,
    appendChild: () => {}
  };
  return tileList;
}

test("resolveTileInsertTarget inserts before first tile when pointer is above column tiles", () => {
  globalThis.columns = [{ tiles: [{ id: "a" }, { id: "b" }, { id: "c" }] }];
  const tileList = createMockTileList([
    createMockTile(0, 120, 80),
    createMockTile(1, 210, 80),
    createMockTile(2, 300, 80)
  ]);

  expectInsertTarget(resolveTileInsertTarget({ clientY: 80 }, 0, tileList), { colIndex: 0, tileIndex: 0 });
});

test("resolveTileInsertTarget inserts after tile when pointer is below its midpoint", () => {
  globalThis.columns = [{ tiles: [{ id: "a" }, { id: "b" }] }];
  const tileList = createMockTileList([
    createMockTile(0, 120, 80),
    createMockTile(1, 210, 80)
  ]);

  expectInsertTarget(resolveTileInsertTarget({ clientY: 170 }, 0, tileList), { colIndex: 0, tileIndex: 1 });
});

test("resolveTileInsertTarget appends when pointer is below add-tile slot area", () => {
  globalThis.columns = [{ tiles: [{ id: "a" }, { id: "b" }] }];
  const tileList = createMockTileList([createMockTile(0, 120, 80), createMockTile(1, 210, 80)]);

  expectInsertTarget(resolveTileInsertTarget({ clientY: 560 }, 0, tileList), { colIndex: 0, tileIndex: 2 });
});

test("resolveTileInsertTarget ignores dragging tile and uses midpoint of visible tiles", () => {
  globalThis.columns = [{ tiles: [{ id: "a" }, { id: "b" }, { id: "c" }] }];
  const visibleTiles = [createMockTile(0, 120, 80), createMockTile(2, 300, 80)];
  const tileList = createMockTileList(visibleTiles);

  expectInsertTarget(resolveTileInsertTarget({ clientY: 250 }, 0, tileList), { colIndex: 0, tileIndex: 2 });
});
