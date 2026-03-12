# Glass Box Demo Framework

How to create any new glass box demo from scratch. This distills the reusable patterns, skills, and agent prompts from building the MCP and Agentic AI demos.

---

## What's Reusable vs. What's Demo-Specific

### Reusable Across All Demos (copy & adapt)

| Component | File Section | What It Does |
|-----------|-------------|-------------|
| `useSimulation()` hook | simulation | Step navigation, auto-play, act transitions, conversation accumulation |
| Step schema | simulation | `{ id, act, phase, label, activeComponents, messageFlow, message, narration, chatUpdate, contextState, ... }` |
| `CompBox` | diagrams | SVG labeled rectangle with glow, opacity states, optional diamond shape |
| `FlowPacket` | diagrams | Animated dot traveling an SVG `<path>` via `<animateMotion>` |
| `JsonNode` | inspector | Recursive JSON renderer with syntax highlighting, collapsible at depth > 2 |
| `PayloadInspector` | inspector | JSON viewer with annotations and token count badge |
| `ContextWindowMeter` | inspector | Segmented progress bar showing token usage |
| `InnerMessageLog` | inspector | Chronological event list with color-coded types |
| `ChatBubble` / `ChatPanel` | app | Claude-style chat with tool call/result visualization |
| `StepNarrator` | app | Act tabs, phase badges, narration text, playback controls |
| `LandingScreen` | app | Title, description, start button, skip-to-act buttons |
| `HeaderBar` | app | Title bar with act buttons and progress bar |
| `ActTransition` | app | Full-screen overlay when switching acts |
| `App` layout | app | Chat left, internals right, narrator at bottom, keyboard shortcuts |
| Assembly process | build step | `cat header sections footer > index.html` |
| Visual verification | test step | Playwright headless screenshot pipeline |

### Demo-Specific (must be written fresh)

| Component | What Changes |
|-----------|-------------|
| `COLORS` | Color scheme per component category |
| `COMPONENT_IDS` | The architectural components being visualized |
| `ACT_METADATA` | Number of acts, titles, subtitles, accent colors, descriptions |
| `STEPS[]` | All step definitions — narration, payloads, state mutations, chat updates |
| API payloads | Pre-built request/response JSON matching the demo's scenario |
| SVG diagram layouts | Per-act box positions, connection lines, flow paths |
| Simulated data | Fake codebase files, tool definitions, scenario-specific content |

---

## New Demo Playbook

### Step 0: Define the Narrative

Before any code, answer:

1. **What mechanism are you making visible?** (e.g., "how MCP boot + tool calls work", "how agentic loops evolve")
2. **How many acts?** Each act should teach one distinct concept.
3. **What's the shared scenario?** A concrete task that runs through all acts (e.g., "find and fix a bug in auth code").
4. **What are the architectural components?** Name every box that will appear in the diagram.
5. **What color represents each component category?** One unique border color per category. Verify visibility at 35% opacity against `#0f172a`.

Write this up as an `agent.md` content blueprint before touching any code.

### Step 1: Scaffold the Directory

```bash
mkdir tutorial_<name>
cd tutorial_<name>

# Create the HTML skeleton
cat > index.html << 'SKELETON'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEMO_TITLE — Glass Box Demo</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; overflow: hidden; }
    body { background: #0f0f1a; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f0f1a; }
    ::-webkit-scrollbar-thumb { background: #2a2a3c; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #3a3a4c; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
  </script>
</body>
</html>
SKELETON

# Create empty section files
mkdir -p src docs
touch src/simulation.js src/diagrams.js src/inspector.js src/app.js
```

### Step 2: Set Up Visual Verification

Do this BEFORE writing any UI code. Not after.

```bash
# One-time Playwright setup
npx playwright install-deps chromium
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers npx playwright install chromium
```

Create a screenshot script at `/tmp/shot.js`:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file:///home/dev/projects/glassbox/tutorial_<name>/index.html');
  await page.waitForTimeout(2000);
  const btn = await page.$('button');
  if (btn) { await btn.click(); await page.waitForTimeout(1000); }
  await page.screenshot({ path: '/tmp/demo.png', fullPage: false });
  await browser.close();
})();
```

### Step 3: Write the BUILD-SPEC

Create `BUILD-SPEC.md` with:

1. **Interface contract** — every shared global, its type, its exact values (especially colors)
2. **Agent personas** — one per section file, with responsibilities and constraints
3. **Step outline** — every step's act, phase, label (not full content yet — that's the agent's job)
4. **Assembly command** — the exact `cat` command
5. **Verification checklist** — 10-15 specific assertions to check after assembly

### Step 4: Copy Reusable Components

Copy inspector and app shell from the reference implementation or an existing demo. These are 80%+ reusable:

```bash
# From the reference implementation (always available in the template)
# Extract sections from reference/example-demo.html (lines 2066-3004 → inspector, 3014-4404 → app)
# Or from an existing demo's src/ files:
cp ../tutorial_agent/src/inspector.js src/   # JsonNode, PayloadInspector, ContextWindowMeter, MessageLog
cp ../tutorial_agent/src/app.js src/         # ChatPanel, StepNarrator, App, LandingScreen, etc.
```

Adapt:
- `AGENT_COLORS` in app (if the demo has different agent types)
- `PHASE_META` in app (new phase types may be needed)
- `KEY_TERMS` in app (different highlighted vocabulary)
- `ACT_METADATA` references (different number of acts, different accent colors)
- Layout proportions if needed

### Step 5: Write Demo-Specific Sections

**simulation.js** — This is the critical path. It defines:
- `COLORS`, `COMPONENT_IDS`, `ACT_METADATA`
- All pre-built API payloads
- All step definitions with narration
- `useSimulation()` hook

**diagrams.js** — Per-act SVG layouts:
- Box positions (COMP_RECTS per act)
- Connection lines (static dashed paths)
- Flow packet paths (in `<defs>`)
- The `ArchitectureDiagram` switch component

### Step 6: Assemble and Verify

```bash
head -24 index.html > /tmp/h.txt && tail -3 index.html > /tmp/f.txt
cat /tmp/h.txt src/simulation.js src/diagrams.js src/inspector.js src/app.js /tmp/f.txt > index.html
```

Take a screenshot. Check every item on the verification list.

---

## Agent Team Spec Template

Use this when writing a BUILD-SPEC for a new demo. Fill in the bracketed sections.

### Agent A: Simulation Engine Architect

**File:** `src/simulation.js`
**Persona:** Data architect. Meticulous about internal consistency.

**Responsibilities:**
1. Define COLORS with these exact values: [TABLE OF COLORS WITH HEX VALUES]
2. Define COMPONENT_IDS: [LIST OF ALL COMPONENTS]
3. Write [SIMULATED_DATA] — [DESCRIPTION]
4. Build [TOOL/API DEFINITIONS] in [FORMAT]
5. Build all pre-built payloads for all [N] acts
6. Define all [N] STEPS with full schema
7. Implement ACT_OFFSETS, ACT_LENGTHS, INITIAL_STATE
8. Implement useSimulation() hook — MUST return both `currentStep` (object) AND `currentStepIndex` (number)

**Critical:** useSimulation() return signature:
```
{ currentStep, currentStepIndex, currentAct, conversationHistory,
  messageLog, contextState, isPlaying, playSpeed,
  next, prev, togglePlay, setPlaySpeed, goToAct, goToStep, reset }
```

**Reference:** `reference/example-demo.html` (lines 46-1487) for hook pattern

### Agent B: Architecture Diagram Animator

**File:** `src/diagrams.js`
**Persona:** SVG visualization specialist.

**Responsibilities:**
1. Define per-act layout constants (box positions, lines, flow paths)
2. Implement CompBox (rect + label + glow) — copy from existing demo
3. Implement FlowPacket (animated dot with animateMotion) — copy from existing demo
4. Implement [N] per-act diagram layouts
5. Implement ArchitectureDiagram switch component

**Critical:**
- Flow packet paths must match messageFlow.from/to in step definitions
- If messageFlow.from is HARNESS, the dot must START at the Harness box, not User
- Inactive opacity is 0.35 — verify all borders visible at this opacity on #0f172a
- All SVG `<path>` IDs in `<defs>` must be unique per act (suffix with `-a1`, `-a2`, etc.)

**Reference:** `reference/example-demo.html` (lines 1490-2063) for CompBox/FlowPacket patterns

### Agent C: Inspector Specialist

**File:** `src/inspector.js`
**Persona:** Developer-tools UI specialist.

**Note:** This section is 80%+ reusable. Copy from existing demo, then adapt:
- Annotation labels if new message types exist
- Context meter thresholds if different from 200K

### Agent D: App Shell Engineer

**File:** `src/app.js`
**Persona:** UI/UX engineer.

**Note:** This section is 70%+ reusable. Copy from existing demo, then adapt:
- AGENT_COLORS if different agent types
- PHASE_META for new phase types
- KEY_TERMS for new highlighted vocabulary
- Layout proportions (chat width, right column split)
- Act count and accent colors

---

## Reusable Assembly Script

Save as `assemble.sh` in each demo directory:

```bash
#!/bin/bash
# Reassemble index.html from section files
DIR="$(cd "$(dirname "$0")" && pwd)"
head -24 "$DIR/index.html" > /tmp/glassbox_header.txt
tail -3 "$DIR/index.html" > /tmp/glassbox_footer.txt
cat /tmp/glassbox_header.txt \
    "$DIR/src/simulation.js" \
    "$DIR/src/diagrams.js" \
    "$DIR/src/inspector.js" \
    "$DIR/src/app.js" \
    /tmp/glassbox_footer.txt > "$DIR/index.html"
echo "Assembled: $(wc -l < "$DIR/index.html") lines"
```

---

## Decision Framework: Agents vs. Direct Editing

```
Is this a NEW demo from scratch (1000+ lines to generate)?
  → YES: Use 2-3 agents (A: simulation, B: diagrams). Copy sections C & D from existing demo.
  → NO: Continue below.

Are changes isolated to one section file?
  → YES: Edit that file directly, reassemble.
  → NO: Continue below.

Do changes span 2+ sections but are small per file (< 20 lines each)?
  → YES: Edit each file directly, reassemble.
  → NO: Continue below.

Are changes large AND independent across sections (e.g., rewriting all 4)?
  → YES: Consider 2 agents max. Never 4 — rate limits make it counterproductive.
  → NO: Edit directly.
```

---

## Anti-Patterns (Things That Wasted Time)

1. **Writing index.html as a monolith** — Every edit requires re-reading thousands of irrelevant lines. Always use section files.
2. **Launching 4 agents simultaneously** — Rate limits stall all of them. Use 2-3 max, stagger if needed.
3. **Editing UI without screenshots** — Color contrast, layout proportions, z-ordering, and missing content are invisible from code alone.
4. **Implicit interface contracts** — "The hook returns a step object" is not enough. Specify: "returns `currentStep` (Object: the step definition) AND `currentStepIndex` (Number: zero-based array index). Do NOT use `currentStep` as an array index."
5. **Hardcoding colors in multiple files** — User bubble was `#1e3a5f` in app while `COLORS.user.bg` was `#1f2937` in simulation. Use `COLORS.user.bg` everywhere. One source of truth.
6. **SVG paths that don't match data** — Flow path goes User→API, but messageFlow says Harness→API. The animated dot visually bypasses the Harness. Always audit paths against step definitions.
7. **Using agents for polish** — Color tweaks, layout percentage changes, adding a code attachment to a chat bubble — these are 3-10 line edits. Spawning an agent for this is slower than just editing the file.
