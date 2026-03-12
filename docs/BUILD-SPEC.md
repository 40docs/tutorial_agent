# Agentic AI Glass Box Demo — Build Specification

## Why Agent Teams Are Needed

This demo is a single HTML file (~6,000-7,000 lines) containing a complete React application with:
- A simulation engine with 49 pre-scripted steps, pre-built API payloads, and a state management hook
- 4 distinct SVG architecture diagrams with animations
- Developer-tools-style inspector panels with JSON syntax highlighting
- A chat interface, step narrator, and full application shell

**A single agent cannot build this reliably because:**
1. **Context window pressure** — The file exceeds what one agent can hold in working memory while also referencing the MCP demo patterns and the agent.md blueprint
2. **Independent concerns** — The simulation data, SVG diagrams, inspector UI, and app shell have clean boundaries and can be built in parallel
3. **Reference material is large** — The MCP demo (4,400 lines) and agent.md (1,000 lines) must both be read for patterns and content
4. **Combinatorial complexity** — 49 steps x (narration + payload + context state + chat update) = hundreds of interconnected data points that need internal consistency

**The solution:** 4 specialist agents, each responsible for one section, writing to separate files that get combined into the final `index.html`.

---

## Agent Team Structure

### Pre-Launch Setup

Before spawning agents, set up tmux for visibility:

```bash
# Create a tmux session with 4 panes
tmux new-session -d -s glassbox-build -n agents
tmux split-window -h -t glassbox-build:agents
tmux split-window -v -t glassbox-build:agents.0
tmux split-window -v -t glassbox-build:agents.1

# Label each pane (optional, for clarity)
tmux send-keys -t glassbox-build:agents.0 'echo "=== Agent A: Simulation Engine ==="' Enter
tmux send-keys -t glassbox-build:agents.1 'echo "=== Agent B: Architecture Diagrams ==="' Enter
tmux send-keys -t glassbox-build:agents.2 'echo "=== Agent C: Inspector + Context Meter ==="' Enter
tmux send-keys -t glassbox-build:agents.3 'echo "=== Agent D: Chat + Narrator + App Shell ==="' Enter

# Tail each agent's output file in its pane (once agents are launched)
# tmux send-keys -t glassbox-build:agents.0 'tail -f /tmp/agent-a.output' Enter
# ... etc
```

---

## Agent A: Simulation Engine Architect

**File:** `src/simulation.js`
**Persona:** You are a data architect who builds the complete simulation data layer. You are meticulous about internal consistency — token counts must tell a coherent story, API payloads must be technically accurate, and every step must have meaningful educational narration.

**Responsibilities:**
1. Define all constants: COLORS, COMPONENT_IDS, ACT_METADATA
2. Write the SIMULATED_CODEBASE (5 realistic JavaScript files, 30-50 lines each)
3. Build TOOL_DEFINITIONS in Anthropic API format (read_file, run_tests, write_file)
4. Build all pre-built API payloads for all 4 acts (request/response pairs with realistic token counts)
5. Define all 49 STEPS with: id, act, phase, label, activeComponents, messageFlow, message, narration, stateMutations, chatUpdate, contextState, activeAgent, compactionData
6. Implement ACT_OFFSETS, ACT_LENGTHS helpers
7. Define INITIAL_STATE
8. Implement the `useSimulation()` hook following the MCP demo pattern (lines 1265-1472)

**Reference files to read:**
- `/home/dev/projects/glassbox/tutorial_mcp/index.html` (lines 46-1487) — simulation engine patterns
- `/home/dev/projects/glassbox/agent.md` — content blueprint for all 4 acts

**Critical constraints:**
- Token counts must be internally consistent and grow realistically across steps
- Act 1: ~700 → ~2,430 tokens (slow growth, no tools)
- Act 2: ~1,890 → ~8,200 tokens (faster growth with tool results)
- Act 3: Explorer fills to ~85% (~170,000), Builder starts fresh at ~800
- Act 4: grows to ~140,000, drops to ~3,500 after compaction
- Every step MUST have narration text that teaches concepts from agent.md
- API payloads must use model `claude-sonnet-4-6` and match real Anthropic Messages API format
- The simulated codebase bug must be technically accurate (seconds vs milliseconds comparison)

**Output format:** Pure JavaScript, no HTML wrapper. Starts with `const { useState, useCallback, useEffect, useRef, useMemo } = React;`

---

## Agent B: Architecture Diagram Animator

**File:** `src/diagrams.js`
**Persona:** You are an SVG visualization specialist. You create clean, animated diagrams that make complex architectures intuitive. You follow the MCP demo's visual patterns exactly — CompBox, FlowPacket, glow filters, opacity management — but create 4 entirely different layouts.

**Responsibilities:**
1. Define per-act layout constants (COMP_RECTS, COMP_META, STATIC_LINES, FLOW_PATHS for each act)
2. Implement CompBox sub-component (rect + labels + state badge + glow)
3. Implement FlowPacket sub-component (animated dot with animateMotion)
4. Implement MiniContextMeter sub-component (NEW — for Act 3 agent boxes)
5. Implement 4 per-act diagram layouts:
   - Act 1: Simple `[User] → [API/Model] → [User]` linear flow
   - Act 2: Feedback loop with Harness, API/Model, decision diamond, Tool Dispatch, 3 tool boxes
   - Act 3: Pipeline with Orchestrator, Explorer/Builder/Reviewer, mini context meters, handoff edges
   - Act 4: Act 2 loop + Compaction Engine + Audit Log
6. Implement the main `ArchitectureDiagram` component that switches layout based on `currentAct`

**Reference files to read:**
- `/home/dev/projects/glassbox/tutorial_mcp/index.html` (lines 1490-2063) — SVG diagram patterns

**Critical constraints:**
- Dark theme (#1a1a2e SVG background)
- Active components glow (opacity 1.0), inactive dim (0.4), hidden fade (0.08)
- FlowPacket animations must use unique keys to restart on step change
- All SVG viewBoxes must be properly sized for responsive display
- Include dot grid background and legend
- Assumes COLORS and C (COMPONENT_IDS) are defined globally by Agent A

**Output format:** Pure JavaScript, no HTML wrapper. Exports `ArchitectureDiagram` as a function component.

---

## Agent C: Message Inspector & Context Meter

**File:** `src/inspector.js`
**Persona:** You are a developer-tools UI specialist. You build the panels that let users inspect every payload, monitor context usage, and see what information was lost during compaction. Your panels are the "truth layer" of the demo.

**Responsibilities:**
1. Define shared constants (MONO_FONT, SYNTAX colors, PANEL_BG, PANEL_BORDER)
2. Implement ContextWindowMeter component (NEW):
   - Segmented progress bar with per-type coloring
   - Token count labels
   - 70% threshold line for Act 4
   - Compaction animation (dramatic shrink)
3. Implement JsonNode component (recursive JSON renderer with syntax highlighting, collapsible nodes)
4. Implement PayloadInspector component (JSON viewer with annotations, copy button, diff mode)
5. Implement WhatWasLostPanel component (NEW — Act 4, shows items lost in compaction)
6. Implement CompactionDiffView component (NEW — before/after token comparison)
7. Implement MessageLog component (chronological message list with color coding)
8. Implement getMessageDisplayInfo helper function

**Reference files to read:**
- `/home/dev/projects/glassbox/tutorial_mcp/index.html` (lines 2066-3004) — inspector patterns

**Critical constraints:**
- JsonNode must handle all JSON types (null, boolean, number, string, array, object)
- Strings truncated at 120 chars
- Collapsible at depth > 2
- Annotations: tool_use = orange "Model requesting tool call", tool_result = green "Injected by harness"
- Context meter max = 200,000 tokens
- WhatWasLostPanel must highlight the refresh token TODO as high-risk
- Assumes COLORS is defined globally by Agent A

**Output format:** Pure JavaScript, no HTML wrapper.

---

## Agent D: Chat Interface & Application Shell

**File:** `src/app.js`
**Persona:** You are a UI/UX engineer who builds the interactive shell that ties everything together. You create the chat interface, step narrator, act transitions, landing screen, and the main App layout. You ensure the user can navigate the demo intuitively with both mouse and keyboard.

**Responsibilities:**
1. Implement ChatPanel (Claude-style bubbles, tool call visualization, agent labels for Act 3, compaction markers for Act 4)
2. Implement StepNarrator (act tabs with accent colors, phase badges, narration text with keyword highlighting, playback controls, speed selector)
3. Implement ActTransition overlay (shown when switching acts)
4. Implement LandingScreen (title, description, start button, skip-to-act buttons)
5. Implement HeaderBar (title, progress bar, current act label)
6. Create SimulationContext (React Context wrapping useSimulation)
7. Implement App component (layout, keyboard shortcuts, act change detection)
8. Add ReactDOM.createRoot render call

**Reference files to read:**
- `/home/dev/projects/glassbox/tutorial_mcp/index.html` (lines 3014-4404) — chat, narrator, app shell patterns

**Critical constraints:**
- Act tab accent colors: Act 1 purple (#a855f7), Act 2 amber (#f59e0b), Act 3 blue (#3b82f6), Act 4 orange (#f97316)
- Keyboard shortcuts: arrows (prev/next), 1-4 (jump to act), P (toggle play), Esc (reset)
- Layout must use CSS grid/flexbox, full viewport height
- Auto-scroll chat to latest message
- Narration text should bold key terms: tool_use, tool_result, end_turn, stop_reason, context window, harness, compaction, etc.
- Assumes all other components (ArchitectureDiagram, ContextWindowMeter, PayloadInspector, MessageLog, WhatWasLostPanel) are defined globally
- Must include the final ReactDOM render call

**Output format:** Pure JavaScript, no HTML wrapper. Ends with `ReactDOM.createRoot(document.getElementById('root')).render(<App />);`

---

## Verification Checklist

After assembly:
1. Opens in browser with no console errors
2. All 49 steps navigable with Next/Back
3. All 4 act tabs work
4. Architecture diagram changes per act
5. Context meter updates every step
6. Payload inspector shows correct JSON
7. Chat panel accumulates messages
8. Keyboard shortcuts work
9. Auto-play works at all 3 speeds
10. Act transitions show overlay
11. Act 1 Step 6: messages array has 3 entries
12. Act 2 Step 4: stop_reason is "tool_use"
13. Act 3 Step 8: handoff is ~300 tokens vs Explorer's ~40,000
14. Act 4 Step 7: token count drops from ~140,000 to ~3,500
15. Act 4 Step 8: refresh token TODO appears in "What Was Lost"

---

> **Lessons learned and the assembly process are documented in the [Glass Box template repo](https://github.com/your-org/glassbox)** — they apply to all demos, not just this one. See the template's `docs/LESSONS-LEARNED.md`.
