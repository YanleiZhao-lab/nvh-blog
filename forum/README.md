# NVH Test Forum

`forum/` is the Discourse preparation package for `forum.nvhtest.cn`.

It is intentionally not a self-built forum. It contains the static landing page, category plan, rules, deployment notes, launch checklist, and category configuration draft needed before a real Discourse deployment.

## Local Preview

Open this file directly in a browser:

```text
E:\AI\NVHtest\forum\index.html
```

No Node.js, database, Docker, or build step is required for the current preview.

## Files

- `index.html`: standalone forum preparation page.
- `docs/category-plan.md`: category, tag, and permission plan.
- `docs/community-guidelines.md`: posting rules and moderation principles.
- `docs/discourse-deployment.md`: future VPS/DNS/SMTP/backup deployment plan.
- `docs/launch-checklist.md`: pre-launch checklist.
- `config/discourse-categories.yml`: category configuration reference.

## Boundary

- Do not add custom forum backend code here.
- Do not add user database, login, payment, or API gateway logic here.
- Do not mix this package with `api/` or `ai-api/` implementation.
- After Discourse is deployed, keep these docs as operations references.
