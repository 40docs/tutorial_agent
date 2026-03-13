// ============================================================================
// SECTION 8-9: CHAT PANEL, STEP NARRATOR, APPLICATION SHELL
// Agentic AI Glass Box Demo
// ============================================================================

const SimulationContext = React.createContext(null);

// ---------------------------------------------------------------------------
// Shared panel header style — all panels use this for consistent width
// ---------------------------------------------------------------------------
const PANEL_HEADER_STYLE = {
  padding: '7px 14px',
  background: '#11111b',
  borderBottom: '1px solid #2a2a3c',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: MONO_FONT,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const PANEL_STYLE = {
  background: '#11111b',
  border: '1px solid #2a2a3c',
  borderRadius: 10,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------
const AGENT_COLORS = {
  orchestrator: { border: '#334155', bg: '#1e293b', text: '#c084fc', label: 'Orchestrator' },
  explorer:     { border: '#334155', bg: '#1e293b', text: '#c084fc', label: 'Explorer' },
  builder:      { border: '#334155', bg: '#1e293b', text: '#c084fc', label: 'Builder' },
  reviewer:     { border: '#334155', bg: '#1e293b', text: '#c084fc', label: 'Reviewer' },
};

function ToolCallBubble({ call }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px',
      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 6, fontFamily: MONO_FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, color: '#f59e0b' }}>⚙</span>
        <span style={{ fontSize: 12, color: '#fbbf24' }}>tool_use</span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>·</span>
        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 'bold' }}>{call.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && call.input && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(245,158,11,0.15)' }}>
          <JsonNode value={call.input} depth={0} isLast={true}/>
        </div>
      )}
    </div>
  );
}

function ToolResultBubble({ result }) {
  const [open, setOpen] = React.useState(false);
  const isError = result.isError;
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px',
      background: isError ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
      borderRadius: 6, fontFamily: MONO_FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, color: isError ? '#f87171' : '#10b981' }}>{isError ? '✗' : '✓'}</span>
        <span style={{ fontSize: 12, color: isError ? '#fca5a5' : '#34d399' }}>tool_result</span>
        {result.tool_use_id && <span style={{ fontSize: 10, color: '#475569' }}>· {result.tool_use_id.slice(-8)}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && result.content && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${isError ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
          <pre style={{ fontSize: 11, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const agentMeta = msg.agent && AGENT_COLORS[msg.agent];
  let bubbleBg = '#1e293b', bubbleBorder = '#334155';
  let roleLabel = isUser ? 'user' : 'assistant', roleColor = isUser ? '#94a3b8' : '#c084fc';
  if (agentMeta) { bubbleBg = agentMeta.bg; bubbleBorder = agentMeta.border; roleLabel = agentMeta.label; roleColor = agentMeta.text; }

  if (msg.isCompactionMarker) {
    return (
      <div style={{
        margin: '10px 0', padding: '8px 14px',
        background: 'rgba(249,115,22,0.08)', border: `1px solid ${COLORS.compaction.border}`,
        borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO_FONT,
      }}>
        <span style={{ fontSize: 14 }}>⌛</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.compaction.text }}>Context Compacted</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{msg.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '5px 0', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: agentMeta ? agentMeta.bg : '#1a1a2e',
          border: `2px solid ${agentMeta ? agentMeta.border : '#a855f7'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: agentMeta ? agentMeta.text : '#c084fc',
        }}>
          {agentMeta ? roleLabel[0].toUpperCase() : 'C'}
        </div>
      )}
      <div style={{
        maxWidth: '80%', padding: '8px 12px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? COLORS.user.bg : bubbleBg,
        border: `1px solid ${isUser ? COLORS.user.border : bubbleBorder}`,
        fontSize: 13, color: '#e2e8f0', lineHeight: 1.6,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 10, color: roleColor, marginBottom: 4, fontFamily: MONO_FONT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {roleLabel}
        </div>
        {msg.content && <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>}
        {msg.codeAttachment && (
          <div style={{ marginTop: 8, background: '#0b1520', border: '1px solid #1e3a4a', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '4px 10px', background: '#111e2e', borderBottom: '1px solid #1e3a4a', fontSize: 10, color: '#64748b', fontFamily: MONO_FONT, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📎</span>
              <span>{msg.codeAttachment.filename}</span>
            </div>
            <pre style={{ margin: 0, padding: '8px 10px', fontSize: 11, color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre', lineHeight: 1.55 }}>
              {msg.codeAttachment.code}
            </pre>
          </div>
        )}
        {Array.isArray(msg.toolCalls)   && msg.toolCalls.map((c, i)   => <ToolCallBubble   key={i} call={c}/>)}
        {Array.isArray(msg.toolResults) && msg.toolResults.map((r, i) => <ToolResultBubble key={i} result={r}/>)}
      </div>
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: COLORS.user.bg, border: `2px solid ${COLORS.user.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: COLORS.user.text,
        }}>U</div>
      )}
    </div>
  );
}

function ChatPanel({ conversationHistory }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversationHistory?.length]);

  return (
    <div style={{ ...PANEL_STYLE, height: '100%' }}>
      <div style={PANEL_HEADER_STYLE}>Chat</div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {(!conversationHistory || conversationHistory.length === 0) ? (
          <div style={{ color: '#374151', fontSize: 12, fontStyle: 'italic', fontFamily: MONO_FONT, paddingTop: 8 }}>
            Conversation will appear here…
          </div>
        ) : (
          (conversationHistory || []).map((msg, i) => <ChatBubble key={i} msg={msg}/>)
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepNarrator — phase badge, label, narration, act tabs, nav controls at bottom
// ---------------------------------------------------------------------------

const PHASE_META = {
  message:            { bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6', text: '#93c5fd' },
  api_call:           { bg: 'rgba(168,85,247,0.12)',  border: '#a855f7', text: '#c084fc' },
  api_response:       { bg: 'rgba(168,85,247,0.12)',  border: '#a855f7', text: '#c084fc' },
  render:             { bg: 'rgba(107,114,128,0.12)', border: '#6b7280', text: '#9ca3af' },
  insight:            { bg: 'rgba(234,179,8,0.12)',   border: '#eab308', text: '#fde047' },
  setup:              { bg: 'rgba(245,158,11,0.12)',  border: '#f59e0b', text: '#fbbf24' },
  tool_execute:       { bg: 'rgba(16,185,129,0.12)',  border: '#10b981', text: '#34d399' },
  orchestrator:       { bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6', text: '#93c5fd' },
  handoff:            { bg: 'rgba(99,102,241,0.12)',  border: '#6366f1', text: '#a5b4fc' },
  explorer:           { bg: 'rgba(59,130,246,0.08)',  border: '#60a5fa', text: '#93c5fd' },
  builder:            { bg: 'rgba(16,185,129,0.08)',  border: '#34d399', text: '#86efac' },
  reviewer:           { bg: 'rgba(167,139,250,0.08)', border: '#a78bfa', text: '#c4b5fd' },
  loop_run:           { bg: 'rgba(245,158,11,0.08)',  border: '#f59e0b', text: '#fbbf24' },
  threshold:          { bg: 'rgba(249,115,22,0.12)',  border: '#f97316', text: '#fb923c' },
  compaction_trigger: { bg: 'rgba(249,115,22,0.12)',  border: '#f97316', text: '#fb923c' },
  compaction_run:     { bg: 'rgba(249,115,22,0.12)',  border: '#f97316', text: '#fb923c' },
  compaction_result:  { bg: 'rgba(249,115,22,0.12)',  border: '#f97316', text: '#fb923c' },
  what_was_lost:      { bg: 'rgba(239,68,68,0.08)',   border: '#ef4444', text: '#fca5a5' },
  loop_resume:        { bg: 'rgba(16,185,129,0.08)',  border: '#10b981', text: '#34d399' },
  audit_log:          { bg: 'rgba(59,130,246,0.08)',  border: '#3b82f6', text: '#93c5fd' },
};

const KEY_TERMS = [
  'tool_use', 'tool_result', 'end_turn', 'stop_reason', 'context window',
  'harness', 'compaction', 'handoff', 'orchestrator', 'explorer', 'builder',
  'reviewer', 'messages array', 'API', 'loop', 'token', 'tokens',
];

function HighlightedNarration({ text }) {
  if (!text) return null;
  const sorted = [...KEY_TERMS].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <span>
      {parts.map((part, i) =>
        KEY_TERMS.some(kw => kw.toLowerCase() === part.toLowerCase())
          ? <strong key={i} style={{ color: '#fde047', fontWeight: 600 }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

function StepNarrator({ sim, onGoToAct }) {
  const { currentStepIndex, currentAct, isPlaying, playSpeed, next, prev, togglePlay, setPlaySpeed } = sim;
  const step = STEPS[currentStepIndex];
  if (!step) return null;

  const phaseStyle = PHASE_META[step.phase] || PHASE_META.message;
  const actMeta    = ACT_METADATA[step.act];
  const stepInAct  = step.id.match(/step(\d+)/)?.[1] || '?';
  const total      = STEPS.length;

  return (
    <div style={{ ...PANEL_STYLE }}>
      {/* Act tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a3c', flexShrink: 0 }}>
        {[1, 2, 3, 4].map(actNum => {
          const am = ACT_METADATA[actNum];
          const isActive = step.act === actNum;
          return (
            <button key={actNum} onClick={() => onGoToAct(actNum)} style={{
              flex: 1, padding: '7px 4px',
              background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${am.accentColor}` : '2px solid transparent',
              color: isActive ? am.accentColor : '#4b5563',
              cursor: 'pointer', fontSize: 11, fontFamily: MONO_FONT,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontWeight: isActive ? 700 : 400 }}>Act {actNum}</div>
              <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{am.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Step label + phase badge */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4, flexShrink: 0,
            background: phaseStyle.bg, border: `1px solid ${phaseStyle.border}`, color: phaseStyle.text,
            fontFamily: MONO_FONT, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{step.phase}</span>
          <span style={{ fontSize: 10, color: '#374151', fontFamily: MONO_FONT }}>
            Act {step.act} · {stepInAct}/{ACT_LENGTHS[step.act]}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>
          {step.label}
        </div>
      </div>

      {/* Narration */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.75, margin: 0 }}>
          <HighlightedNarration text={step.narration}/>
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#1a1a2e', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${((currentStepIndex + 1) / total) * 100}%`,
          background: `linear-gradient(90deg, ${actMeta.accentColor}99, ${actMeta.accentColor})`,
          transition: 'width 0.3s ease',
        }}/>
      </div>

      {/* Nav controls */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid #2a2a3c',
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#0f0f1a', flexShrink: 0,
      }}>
        <button onClick={prev} disabled={currentStepIndex === 0} style={{
          padding: '7px 16px', borderRadius: 8,
          background: '#1a1a2a', border: '1px solid #2a2a3c',
          color: currentStepIndex === 0 ? '#2a2a3c' : '#94a3b8',
          fontSize: 13, cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
          fontFamily: MONO_FONT, transition: 'all 0.15s',
        }}>← Back</button>

        <button onClick={togglePlay} style={{
          padding: '7px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          background: isPlaying ? `${COLORS.compaction.border}22` : `${actMeta.accentColor}22`,
          border: `1px solid ${isPlaying ? COLORS.compaction.border : actMeta.accentColor}`,
          color: isPlaying ? COLORS.compaction.text : actMeta.accentColor,
          cursor: 'pointer', fontFamily: MONO_FONT, minWidth: 100, transition: 'all 0.15s',
        }}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button onClick={next} disabled={currentStepIndex === total - 1} style={{
          padding: '7px 16px', borderRadius: 8,
          background: '#1a1a2a', border: '1px solid #2a2a3c',
          color: currentStepIndex === total - 1 ? '#2a2a3c' : '#94a3b8',
          fontSize: 13, cursor: currentStepIndex === total - 1 ? 'not-allowed' : 'pointer',
          fontFamily: MONO_FONT, transition: 'all 0.15s',
        }}>Next →</button>

        {/* Speed */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
          {[0.5, 1, 2].map(s => (
            <button key={s} onClick={() => setPlaySpeed(s)} style={{
              padding: '4px 7px', borderRadius: 5, fontSize: 11,
              background: playSpeed === s ? '#1e3a5f' : 'transparent',
              border: `1px solid ${playSpeed === s ? '#3b82f6' : '#2a2a3c'}`,
              color: playSpeed === s ? '#93c5fd' : '#4b5563',
              cursor: 'pointer', fontFamily: MONO_FONT,
            }}>{s}x</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActTransition overlay
// ---------------------------------------------------------------------------
function ActTransition({ toAct, visible, onDismiss }) {
  if (!visible || !toAct) return null;
  const meta = ACT_METADATA[toAct];
  if (!meta) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', cursor: 'pointer',
    }} onClick={onDismiss}>
      <div style={{
        textAlign: 'center', padding: '36px 48px',
        background: '#0f172a', border: `2px solid ${meta.accentColor}`,
        borderRadius: 16, maxWidth: 480, boxShadow: `0 0 60px ${meta.accentColor}2a`,
      }}>
        <div style={{ fontSize: 11, color: meta.accentColor, fontFamily: MONO_FONT, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Act {toAct}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>{meta.title}</div>
        <div style={{ fontSize: 16, color: meta.accentColor, marginBottom: 18, fontStyle: 'italic' }}>{meta.subtitle}</div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 }}>{meta.description}</div>
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.6, fontStyle: 'italic' }}>
          <strong style={{ color: '#94a3b8' }}>Watch for: </strong>{meta.watchFor}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#374151', fontFamily: MONO_FONT }}>Click anywhere to continue</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LandingScreen
// ---------------------------------------------------------------------------
function LandingScreen({ onStart, onSkipToAct }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f0f1a',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.04 }}>
        <svg width="100%" height="100%">
          {Array.from({ length: 50 }, (_, i) => Array.from({ length: 30 }, (_, j) => (
            <circle key={`${i}-${j}`} cx={i * 48 + 24} cy={j * 48 + 24} r="1.5" fill="#fff"/>
          )))}
        </svg>
      </div>

      <div style={{ maxWidth: 560, width: '90%', textAlign: 'center', position: 'relative' }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
          top: -140, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
        }}/>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 18, margin: '0 auto 28px',
          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Agentic AI Glass Box
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: '0 0 16px', fontStyle: 'italic' }}>
          How agentic systems actually work — made visible
        </p>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, margin: '0 auto 40px', maxWidth: 480 }}>
          Step through the evolution from a single API call to a multi-agent pipeline.
          Watch every token, every tool call, every context window fill and compact —
          four acts that show why agentic AI behaves the way it does.
        </p>

        {/* Start button */}
        <button
          onClick={onStart}
          style={{
            padding: '16px 56px', borderRadius: 14,
            border: '1px solid rgba(168,85,247,0.4)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08))',
            color: '#c084fc', fontSize: 20, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.25s ease', boxShadow: '0 0 40px rgba(168,85,247,0.1)',
            fontFamily: 'inherit', letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.15))'; e.currentTarget.style.boxShadow = '0 0 60px rgba(168,85,247,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08))'; e.currentTarget.style.boxShadow = '0 0 40px rgba(168,85,247,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Start Demo
        </button>

        {/* Skip to act */}
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#4b5563', fontSize: 13, alignSelf: 'center' }}>Skip to:</span>
          {[
            { act: 1, label: 'Traditional GenAI' },
            { act: 2, label: 'Agentic Loop' },
            { act: 3, label: 'Multi-Agent' },
            { act: 4, label: 'Compaction' },
          ].map(item => (
            <button key={item.act} onClick={() => onSkipToAct(item.act)} style={{
              padding: '5px 14px', borderRadius: 8,
              border: `1px solid ${ACT_METADATA[item.act].accentColor}33`,
              background: 'transparent', color: '#6b7280', fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = ACT_METADATA[item.act].accentColor; e.currentTarget.style.borderColor = ACT_METADATA[item.act].accentColor; e.currentTarget.style.background = `${ACT_METADATA[item.act].accentColor}0d`; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = `${ACT_METADATA[item.act].accentColor}33`; e.currentTarget.style.background = 'transparent'; }}>
              Act {item.act}: {item.label}
            </button>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 12, color: '#374151' }}>
          Keyboard: Arrow keys to navigate · 1-4 for acts · P to play/pause · Esc to reset
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeaderBar — title + act buttons + step counter (no nav controls here)
// ---------------------------------------------------------------------------
function HeaderBar({ currentAct, onGoToAct, currentStep }) {
  const totalSteps = STEPS.length;
  const pct = ((currentStep + 1) / totalSteps) * 100;
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', background: '#11111b', borderBottom: '1px solid #2a2a3c',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Agentic AI Glass Box Demo
          </span>
        </div>

        {/* Act buttons + step counter */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[1, 2, 3, 4].map(actNum => {
            const am = ACT_METADATA[actNum];
            const isActive = currentAct === actNum;
            return (
              <button key={actNum} onClick={() => onGoToAct(actNum)} style={{
                padding: '4px 14px', borderRadius: 6,
                border: isActive ? `1px solid ${am.accentColor}` : '1px solid transparent',
                background: isActive ? `${am.accentColor}1a` : 'transparent',
                color: isActive ? am.accentColor : '#6b7280',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{actNum}</button>
            );
          })}
          <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 8, fontFamily: MONO_FONT }}>
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: '#1a1a2e' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${ACT_METADATA[currentAct]?.accentColor || '#a855f7'}, ${ACT_METADATA[currentAct]?.accentColor || '#a855f7'})`,
          transition: 'width 0.3s ease',
        }}/>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App — main layout matching MCP demo structure
// ---------------------------------------------------------------------------
function App() {
  const sim = useSimulation();
  const { currentStepIndex, currentAct, conversationHistory, messageLog, next, prev, togglePlay, isPlaying, contextState, goToAct, reset } = sim;

  const [started, setStarted]                   = React.useState(false);
  const [showActTransition, setShowActTransition] = React.useState(null);
  const prevActRef = React.useRef(null);

  const step = STEPS[currentStepIndex];

  // Act change detection
  React.useEffect(() => {
    if (started && prevActRef.current !== null && prevActRef.current !== currentAct) {
      setShowActTransition(currentAct);
    }
    prevActRef.current = currentAct;
  }, [currentAct, started]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!started) return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowRight': case ' ': e.preventDefault(); next(); break;
        case 'ArrowLeft':            e.preventDefault(); prev(); break;
        case '1': goToAct(1); break;
        case '2': goToAct(2); break;
        case '3': goToAct(3); break;
        case '4': goToAct(4); break;
        case 'p': case 'P': e.preventDefault(); togglePlay(); break;
        case 'Escape': e.preventDefault(); reset(); setStarted(false); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, next, prev, goToAct, togglePlay, reset]);

  const handleStart = React.useCallback(() => {
    setStarted(true);
    sim.goToStep(0);
    setShowActTransition(1);
    prevActRef.current = 1;
  }, [sim]);

  const handleSkipToAct = React.useCallback((act) => {
    setStarted(true);
    goToAct(act);
    prevActRef.current = act;
  }, [goToAct]);

  if (!started) {
    return <LandingScreen onStart={handleStart} onSkipToAct={handleSkipToAct}/>;
  }

  const showThreshold      = currentAct === 4;
  const isCompacting       = step?.phase?.includes('compaction') || false;
  const showCompactionDiff = currentAct === 4 && step?.compactionData?.before;
  const showWhatWasLost    = step?.phase === 'what_was_lost' && step?.compactionData?.lost;

  // Choose the right inspector panel content
  const InspectorContent = () => {
    if (showCompactionDiff) {
      return (
        <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
          <CompactionDiffView compactionData={step.compactionData}/>
          {showWhatWasLost && <WhatWasLostPanel compactionData={step.compactionData}/>}
        </div>
      );
    }
    if (showWhatWasLost) {
      return <WhatWasLostPanel compactionData={step.compactionData}/>;
    }
    return (
      <PayloadInspector
        message={step?.message || null}
        contextState={contextState}
        activeAgent={step?.activeAgent}
        currentAct={currentAct}
      />
    );
  };

  return (
    <SimulationContext.Provider value={sim}>
      {showActTransition && (
        <ActTransition
          toAct={showActTransition}
          visible={true}
          onDismiss={() => setShowActTransition(null)}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: '#0f0f1a', color: '#e2e8f0',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}>
        <HeaderBar currentAct={currentAct} onGoToAct={goToAct} currentStep={currentStepIndex}/>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* LEFT: Chat (46%) */}
          <div style={{ width: '46%', padding: '8px 4px 8px 8px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ChatPanel conversationHistory={conversationHistory}/>
          </div>

          {/* RIGHT: Internals (54%) */}
          <div style={{ width: '54%', display: 'flex', flexDirection: 'column', padding: '8px 8px 8px 4px', gap: 6, minHeight: 0 }}>

            {/* Architecture Diagram */}
            <div style={{ flex: '4 1 0%', minHeight: 0, overflow: 'hidden', ...PANEL_STYLE }}>
              <div style={PANEL_HEADER_STYLE}>Architecture</div>
              {/* position:relative + absolute child ensures SVG fills panel regardless of aspect ratio */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#0f172a' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <ArchitectureDiagram
                    currentAct={currentAct}
                    activeComponents={step?.activeComponents || []}
                    messageFlow={step?.messageFlow || null}
                    stepKey={step?.id || 'init'}
                    contextState={contextState}
                    activeAgent={step?.activeAgent}
                    agentContexts={step?.agentContexts}
                  />
                </div>
              </div>
            </div>

            {/* Context Meter — slim strip */}
            <div style={{ flexShrink: 0, ...PANEL_STYLE }}>
              <div style={PANEL_HEADER_STYLE}>Context Window</div>
              <div style={{ padding: '8px 14px 10px' }}>
                <ContextWindowMeter
                  contextState={contextState}
                  showThreshold={showThreshold}
                  isCompacting={isCompacting}
                  compact={true}
                />
              </div>
            </div>

            {/* Event Log + Inspector */}
            <div style={{ flex: '3 1 0%', display: 'flex', gap: 6, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ width: '38%', minHeight: 0, ...PANEL_STYLE }}>
                <div style={PANEL_HEADER_STYLE}>Event Log</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <InnerMessageLog messageLog={messageLog} currentStep={currentStepIndex}/>
                </div>
              </div>
              <div style={{ width: '62%', minHeight: 0, overflow: 'hidden', ...PANEL_STYLE }}>
                <InspectorContent/>
              </div>
            </div>

            {/* Step Narrator with controls at bottom */}
            <div style={{ flex: '2.5 1 0%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <StepNarrator sim={sim} onGoToAct={goToAct}/>
            </div>

          </div>
        </div>
      </div>
    </SimulationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// InnerMessageLog — the log rows inside the Event Log panel (no outer wrapper)
// ---------------------------------------------------------------------------
function InnerMessageLog({ messageLog, currentStep }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messageLog?.length]);

  const getInfo = (flow) => {
    if (!flow) return { label: 'event', color: '#64748b', icon: '·' };
    const map = {
      api_request:  { label: 'API Request',    color: COLORS.harness.border, icon: '→' },
      api_response: { label: 'API Response',   color: COLORS.genai.border,   icon: '←' },
      tool_dispatch:{ label: 'Tool Dispatch',  color: COLORS.harness.border, icon: '⚙' },
      tool_result:  { label: 'Tool Result',    color: COLORS.tools.border,   icon: '✓' },
      handoff:      { label: 'Agent Handoff',  color: COLORS.agents.border,  icon: '⇒' },
      review_notes: { label: 'Review Notes',   color: COLORS.agents.border,  icon: '⇒' },
      compaction:   { label: 'Compaction',     color: COLORS.compaction.border, icon: '⌛' },
    };
    return map[flow.type] || { label: flow.type, color: '#64748b', icon: '·' };
  };

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto' }}>
      {(!messageLog || messageLog.length === 0) && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: '#374151', fontFamily: MONO_FONT, fontStyle: 'italic' }}>No events yet</div>
      )}
      {(messageLog || []).map((entry, i) => {
        const info = getInfo(entry.flow);
        const isCurrent = i === (messageLog.length - 1);
        return (
          <div key={i} style={{
            padding: '6px 14px', display: 'flex', alignItems: 'flex-start', gap: 8,
            background: isCurrent ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderLeft: `2px solid ${isCurrent ? info.color : 'transparent'}`,
          }}>
            <span style={{ fontSize: 12, color: info.color, fontFamily: MONO_FONT, flexShrink: 0, marginTop: 1 }}>{info.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: isCurrent ? '#e2e8f0' : '#6b7280', fontFamily: MONO_FONT }}>{entry.label || info.label}</div>
              {entry.detail && <div style={{ fontSize: 10, color: '#374151', fontFamily: MONO_FONT, marginTop: 1, wordBreak: 'break-word' }}>{entry.detail}</div>}
            </div>
            <span style={{ fontSize: 10, color: '#2a2a3c', fontFamily: MONO_FONT, flexShrink: 0 }}>{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
