# Agentic AI Glass Box Demo

An interactive browser demo that walks through the evolution of agentic AI systems in four acts — from a single API call to a multi-agent pipeline with context compaction.

## Quick Start

Open `index.html` in any modern browser. No install, no build step, no server.

## The Four Acts

| Act | Title | What You'll See |
|-----|-------|----------------|
| 1 | Traditional GenAI | A single API call with no tools. The model guesses but can't verify. |
| 2 | The Agentic Loop | Tools are added. The harness loops: call API, execute tool, feed results back. Six API calls, one task. |
| 3 | Multi-Agent Systems | An orchestrator delegates to Explorer, Builder, and Reviewer. Watch context meters fill and handoffs compress 40,000 tokens into 300. |
| 4 | Compaction | The context window hits 70%. A compaction engine summarizes 140,000 tokens down to 3,500 — but a critical TODO gets lost. |

All four acts use the same scenario: finding and fixing a seconds-vs-milliseconds bug in an authentication module.

## What's On Screen

```
+---------------------------+-----------------------------------+
|                           |        Architecture Diagram       |
|       Chat Panel          |     (SVG, animated flow dots)     |
|   (Claude-style bubbles,  +-----------------------------------+
|    tool calls, agent       |         Context Window Meter      |
|    labels)                +------------------+----------------+
|                           |   Event Log      | API Payload    |
|                           |                  | Inspector      |
+---------------------------+------------------+----------------+
|                    Step Narrator                               |
|     (act tabs, narration text, Back / Play / Next controls)   |
+---------------------------------------------------------------+
```

## File Structure

```
src/
  simulation.js    Constants, simulated codebase, 49 step definitions,
                   pre-built API payloads, useSimulation() hook

  diagrams.js      4 SVG architecture layouts (one per act), CompBox,
                   FlowPacket animations, MiniContextMeter

  inspector.js     JSON syntax highlighter, payload inspector, context
                   window meter, "What Was Lost" panel, message log

  app.js           Chat panel, step narrator, landing screen, header bar,
                   act transitions, keyboard shortcuts, main App layout

docs/
  content-blueprint.md   The scenario, acts, and narration guide
  BUILD-SPEC.md          Agent team spec for this demo
  PLAN.md                Implementation plan

assemble.sh      Concatenates src/ files into index.html
index.html       The assembled demo (open in browser)
```

## Development

Edit any `.js` file, then reassemble:

```bash
./assemble.sh
# → "Assembled: 3438 lines → index.html"
```

Refresh the browser. That's it.

### Headless Screenshots

For visual verification without a display:

```bash
# One-time setup
npx playwright install-deps chromium
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers npx playwright install chromium

# Take a screenshot
PLAYWRIGHT_BROWSERS_PATH=/home/dev/.playwright-browsers node /tmp/shot.js
```

## How It Was Built

This demo was built using a 4-agent parallel team, each writing one section file. The build spec with agent personas and verification checklist is in [`docs/BUILD-SPEC.md`](docs/BUILD-SPEC.md).

Key takeaway: the section-file approach worked far better than attempting to write the full 3,400-line file monolithically.

## Building More Demos Like This

This repo was created from the [Glass Box template](https://github.com/your-org/glassbox). See the template's `docs/FRAMEWORK.md` for the reusable playbook and `docs/LESSONS-LEARNED.md` for what worked and what didn't.

## License

MIT
