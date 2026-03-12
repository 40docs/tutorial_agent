# Reference Implementation

This directory contains a complete, working glass box demo to use as a reference when building new demos. It's the MCP Protocol demo — the first demo built with this framework and the source of all reusable patterns.

## Files

| File | What It Is |
|------|-----------|
| `example-demo.html` | A complete 4,400-line glass box demo. Open in a browser to see the end result. Read the source to understand the section structure. |
| `example-build-spec.md` | The build spec used to create this demo — agent personas, responsibilities, interface contracts. Use as a template for your own BUILD-SPEC.md. |
| `example-architecture.md` | Deep dive into the architecture and patterns used. Explains the data model, component relationships, and design decisions. |

## How to Use This

### When starting a new demo

1. Open `example-demo.html` in your browser to understand the target experience
2. Read the source to see how the 4 sections work together:
   - Lines 46-1487: Simulation engine (constants, steps, payloads, hook)
   - Lines 1490-2063: Architecture diagrams (SVG, CompBox, FlowPacket)
   - Lines 2066-3004: Inspector panels (JSON viewer, context meter, message log)
   - Lines 3014-4404: App shell (chat, narrator, landing screen, layout)
3. Copy `inspector` and `app` patterns (70-80% reusable) into your new demo's `src/inspector.js` and `src/app.js`
4. Write fresh `src/simulation.js` (your steps and payloads) and `src/diagrams.js` (your SVG layouts)

### When debugging

If a component isn't working in your new demo, compare it against the reference implementation. The patterns here are known to work.

## This Directory Ships With the Template

When you create a new repo from the glass box template, this reference directory is included so you always have a working example to learn from — even before you've built your first demo.
