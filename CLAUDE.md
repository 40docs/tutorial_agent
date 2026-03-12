# Glass Box Demos — Project Guide

## What This Is

A collection of interactive, single-file React demos that make invisible AI mechanisms visible. Each demo is a "glass box" — the user sees every payload, every state change, every architectural decision in real time.

| Demo | Directory | Topic |
|------|-----------|-------|
| MCP Protocol | `tutorial_mcp/` | Model Context Protocol — boot, handshake, tool calls, chained calls |
| Agentic AI | `tutorial_agent/` | GenAI → Agentic Loop → Multi-Agent → Compaction |

## Tech Stack (all demos)

- React 18 + ReactDOM 18 (CDN, production build)
- Babel Standalone (in-browser JSX)
- Tailwind CSS (CDN)
- **Zero build step, zero dependencies** — open `index.html` in a browser

---

## The Section-File Assembly Pattern

**Every demo MUST use this pattern.** Do not write directly into `index.html`.

### How It Works

Each demo is split into independent `.js` section files that are concatenated into the final `index.html`:

```
src/simulation.js   — constants, data, steps, useSimulation() hook
src/diagrams.js     — SVG architecture diagrams
src/inspector.js    — payload inspector, context meter, message log
src/app.js          — chat, narrator, app shell, ReactDOM.render
```

Assembly is a single `cat` command:

```bash
cat html_header.html \
    src/simulation.js \
    src/diagrams.js \
    src/inspector.js \
    src/app.js \
    html_footer.html > index.html
```

The HTML header/footer are the first 24 and last 3 lines of `index.html` (the `<head>`, `<script type="text/babel">` open, and the closing tags).

### Why This Pattern Exists

1. **Context window management** — A single 3,500+ line file exceeds what one agent can hold in working memory while also reading reference material. Section files let agents (or humans) focus on one concern at a time.
2. **Independent editing** — Change the diagrams without touching the simulation engine. Fix the chat panel without re-reading 1,400 lines of step definitions.
3. **Instant reassembly** — `cat` is atomic and instant. No build step, no compilation, no waiting.
4. **Git-friendly** — Diffs are scoped to the section that changed, not a 3,500-line monolith.
5. **Agent-parallelizable** — Multiple agents can write separate section files simultaneously without merge conflicts.

### Rules

- **Never edit `index.html` directly.** Edit the section file, then reassemble.
- **Always reassemble after any section edit** before testing in browser.
- **The header/footer rarely change.** Extract them once and reuse.
- Section files are **pure JavaScript** — no `<script>` tags, no HTML wrappers.
- Load order matters: `src/simulation.js` defines globals (COLORS, C, STEPS), later files consume them.

---

## Interface Contract Between Sections

The section files share globals. These implicit dependencies have caused bugs. **Always check the contract when editing cross-section interfaces.**

### Globals Defined by src/simulation.js

```javascript
// Constants (used by ALL other sections)
COLORS          // { genai, harness, tools, agents, compaction, user } — each has { bg, border, text, glow }
COMPONENT_IDS   // { USER, API, MODEL, HARNESS, TOOL_READ, ... }
C               // Alias for COMPONENT_IDS
ACT_METADATA    // { 1: { title, subtitle, accentColor, ... }, ... }
STEPS           // Array of all step objects
ACT_OFFSETS     // { 1: 0, 2: 8, 3: 22, 4: 38 }
ACT_LENGTHS     // { 1: 8, 2: 14, 3: 16, 4: 11 }
INITIAL_STATE   // Default simulation state
MAX_CONTEXT_TOKENS  // 200000

// Hook (used by src/app.js)
useSimulation() // Returns: { currentStep, currentStepIndex, currentAct, conversationHistory,
                //            messageLog, contextState, isPlaying, playSpeed,
                //            next, prev, togglePlay, setPlaySpeed, goToAct, goToStep, reset }
```

**Critical:** `useSimulation()` returns BOTH `currentStep` (the step object) AND `currentStepIndex` (the numeric index). Using `currentStep` as an array index will break the app silently — the step object coerces to `[object Object]` in string contexts.

### Globals Defined by src/inspector.js

```javascript
MONO_FONT                // Monospace font stack string
ContextWindowMeter       // Component — accepts { contextState, showThreshold, isCompacting, compact }
PayloadInspector         // Component — accepts { message, contextState, activeAgent, currentAct }
WhatWasLostPanel         // Component — accepts { compactionData }
CompactionDiffView       // Component — accepts { compactionData }
InnerMessageLog          // Component — accepts { messageLog, currentStep }
JsonNode                 // Component — recursive JSON renderer
```

### Globals Defined by src/diagrams.js

```javascript
ArchitectureDiagram      // Component — accepts { currentAct, activeComponents, messageFlow, stepKey, contextState, activeAgent }
```

---

## Agent Team Strategy

### When to Use Agent Teams

Use parallel agents for **initial generation** of a new demo — when 1,000+ lines need to be written from scratch across independent sections.

### When NOT to Use Agent Teams

- **Iterative refinement** — After the initial build, work directly on section files. Edit → reassemble → verify. A single agent editing 3 lines across 2 files is faster than coordinating 4 agents.
- **Bug fixes** — Read the section, edit it, reassemble. No agents needed.
- **Visual polish** — Color changes, layout tweaks, SVG coordinate adjustments. Direct editing only.

### Agent Sizing Rules

| Situation | Agents | Why |
|-----------|--------|-----|
| New demo from scratch | 4 parallel | Each writes one section file independently |
| Adding a new Act to existing demo | 2 max | One for step data (`src/simulation.js`), one for new diagram (`src/diagrams.js`) |
| UI/layout changes | 0 (direct edit) | Changes span multiple sections but are small per file |
| Color/style changes | 0 (direct edit) | Usually a constant change in `src/simulation.js` + minor `src/app.js` tweaks |

### Agent Team Pitfalls (Learned the Hard Way)

1. **Rate limits** — 4 agents running simultaneously can all hit API rate limits. Stagger launches if needed.
2. **Shared constant drift** — Agent B assumes `COLORS.user` is blue, Agent D codes user bubbles as blue independently → color conflicts. Solution: define the full contract in the spec before agents start.
3. **Hook signature mismatch** — Agent A's `useSimulation()` returns `{ currentStep, currentStepIndex }`, but Agent D destructures only `currentStep` and uses it as both the object AND the index → silent `[object Object]` failures. Solution: the spec must explicitly list every return value and its type.

---

## Visual Verification

**Always set up visual verification before iterating on UI.** Many bugs are invisible without rendering.

### Headless Screenshot Setup

```bash
# One-time setup (already done in this container)
npx playwright install-deps chromium
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers npx playwright install chromium
```

### Screenshot Script Pattern

```javascript
// /tmp/screenshot.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file:///home/dev/projects/glassbox/tutorial_agent/index.html');
  await page.waitForTimeout(2000);
  // Click "Start Demo" if on landing screen
  const startBtn = await page.$('button');
  if (startBtn) await startBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: false });
  await browser.close();
})();
```

```bash
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers node /tmp/screenshot.js
```

### What Visual Verification Catches

- SVG elements hidden behind other elements (z-order)
- Colors too muted against dark backgrounds (opacity 0.35 on grey = invisible)
- Layout proportions that look fine in code but wrong on screen
- Flow packet paths that visually bypass intermediate components
- Missing content (empty chat bubbles, no code attachments)

---

## Color System

| Component | bg | border | text | Used For |
|-----------|------|--------|------|----------|
| genai | #581c87 | #a855f7 | #c084fc | API/Model boxes, Act 1 accent |
| harness | #92400e | #f59e0b | #fbbf24 | Harness boxes, Act 2 accent |
| tools | #065f46 | #10b981 | #34d399 | Tool boxes |
| agents | #1e3a5f | #3b82f6 | #60a5fa | Agent boxes, Act 3 accent |
| compaction | #7c2d12 | #f97316 | #fb923c | Compaction engine, Act 4 accent |
| user | #052e16 | #4ade80 | #86efac | User box in diagrams, user chat bubbles |

**Rule:** Every component category must have a visually distinct border color. At 35% opacity (inactive state in diagrams), the border must still be visible against `#0f172a` background.

---

## Reusable Framework

See `docs/FRAMEWORK.md` for the complete playbook on creating new glass box demos — including what's reusable vs. demo-specific, the new-demo scaffold steps, agent team spec templates, and the decision framework for when to use agents vs. direct editing. See `docs/LESSONS-LEARNED.md` for what worked, what failed, and rules for future demos.

Key insight: **sections 7 (inspector) and 89 (app shell) are 70-80% reusable** across demos. Copy from an existing demo and adapt the demo-specific parts (agent colors, phase types, key terms, act metadata). Only sections 1 (simulation data) and 6 (diagrams) need to be written fresh.

---

## Repeatable Operations

These operations are run frequently during development. Consider these as skill candidates.

### Assemble

```bash
# Run from the demo directory (e.g., tutorial_agent/)
head -24 index.html > /tmp/h.txt && tail -3 index.html > /tmp/f.txt
cat /tmp/h.txt src/simulation.js src/diagrams.js src/inspector.js src/app.js /tmp/f.txt > index.html
```

### Screenshot

```bash
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers node /tmp/shot.js
# Then read the screenshot: Read /tmp/screenshot.png
```

### Assemble + Screenshot (full verify cycle)

Assemble first, then screenshot. This is the most common workflow during iterative development.

---

## Common Pitfalls

1. **Don't edit index.html directly** — It will be overwritten on next assembly.
2. **SVG flow paths must match box positions** — If you move a box (change x/y), update ALL paths that reference those coordinates.
3. **Flow packets animate along `<path>` elements in `<defs>`** — They reference paths by ID via `<mpath href>`. Changing a path ID without updating the FlowPacket reference = silent failure (dot doesn't move).
4. **Act transitions need `prevActRef`** — Without tracking the previous act, transitions fire on every render.
5. **Chat auto-scroll** — Must use `useEffect` on `conversationHistory.length`, not on step changes.
6. **`position: absolute` trick for diagram panel** — The SVG diagram is inside `position: relative` container with `position: absolute; inset: 0` child. This ensures the SVG fills the panel regardless of aspect ratio. Removing this causes the diagram to collapse or letterbox.
