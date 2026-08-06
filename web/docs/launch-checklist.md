# Web Launch Checklist

## Before Publishing

- [ ] Confirm whether the first deployment target is GitHub Pages or Cloudflare Pages.
- [ ] Confirm whether `www.nvhtest.cn` or root `nvhtest.cn` is the primary public entry.
- [ ] If using GitHub Pages, copy `CNAME.example` to `CNAME` and confirm the value.
- [ ] Review all relative links from `index.html`.
- [ ] Confirm API and forum pages clearly say planned/separate where appropriate.
- [ ] Update `sitemap.xml` if final public paths change.
- [ ] Add at least one real blog/research note before wider promotion.

## Recommended Cloudflare Pages Settings

```text
Framework preset: None
Build command: leave empty
Build output directory: /
Root directory: /
```

## DNS First Stage

```text
www.nvhtest.cn -> web static site
```

Keep these for later dedicated services:

```text
forum.nvhtest.cn  -> Discourse server
api.nvhtest.cn    -> professional API server
ai-api.nvhtest.cn -> AI API gateway server
```

## Smoke Test

- [ ] Root page opens.
- [ ] Blog page opens.
- [ ] Docs page opens.
- [ ] Channel page opens.
- [ ] API page opens.
- [ ] Forum guide page opens.
- [ ] Mobile layout is readable.
