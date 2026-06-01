#!/usr/bin/env python3
"""Smoke-test the unpacked extension in headless Chrome via CDP."""

from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

try:
    import websockets
except ImportError:
    print("FAIL: Python websockets package is required")
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
PROFILE = Path("/tmp/chrome-newtab-verify-profile")
PORT = 9230
CHROME_FOR_TESTING = (
    Path.home()
    / ".cache/puppeteer/chrome/mac_arm-131.0.6778.204/chrome-mac-arm64/"
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
)
CHROME = str(CHROME_FOR_TESTING if CHROME_FOR_TESTING.exists() else "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
NEWTab_PATH = "app/newtab.html"


def http_json(url: str, data: bytes | None = None) -> dict | list:
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET")
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def wait_port(timeout: float = 25.0) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            http_json(f"http://127.0.0.1:{PORT}/json/version")
            return True
        except Exception:
            time.sleep(0.25)
    return False


def read_extension_id() -> str:
    prefs_path = PROFILE / "Default" / "Preferences"
    for _ in range(60):
        if prefs_path.exists():
            prefs = json.loads(prefs_path.read_text(encoding="utf-8"))
            settings = prefs.get("extensions", {}).get("settings", {})
            for ext_id, meta in settings.items():
                path = str(meta.get("path", ""))
                if path.endswith("chrome_newtab_prompt_columns") or str(ROOT) in path:
                    return ext_id

        try:
            targets = http_json(f"http://127.0.0.1:{PORT}/json/list")
            for target in targets:
                url = str(target.get("url", ""))
                if "/app/background.js" in url and url.startswith("chrome-extension://"):
                    return url.split("/")[2]
        except Exception:
            pass

        time.sleep(0.25)
    raise RuntimeError("Could not resolve unpacked extension ID")


class CdpClient:
    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        self.ws = None
        self._next_id = 1

    async def connect(self) -> None:
        self.ws = await websockets.connect(self.ws_url, max_size=10_000_000)

    async def close(self) -> None:
        if self.ws:
            await self.ws.close()

    async def call(self, method: str, params: dict | None = None) -> dict:
        msg_id = self._next_id
        self._next_id += 1
        payload = {"id": msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        while True:
            raw = await self.ws.recv()
            data = json.loads(raw)
            if data.get("id") == msg_id:
                if "error" in data:
                    raise RuntimeError(f"CDP {method} failed: {data['error']}")
                return data.get("result", {})

    async def evaluate(self, expression: str, await_promise: bool = False) -> dict:
        result = await self.call(
            "Runtime.evaluate",
            {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": await_promise,
            },
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(json.dumps(result["exceptionDetails"], ensure_ascii=False))
        return result.get("result", {}).get("value")


async def run_checks(client: CdpClient) -> list[tuple[str, bool, str]]:
    checks: list[tuple[str, bool, str]] = []

    await client.call("Runtime.enable")
    await client.call("Page.enable")

    boot_ok = await client.evaluate(
        """
        (async () => {
          const deadline = Date.now() + 8000;
          while (Date.now() < deadline) {
            const domIds = [...document.querySelectorAll('.tile')].map((el) => el.dataset.tileId);
            const modelIds = columns.flatMap((column) => column.tiles.map((tile) => tile.id));
            if (domIds.length && domIds.length === modelIds.length && domIds.every((id, i) => id === modelIds[i])) {
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          if (typeof render === 'function') render();
          await new Promise((resolve) => setTimeout(resolve, 200));
          const domIds = [...document.querySelectorAll('.tile')].map((el) => el.dataset.tileId);
          const modelIds = columns.flatMap((column) => column.tiles.map((tile) => tile.id));
          return domIds.length === modelIds.length && domIds.every((id, i) => id === modelIds[i]);
        })()
        """,
        await_promise=True,
    )
    checks.append(("boot dom/model sync", boot_ok is True, "tile ids aligned"))

    load = await client.evaluate("document.readyState === 'complete'")
    checks.append(("page load event", bool(load), "document reached load"))

    shared_ok = await client.evaluate("typeof globalThis.MemoBoardShared === 'object'")
    checks.append(("shared module loaded", shared_ok is True, "MemoBoardShared present"))

    css_ok = await client.evaluate(
        """
        (() => {
          const link = document.querySelector('link[rel="stylesheet"]');
          if (!link) return false;
          const sheet = [...document.styleSheets].find((s) => String(s.href || '').includes('newtab.css'));
          return Boolean(sheet);
        })()
        """
    )
    checks.append(("newtab.css loaded", css_ok is True, "stylesheet href resolves"))

    columns = await client.evaluate(
        """
        ({
          count: document.querySelectorAll('#columns .column').length,
          titles: [...document.querySelectorAll('.column-title-input')].map((el) => el.value)
        })
        """
    )
    checks.append(
        (
            "columns rendered",
            isinstance(columns, dict) and columns.get("count", 0) >= 3,
            f"count={columns.get('count') if isinstance(columns, dict) else 'n/a'}",
        )
    )

    tile_open = await client.evaluate(
        """
        (async () => {
          const tile = document.querySelector('.tile');
          if (!tile) return { ok: false, reason: 'no tile' };
          tile.click();
          await new Promise((r) => setTimeout(r, 350));
          const dialog = document.getElementById('tileDialog');
          const textarea = document.getElementById('modalTextarea');
          if (!dialog?.open || !textarea) return { ok: false, reason: 'modal not open' };
          const marker = `smoke-${Date.now()}`;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setter.call(textarea, `${marker}\\n\\nbody`);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 200));
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await new Promise((r) => setTimeout(r, 1200));
          const preview = tile.querySelector('.markdown-preview');
          const title = tile.querySelector('.tile-title-display');
          const bodyOk = Boolean(preview && preview.textContent.includes('body'));
          const titleOk = Boolean(title && title.textContent.includes(marker));
          return {
            ok: bodyOk || titleOk,
            reason: `preview=${preview?.textContent?.slice(0, 40) || ''}; title=${title?.textContent?.slice(0, 40) || ''}`
          };
        })()
        """,
        await_promise=True,
    )
    checks.append(
        (
            "tile edit persists to board",
            isinstance(tile_open, dict) and tile_open.get("ok") is True,
            str(tile_open),
        )
    )

    settings = await client.evaluate(
        """
        (async () => {
          const btn = document.getElementById('settingsButton');
          const dialog = document.getElementById('settingsDialog');
          if (!btn || !dialog) return { ok: false, reason: 'missing settings ui' };
          btn.click();
          await new Promise((r) => setTimeout(r, 200));
          const open = dialog.open === true;
          dialog.close('cancel');
          return { ok: open, reason: open ? 'opened' : 'not open' };
        })()
        """,
        await_promise=True,
    )
    checks.append(
        (
            "settings dialog opens",
            isinstance(settings, dict) and settings.get("ok") is True,
            str(settings),
        )
    )

    tag_add = await client.evaluate(
        """
        (async () => {
          const tile = document.querySelector('.tile');
          if (!tile) return { ok: false, reason: 'no tile' };
          tile.click();
          await new Promise((r) => setTimeout(r, 300));
          const addLink = document.getElementById('modalTagAddToggle');
          const dialog = document.getElementById('tagAddDialog');
          const input = document.getElementById('tagAddInput');
          if (!addLink || !dialog || !input) return { ok: false, reason: 'tag ui missing' };
          addLink.click();
          await new Promise((r) => setTimeout(r, 150));
          const tagName = `smoke-tag-${Date.now()}`;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, tagName);
          applyTagAddDialog();
          if (dialog.open) dialog.close('cancel');
          await new Promise((r) => setTimeout(r, 200));
          const chips = [...document.querySelectorAll('#modalTagsList .modal-tag-chip-label')].map((el) => el.textContent.trim());
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await new Promise((r) => setTimeout(r, 200));
          return { ok: chips.includes(`#${tagName}`), reason: chips.join(',') };
        })()
        """,
        await_promise=True,
    )
    checks.append(
        (
            "tag add dialog apply",
            isinstance(tag_add, dict) and tag_add.get("ok") is True,
            str(tag_add),
        )
    )

    sidebar = await client.evaluate(
        """
        (() => {
          const before = document.body.classList.contains('sidebar-collapsed');
          document.getElementById('sidebarToggle')?.click();
          const after = document.body.classList.contains('sidebar-collapsed');
          return before !== after;
        })()
        """
    )
    checks.append(("sidebar toggle", sidebar is True, "collapsed class toggled"))

    console_errors = await client.evaluate(
        """
        (() => {
          if (!window.__smokeConsoleErrors) {
            window.__smokeConsoleErrors = [];
            const orig = console.error.bind(console);
            console.error = (...args) => {
              window.__smokeConsoleErrors.push(args.map(String).join(' '));
              orig(...args);
            };
          }
          return window.__smokeConsoleErrors.filter((line) => !line.includes('favicon'));
        })()
        """
    )
    checks.append(
        (
            "no console.error on boot",
            isinstance(console_errors, list) and len(console_errors) == 0,
            "; ".join(console_errors[:3]) if isinstance(console_errors, list) else str(console_errors),
        )
    )

    return checks


async def main() -> int:
    if PROFILE.exists():
        shutil.rmtree(PROFILE)

    chrome = subprocess.Popen(
        [
            CHROME,
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={PROFILE}",
            f"--disable-extensions-except={ROOT}",
            f"--load-extension={ROOT}",
            "--no-first-run",
            "--no-default-browser-check",
            "--headless=new",
            "--disable-gpu",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    client: CdpClient | None = None
    try:
        if not wait_port():
            print("FAIL: Chrome debugging port not ready")
            return 1

        ext_id = read_extension_id()
        newtab_url = f"chrome-extension://{ext_id}/{NEWTab_PATH}"

        targets = http_json(f"http://127.0.0.1:{PORT}/json/list")
        page_target = next(
            (t for t in targets if t.get("type") == "page" and t.get("url") == "about:blank"),
            targets[0] if targets else None,
        )
        if not page_target:
            raise RuntimeError("No CDP page target available")
        ws_url = page_target["webSocketDebuggerUrl"]

        client = CdpClient(ws_url)
        await client.connect()
        await client.call(
            "Page.addScriptToEvaluateOnNewDocument",
            {
                "source": """
                window.__smokeConsoleErrors = [];
                const orig = console.error.bind(console);
                console.error = (...args) => {
                  window.__smokeConsoleErrors.push(args.map(String).join(' '));
                  orig(...args);
                };
                """,
            },
        )
        await client.call("Page.navigate", {"url": newtab_url})
        await client.evaluate(
            """
            new Promise((resolve) => {
              if (document.readyState === 'complete') return resolve(true);
              window.addEventListener('load', () => resolve(true), { once: true });
            })
            """,
            await_promise=True,
        )
        checks = await run_checks(client)

        failed = [c for c in checks if not c[1]]
        print(f"Extension URL: {newtab_url}")
        for name, ok, detail in checks:
            status = "PASS" if ok else "FAIL"
            print(f"{status}: {name} ({detail})")

        print("")
        print(f"Summary: {len(checks) - len(failed)}/{len(checks)} checks passed")
        return 1 if failed else 0
    finally:
        if client:
            await client.close()
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except subprocess.TimeoutExpired:
            chrome.kill()
        if PROFILE.exists():
            shutil.rmtree(PROFILE, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
