# AI tools for this project

Checked 2026-11-17 for Darshan. Only tools that are useful and licensed for our use are wired in.

## In use: spine-mcp (MIT)
https://github.com/egorfedorov/spine-mcp — an MCP server that turns a layered PSD (or a PhotoshopToSpine export) into a Spine 4.2 skeleton with animations, a packed atlas, and an editable `.spine` project. Tools: `spine_doctor`, `inspect_source`, `rig_and_animate`, `pack_atlas`, `make_project`, `export_project`, `project_info`, `preview`, `batch`. Tested 2026-11-17: installs and starts, all 9 tools listed.

**Set up once on the home PC (Claude Code):**
1. Install uv: `winget install astral-sh.uv` (or `pip install uv`).
2. If Spine isn't at `C:\Program Files\Spine\Spine.com`, set the `SPINE_BIN` environment variable to your Spine executable.
3. Open this repo in Claude Code. It reads `.mcp.json` and asks once to approve the `spine` server; approve it.
4. Ask Claude: "run spine_doctor". `spine_cli: true` means everything works.

**Use:** cut the character in Photoshop into named layers (head, hat, poncho, arms, gun, legs), with overlap tabs under each joint. Then ask Claude to run `rig_and_animate` on the PSD and `make_project`, and open the `.spine` file in Spine to polish. Note its naming conventions: alternate faces `<base>_win` / `<base>_blink`, glow layer `Layer 2`, effects `*fire*` / `*rot*`; head layers are found by the words `head, face, crown, tooth` (override with `SPINE_HEAD_WORDS`).

Rigging, `inspect_source` and `preview` work without Spine (also in claude.ai chat sessions); packing, `.spine` projects and export need the Spine editor and licence. The repo is very new (one commit): expect rough edges.

## Not added
- **Genielabs spine-animation-ai** (https://github.com/GenielabsOpenSource/spine-animation-ai): useful for splitting one picture into parts with Gemini and auto-placing them, but PolyForm **Noncommercial** licence: fine for an internal test, not for games we ship without a licence from Genielabs.
- **Slot & Casino Game Developer Skills for Stake Engine** (https://github.com/egorfedorov/Slot-Casino-Game-Developer-Skills-for-Stake-Engine): ~30 prompt checklists (RTP optimiser, QA, mechanics, VFX, animation timelines, Stake RGS). Generic and largely covered by our own skills (`slot-math-audit`, `slot-project-sync`, the simulator and edge-case checks). **No licence**, so it can't be copied into our repos; read it on GitHub or fork it there. Worth borrowing as an idea: RTP sign-off with a confidence interval over long runs.
- **SlopSlot** (https://github.com/gajus/slopslot): a toy Claude Code plugin that spins a slot machine while Claude works. Fun, not a game-building tool.
