# Changelog

Newest first.

## 2026-11-16: template created
- Made from New Year Crackers (`fxdarshan/01_New_Year_Crackers` at 9afcb2b): game art removed, sample config with neutral symbol names (Crown, Ruby, Emerald, Sapphire, Gold Bar, Coins, A-10, Scatter), theme texts moved to `CONFIG.texts`, the single-file build named after `CONFIG.title`.
- Art inbox `art/` and `tools/asset-pipeline/import_art.py`: files named by asset ID are imported with no manifest edits. Mockup clean-up tools take the reel window as an argument.
- Optional art (`sym_00_expanded`, `fx_lantern`, banners, splash logo) is only drawn when supplied.
- `CLAUDE.md` house rules, `HANDOFF.md`, `WORKFLOW.md` (Claude Code at home + claude.ai chat elsewhere, GitHub as the bridge), `NEW_GAME.md`, spec templates in `docs/templates/`, and five project skills in `.claude/skills/`.
- Checks: 20/20 edge cases pass with placeholder art.
