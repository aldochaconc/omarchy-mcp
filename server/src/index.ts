import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All known Omarchy Manual pages
const PAGES: { slug: string; title: string; path: string }[] = [
  { slug: "welcome-to-omarchy", title: "Welcome to Omarchy", path: "/2/the-omarchy-manual/91/welcome-to-omarchy" },
  { slug: "the-basics", title: "The Basics", path: "/2/the-omarchy-manual/49/the-basics" },
  { slug: "getting-started", title: "Getting Started", path: "/2/the-omarchy-manual/50/getting-started" },
  { slug: "navigation", title: "Navigation", path: "/2/the-omarchy-manual/51/navigation" },
  { slug: "themes", title: "Themes", path: "/2/the-omarchy-manual/52/themes" },
  { slug: "extra-themes", title: "Extra Themes", path: "/2/the-omarchy-manual/90/extra-themes" },
  { slug: "making-your-own-theme", title: "Making Your Own Theme", path: "/2/the-omarchy-manual/92/making-your-own-theme" },
  { slug: "universal-clipboard", title: "Universal Clipboard", path: "/2/the-omarchy-manual/105/universal-clipboard" },
  { slug: "hotkeys", title: "Hotkeys", path: "/2/the-omarchy-manual/53/hotkeys" },
  { slug: "the-applications", title: "The Applications", path: "/2/the-omarchy-manual/55/the-applications" },
  { slug: "terminal", title: "Terminal", path: "/2/the-omarchy-manual/106/terminal" },
  { slug: "neovim", title: "Neovim", path: "/2/the-omarchy-manual/56/neovim" },
  { slug: "ai", title: "AI", path: "/2/the-omarchy-manual/107/ai" },
  { slug: "development-tools", title: "Development Tools", path: "/2/the-omarchy-manual/62/development-tools" },
  { slug: "shell-tools", title: "Shell Tools", path: "/2/the-omarchy-manual/57/shell-tools" },
  { slug: "shell-functions", title: "Shell Functions", path: "/2/the-omarchy-manual/58/shell-functions" },
  { slug: "tuis", title: "TUIs", path: "/2/the-omarchy-manual/59/tuis" },
  { slug: "guis", title: "GUIs", path: "/2/the-omarchy-manual/60/guis" },
  { slug: "commercial", title: "Commercial", path: "/2/the-omarchy-manual/61/commercial" },
  { slug: "filling-out-pdfs", title: "Filling Out PDFs", path: "/2/the-omarchy-manual/54/filling-out-pdfs" },
  { slug: "web-apps", title: "Web Apps", path: "/2/the-omarchy-manual/63/web-apps" },
  { slug: "gaming", title: "Gaming", path: "/2/the-omarchy-manual/71/gaming" },
  { slug: "windows-vm", title: "Windows VM", path: "/2/the-omarchy-manual/100/windows-vm" },
  { slug: "other-packages", title: "Other Packages", path: "/2/the-omarchy-manual/66/other-packages" },
  { slug: "configuration", title: "Configuration", path: "/2/the-omarchy-manual/64/configuration" },
  { slug: "updates", title: "Updates", path: "/2/the-omarchy-manual/68/updates" },
  { slug: "dotfiles", title: "Dotfiles", path: "/2/the-omarchy-manual/65/dotfiles" },
  { slug: "monitors", title: "Monitors", path: "/2/the-omarchy-manual/86/monitors" },
  { slug: "keyboard-mouse-trackpad", title: "Keyboard, Mouse, Trackpad", path: "/2/the-omarchy-manual/78/keyboard-mouse-trackpad" },
  { slug: "system-sleep", title: "System Sleep", path: "/2/the-omarchy-manual/103/system-sleep" },
  { slug: "fingerprint-fido2-authentication", title: "Fingerprint & Fido2 Authentication", path: "/2/the-omarchy-manual/77/fingerprint-fido2-authentication" },
  { slug: "fonts", title: "Fonts", path: "/2/the-omarchy-manual/94/fonts" },
  { slug: "backgrounds", title: "Backgrounds", path: "/2/the-omarchy-manual/89/backgrounds" },
  { slug: "prompt", title: "Prompt", path: "/2/the-omarchy-manual/95/prompt" },
  { slug: "common-tweaks", title: "Common Tweaks", path: "/2/the-omarchy-manual/102/common-tweaks" },
  { slug: "manual-installation", title: "Manual Installation", path: "/2/the-omarchy-manual/96/manual-installation" },
  { slug: "mac-support", title: "Mac Support", path: "/2/the-omarchy-manual/97/mac-support" },
  { slug: "troubleshooting", title: "Troubleshooting", path: "/2/the-omarchy-manual/88/troubleshooting" },
  { slug: "faq", title: "FAQ", path: "/2/the-omarchy-manual/67/faq" },
  { slug: "system-snapshots", title: "System Snapshots", path: "/2/the-omarchy-manual/101/system-snapshots" },
  { slug: "security", title: "Security", path: "/2/the-omarchy-manual/93/security" },
  { slug: "omarchy-on", title: "Omarchy On...", path: "/2/the-omarchy-manual/79/omarchy-on" },
  { slug: "the-rest", title: "The Rest", path: "/2/the-omarchy-manual/69/the-rest" },
];

const BASE_URL = "https://learn.omacom.io";
const CACHE_DIR = process.env.OMARCHY_CACHE_DIR ?? path.join(__dirname, "../.cache");
const INDEX_FILE = path.join(CACHE_DIR, "index.json");

interface CachedPage {
  slug: string;
  title: string;
  content: string;
  fetchedAt: string;
}

interface CacheIndex {
  pages: Record<string, { fetchedAt: string }>;
  lastFullFetch?: string;
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadIndex(): CacheIndex {
  if (fs.existsSync(INDEX_FILE)) {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
  }
  return { pages: {} };
}

function saveIndex(index: CacheIndex) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function cacheFilePath(slug: string) {
  return path.join(CACHE_DIR, `${slug}.json`);
}

function loadCachedPage(slug: string): CachedPage | null {
  const file = cacheFilePath(slug);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  return null;
}

function saveCachedPage(page: CachedPage) {
  fs.writeFileSync(cacheFilePath(page.slug), JSON.stringify(page, null, 2));
}

async function fetchPage(pagePath: string): Promise<string> {
  const url = BASE_URL + pagePath;
  const res = await fetch(url, {
    headers: { "User-Agent": "omarchy-mcp/1.0 (documentation reader)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return htmlToMarkdown(html);
}

function htmlToMarkdown(html: string): string {
  // Extract the main content area - strip nav, header, footer
  // The site wraps content in a recognizable structure
  let content = html;

  // Remove script and style tags
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Try to extract main content block (common patterns)
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    ?? content.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    ?? content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (mainMatch) {
    content = mainMatch[1];
  }

  // Convert headings
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
  content = content.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
  content = content.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");

  // Convert code blocks
  content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n");
  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Convert lists
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  content = content.replace(/<\/ul>/gi, "\n");
  content = content.replace(/<\/ol>/gi, "\n");

  // Convert paragraphs and line breaks
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  content = content.replace(/<br\s*\/?>/gi, "\n");

  // Convert bold/italic
  content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  content = content.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Convert links
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  content = content
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));

  // Clean up excessive whitespace
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  return content;
}

async function fetchAndCachePage(slug: string): Promise<CachedPage> {
  const pageInfo = PAGES.find((p) => p.slug === slug);
  if (!pageInfo) throw new Error(`Unknown page slug: ${slug}`);

  const content = await fetchPage(pageInfo.path);
  const cached: CachedPage = {
    slug,
    title: pageInfo.title,
    content,
    fetchedAt: new Date().toISOString(),
  };

  ensureCacheDir();
  saveCachedPage(cached);

  const index = loadIndex();
  index.pages[slug] = { fetchedAt: cached.fetchedAt };
  saveIndex(index);

  return cached;
}

async function getPage(slug: string, forceRefresh = false): Promise<CachedPage> {
  if (!forceRefresh) {
    const cached = loadCachedPage(slug);
    if (cached) return cached;
  }
  return fetchAndCachePage(slug);
}

function searchPages(query: string): Array<{ slug: string; title: string; excerpt: string; score: number }> {
  const q = query.toLowerCase();
  const results: Array<{ slug: string; title: string; excerpt: string; score: number }> = [];

  for (const pageInfo of PAGES) {
    const cached = loadCachedPage(pageInfo.slug);
    if (!cached) continue;

    const titleMatch = cached.title.toLowerCase().includes(q);
    const contentLower = cached.content.toLowerCase();
    const contentIdx = contentLower.indexOf(q);

    if (!titleMatch && contentIdx === -1) continue;

    let score = 0;
    if (titleMatch) score += 10;

    // Count occurrences in content
    let idx = 0;
    while ((idx = contentLower.indexOf(q, idx)) !== -1) {
      score++;
      idx += q.length;
    }

    // Extract excerpt around first match
    let excerpt = "";
    if (contentIdx !== -1) {
      const start = Math.max(0, contentIdx - 100);
      const end = Math.min(cached.content.length, contentIdx + 300);
      excerpt = (start > 0 ? "..." : "") + cached.content.slice(start, end).trim() + (end < cached.content.length ? "..." : "");
    } else {
      excerpt = cached.content.slice(0, 200).trim() + "...";
    }

    results.push({ slug: pageInfo.slug, title: cached.title, excerpt, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- MCP Server ---

const server = new Server(
  { name: "omarchy-docs", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_sections",
      description: "List all sections/pages of the Omarchy Manual with their slugs and titles.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "read_section",
      description: "Read the full content of a specific Omarchy Manual section by its slug. Returns cached content; use refresh=true to re-fetch from the live site.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The section slug (e.g. 'hotkeys', 'neovim', 'getting-started'). Use list_sections to see all slugs.",
          },
          refresh: {
            type: "boolean",
            description: "If true, re-fetch content from the live site even if cached.",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "search_docs",
      description: "Search the cached Omarchy Manual for a keyword or phrase. Returns the top matching sections with excerpts. Only searches sections that have been fetched (use fetch_all_sections first for full coverage).",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search term or phrase.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "fetch_all_sections",
      description: "Fetch and cache all sections of the Omarchy Manual from the live site. This enables full-text search across the entire manual. Only fetches sections not yet cached unless refresh=true.",
      inputSchema: {
        type: "object",
        properties: {
          refresh: {
            type: "boolean",
            description: "If true, re-fetch all sections even if already cached.",
          },
        },
        required: [],
      },
    },
    {
      name: "cache_status",
      description: "Show which Omarchy Manual sections are cached locally and when they were last fetched.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_sections") {
      const index = loadIndex();
      const lines = PAGES.map((p) => {
        const cached = index.pages[p.slug];
        const status = cached ? `(cached ${cached.fetchedAt.slice(0, 10)})` : "(not cached)";
        return `- **${p.title}** — \`${p.slug}\` ${status}`;
      });
      return {
        content: [{ type: "text", text: `# Omarchy Manual Sections\n\n${lines.join("\n")}` }],
      };
    }

    if (name === "read_section") {
      const slug = args?.slug as string;
      const refresh = (args?.refresh as boolean) ?? false;

      const page = await getPage(slug, refresh);
      const status = refresh ? "(freshly fetched)" : "(from cache)";
      return {
        content: [
          {
            type: "text",
            text: `# ${page.title} ${status}\n\n_Fetched: ${page.fetchedAt}_\n\n---\n\n${page.content}`,
          },
        ],
      };
    }

    if (name === "search_docs") {
      const query = args?.query as string;
      const results = searchPages(query);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No cached sections match "${query}". Run fetch_all_sections first to build the full search index.`,
            },
          ],
        };
      }

      const lines = results.map(
        (r) => `## ${r.title} (\`${r.slug}\`, score: ${r.score})\n\n${r.excerpt}`
      );
      return {
        content: [{ type: "text", text: `# Search results for "${query}"\n\n${lines.join("\n\n---\n\n")}` }],
      };
    }

    if (name === "fetch_all_sections") {
      const refresh = (args?.refresh as boolean) ?? false;
      ensureCacheDir();
      const results: string[] = [];

      for (const pageInfo of PAGES) {
        const cached = loadCachedPage(pageInfo.slug);
        if (!refresh && cached) {
          results.push(`- ${pageInfo.title}: already cached`);
          continue;
        }
        try {
          await fetchAndCachePage(pageInfo.slug);
          results.push(`- ${pageInfo.title}: fetched`);
          // Small delay to be polite to the server
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          results.push(`- ${pageInfo.title}: ERROR - ${err}`);
        }
      }

      const index = loadIndex();
      index.lastFullFetch = new Date().toISOString();
      saveIndex(index);

      return {
        content: [{ type: "text", text: `# Fetch All Sections\n\n${results.join("\n")}` }],
      };
    }

    if (name === "cache_status") {
      const index = loadIndex();
      const cached = Object.keys(index.pages).length;
      const total = PAGES.length;
      const lines = PAGES.map((p) => {
        const info = index.pages[p.slug];
        return info
          ? `- [x] **${p.title}** — last fetched ${info.fetchedAt.slice(0, 10)}`
          : `- [ ] ${p.title}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `# Cache Status\n\n${cached}/${total} sections cached\n${index.lastFullFetch ? `Last full fetch: ${index.lastFullFetch.slice(0, 10)}` : "No full fetch done yet"}\n\n${lines.join("\n")}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
