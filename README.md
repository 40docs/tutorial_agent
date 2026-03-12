# Glass Box Demo Template

A template for building interactive, single-file browser demos that make invisible AI mechanisms visible. No build step, no dependencies — open `index.html` and start learning.

Each demo is a step-by-step simulation where you watch every API call, every payload, every state change happen in real time. Pause, rewind, and inspect anything.

## Getting Started

Create a new repo from this template, then follow [`docs/FRAMEWORK.md`](docs/FRAMEWORK.md) to build your first demo.

The `reference/` directory contains a complete working demo (4,400 lines) you can open in a browser and study. It's the source you'll copy reusable components from.

### Quick Version

1. Define your narrative (what mechanism, how many acts, what scenario)
2. Scaffold a new `tutorial_<name>/` directory
3. Copy `src/inspector.js` and `src/app.js` from `reference/example-demo.html` (adapt colors, phase types)
4. Write `src/simulation.js` (your steps, payloads, narration) and `src/diagrams.js` (your SVG layouts)
5. Assemble and verify

## How Demos Are Built

Every demo follows the same architecture: four JavaScript files concatenated into a single `index.html`.

```
src/
  simulation.js    Data layer — constants, scenario, pre-built API payloads, step
                   definitions, and the useSimulation() hook that drives everything

  diagrams.js      Architecture diagrams — SVG layouts per act, animated flow
                   packets, component boxes with glow/dim states

  inspector.js     Developer tools panels — JSON syntax-highlighted payload viewer,
                   context window meter, message log, compaction diff view

  app.js           Application shell — chat interface, step narrator with playback
                   controls, landing screen, keyboard shortcuts, main layout
```

Assembly is one command:

```bash
./assemble.sh    # → "Assembled: 3438 lines → index.html"
```

Edit any `.js` file, run `./assemble.sh`, refresh the browser. That's the entire development loop.

### Why Section Files Instead of One Big File?

- **Each file is focused.** Change the SVG diagrams without scrolling past 1,400 lines of step definitions.
- **AI agents can work in parallel.** Each file has clear boundaries — no merge conflicts.
- **Diffs are readable.** A color change shows up in `src/simulation.js`, not buried in a 3,500-line monolith.
- **Context windows stay manageable.** No single file exceeds what an AI agent can hold in working memory.

## Controls (all demos)

| Input | Action |
|-------|--------|
| **Next / Back** buttons | Step forward or backward |
| **Play** button | Auto-advance through steps |
| Arrow keys | Navigate steps |
| `1` `2` `3` `4` | Jump to act |
| `P` | Toggle play/pause |
| `Esc` | Reset to beginning |

## Template Structure

```
glassbox/
+-- README.md                      You are here
+-- CLAUDE.md                      Project guide for Claude Code (interface contracts, patterns)
|
+-- docs/                          Reusable guides
|   +-- FRAMEWORK.md               Playbook for creating new demos
|   +-- LESSONS-LEARNED.md         What worked, what failed, rules for next time
|
+-- reference/                     Reference implementation
    +-- README.md                  How to use the reference
    +-- example-demo.html          A complete working demo to learn from and copy
    +-- example-build-spec.md      Build spec used to create the example
    +-- example-architecture.md    Deep dive into patterns and design decisions
```

When you create a demo, add a `tutorial_<name>/` directory:

```
tutorial_<name>/
+-- README.md
+-- src/
|   +-- simulation.js              Data layer (constants, steps, hook)
|   +-- diagrams.js                SVG architecture diagrams
|   +-- inspector.js               Payload inspector + context meter
|   +-- app.js                     Chat, narrator, app shell
+-- docs/
|   +-- BUILD-SPEC.md              Agent team spec for this demo
|   +-- content-blueprint.md       Scenario, acts, narration guide
+-- assemble.sh                    Concatenates src/ files into index.html
+-- index.html                     Assembled output (open in browser)
```

## Lessons Learned

Building these demos with AI agent teams produced concrete findings about how to structure large single-file projects for AI-assisted development. The full write-up is in [`docs/LESSONS-LEARNED.md`](docs/LESSONS-LEARNED.md), but the highlights:

- **Section files are non-negotiable.** A single agent cannot reliably produce 3,500+ lines in one pass. Four focused files of 500-1,500 lines each is the sweet spot.
- **Agents for generation, humans for polish.** Use 2-3 parallel agents to write the initial scaffold. Switch to direct editing for all iterative refinement.
- **Visual verification from day one.** Set up headless screenshots (Playwright) before writing any UI code.
- **Explicit interface contracts prevent silent failures.** Document every shared global, every hook return value, every color hex.

## Demos Built With This Template

| Demo | Repo | What It Teaches |
|------|------|----------------|
| Agentic AI | *your-org/tutorial_agent* | GenAI → Agentic Loop → Multi-Agent → Compaction |
| MCP Protocol | *your-org/tutorial_mcp* | MCP boot sequence, tool discovery, chained tool calls |

## Tech Stack

- React 18 + ReactDOM 18 (CDN)
- Babel Standalone (in-browser JSX transpilation)
- Tailwind CSS (CDN)
- Zero build step, zero `node_modules`, zero server

## License

MIT
