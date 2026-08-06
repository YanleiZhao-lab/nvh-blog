# Content Sync Guide

This guide records how the current `nvhtest.cn` / `Githubfeishu.github.io` VitePress site should fit into the NVH Test station group.

## Reference Findings

- `https://nvhtest.cn` is currently a VitePress site titled `NVH百宝箱`.
- The public repository is `nancheng1994/Githubfeishu.github.io`.
- The repository description is `elog` and its README describes a Feishu + VitePress automated sync deployment approach.
- The repository uses `docs/` as the VitePress content root.
- `package.json` exposes `docs:dev`, `docs:build`, and `docs:preview` scripts.

## Recommended Role

Use the current VitePress site as the long-form content and documentation engine. Use `web/` as the station-group portal and lightweight content index.

Recommended split:

| Layer | Role |
| --- | --- |
| `web/` | Public station portal, service matrix, channel index, forum/API boundary pages. |
| VitePress / Githubfeishu | Searchable NVH knowledge base, tutorials, Markdown content, changelog, navigation pages. |
| `forum/` | Discourse preparation package, then real community runtime after VPS deployment. |
| `api/` and `ai-api/` | Future independent backend services; not part of content sync. |

## Sync Workflow

1. Write or sync content from Feishu into the VitePress repository.
2. Build and deploy the VitePress site through GitHub Pages or Cloudflare Pages.
3. Add only selected summaries and links into `web/pages/blog.html` and `web/pages/channel.html`.
4. Link longer tutorials to the VitePress pages instead of duplicating full articles in `web/`.
5. Promote forum discussions into VitePress articles only after they are cleaned and anonymized.

## Guardrails

- Do not copy private Feishu content into public pages without review.
- Do not publish customer data, internal project names, API keys, payment configuration, or private endpoints.
- Do not merge the VitePress build system into the static `web/` package in the first phase.
- Keep forum runtime, professional API, and general AI API gateway independent.

## Later Options

- Move VitePress to `docs.nvhtest.cn` and keep `www.nvhtest.cn` as the station portal.
- Keep the current VitePress site as `nvhtest.cn` temporarily while testing `web/` on Cloudflare Pages preview.
- Add a generated `latest-content.json` later if the portal needs automatic cards from VitePress frontmatter.
