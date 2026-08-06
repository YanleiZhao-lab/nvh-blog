# Discourse Deployment Guide

This guide is for the future production forum at `forum.nvhtest.cn`. The current `forum/` package remains static preparation material until the VPS deployment starts.

## Recommended Architecture

- Runtime: Discourse official Docker-based install.
- Domain: `forum.nvhtest.cn`.
- DNS/CDN: Cloudflare DNS, proxy setting evaluated during Discourse setup.
- Mail: reliable SMTP provider for account activation, notifications, and password reset.
- Backup: Discourse automatic backups plus periodic manual download.

## Preflight Checklist

1. Confirm domain ownership and Cloudflare DNS access.
2. Create `A` record for `forum.nvhtest.cn` pointing to the VPS IP.
3. Prepare SMTP host, port, username, password, and sender address.
4. Prepare admin email and secure password manager entry.
5. Confirm server firewall allows HTTP, HTTPS, and SSH.
6. Read the latest official Discourse install documentation before running production commands.

## Launch Sequence

1. Provision VPS.
2. Configure DNS.
3. Install Discourse using the official installation flow.
4. Complete web-based setup wizard.
5. Create categories according to `docs/category-plan.md`.
6. Pin `docs/community-guidelines.md` content as a welcome/rules topic.
7. Configure backups and send a test email.
8. Update `web/pages/forum.html` to link to `https://forum.nvhtest.cn/`.

## Boundary

Do not place Discourse runtime files inside `web/`. Do not mix forum database users with future `api` or `ai-api` users. The forum can link to public API documentation later, but it should not become an API control panel.
