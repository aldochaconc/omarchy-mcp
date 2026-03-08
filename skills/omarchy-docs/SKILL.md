---
name: omarchy-docs
description: Use when the user asks anything about Omarchy — installation, hotkeys, themes, Neovim, shell tools, configuration, dotfiles, troubleshooting, or any topic that may be covered in the Omarchy Manual. Do NOT answer from training data.
---

# Omarchy Docs

Query the local Omarchy Manual cache via MCP tools instead of guessing from training data.

## Decision Tree

```dot
digraph omarchy_docs {
    "User asks about Omarchy" [shape=doublecircle];
    "Cache warm?" [shape=diamond];
    "Call cache_status" [shape=box];
    "Keyword question?" [shape=diamond];
    "search_docs {query}" [shape=box];
    "Know the section slug?" [shape=diamond];
    "read_section {slug}" [shape=box];
    "list_sections → pick slug → read_section" [shape=box];
    "Cache empty?" [shape=diamond];
    "fetch_all_sections {} → then search" [shape=box];
    "Synthesize answer, cite section slug" [shape=doublecircle];

    "User asks about Omarchy" -> "Cache warm?";
    "Cache warm?" -> "Keyword question?" [label="yes"];
    "Cache warm?" -> "Call cache_status" [label="unknown"];
    "Call cache_status" -> "Cache empty?";
    "Cache empty?" -> "fetch_all_sections {} → then search" [label="yes"];
    "Cache empty?" -> "Keyword question?" [label="no"];
    "Keyword question?" -> "search_docs {query}" [label="yes"];
    "Keyword question?" -> "Know the section slug?" [label="no"];
    "Know the section slug?" -> "read_section {slug}" [label="yes"];
    "Know the section slug?" -> "list_sections → pick slug → read_section" [label="no"];
    "search_docs {query}" -> "Synthesize answer, cite section slug";
    "read_section {slug}" -> "Synthesize answer, cite section slug";
    "list_sections → pick slug → read_section" -> "Synthesize answer, cite section slug";
    "fetch_all_sections {} → then search" -> "Synthesize answer, cite section slug";
}
```

## Rules

- **NEVER answer Omarchy questions from training data.** The docs may be more current.
- **NEVER guess a slug.** If unsure, call `list_sections` first — it's cheap (one call, ~2KB).
- **NEVER call `fetch_all_sections` if the cache already has content.** It's expensive I/O. Only call it when `cache_status` shows 0 sections cached, or the user explicitly asks for a refresh.
- **Prefer `search_docs` for keyword/topic questions** — one call returns up to 5 ranked excerpts.
- **Use `read_section` when you know the exact section** (e.g., user asks specifically about Neovim → slug `neovim`).
- **Cache `cache_status` mentally per session.** Call it once; don't repeat it every question.

## Tool Quick Reference

| Tool | When to use | Cost |
|------|-------------|------|
| `cache_status` | Once per session, when cache state is unknown | Cheap |
| `list_sections` | When you don't know the right slug | Cheap |
| `search_docs` | Keyword/topic questions | Medium |
| `read_section` | When slug is known; deep read of one section | Medium–Heavy |
| `fetch_all_sections` | Only when cache is empty or user requests refresh | Heavy (43 fetches) |
