# Forum Launch Checklist

This checklist prepares `forum.nvhtest.cn` for a future Discourse deployment. It does not install Discourse and does not create a custom forum backend.

## Content

- [ ] Confirm the first category list in `docs/category-plan.md`.
- [ ] Confirm required tags for NVH testing, signal processing, CAE, materials, papers, tools, and resources.
- [ ] Publish `docs/community-guidelines.md` as the first pinned guideline topic.
- [ ] Prepare one pinned welcome topic for new members.
- [ ] Prepare one question template for engineering troubleshooting posts.

## Infrastructure

- [ ] Choose a VPS with at least 2 GB RAM for a small Discourse community.
- [ ] Point `forum.nvhtest.cn` to the VPS through Cloudflare DNS.
- [ ] Prepare SMTP credentials from a reliable mail provider.
- [ ] Confirm admin email and recovery email are not the same mailbox.
- [ ] Enable automatic Discourse backups and download a manual backup after launch.

## Security And Operations

- [ ] Use HTTPS only.
- [ ] Keep admin accounts minimal.
- [ ] Enable basic trust-level defaults before public registration.
- [ ] Create a private staff category for moderation notes.
- [ ] Define a simple weekly backup check.

## Web Integration

- [ ] Keep `web/pages/forum.html` pointing to `../forum/index.html` before launch.
- [ ] After Discourse is online, change the main forum CTA to `https://forum.nvhtest.cn/`.
- [ ] Keep `forum/` docs as the operating reference even after launch.
