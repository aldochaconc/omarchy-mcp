# omarchy-mcp

A Claude Code plugin that exposes the [Omarchy Manual](https://learn.omacom.io/2/the-omarchy-manual) as a local MCP server. Provides searchable, cached access to all 43 sections of the manual directly inside Claude conversations.

**Author:** Aldo W. Chacón ([@aldochaconc](https://github.com/aldochaconc))

---

## What it does

- Fetches and caches the Omarchy Manual locally (no repeated network calls)
- Exposes 5 MCP tools for querying the docs from inside Claude
- Supports on-demand refresh to pick up documentation updates
- Enables full-text search across all cached sections

---

## Installation

```bash
/plugin marketplace add /path/to/omarchy-mcp
/plugin install omarchy-mcp@omarchy-mcp-dev
```

Restart Claude Code. Then pre-load the full manual cache (one-time):

```
fetch_all_sections
```

---

## MCP Tools

### `list_sections`

Lists all 43 sections of the Omarchy Manual with their slugs and cache status.

**No parameters.**

**Example output:**
```
- **Welcome to Omarchy** — `welcome-to-omarchy` (cached 2026-03-07)
- **Hotkeys** — `hotkeys` (not cached)
...
```

---

### `read_section`

Reads the full content of a specific section.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | yes | Section slug (e.g. `hotkeys`, `neovim`). Use `list_sections` to find slugs. |
| `refresh` | boolean | no | Re-fetch from live site even if cached. Default: `false`. |

**Example:**
```
read_section { "slug": "hotkeys" }
read_section { "slug": "neovim", "refresh": true }
```

---

### `search_docs`

Full-text search across all cached sections. Returns up to 5 matches with excerpts ranked by relevance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Keyword or phrase to search for. |

**Note:** Only searches sections already in the local cache. Run `fetch_all_sections` first for complete coverage.

**Example:**
```
search_docs { "query": "clipboard" }
search_docs { "query": "fingerprint auth" }
```

---

### `fetch_all_sections`

Fetches and caches all 43 sections from the live site. Run once to build the local index, or with `refresh: true` when the docs update.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `refresh` | boolean | no | Re-fetch all sections even if already cached. Default: `false`. |

**Example:**
```
fetch_all_sections {}
fetch_all_sections { "refresh": true }
```

---

### `cache_status`

Shows which sections are cached and when they were last fetched.

**No parameters.**

**Example output:**
```
# Cache Status

43/43 sections cached
Last full fetch: 2026-03-07

- [x] Welcome to Omarchy — last fetched 2026-03-07
- [x] Hotkeys — last fetched 2026-03-07
...
```

---

## Cache

Content is stored in `server/.cache/` inside the plugin directory. Each section is a JSON file:

```
server/.cache/
├── index.json          # Metadata index
├── hotkeys.json
├── neovim.json
└── ...
```

The cache path can be overridden via the `OMARCHY_CACHE_DIR` environment variable.

---

## Development

```bash
cd server
npm install
npm run build    # Compile TypeScript → dist/
npm start        # Run the server directly
```

To iterate on the plugin:

```bash
/plugin uninstall omarchy-mcp@omarchy-mcp-dev
# make changes, then:
npm run build
/plugin install omarchy-mcp@omarchy-mcp-dev
# restart Claude Code
```

---

## Manual Sections

| Slug | Title |
|------|-------|
| `welcome-to-omarchy` | Welcome to Omarchy |
| `the-basics` | The Basics |
| `getting-started` | Getting Started |
| `navigation` | Navigation |
| `themes` | Themes |
| `extra-themes` | Extra Themes |
| `making-your-own-theme` | Making Your Own Theme |
| `universal-clipboard` | Universal Clipboard |
| `hotkeys` | Hotkeys |
| `the-applications` | The Applications |
| `terminal` | Terminal |
| `neovim` | Neovim |
| `ai` | AI |
| `development-tools` | Development Tools |
| `shell-tools` | Shell Tools |
| `shell-functions` | Shell Functions |
| `tuis` | TUIs |
| `guis` | GUIs |
| `commercial` | Commercial |
| `filling-out-pdfs` | Filling Out PDFs |
| `web-apps` | Web Apps |
| `gaming` | Gaming |
| `windows-vm` | Windows VM |
| `other-packages` | Other Packages |
| `configuration` | Configuration |
| `updates` | Updates |
| `dotfiles` | Dotfiles |
| `monitors` | Monitors |
| `keyboard-mouse-trackpad` | Keyboard, Mouse, Trackpad |
| `system-sleep` | System Sleep |
| `fingerprint-fido2-authentication` | Fingerprint & Fido2 Authentication |
| `fonts` | Fonts |
| `backgrounds` | Backgrounds |
| `prompt` | Prompt |
| `common-tweaks` | Common Tweaks |
| `manual-installation` | Manual Installation |
| `mac-support` | Mac Support |
| `troubleshooting` | Troubleshooting |
| `faq` | FAQ |
| `system-snapshots` | System Snapshots |
| `security` | Security |
| `omarchy-on` | Omarchy On... |
| `the-rest` | The Rest |

---

## License

MIT
