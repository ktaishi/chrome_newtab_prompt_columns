# Privacy Policy — New Tab Memo Board

**Last updated:** 2026-05-29  
**Extension:** New Tab Memo Board (Chrome extension, Manifest V3)  
**Publisher:** Taishi  
**Contact:** [GitHub Issues](https://github.com/ktaishi/chrome_newtab_prompt_columns/issues)

**Published URL (for Chrome Web Store):**  
https://ktaishi.github.io/chrome_newtab_prompt_columns/privacy/

---

## Summary

New Tab Memo Board stores your memos and settings **on your device only**. The extension author does **not** operate servers that collect your memo content.

Some features send data to **third-party services you configure yourself** (OpenAI, Obsidian) or to **Stripe** when you voluntarily open a tip link. Those transfers happen only when you use those features.

---

## Data we store locally

The extension uses **Chrome local storage** (`chrome.storage.local`) and, for optional clipboard auto-paste, **session storage** (`sessionStorage`) in your browser.

| Data | Purpose |
| --- | --- |
| Memo tiles (title, body, tags, colors) | Your memo board content |
| Column layout and settings | UI preferences |
| OpenAI API Key (optional) | AI summary when you enable it |
| Obsidian API URL / token (optional) | Export to your local Obsidian |
| UI language preference | Display language |

This data **stays on your device** unless you export it (JSON backup) or use optional integrations below.

---

## Data we do not collect

The extension author does **not**:

- Run backend servers for memo sync or analytics
- Receive your memos, clips, or settings by default
- Sell or share your data with advertisers

---

## Optional: OpenAI

If you enter an **OpenAI API Key** in Settings:

- Memo text and fetched public page content may be sent to **OpenAI** (`https://api.openai.com`) when you use AI actions
- The key is stored locally in `chrome.storage.local`
- JSON backup **excludes** the API key by default; import preserves your existing key
- Local and private-network URLs are **not** fetched for AI

OpenAI’s privacy policy applies to data processed by OpenAI: https://openai.com/policies/privacy-policy

---

## Optional: Obsidian (local)

If you configure **Obsidian Local REST API**:

- Notes are sent to **your local Obsidian** (`localhost` / `127.0.0.1`, ports 27123 or 27124 only)
- API tokens are stored locally
- Nothing is sent to the extension author

---

## Optional: Web clipping

When you save a clip from a web page (context menu or extension icon):

- Selected text, page title, URL, and optionally page body text are saved to your **Clipping column** in local storage
- Scripts are injected into the active tab only to show the save UI or read selection

---

## Optional: Speech input

Speech input uses the **browser Web Speech API**. Audio is handled by your browser/OS speech service, not by the extension author. Audio is **not** sent to OpenAI for transcription in this extension.

---

## Optional: Stripe tips

If a Stripe Payment Link is configured, Settings may show **“Tip via Stripe (optional)”**:

- Opens Stripe’s hosted checkout in a **new tab** only when **you click** the button
- No automatic redirects or background payment requests
- Payment data is processed by **Stripe**; the extension does not handle card numbers

Stripe’s privacy policy applies: https://stripe.com/privacy

---

## Permissions (why they exist)

| Permission | Use |
| --- | --- |
| `storage` | Save memos and settings locally |
| `contextMenus` / `activeTab` / `scripting` | Save web selections to your board |
| `host_permissions` (http/https) | Fetch public URLs for optional AI summary |
| `host_permissions` (api.openai.com) | Optional OpenAI API |
| `host_permissions` (localhost Obsidian) | Optional local Obsidian export |

---

## Children

This extension is not directed at children under 13. We do not knowingly collect personal information from children.

---

## Changes

We may update this policy. The “Last updated” date at the top will change. Continued use after changes means you accept the updated policy.

---

## Your choices

- **Remove data:** Uninstall the extension or clear site data for the extension in Chrome
- **Export:** JSON backup from Settings
- **Disable integrations:** Leave OpenAI / Obsidian fields empty; do not use AI or Obsidian buttons

---

## Contact

Questions about this policy: open an issue at  
https://github.com/ktaishi/chrome_newtab_prompt_columns/issues
