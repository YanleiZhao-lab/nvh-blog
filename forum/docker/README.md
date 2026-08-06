# Forum Docker Deployment Notes

`forum.nvhtest.cn` should use the official Discourse Docker install instead of a custom forum service in this repository.

## Production Flow

1. Prepare a VPS with enough memory for Discourse.
2. Point `forum.nvhtest.cn` to the VPS.
3. Configure SMTP before launch.
4. Install Discourse through the official installer.
5. Use `forum/config/discourse-categories.yml` as the manual category reference.
6. Enable backups and download a manual backup after launch.

This folder intentionally does not include a runnable Discourse compose file. Discourse upgrades and backups should follow the upstream operations model.
