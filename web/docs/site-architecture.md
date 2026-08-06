# NVH Test Site Architecture

## First Stage

```text
web -> GitHub Pages or Cloudflare Pages
forum -> preparation docs and landing page only
api -> planning only
ai-api -> planning only
```

## Long-Term Subdomains

| Subdomain | Package | Runtime |
|---|---|---|
| `www.nvhtest.cn` | `web` | Static front site |
| `blog.nvhtest.cn` | `web` first, later content platform | Feishu Pages / Docusaurus / Astro |
| `docs.nvhtest.cn` | `web` first, later docs platform | Docusaurus / Nextra / VitePress |
| `channel.nvhtest.cn` | `web` first, later channel app | CMS or custom channel system |
| `forum.nvhtest.cn` | `forum` | Discourse on VPS |
| `api.nvhtest.cn` | `api` | Professional NVH API backend |
| `ai-api.nvhtest.cn` | `ai-api` | AI API gateway, Sub2API-style reference |

## Deployment Recommendation

Free stage:

```text
Cloudflare DNS + Cloudflare Pages or GitHub Pages
```

Commercial stage:

```text
Cloudflare + VPS/Docker for forum/api/ai-api
```

## Separation Rules

- `api` and `ai-api` do not share keys, quotas, logs, or billing tables by default.
- `forum` is not hosted on GitHub Pages.
- `web` contains public copy and links only, no runtime service logic.
- Sub2API is an `ai-api` reference, not a professional NVH API core.
