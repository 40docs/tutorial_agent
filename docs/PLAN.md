# Agentic AI Glass Box Demo — Implementation Plan

## Context

The existing MCP Glass Box Demo (`tutorial_mcp/index.html`) is a single-file, zero-build React app that visualizes the MCP protocol step-by-step. We need to build a parallel demo that teaches the evolution from **GenAI → Agentic Loop → Multi-Agent → Compaction**, following the blueprint in `agent.md`. Same tech stack, same "glass box" philosophy — make the invisible mechanism visible.

---

## Target File

`/home/dev/projects/glassbox/tutorial_agent/index.html` — single self-contained HTML file (~5,500-7,000 lines).

## Tech Stack (identical to MCP demo)

- React 18, ReactDOM 18 (CDN)
- Babel Standalone (in-browser JSX)
- Tailwind CSS (CDN)
- No build step, no dependencies

---

## Architecture (mirroring MCP demo sections)

```
SECTION 1-5:  Simulation Engine (constants, codebase data, payloads, steps, useSimulation hook)
SECTION 6:    Architecture Diagrams (4 per-act SVG layouts)
SECTION 7:    Payload Inspector, Context Window Meter, Message Log
SECTION 8:    Chat Panel, Step Narrator, Act Transitions
SECTION 9:    Application Shell (Context provider, Layout, Keyboard, Landing)
```

---

## Color Scheme

| Concept | Color | Hex |
|---------|-------|-----|
| GenAI/API | Purple | #a855f7 |
| Harness/Host | Amber | #f59e0b |
| Tools | Green | #10b981 |
| Agents | Blue | #3b82f6 |
| Compaction | Orange | #f97316 |

---

## Shared Scenario (all 4 acts)

**Task:** "Analyze this codebase, identify a bug in the authentication module, and produce a fix."

**Simulated codebase:**
- `src/auth/auth.js` — contains the bug (line 47: `token.expiry < Date.now()` — seconds vs milliseconds)
- `src/auth/tokens.js` — stores expiry in seconds (`Math.floor(Date.now() / 1000)`)
- `src/middleware/authMiddleware.js` — calls validateToken
- `src/routes/userRoutes.js` — uses auth middleware
- `tests/auth.test.js` — passes incorrectly due to same bug

**Hidden detail for Act 4:** Line 92 of auth.js has a TODO about unimplemented refresh token logic — this gets compacted away.

---

## 4 Acts — Step Sequences (49 total steps)

### Act 1: Traditional GenAI (8 steps) — Purple accent

| # | Phase | Label | Key Visual |
|---|-------|-------|-----------|
| 1 | message | User Sends Code + Question | Request payload being built |
| 2 | api_call | API Request #1 | Single message, NO tools array, ~1,540 tokens |
| 3 | api_response | Model Responds | Text-only, stop_reason: "end_turn", incomplete guess |
| 4 | render | Render Response | Chat shows response; narrator: "it guessed" |
| 5 | message | User Asks Follow-Up | "Can you check tokens.js too?" |
| 6 | api_call | API Request #2 | 3 messages re-sent, token count jumps to ~2,430 |
| 7 | api_response | Model Can't Access | "I don't have access to tokens.js" |
| 8 | insight | Act 1 Summary | "There has to be a better way." |

**Diagram:** Simple linear: `[User] → [API/Model] → [User]`

### Act 2: The Agentic Loop (14 steps) — Amber accent

| # | Phase | Label | Key Visual |
|---|-------|-------|-----------|
| 1 | setup | Harness Initializes | Tools array shown: read_file, run_tests, write_file |
| 2 | message | User Submits Task | Same task, but now with tools |
| 3 | api_call | API Request #1 | Tools + messages, ~1,890 tokens |
| 4 | api_response | Model: tool_use (read_file auth.js) | stop_reason: "tool_use" highlighted |
| 5 | tool_execute | Harness Executes read_file | File contents returned, context grows to ~3,100 |
| 6 | api_response | Model: tool_use (read_file tokens.js) | Finds the seconds vs ms evidence |
| 7 | tool_execute | Harness Executes read_file | Context: ~4,300 |
| 8 | api_response | Model: tool_use (run_tests) | Runs tests |
| 9 | tool_execute | Harness Executes run_tests | Tests pass incorrectly, context: ~5,700 |
| 10 | api_response | Model: tool_use (write_file fix) | Writes the fix |
| 11 | tool_execute | Harness Executes write_file | Fix written |
| 12 | api_response | Model: tool_use (run_tests verify) | Verification run |
| 13 | tool_execute | Harness Executes run_tests | Tests reveal fixture issue |
| 14 | api_response | Model: end_turn | Final summary, 6 API calls, ~8,200 tokens |

**Diagram:** Feedback loop: `Harness → API/Model → [stop_reason?] → Tool Dispatch → Tools → back to Harness`

### Act 3: Multi-Agent Systems (16 steps) — Blue accent

| # | Phase | Label | Key Visual |
|---|-------|-------|-----------|
| 1 | orchestrator | Orchestrator Receives Task | System prompt + plan shown |
| 2 | orchestrator | Orchestrator Creates Plan | Breaks task: Explore → Build → Review |
| 3 | handoff | Handoff to Explorer | Explorer starts with read-only tools |
| 4 | explorer | Explorer: read_file auth.js | Context begins filling |
| 5 | explorer | Explorer: read_file tokens.js | Context: ~35% |
| 6 | explorer | Explorer: read_file middleware | Context: ~55% |
| 7 | explorer | Explorer: read more files + tests | Context: ~85% |
| 8 | explorer | Explorer Produces Handoff | 40,000 tokens → 300-token summary |
| 9 | handoff | Handoff to Builder | Builder starts with ~800 tokens (fresh!) |
| 10 | builder | Builder: write_file (fix) | Uses handoff instructions |
| 11 | builder | Builder: run_tests | Verifies |
| 12 | handoff | Handoff to Reviewer | Builder's patch sent to Reviewer |
| 13 | reviewer | Reviewer Evaluates | Fresh eyes, catches test fixture issue |
| 14 | reviewer | Reviewer Returns Notes | Sends back to Builder |
| 15 | builder | Builder Updates Test | Fixes test fixture too |
| 16 | insight | Act 3 Summary | Explorer 85% vs Builder 4% comparison |

**Diagram:** Pipeline: `Orchestrator → Explorer → [handoff] → Builder → [handoff] → Reviewer`. Each agent has mini context meter.

### Act 4: Compaction (11 steps) — Orange accent

| # | Phase | Label | Key Visual |
|---|-------|-------|-----------|
| 1 | setup | Agentic Loop Resumes | Single agent, tools, ~2,000 tokens |
| 2 | loop_run | Reading Files (montage) | Context: 15% → 30% → 45% |
| 3 | loop_run | More Exploration | Context: 55% → 65% → 68% |
| 4 | threshold | Context Reaches 70% | Threshold line crossed, warning flashes |
| 5 | compaction_trigger | Compaction Triggered | Raw context shown in "before" panel |
| 6 | compaction_run | Compaction Prompt Sent | Compaction instructions shown |
| 7 | compaction_result | Summary Returned | 140,000 → 3,500 tokens. Before/after |
| 8 | what_was_lost | What Was Lost | 3 items lost — refresh token TODO flagged |
| 9 | loop_resume | Loop Resumes | Agent continues from summary |
| 10 | audit_log | Audit Log Pattern | External storage concept shown |
| 11 | insight | Act 4 Summary | "Compaction is necessary. But every compaction is a bet." |

**Diagram:** Act 2 loop + Compaction Engine box (activates at threshold) + Audit Log (external storage)

---

## Key UI Components

### 1. Context Window Meter (NEW — not in MCP demo)
- Segmented progress bar: system prompt (purple), conversation (amber), tool results (green)
- Token count + percentage label
- 70% threshold line (visible in Act 4)
- Compaction animation (bar shrinks dramatically)

### 2. Payload Inspector (port from MCP demo, extend)
- JSON syntax highlighting with annotations on `tool_use`/`tool_result`
- Token count badge per payload
- Timeline of API calls (clickable)
- Act 3: agent label on each payload
- Act 4: before/after compaction diff view

### 3. Architecture Diagram (4 variants, SVG-based)
- Per-act layout switching
- Active component highlighting (glow), inactive dimming
- Animated flow packets along paths
- Act 3: mini context meters in agent boxes

### 4. Chat Panel (port from MCP demo, extend)
- Claude-style bubbles
- Tool call visualization with expandable args
- Agent avatar indicators (Act 3)
- Compaction marker (Act 4)

### 5. Step Narrator (port from MCP demo, extend)
- Act tabs with per-act accent colors
- Phase badges
- Rich narration text
- Playback controls: Back, Next, Play/Pause, Speed (0.5x/1x/2x)
- Keyboard shortcuts: arrows, 1-4, P, Esc

### 6. What Was Lost Panel (NEW — Act 4 only)
- Items from raw context not in compaction summary
- Risk assessment per item
- Refresh token TODO highlighted with warning

---

## Data Model

### Step Schema
```javascript
{
  id, act, phase, label,
  activeComponents: [],
  messageFlow: { from, to, type, label },
  message: { /* API payload JSON */ },
  narration: "...",
  stateMutations: { ... },
  chatUpdate: { role, content } | null,
  contextState: {
    systemPromptTokens, conversationTokens, toolResultTokens,
    totalTokens, percentUsed, breakdown: [{ label, tokens, color }]
  },
  activeAgent: null | 'orchestrator' | 'explorer' | 'builder' | 'reviewer',
  compactionData: null | { before, after, lost: [] }
}
```

### State
```javascript
{
  systemPhase, harnessState, apiCallCount, loopIteration, currentTool,
  activeAgent, orchestratorState, explorerState, builderState, reviewerState,
  compactionState,
  contextTokens, contextPercent, contextBreakdown
}
```

---

## Implementation Order

### Phase 1: Scaffolding
- HTML skeleton, CDN imports, global CSS (from MCP demo)
- Constants: COLORS, COMPONENT_IDS, ACT_METADATA
- SIMULATED_CODEBASE with all 5 fake files
- INITIAL_STATE

### Phase 2: Simulation Engine (CRITICAL PATH)
- All pre-built API payloads (Acts 1-4)
- All 49 step definitions with narrations
- `useSimulation()` hook (port from MCP demo, extend with contextState)

### Phase 3: Core UI Components
- ContextWindowMeter (new)
- PayloadInspector (port + extend)
- MessageLog (port + extend)
- ChatPanel (port + extend)
- StepNarrator (port + extend)

### Phase 4: Architecture Diagrams
- 4 per-act SVG layouts
- FlowPacket animation
- Act 3 mini context meters in agent boxes

### Phase 5: Act 4 Special Components
- WhatWasLostPanel
- Before/after compaction diff
- Compaction animation

### Phase 6: Application Shell
- LandingScreen, HeaderBar, App component
- Keyboard shortcuts
- SimulationContext provider

### Phase 7: Polish
- Test all 49 steps for correct narration, payloads, animations
- Verify token count consistency across acts
- Test navigation, auto-play, keyboard shortcuts

---

## Verification Checklist

1. Opens in browser with no errors, all CDN resources load
2. All 49 steps: narration present, diagram updates, chat correct, payload correct, context meter updates
3. Act transitions with overlay
4. Navigation: Previous/Next, act tabs, keyboard (arrows, 1-4, P, Esc), auto-play (0.5x/1x/2x)
5. **Act 1 Step 6**: Messages array has 3 entries (proves re-send)
6. **Act 2 Step 4**: stop_reason is "tool_use" (not "end_turn")
7. **Act 2 Step 14**: stop_reason is "end_turn", 6 API calls total
8. **Act 3 Step 8**: Handoff is ~300 tokens vs Explorer's ~40,000
9. **Act 3 Step 9**: Builder starts with dramatically less context
10. **Act 4 Step 7**: Token count drops from ~140,000 to ~3,500
11. **Act 4 Step 8**: Refresh token TODO appears in "What Was Lost"

---

## Critical Reference Files

- `tutorial_mcp/index.html` — primary reference implementation to port from
- `agent.md` — authoritative blueprint for all 4 acts, scenario, and content
- `tutorial_mcp/prompts/MCP-Demo-Build-Spec-agents.md` — build spec patterns
- `tutorial_mcp/README.md` — conventions to follow
