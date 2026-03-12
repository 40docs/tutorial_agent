gentic AI Interactive Demo — Blueprint
### A Technical Design Document for a 4-Act Educational Experience

---

## Purpose

This document is the authoritative design reference for building an interactive demo that teaches the evolution from traditional Generative AI through Agentic AI systems. It covers not just the conceptual narrative but the precise mechanical reality of each approach — what is actually happening at the API level, what the user should see, what the demo should expose, and where the meaningful transitions occur.

The four acts are:

1. **GenAI** — Single-shot API call with no agency
2. **Agentic Loop** — Iterative feedback cycle with tool use
3. **Multi-Agent System** — Specialized agents with handoffs
4. **Compaction** — Context management and its tradeoffs

Each act builds on the last. The demo should make the scaffolding visible — the goal is not just to show results but to show *mechanism*.

---

## Global Demo Architecture

Before the acts, establish some shared infrastructure that appears throughout.

### The Payload Inspector
Every act should have a persistent panel or drawer that shows:
- The **full API request payload** being sent (formatted JSON)
- The **full API response** received
- **Token counts**: prompt tokens, completion tokens, total tokens, percentage of context window used
- A **timeline** of calls made so far in the current act

This is the backbone of the demo. Users should always be able to see exactly what is going into the model and what is coming out.

### The Context Window Meter
A persistent visual element — a progress bar or fill gauge — that shows how much of the context window is currently occupied. This becomes critical in Acts 2, 3, and 4.

### Shared Scenario
All four acts should use the **same underlying task** so the comparison is apples-to-apples. Recommended scenario:

> **"Analyze this codebase, identify a bug in the authentication module, and produce a fix."**

This scenario is ideal because:
- It's a real, recognizable task
- It has clear sub-phases: explore, diagnose, build
- It naturally strains a single context window
- It makes the value of multi-agent handoffs intuitive

---

---

# ACT 1: Traditional GenAI

## Conceptual Frame

Traditional GenAI is a **pure function**. Input goes in, output comes out. The model is stateless. It has no tools, no memory, no loop. It cannot take action in the world. It can only process what it was given and return text.

This is powerful and useful for a huge range of tasks — but it has hard structural limits that aren't about intelligence. They're about *architecture*.

## What Actually Happens at the API Level

A single call to the Anthropic (or any LLM) API looks like this:

```json
POST https://api.anthropic.com/v1/messages

{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": "You are a senior software engineer. Analyze code and answer questions.",
  "messages": [
    {
      "role": "user",
      "content": "Here is an authentication module. Find any bugs and suggest a fix.\n\n[CODE PASTED HERE]"
    }
  ]
}
```

And the response:

```json
{
  "id": "msg_01XFDUDYJgAACTvkgnv5XDZW",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Looking at this authentication module, I can see a potential issue with the token validation logic on line 47..."
    }
  ],
  "model": "claude-sonnet-4-6",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 892,
    "output_tokens": 347
  }
}
```

That's it. The entire interaction is one HTTP request and one HTTP response. Nothing persists. Nothing loops. The model receives the payload, runs inference once, and returns text.

## The Full Message Array — What's In It

The `messages` array is the entirety of what the model "knows." It is assembled fresh on every call. For a traditional conversation it accumulates like this:

```json
"messages": [
  { "role": "user",      "content": "First question" },
  { "role": "assistant", "content": "First answer" },
  { "role": "user",      "content": "Follow-up question" },
  { "role": "assistant", "content": "Follow-up answer" },
  { "role": "user",      "content": "Current question" }
]
```

The model does not "remember" turn 1 when processing turn 3. Turn 1 is re-sent in the payload. What feels like memory is just the calling application re-packaging the full history into each new request. The model always reads a transcript, never a memory.

## The System Prompt

The `system` field (or system turn) is not special to the model at inference time — it's just a high-priority portion of the context that appears before the conversation. It sets tone, role, constraints, and context. It consumes tokens the same way any other content does.

## What the Context Window Actually Is

The **context window** is the maximum total number of tokens that can appear in a single API call — the sum of:

- System prompt tokens
- All user turns
- All assistant turns
- Any code, documents, or data pasted in

Every token that exists in the payload competes for space in this fixed window. As of 2025, frontier models have windows in the range of 100k–200k+ tokens (roughly 75k–150k words). This sounds large, but:

- A mid-sized codebase can be 50k–200k tokens
- A long agentic run with tool results accumulates quickly
- The full history of a multi-turn conversation grows linearly

When the window is exceeded, the API returns an error. The calling application must handle this — typically by truncating, summarizing, or dropping old content.

## Where GenAI Succeeds

For well-bounded tasks with all necessary context available, GenAI is excellent:
- Answering questions about provided content
- Writing, summarizing, translating
- Explaining or generating code from a clear specification
- Single-shot analysis tasks

## Where GenAI Structurally Fails

These are not limitations of model intelligence. They are architectural limits:

| Failure Mode | Root Cause |
|---|---|
| Cannot look up missing information | No tool access; can only use what's in the prompt |
| Cannot verify its own output | No ability to run code or test against reality |
| Cannot handle tasks larger than the window | Fixed payload size; no external memory |
| Cannot self-correct | No loop; one response is the final answer |
| Hallucination under uncertainty | No mechanism to say "let me check"; must respond from training |
| No persistence between sessions | Stateless; each new session starts from zero |
| Cannot take action | Output is text only; no side effects |

The deepest failure: **the model must answer even when it shouldn't**. It has no mechanism to pause, go find information, try something, see if it worked, and come back. It either knows it from training/context or it guesses.

## Demo UI for Act 1

**Layout:**
- Left panel: Chat interface. User types a prompt.
- Right panel: Payload inspector showing the request and response JSON.
- Top: Context window meter (fills based on input tokens).

**Interactive Demo Flow:**
1. User pastes in a chunk of code and asks "find the bug."
2. Model responds with an answer.
3. Payload inspector shows the request — a single messages array with just that one exchange.
4. User asks a follow-up. Payload inspector now shows the array has grown — both turns are re-sent.
5. User pastes in a much larger codebase. The context meter fills dramatically.
6. Optionally: let the user overflow the window to see the error.

**What to highlight:**
- The re-sending of full history on every call (show the token count jump on turn 2)
- That the model had to guess at some aspects because the right file wasn't in context
- That the model can't verify if its fix would actually compile

**The "aha" moment:**
> "This model gave us an answer. But it couldn't check if the answer was right. It couldn't look at the file it needed. And if the codebase was any bigger, we'd have run out of space just loading it. There has to be a better way."

---

---

# ACT 2: The Agentic Loop

## Conceptual Frame

The agentic loop solves the "one shot" problem by wrapping the model in a **feedback cycle**. Instead of: send prompt → get answer → done, you get: send prompt → get plan → execute action → observe result → send new prompt with result → repeat.

The model is now inside a loop. Its outputs are not just text for humans — they are **instructions for systems**. When the model says "call this tool," something actually happens. The result comes back. The model sees what happened and decides what to do next.

This is the first time the model can be **wrong and recover**. It can try something, see it failed, and try a different approach. This is qualitatively different from single-shot generation.

## The Tool Use Mechanism — Exactly How It Works

Tool use (also called function calling) is a structured contract between the calling application and the model. The application declares available tools in the API request. The model decides when to use them. The application executes them and feeds results back.

### Step 1: Declare Tools in the Request

```json
POST https://api.anthropic.com/v1/messages

{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "tools": [
    {
      "name": "read_file",
      "description": "Read the contents of a file from the codebase",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "The file path to read"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "run_tests",
      "description": "Execute the test suite and return results",
      "input_schema": {
        "type": "object",
        "properties": {
          "target": {
            "type": "string",
            "description": "Optional specific test file or module to run"
          }
        },
        "required": []
      }
    },
    {
      "name": "write_file",
      "description": "Write or overwrite a file with new content",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "content": { "type": "string" }
        },
        "required": ["path", "content"]
      }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "The authentication module has a bug. Find it and fix it."
    }
  ]
}
```

### Step 2: Model Returns a Tool Call (Not Text)

The model's response contains a `tool_use` block instead of (or in addition to) a text block:

```json
{
  "id": "msg_02abc",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll start by reading the authentication module to understand its structure."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A",
      "name": "read_file",
      "input": {
        "path": "src/auth/auth.js"
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

Note the `stop_reason: "tool_use"` — the model has stopped generating and is waiting for the tool result. **The harness must now execute the tool.**

### Step 3: The Harness Executes the Tool

The harness parses the `tool_use` block, calls the actual function (reads the file, runs the test, calls the API, etc.), and gets a result.

### Step 4: The Harness Appends the Tool Result and Calls Again

The harness adds the model's response AND the tool result to the messages array, then makes another API call:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "The authentication module has a bug. Find it and fix it."
    },
    {
      "role": "assistant",
      "content": [
        { "type": "text", "text": "I'll start by reading the authentication module." },
        { "type": "tool_use", "id": "toolu_01A", "name": "read_file", "input": { "path": "src/auth/auth.js" } }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01A",
          "content": "const validateToken = (token) => {\n  if (token.expiry < Date.now()) {\n    return false;\n  }\n  return jwt.verify(token.value, SECRET);\n};"
        }
      ]
    }
  ]
}
```

The model now sees the file contents and generates the next step — maybe call another tool, maybe write the fix, or maybe just respond.

### Step 5: Repeat Until `stop_reason: "end_turn"`

The loop continues until the model returns `stop_reason: "end_turn"`, which means it has completed its task and is returning a final response to the user.

## The Full Agentic Loop Flow

```
HARNESS STARTS LOOP
│
├─► Build messages array (system + goal + history)
├─► POST to /v1/messages
│
│   ◄── Response: tool_use block
│
├─► Parse tool call
├─► Execute tool (real side effect)
├─► Append tool result to messages
│
├─► POST to /v1/messages again
│
│   ◄── Response: another tool_use
│
├─► (repeat...)
│
│   ◄── Response: end_turn
│
└─► Return final output to user
```

## What the Harness Actually Is

The harness is the application code that manages this loop. At minimum it must handle:

**Loop management:**
- Starting and stopping the loop
- Detecting `stop_reason` values (`tool_use` means continue, `end_turn` means done, `max_tokens` means truncated)
- Maximum iteration limits to prevent infinite loops

**Tool dispatch:**
- Parsing tool call names and inputs from the response
- Routing each tool name to the actual function
- Catching and handling tool execution errors
- Formatting results back into `tool_result` blocks

**Context management:**
- Appending each assistant turn and tool result to the growing messages array
- Monitoring total token count
- Triggering compaction or truncation when approaching limits

**Error handling:**
- What to do when a tool fails (retry? tell the model? abort?)
- What to do when the model makes a malformed tool call
- What to do when the model loops without making progress

## How Context Grows in an Agentic Loop

This is critical to understand. Every iteration of the loop adds to the messages array:

| Loop Iteration | What Gets Added | Cumulative Token Count |
|---|---|---|
| 0 (initial) | System prompt + user goal | ~500 |
| 1 | Model's first response + tool call | ~800 |
| 1 result | Tool result (file contents) | ~1,800 |
| 2 | Model analysis + second tool call | ~2,200 |
| 2 result | Test output | ~2,600 |
| 3 | Model's fix + write_file call | ~3,400 |
| 3 result | Write confirmation | ~3,500 |
| 4 | Model's final summary | ~3,900 |

After just 4 tool calls, the context is nearly 4x larger than the initial prompt. After 20 tool calls exploring a large codebase, it can be enormous.

**The history cannot be selectively discarded.** The model needs to see what it has already done to avoid repeating itself and to build on prior findings. Dropping old tool results risks the model re-exploring things it already explored or losing crucial information.

## Where the Agentic Loop Succeeds

- **Self-correction:** Model runs tests, sees failures, revises its fix, tests again
- **Discovery:** Model can navigate an unknown codebase rather than needing it all pre-loaded
- **Verification:** Claims can be grounded in reality (run the code; see if it works)
- **Long-horizon tasks:** Distribute work across many iterations rather than one overloaded prompt

## Where the Agentic Loop Fails or Strains

| Failure Mode | Root Cause |
|---|---|
| Context exhaustion on long runs | Every iteration grows the window |
| Compounding errors | A wrong assumption in step 2 becomes the foundation for step 5 |
| Cost multiplication | Each iteration is a full billable API call re-sending all prior context |
| Stuck loops | Model can confidently repeat the same wrong approach without external intervention |
| Latency | A 20-step loop is 20 sequential API calls with no parallelism |
| Cognitive overload | A single agent doing exploration + analysis + writing is doing too much at once |

The last point is where multi-agent systems enter.

## Demo UI for Act 2

**Layout:**
- Left panel: A visualization of the loop — each step appears as a node in a vertical chain
- Center: The "workspace" — shows what files have been read, what tools were called
- Right panel: Payload inspector, now more dynamic — a timeline of calls with a dropdown to inspect any individual call's full payload
- Top: Context window meter, now visibly growing with each step

**Interactive Demo Flow:**
1. User submits the same bug-finding task as Act 1
2. The loop visualization begins — first node shows the model's initial plan
3. Each tool call is shown as an action: "Reading auth.js..." with the file path visible
4. Tool results appear in the chain
5. User can click any node to open the full payload inspector for that specific call
6. Context meter grows visibly with each step
7. Demo reaches a natural endpoint (bug found, fix written, tests pass)

**What to highlight:**
- The `stop_reason: "tool_use"` vs `"end_turn"` distinction
- The growing messages array — show token count at each step
- The model correcting itself (if tests fail, it revises)
- The moment where the context window is starting to stress

**The "aha" moment:**
> "The model found the bug by actually reading the files it needed. It ran the tests and saw they failed. It revised the fix. It verified. But look at this context window — after exploring just 5 files, we've used 40% of our space. What if the codebase had 500 files? We'd be out of room before we even knew where the bug was."

---

---

# ACT 3: Multi-Agent Systems

## Conceptual Frame

A single agentic loop has one fundamental bottleneck: **one context window doing all the work**. When a task requires both breadth (exploring a large space) and depth (doing precise work within that space), a single agent must compromise. It either runs out of room, or dilutes its attention.

Multi-agent systems solve this through **division of cognitive labor**. Different agents are given different jobs, each gets its own fresh context, and they communicate through structured handoffs rather than shared memory.

This isn't just an optimization — it's a different architecture.

## The Core Problem: Breadth vs. Depth in a Fixed Window

Consider the codebase task:

**Phase 1 — Exploration:**
The agent needs to read many files, understand module relationships, trace data flows, build a mental map of the architecture. This is wide, messy, accumulative work. By the time an agent understands a large codebase, its context is filled with:
- File listings
- File contents (many files)
- Dead ends and irrelevant findings
- Navigation traces

**Phase 2 — Construction:**
The agent needs to write precise, correct code that integrates with the existing architecture. This is narrow, careful, exact work. It needs:
- A clear specification of the change
- Relevant context about the affected modules
- Room to think carefully and produce high-quality output

**The incompatibility:** The context that was necessary for Phase 1 (broad exploration) is largely noise during Phase 2 (precise construction). An agent that did both accumulates so much context in Phase 1 that it has little working space left for Phase 2.

## The Multi-Agent Solution: Summarize Across the Boundary

```
EXPLORER AGENT                    BUILDER AGENT
┌─────────────────────┐           ┌──────────────────────┐
│ Context: Full        │           │ Context: Fresh        │
│                      │           │                       │
│ - System prompt      │           │ - System prompt       │
│ - Goal              │           │ - Goal                │
│ - File: auth.js     │           │ - SUMMARY from        │
│ - File: tokens.js   │   ──────► │   Explorer (compact)  │
│ - File: middleware  │  handoff  │                       │
│ - File: routes.js   │           │ [80% of window free   │
│ - Tool results x20  │           │  for building]        │
│ - Dead ends...      │           │                       │
│                      │           │                       │
│ [Context: 85% full] │           └──────────────────────┘
└─────────────────────┘
         │
         │ Compaction/Summarization
         ▼
┌─────────────────────┐
│ HANDOFF DOCUMENT    │
│                     │
│ "Auth bug is in     │
│ validateToken().    │
│ Line 47 compares    │
│ expiry incorrectly. │
│ Affected files:     │
│ auth.js, tokens.js  │
│ Fix approach: ..."  │
└─────────────────────┘
```

The Explorer's dense, messy context produces a **small, information-rich summary**. The Builder receives only that summary — not the Explorer's full history. The Builder starts fresh.

## Multi-Agent Communication Patterns

Agents in a team don't share memory. They communicate through messages, the same way the model communicates with users. There are several common patterns:

### Pattern 1: Sequential Handoff (Pipeline)
Each agent completes its work and passes a summary to the next.

```
Explorer → [summary] → Analyzer → [diagnosis] → Builder → [patch] → Reviewer
```

Best for: linear tasks with clear phases
Risk: errors propagate forward; late-stage agents inherit early-stage mistakes

### Pattern 2: Orchestrator / Worker
A central orchestrator agent breaks down a goal and dispatches sub-tasks to specialist agents. Workers return results to the orchestrator, which synthesizes and decides next steps.

```
                    ORCHESTRATOR
                   /     |      \
            Worker 1  Worker 2  Worker 3
           (explore)  (search)  (analyze)
                   \     |      /
                    ORCHESTRATOR
                        │
                    Final synthesis
```

Best for: tasks that can be parallelized, or where the orchestrator needs to route dynamically based on results
Risk: orchestrator itself can become a bottleneck; it needs enough context to manage all worker outputs

### Pattern 3: Critic / Verifier Layer
After a Builder produces output, a separate Critic agent reviews it with fresh eyes — no attachment to the construction choices, no accumulated context bias.

```
Builder → [output] → Critic → [pass/fail + notes] → Builder (revision)
```

Best for: quality-sensitive tasks where self-review is insufficient
Key insight: The critic's fresh context means it evaluates the output on its own merits, not filtered through the same reasoning path the Builder used

### Pattern 4: Parallel Exploration
Multiple Explorer agents investigate different parts of the codebase simultaneously, then a Synthesizer agent receives all their summaries and produces a unified view.

```
Explorer A (auth/)  ─────────────┐
Explorer B (tokens/)  ──────────►  Synthesizer → Builder
Explorer C (middleware/)  ───────┘
```

Best for: large codebases where serial exploration would be too slow or too context-heavy
Risk: Synthesizer must receive all summaries coherently; if summaries conflict, it must reconcile

## What an Individual Agent Actually Is

From an implementation standpoint, each "agent" is:

1. **A system prompt** — defines the agent's role, expertise, constraints, and output format
2. **A tool set** — the specific tools this agent has access to (an Explorer might have read-only tools; a Builder gets write access)
3. **An initial message** — the task or handoff document it receives
4. **A harness instance** — the loop that drives it until it's done
5. **An output** — typically a structured artifact (a summary, a diagnosis, a code change, a review)

Agents are not fundamentally different from a single-agent setup. They are just **scoped, purposeful instances** of the same agentic loop mechanism, coordinated by an orchestrator or a pipeline.

## The Handoff Document — What It Contains and Why It Matters

The handoff document is the compacted context that travels between agents. It is the most important artifact in a multi-agent pipeline. A poorly written handoff document degrades every subsequent agent that receives it.

A good handoff document for the codebase task would include:

```markdown
## Codebase Exploration Summary

**Task:** Find and fix the authentication bug

**Architecture Overview:**
The auth system uses JWT tokens stored in Redis. Three modules are involved:
- `src/auth/auth.js` — main validation logic (PRIMARY)
- `src/tokens/tokens.js` — token generation and storage
- `src/middleware/authMiddleware.js` — request interceptor

**Bug Located:**
In `auth.js`, line 47, the `validateToken()` function compares:
  `token.expiry < Date.now()`
This is WRONG. `token.expiry` is stored as a Unix timestamp in SECONDS.
`Date.now()` returns milliseconds. The comparison always evaluates true,
meaning all tokens appear expired immediately.

**Fix Required:**
Change comparison to: `token.expiry * 1000 < Date.now()`
Or alternatively: `token.expiry < Math.floor(Date.now() / 1000)`

**Affected Test:**
`tests/auth.test.js` line 23 — this test currently passes incorrectly because
it uses the same flawed comparison in the test fixture.

**Files the Builder Should Access:**
1. `src/auth/auth.js` — make the fix here
2. `tests/auth.test.js` — update test fixture
3. No other files require changes.

**Files the Builder Does NOT Need:**
Everything else. The bug is isolated.
```

This document is perhaps 300 tokens. The Explorer's raw context that produced it might be 40,000 tokens. **The Builder receives 0.75% of the original context and has everything it needs.**

## The Orchestrator's Role

The orchestrator doesn't do domain work — it does **coordination work**. Its context contains:
- The original goal
- The current state of the plan
- Summaries of what each worker has returned
- Decisions about what to do next

The orchestrator must be careful not to accumulate too much raw content. It should receive summaries from workers, not full outputs. If an orchestrator starts accumulating full file contents or long logs, it faces the same context pressure as a single agent.

## Where Multi-Agent Systems Succeed

- Parallel workloads (multiple explorers run simultaneously)
- Separation of concerns (fresh-context critic catches things a tired builder misses)
- Scale (tasks too large for one context window become tractable)
- Specialization (each agent's system prompt and toolset is purpose-fit)
- Cost efficiency (workers with smaller, focused contexts are cheaper per call)

## Where Multi-Agent Systems Strain

| Challenge | Description |
|---|---|
| Handoff quality determines everything | A bad summary from Explorer ruins Builder's work |
| Error laundering | Mistakes made early get baked into summaries as fact |
| Orchestration overhead | More agents = more calls = more latency and cost |
| Debugging complexity | When the pipeline fails, which agent is at fault? |
| Trust between agents | Should Builder trust Explorer's claim that only 2 files need changes? |
| No shared ground truth | Agents can diverge in their understanding of the same codebase |

## Demo UI for Act 3

**Layout:**
- Center: A visual pipeline diagram showing agents as nodes connected by edges
- Each agent node: shows its role, its current status (idle / running / done), and its context fill level
- Clicking an agent: opens its payload inspector (all its calls, its system prompt, its tool set)
- Clicking an edge between agents: shows the handoff document that was passed
- A "compare" view: side-by-side of Explorer's context vs. Builder's context, showing the token count difference

**Interactive Demo Flow:**
1. The same bug-fixing task is submitted
2. Orchestrator appears first — it breaks the task into subtasks, visually
3. Explorer agent activates — its context meter fills as it reads files
4. Explorer produces a handoff document — show the summarization happening
5. Handoff edge lights up — document travels to Builder
6. Builder activates — starts with small context, grows only as it works
7. Builder produces the fix, hands to Reviewer
8. Reviewer gives thumbs up / or sends back with notes
9. Final result delivered

**What to highlight:**
- The contrast in context fill between Explorer (full) and Builder (starts fresh)
- The handoff document in isolation — show its token count vs. the Explorer's total
- The Reviewer catching something the Builder didn't notice (demonstrate fresh perspective value)

**The "aha" moment:**
> "The Explorer used 85% of its context window just understanding the codebase. But the Builder only received a 300-token summary. The Builder had almost its entire context free for precise work. Each agent was doing one thing, with the right amount of information. No agent was overwhelmed."

---

---

# ACT 4: Compaction

## Conceptual Frame

Compaction is the mechanism that makes long-running agentic systems viable. Without it, every agentic loop would eventually hit the context ceiling and stop. With it, the system can run indefinitely — but not without cost.

Compaction is not just a technical operation. It is a **decision with consequences**. Every compaction is an act of editorial judgment: what is important enough to carry forward, and what can be discarded? That judgment is made under uncertainty, by a model that cannot know what will matter later.

Understanding compaction means understanding both its power and its risks.

## What Compaction Is, Precisely

Compaction is the process of replacing a large, raw context with a smaller representation that preserves the meaningful signal.

In its simplest form, it's a model summarization call:

```json
{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Below is the full history of an agent working on a coding task. 
      Produce a dense summary that captures: what has been done, what was found, 
      what decisions were made, and what still needs to happen. Preserve any 
      specific file paths, line numbers, error messages, or technical details 
      that will be needed to continue the work.\n\n[FULL HISTORY HERE]"
    }
  ]
}
```

The output replaces the history in the messages array. The next iteration of the loop starts with a clean context that contains just the summary — not the thousands of tokens of raw history.

## The Three Forms of Compaction

### 1. Mid-Run Compaction (Triggered by Threshold)

The harness monitors token count. When it approaches a threshold (e.g., 70% of the context window), it pauses the agentic loop and runs a compaction pass.

```
LOOP RUNNING
│
├─► Step 12: context = 68,000 tokens
├─► Step 13: context = 73,000 tokens  ← threshold crossed
│
├─► [HARNESS PAUSES LOOP]
├─► Sends compaction request to model
├─► Receives 3,000-token summary
├─► REPLACES history with summary
│   context is now 3,500 tokens (summary + system prompt)
│
├─► [HARNESS RESUMES LOOP]
├─► Step 14: runs with 3,500 token context
│
```

The loop continues from where it left off, but the detailed history of how it got there is gone.

### 2. Handoff Compaction (Between Agents)

As described in Act 3, the Explorer produces a summary before passing context to the Builder. This is compaction in service of agent handoff. The Explorer agent may explicitly run a summarization step as its final action:

```json
{
  "type": "tool_use",
  "name": "produce_handoff_summary",
  "input": {
    "recipient": "builder_agent",
    "include": ["bug_location", "affected_files", "fix_approach", "test_notes"],
    "exclude": ["exploration_traces", "dead_ends", "raw_file_contents"]
  }
}
```

### 3. Rolling Summary (Continuous Compaction)

Some systems maintain a running summary that is updated after each step. Rather than accumulating raw history, the harness:
1. After each step: asks the model to update the summary with what just happened
2. Drops the raw content from the history
3. Carries only the summary forward

This keeps context size roughly constant regardless of how long the loop runs. But it compounds the information loss — each update to the summary is another editorial pass.

## The Information Loss Problem in Detail

This is the most important thing to understand about compaction: **it is irreversible and lossy**.

When a 40,000-token exploration history is compressed to 2,000 tokens, 38,000 tokens of content are discarded. What was discarded?

In an ideal compaction:
- The discarded content is redundant, exploratory, or superseded
- The retained content is the distilled signal
- Nothing important is lost

In practice, the model compacting the context does not know what the future of the task will need. It makes its best guess. That guess can be wrong in ways that aren't discoverable until later.

### Example: The Silent Error

Explorer agent explores the auth module. It finds:
- **Primary bug:** The timestamp comparison on line 47 (captured in summary)
- **Latent issue:** A TODO comment on line 92 noting that the refresh token logic was never implemented (NOT captured in summary — seemed like a future concern, not the current bug)

After compaction, the Builder agent fixes the timestamp bug. Tests pass. The task appears complete.

Three weeks later in production: the refresh token system fails because the incomplete logic is now being exercised. The note about this was in the Explorer's raw context — but it was compacted away.

This is **error laundering through compaction**: a piece of information that would have been actionable was present in the system, but the compaction decision eliminated it before it could be acted upon.

### The Cascade Problem

In a multi-agent pipeline with multiple handoffs:

```
Explorer → [compaction] → Analyzer → [compaction] → Builder → [compaction] → Reviewer
```

Each compaction step introduces potential information loss. Errors or omissions at step 1 can corrupt every subsequent agent's understanding. And because each agent works from a summary rather than ground truth, the pipeline has no way to recover the original signal — it doesn't exist anymore.

## What a Good Compaction Preserves

A well-designed compaction should explicitly be instructed to preserve:

**Factual anchors:**
- Specific file paths and line numbers (these cannot be paraphrased)
- Error messages (exact text matters)
- API signatures, function names, variable names
- Test names and failure messages

**Decision rationale:**
- Why a particular approach was chosen
- What alternatives were considered and rejected
- What assumptions were made that downstream agents will depend on

**Open questions:**
- Things the agent noticed but did not resolve
- Uncertainty that the agent could not eliminate
- Items flagged for future attention

**Scope boundaries:**
- What was and wasn't explored
- What was deliberately excluded from the current task

## What Compaction Can Discard

**Safe to discard:**
- Exploratory traces (the path taken to find something, not the thing found)
- Dead ends (approaches tried and abandoned)
- Raw file contents that were summarized
- Verbose tool output that was synthesized
- Repetition and redundancy in the history

## The Audit Log Pattern

Because compaction destroys information, sophisticated agentic systems maintain a **separate audit log** that is never compacted. The audit log contains the full raw history, written to external storage, and is not part of the active context window.

The working context gets compacted and stays small. The audit log grows unboundedly but is not read by the model during normal operation. It can be retrieved if something goes wrong and investigation is needed.

```
ACTIVE CONTEXT (compacted, small, in the window)
    ↕ model reads this
    
AUDIT LOG (full, large, external storage)
    ↕ harness writes to this; model does not read this normally
```

This is a best-practice architectural pattern for any long-running agentic system.

## The Compaction Quality Problem

The quality of compaction varies significantly based on:

**The model doing the compacting:** A smaller, cheaper model may miss nuance. The same model that's doing the work is usually a better choice for compaction, but it's more expensive.

**The compaction prompt:** Vague prompts ("summarize this") produce vague summaries. Good compaction prompts are explicit about what categories of information must be preserved.

**Timing:** Compacting too early (discarding information the agent still actively needs) is dangerous. Compacting too late (context already overflowed) is too late.

**The task's inherent structure:** Some tasks have clear phases where compaction is natural (exploration complete → summarize before building). Others are more entangled.

## Demo UI for Act 4

**Layout:**
- Left panel: Running agent loop (same as Act 2 visualization)
- Center: Real-time context window fill — a live bar that approaches the threshold
- Right panel: Before/after split view:
  - Top: Raw context (the full accumulation, showing individual tool results)
  - Bottom: Post-compaction summary (the replacement that goes forward)
  - Token count comparison between the two
- A "what was lost" panel — show items from the raw context that did NOT make it into the summary, to illustrate the risk

**Interactive Demo Flow:**
1. An agentic loop runs on a more complex version of the task
2. Context meter fills — at 70%, a visual warning appears
3. Compaction is triggered — animation shows the raw history collapsing into a summary
4. Token count drops dramatically — show the number
5. Loop resumes with the new compact context
6. "What was lost" panel reveals 2-3 items from the raw history that didn't make the summary
7. One of those items (the refresh token TODO) is flagged as "this could matter later"
8. Optionally: let the loop continue and hit a downstream problem that traces back to the lost item

**What to highlight:**
- The token count before and after (dramatic difference)
- The summary quality — it's good but not perfect
- The items that were dropped — not garbage, but editorial choices
- The irreversibility — once compacted, the raw history is gone
- The audit log pattern as the mitigation

**The "aha" moment:**
> "Compaction let this agent run three times longer than it could have otherwise. But look what it decided wasn't important enough to keep. That TODO on line 92 — the model didn't know it would matter. It made a reasonable judgment call. And it was wrong. Compaction is necessary. But every compaction is a bet."

---

---

# Synthesis: The Through-Line

Each act introduces a capability that solves the previous act's ceiling — and introduces a new class of problem.

| Act | Core Innovation | Ceiling Solved | New Problem Introduced |
|---|---|---|---|
| GenAI | Inference | None (starting point) | No action, no iteration, no scope |
| Agentic Loop | Feedback cycle + tools | Self-correction, real-world grounding | Context growth, error compounding |
| Multi-Agent | Division of cognitive labor | Context exhaustion, cognitive overload | Handoff quality, error laundering |
| Compaction | Context compression | Infinite runtime viability | Irreversible information loss |

The progression is not a ladder where each rung is better than the last. It is a series of **architectural tradeoffs**, each appropriate to different problem shapes. A simple Q&A task needs Act 1. A complex, long-horizon engineering task needs Acts 2, 3, and 4 together.

## What the Demo Should Leave the User With

After completing all four acts, the user should understand:

1. **The model is always just a function** — it only knows what's in the payload
2. **The harness is where intelligence multiplies** — the loop, tools, routing, and memory management are the engineering layer
3. **Context is the scarcest resource** — everything interesting in agentic AI is a strategy for managing context
4. **Compaction is a lossy codec** — it extends range at the cost of fidelity
5. **Multi-agent systems are context sharding** — you get scale by dividing the problem, not by giving one agent infinite memory
6. **The future of this field is better context management** — longer windows, smarter compaction, better handoff protocols

---

---

# Implementation Notes for the Demo

## Recommended Demo Scenario (Codebase Task)

Use a small, self-contained but realistic fake codebase. Recommended structure:

```
/src
  /auth
    auth.js          ← contains the bug (timestamp comparison)
    tokens.js        ← related module
  /middleware
    authMiddleware.js
  /routes
    userRoutes.js
/tests
  auth.test.js       ← test that passes incorrectly
```

The bug should be subtle enough that the model genuinely needs to read the files to find it, but clear enough that users understand it when shown.

## API Call Simulation vs. Live Calls

For demo purposes, you have two options:

**Option A: Live API calls** — Real calls to the Anthropic API with real latency. Most authentic. Shows real token counts. Risk: latency and cost at scale.

**Option B: Pre-recorded payloads** — Replay realistic API call sequences with realistic timing. Allows fine-tuning of what's demonstrated. Allows the "what was lost" compaction panel to be curated.

A hybrid approach works well: live for Act 1 and Act 2, pre-orchestrated for Acts 3 and 4 where the multi-agent choreography needs to be reliable.

## Payload Inspector Specification

Each payload inspector panel should show:

```
┌─────────────────────────────────────────┐
│ CALL #4  │  ⏱ 1.2s  │  1,847 / 200,000 tokens │
├──────────────────────────────────────────┤
│ REQUEST                                  │
│ ─────────────────────────────────────── │
│ {                                        │
│   "model": "claude-sonnet-4-6",          │
│   "tools": [ ... 3 tools ],             │
│   "messages": [                          │
│     { "role": "system", ... }           │
│     { "role": "user", ... }             │
│     { "role": "assistant", ... }        │
│     { "role": "user",                   │
│       "content": [                       │
│         { "type": "tool_result", ... }  │
│       ]                                 │
│     }                                   │
│   ]                                     │
│ }                                        │
├──────────────────────────────────────────┤
│ RESPONSE                                 │
│ ─────────────────────────────────────── │
│ {                                        │
│   "stop_reason": "tool_use",            │
│   "content": [                           │
│     { "type": "text", ... },            │
│     { "type": "tool_use",               │
│       "name": "read_file", ... }        │
│   ]                                     │
│ }                                        │
└──────────────────────────────────────────┘
```

## Context Window Meter Specification

```
Context Window Usage
[████████████░░░░░░░░░░░░░░░░░░] 41% (82,000 / 200,000 tokens)

Breakdown:
  System prompt:     500 tokens   (0.25%)
  Conversation:    1,200 tokens   (0.60%)
  Tool results:   80,300 tokens  (40.15%)
```

---

*End of Blueprint Document*

*This document covers the full technical and narrative design for the 4-act interactive demo. Each act's implementation should preserve the mechanical transparency as the core value: users should always be able to see not just what the system did, but exactly why and how at the API level.*
