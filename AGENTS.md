<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

# NVH Test Project Notes

Before changing this project, read the relevant Trellis specs:

- `.trellis/spec/project/product-blueprint.md`
- `.trellis/spec/project/repository-architecture.md`
- `.trellis/spec/packages/web.md` for `web/`
- `.trellis/spec/packages/api.md` for `api/`
- `.trellis/spec/packages/ai-api.md` for `ai-api/`
- `.trellis/spec/packages/forum.md` for `forum/`

This project is intentionally split into `web`, `api`, `ai-api`, and `forum`. Keep runtime service logic out of the static `web` package.
