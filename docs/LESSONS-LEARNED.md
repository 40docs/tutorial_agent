# Glass Box Demos — Lessons Learned

Findings from building glass box demos with AI agent teams. These apply to any demo built with the section-file assembly pattern.

---

## What Worked

**Section-file assembly pattern.** Splitting a monolith into 4 `.js` files was the single best architectural decision. Benefits realized:
- Each file is independently editable (change SVG coordinates without re-reading 1,400 lines of step definitions)
- Reassembly is instant (`cat` takes <100ms vs. agent re-generating thousands of lines)
- Git diffs are scoped to the section that changed
- Multiple agents can write to separate files without merge conflicts
- A 3,400-line monolith became four files of 572-1,439 lines each — all within comfortable context window range

**Reference implementation.** Having an existing demo as a concrete pattern to port from was invaluable. Agents could read specific line ranges for structural patterns rather than inventing UI components from scratch. Future demos should always reference an existing demo's code directly.

**Headless visual verification.** Playwright + Chromium screenshots caught issues that were invisible from code review alone: SVG z-ordering, color contrast at reduced opacity, layout proportions, missing content. This should be set up BEFORE any UI work begins, not retrofitted after multiple rounds of blind editing.

---

## What Failed

**Single-agent monolith approach.** The first attempt used one agent to write the entire `index.html` (~6,000+ lines). It exhausted context, got stuck in loops, and produced nothing usable. The file was too large for one agent to hold in working memory while also reading reference material.

**Simultaneous agent launches.** All 4 agents running in parallel hit API rate limits. Some agents stalled entirely and had to be manually written. Stagger agent launches or accept that 2-3 concurrent agents is the practical limit.

**Implicit interface contracts.** Bugs from cross-section dependencies:
- `useSimulation()` returns both `currentStep` (object) and `currentStepIndex` (number). An agent destructured only `currentStep` and used it as an array index → step counter showed `[object Object]1/49`, StepNarrator returned null.
- `COLORS.user` was defined as grey (`border: #6b7280`) but the chat panel hardcoded user bubble as blue (`#1e3a5f`), which matched `COLORS.agents.bg` exactly → user and orchestrator bubbles were identical.
- SVG flow packet paths were defined as User→API (bypassing Harness visually) even though the messageFlow data said Harness→API.

**Lesson:** The interface contract must be explicit in the spec — every shared global, every hook return value, every color value — not left for agents to infer.

**No visual verification on day one.** The first 3-4 rounds of changes were made blind (edit code, hope it works). This wasted cycles on issues like:
- Nav buttons invisible (entire StepNarrator component returning null)
- Architecture diagram not filling its panel (SVG aspect ratio mismatch)
- Colors too muted at inactive opacity (grey border on dark background = invisible)

---

## Rules for Future Demos

1. **Always use section-file assembly.** No exceptions. Even a 500-line demo benefits from the edit-reassemble workflow.
2. **Set up Playwright screenshots before writing any UI code.** Not after the first bug. Before.
3. **Write the interface contract first.** Before any agent starts, document every shared global with its exact type, shape, and color values. Include the hook's full return signature.
4. **Use agents for initial generation only.** Once the scaffold exists, switch to direct editing. A human (or single agent) making targeted edits across files is 10x faster than coordinating 4 agents for a color change.
5. **Limit concurrent agents to 2-3.** Rate limits and coordination overhead make 4+ agents counterproductive unless the work is truly independent with zero shared state.
6. **Every SVG flow path must match its messageFlow data.** If `messageFlow.from` is `HARNESS`, the animated dot must visually start at the Harness box — not at User. Audit all paths against step definitions.
7. **Test colors at 35% opacity.** Inactive diagram components render at `opacity: 0.35`. A border color that looks fine at 100% may be invisible at 35%. Always verify against the `#0f172a` diagram background.
8. **Chat content should match narration.** If the narration says "the user pastes code," the chat bubble must show code (e.g., via `codeAttachment`). Empty or text-only bubbles that claim to contain code break trust in the demo.

---

## Assembly Process

After all section files are ready, combine them into the final `index.html`:

```bash
# Extract header (first 24 lines) and footer (last 3 lines) from existing index.html
head -24 index.html > /tmp/html_header.txt
tail -3 index.html > /tmp/html_footer.txt

# Concatenate sections in order
cat /tmp/html_header.txt \
    src/simulation.js \
    src/diagrams.js \
    src/inspector.js \
    src/app.js \
    /tmp/html_footer.txt > index.html
```

**Rules:**
- NEVER edit `index.html` directly — edit the section file, then reassemble
- ALWAYS reassemble after any section change before testing
- The header/footer rarely change — extract once and reuse
- Section files are pure JavaScript — no `<script>` tags, no HTML wrappers
- Load order matters: simulation.js defines globals, later files consume them

Or use the reusable `assemble.sh` script (included in each demo directory):

```bash
./assemble.sh
# → "Assembled: 3438 lines → index.html"
```
