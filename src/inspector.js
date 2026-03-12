// ============================================================================
// SECTION 7: PAYLOAD INSPECTOR, CONTEXT WINDOW METER, MESSAGE LOG
// Agentic AI Glass Box Demo
// ============================================================================

const MONO_FONT = '"Fira Mono", "Cascadia Code", "JetBrains Mono", monospace';

const SYNTAX = {
  string:   '#86efac',  // green-300
  number:   '#93c5fd',  // blue-300
  boolean:  '#f9a8d4',  // pink-300
  null_val: '#6b7280',  // gray-500
  key:      '#fcd34d',  // yellow-300
  brace:    '#94a3b8',  // slate-400
  annot:    '#fb923c',  // orange-400 (tool_use)
  annotGrn: '#34d399',  // green-400 (tool_result)
};

const PANEL_BG     = '#0f172a';
const PANEL_BORDER = '#1e293b';
const PANEL_HEADER = '#1e293b';

// ============================================================================
// Context Window Meter
// ============================================================================

function ContextWindowMeter({ contextState, showThreshold, isCompacting, compact }) {
  if (!contextState) return null;
  const { systemPromptTokens, conversationTokens, toolResultTokens, totalTokens, percentUsed } = contextState;
  const pct = Math.min(100, percentUsed || 0);

  const maxTok  = MAX_CONTEXT_TOKENS;
  const sysPct  = (systemPromptTokens  / maxTok) * 100;
  const convPct = (conversationTokens  / maxTok) * 100;
  const toolPct = (toolResultTokens    / maxTok) * 100;

  const isWarning   = pct >= 70;
  const isDangerous = pct >= 85;

  return (
    <div style={{ fontFamily: MONO_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: isDangerous ? COLORS.compaction.text : isWarning ? '#fbbf24' : '#6b7280' }}>
          {totalTokens.toLocaleString()} / {maxTok.toLocaleString()} tokens
        </span>
        <span style={{ fontSize: 11, fontWeight: 'bold', color: isDangerous ? COLORS.compaction.text : isWarning ? '#fbbf24' : '#94a3b8' }}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Segmented bar */}
      <div style={{
        position: 'relative',
        height: 16,
        background: '#1e293b',
        borderRadius: 8,
        overflow: 'visible',
        transition: isCompacting ? 'all 0.8s ease' : 'none',
      }}>
        {/* Filled bar */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, height: '100%',
          width: `${pct}%`,
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          transition: isCompacting ? 'width 1.2s ease' : 'width 0.4s ease',
        }}>
          {/* System prompt segment (purple) */}
          <div style={{ width: `${(sysPct / pct) * 100}%`, background: '#a855f7', flexShrink: 0 }}/>
          {/* Conversation segment (amber) */}
          <div style={{ width: `${(convPct / pct) * 100}%`, background: '#f59e0b', flexShrink: 0 }}/>
          {/* Tool results segment (green) */}
          <div style={{ width: `${(toolPct / pct) * 100}%`, background: '#10b981', flexShrink: 0 }}/>
        </div>

        {/* 70% threshold line */}
        {showThreshold && (
          <div style={{
            position: 'absolute',
            left: '70%',
            top: -4,
            bottom: -4,
            width: 2,
            background: COLORS.compaction.border,
            borderRadius: 1,
            zIndex: 10,
          }}>
            <div style={{
              position: 'absolute',
              top: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 8,
              color: COLORS.compaction.text,
              whiteSpace: 'nowrap',
              fontFamily: MONO_FONT,
            }}>70%</div>
          </div>
        )}
      </div>

      {/* Compact segment legend (token counts inline) */}
      {!compact && (
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#a855f7' }}/>
            <span style={{ fontSize: 10, color: '#6b7280' }}>System ({systemPromptTokens.toLocaleString()})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }}/>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Conversation ({conversationTokens.toLocaleString()})</span>
          </div>
          {toolResultTokens > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}/>
              <span style={{ fontSize: 10, color: '#6b7280' }}>Tools ({toolResultTokens.toLocaleString()})</span>
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      {isDangerous && !isCompacting && (
        <div style={{ marginTop: 5, padding: '3px 8px', background: 'rgba(249,115,22,0.1)', border: `1px solid ${COLORS.compaction.border}`, borderRadius: 4, fontSize: 10, color: COLORS.compaction.text }}>
          ⚠ {pct.toFixed(0)}% — compaction threshold exceeded
        </div>
      )}
      {isWarning && !isDangerous && !isCompacting && (
        <div style={{ marginTop: 5, padding: '3px 8px', background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', borderRadius: 4, fontSize: 10, color: '#fbbf24' }}>
          ↑ Approaching 70% threshold
        </div>
      )}
    </div>
  );
}

// ============================================================================
// JsonNode — recursive JSON renderer with syntax highlighting
// ============================================================================

function JsonNode({ value, depth, isLast, annotation }) {
  const [collapsed, setCollapsed] = React.useState(depth > 2);
  const canCollapse = typeof value === 'object' && value !== null;

  const toggle = (e) => { e.stopPropagation(); setCollapsed(c => !c); };
  const comma = isLast ? '' : ',';

  if (value === null) return (
    <span>
      <span style={{ color: SYNTAX.null_val }}>null</span>{comma}
    </span>
  );
  if (typeof value === 'boolean') return (
    <span>
      <span style={{ color: SYNTAX.boolean }}>{value ? 'true' : 'false'}</span>{comma}
    </span>
  );
  if (typeof value === 'number') return (
    <span>
      <span style={{ color: SYNTAX.number }}>{value}</span>{comma}
    </span>
  );
  if (typeof value === 'string') {
    const display = value.length > 120 ? value.slice(0, 120) + '…' : value;
    return (
      <span>
        <span style={{ color: SYNTAX.string }}>"{display}"</span>{comma}
        {annotation && (
          <span style={{
            marginLeft: 8,
            fontSize: 10,
            color: annotation.type === 'tool_use' ? SYNTAX.annot : SYNTAX.annotGrn,
            opacity: 0.9,
            fontStyle: 'italic',
          }}>← {annotation.text}</span>
        )}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (collapsed) return (
      <span>
        <span style={{ color: SYNTAX.brace, cursor: 'pointer', userSelect: 'none' }} onClick={toggle}>
          [{value.length === 0 ? '' : `…${value.length} items`}]
        </span>{comma}
      </span>
    );
    return (
      <span>
        <span style={{ color: SYNTAX.brace, cursor: canCollapse ? 'pointer' : 'default', userSelect: 'none' }} onClick={canCollapse ? toggle : undefined}>[</span>
        {value.map((item, i) => (
          <div key={i} style={{ paddingLeft: 16 }}>
            <JsonNode value={item} depth={depth + 1} isLast={i === value.length - 1}/>
          </div>
        ))}
        <span style={{ color: SYNTAX.brace }}>]</span>{comma}
      </span>
    );
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (collapsed) return (
      <span>
        <span style={{ color: SYNTAX.brace, cursor: 'pointer', userSelect: 'none' }} onClick={toggle}>
          {'{'}…{keys.length} keys{'}'}
        </span>{comma}
      </span>
    );
    return (
      <span>
        <span style={{ color: SYNTAX.brace, cursor: 'pointer', userSelect: 'none' }} onClick={toggle}>{'{'}</span>
        {keys.map((key, i) => {
          const childVal = value[key];
          const isToolUse = key === 'type' && childVal === 'tool_use';
          const isToolRes = key === 'type' && childVal === 'tool_result';
          const keyAnnot = isToolUse ? { type: 'tool_use', text: 'Model requesting tool call' }
                         : isToolRes ? { type: 'tool_result', text: 'Injected by harness' }
                         : null;
          return (
            <div key={key} style={{ paddingLeft: 16 }}>
              <span style={{ color: SYNTAX.key }}>"{key}"</span>
              <span style={{ color: SYNTAX.brace }}>: </span>
              <JsonNode value={childVal} depth={depth + 1} isLast={i === keys.length - 1} annotation={keyAnnot}/>
            </div>
          );
        })}
        <span style={{ color: SYNTAX.brace }}>{'}'}</span>{comma}
      </span>
    );
  }
  return <span style={{ color: '#94a3b8' }}>{String(value)}</span>;
}

// ============================================================================
// PayloadInspector — JSON viewer with token count badge
// ============================================================================

function PayloadInspector({ message, contextState, activeAgent, currentAct }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (message) {
      navigator.clipboard.writeText(JSON.stringify(message, null, 2)).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tokens = contextState?.totalTokens;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header — matches PANEL_HEADER_STYLE from app shell */}
      <div style={{
        padding: '7px 14px',
        background: '#11111b',
        borderBottom: '1px solid #2a2a3c',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO_FONT }}>
            API Payload
          </span>
          {activeAgent && currentAct === 3 && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: COLORS.agents.bg, border: `1px solid ${COLORS.agents.border}`,
              color: COLORS.agents.text, fontFamily: MONO_FONT,
            }}>
              {activeAgent}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tokens != null && (
            <span style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#1a1a2a',
              color: '#6b7280',
              fontFamily: MONO_FONT,
            }}>
              {tokens.toLocaleString()} tokens
            </span>
          )}
          <button
            onClick={handleCopy}
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: copied ? '#065f46' : '#1e293b',
              border: `1px solid ${copied ? '#10b981' : '#334155'}`,
              color: copied ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              fontFamily: MONO_FONT,
              transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        fontSize: 12,
        fontFamily: MONO_FONT,
        lineHeight: 1.7,
      }}>
        {message ? (
          <JsonNode value={message} depth={0} isLast={true}/>
        ) : (
          <span style={{ color: '#475569', fontStyle: 'italic' }}>No payload for this step</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// WhatWasLostPanel — Act 4 compaction loss visualization
// ============================================================================

function WhatWasLostPanel({ compactionData }) {
  if (!compactionData || !compactionData.lost) return null;
  const { lost } = compactionData;

  return (
    <div style={{
      background: PANEL_BG,
      border: `1px solid ${COLORS.compaction.border}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: 'rgba(249,115,22,0.1)',
        borderBottom: `1px solid ${COLORS.compaction.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>⚠</span>
        <span style={{
          fontSize: 11,
          color: COLORS.compaction.text,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: MONO_FONT,
          fontWeight: 'bold',
        }}>
          What Was Lost
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: '#64748b',
          fontFamily: MONO_FONT,
        }}>
          {lost.length} item{lost.length !== 1 ? 's' : ''} not in summary
        </span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lost.map((item, i) => (
          <div key={i} style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: item.flagged ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${item.flagged ? COLORS.compaction.border : '#1e293b'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{
                fontSize: 12,
                fontFamily: MONO_FONT,
                fontWeight: 'bold',
                color: item.flagged ? COLORS.compaction.text : '#cbd5e1',
              }}>
                {item.flagged && '⚠ '}{item.title}
              </span>
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
                fontFamily: MONO_FONT,
                background: item.risk === 'high' ? 'rgba(239,68,68,0.15)' : item.risk === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                color: item.risk === 'high' ? '#f87171' : item.risk === 'medium' ? '#fbbf24' : '#94a3b8',
              }}>
                {item.risk} risk
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5, fontFamily: MONO_FONT }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CompactionDiffView — before/after token comparison
// ============================================================================

function CompactionDiffView({ compactionData }) {
  if (!compactionData) return null;
  const { before, after } = compactionData;
  if (!before || !after) return null;

  const reduction = Math.round((1 - after.tokens / before.tokens) * 100);

  return (
    <div style={{
      background: PANEL_BG,
      border: `1px solid ${PANEL_BORDER}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: PANEL_HEADER,
        borderBottom: `1px solid ${PANEL_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO_FONT }}>
          Compaction Result
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: '#34d399',
          fontFamily: MONO_FONT,
          fontWeight: 'bold',
        }}>
          ↓ {reduction}% reduction
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
        {/* Before */}
        <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: '#f87171', fontFamily: MONO_FONT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Before
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f87171', fontFamily: MONO_FONT }}>
            {before.tokens.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: MONO_FONT, marginTop: 4 }}>tokens</div>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: MONO_FONT, marginTop: 8 }}>{before.description}</div>
        </div>
        {/* Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', color: COLORS.compaction.text, fontSize: 20 }}>→</div>
        {/* After */}
        <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: '#34d399', fontFamily: MONO_FONT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            After
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#34d399', fontFamily: MONO_FONT }}>
            {after.tokens.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: MONO_FONT, marginTop: 4 }}>tokens</div>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: MONO_FONT, marginTop: 8 }}>{after.description}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// getMessageDisplayInfo helper
// ============================================================================

function getMessageDisplayInfo(msg) {
  if (!msg) return { label: 'unknown', color: '#64748b', icon: '?' };
  switch (msg.type) {
    case 'api_request':
      return { label: 'API Request', color: COLORS.harness.border, icon: '→' };
    case 'api_response':
      return { label: 'API Response', color: COLORS.genai.border, icon: '←' };
    case 'tool_dispatch':
      return { label: 'Tool Dispatch', color: COLORS.harness.border, icon: '⚙' };
    case 'tool_result':
      return { label: 'Tool Result', color: COLORS.tools.border, icon: '✓' };
    case 'handoff':
      return { label: 'Agent Handoff', color: COLORS.agents.border, icon: '⇒' };
    case 'compaction':
      return { label: 'Compaction', color: COLORS.compaction.border, icon: '⌛' };
    default:
      return { label: msg.type || 'event', color: '#64748b', icon: '·' };
  }
}

// ============================================================================
// MessageLog — chronological event list
// ============================================================================

function MessageLog({ messageLog, currentStep }) {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageLog?.length]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: PANEL_BG,
      border: `1px solid ${PANEL_BORDER}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: PANEL_HEADER,
        borderBottom: `1px solid ${PANEL_BORDER}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO_FONT }}>
          Event Log
        </span>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {(!messageLog || messageLog.length === 0) && (
          <div style={{ padding: '12px 14px', fontSize: 12, color: '#475569', fontFamily: MONO_FONT, fontStyle: 'italic' }}>
            No events yet
          </div>
        )}
        {(messageLog || []).map((entry, i) => {
          const info = getMessageDisplayInfo(entry.flow);
          const isCurrent = i === (messageLog.length - 1);
          return (
            <div key={i} style={{
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: isCurrent ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderLeft: isCurrent ? `2px solid ${info.color}` : '2px solid transparent',
            }}>
              <span style={{ fontSize: 12, color: info.color, fontFamily: MONO_FONT, flexShrink: 0, marginTop: 1 }}>
                {info.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: isCurrent ? '#e2e8f0' : '#94a3b8', fontFamily: MONO_FONT }}>
                  {entry.label || info.label}
                </div>
                {entry.detail && (
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: MONO_FONT, marginTop: 2, wordBreak: 'break-word' }}>
                    {entry.detail}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: '#334155', fontFamily: MONO_FONT, flexShrink: 0 }}>
                step {entry.stepNumber || i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
