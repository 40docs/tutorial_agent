// ============================================================================
// SECTION 6: ARCHITECTURE DIAGRAMS
// Agentic AI Glass Box Demo
// ============================================================================

// ---------------------------------------------------------------------------
// SVG layout constants per act
// ---------------------------------------------------------------------------

// Act 1: Simple linear [User] → [API/Model] → [User]
const ACT1_RECTS = {
  [C.USER]:   { x: 60,  y: 160, w: 120, h: 60, label: 'User', colorKey: 'user' },
  [C.HARNESS]:{ x: 250, y: 160, w: 120, h: 60, label: 'Harness', colorKey: 'harness' },
  [C.API]:    { x: 440, y: 160, w: 120, h: 60, label: 'API / Model', colorKey: 'genai' },
};

const ACT1_LINES = [
  { id: 'u-h',  x1: 180, y1: 190, x2: 250, y2: 190 },
  { id: 'h-a',  x1: 370, y1: 190, x2: 440, y2: 190 },
  { id: 'a-h',  x1: 440, y1: 210, x2: 370, y2: 210 },
  { id: 'h-u2', x1: 250, y1: 210, x2: 180, y2: 210 },
];

const ACT1_PATHS = {
  'req-flow':  'M 180 190 L 440 190',
  'resp-flow': 'M 440 210 L 180 210',
};

// Act 2: Feedback loop — Harness → API/Model → (stop_reason?) → Tool Dispatch → Tools → Harness
const ACT2_RECTS = {
  [C.HARNESS]:    { x: 30,  y: 140, w: 120, h: 56, label: 'Harness', colorKey: 'harness' },
  [C.API]:        { x: 220, y: 140, w: 140, h: 56, label: 'API / Model', colorKey: 'genai' },
  'decision':     { x: 420, y: 148, w: 80,  h: 40, label: 'stop_reason?', colorKey: 'genai', isDiamond: true },
  'dispatch':     { x: 30,  y: 290, w: 120, h: 56, label: 'Tool Dispatch', colorKey: 'harness' },
  [C.TOOL_READ]:  { x: 220, y: 290, w: 110, h: 48, label: 'read_file', colorKey: 'tools' },
  [C.TOOL_TESTS]: { x: 350, y: 290, w: 110, h: 48, label: 'run_tests', colorKey: 'tools' },
  [C.TOOL_WRITE]: { x: 480, y: 290, w: 110, h: 48, label: 'write_file', colorKey: 'tools' },
};

const ACT2_LINES = [
  { id: 'h-a',   x1: 150, y1: 168, x2: 220, y2: 168 },
  { id: 'a-d',   x1: 360, y1: 168, x2: 420, y2: 168 },
  { id: 'd-dis', x1: 460, y1: 188, x2: 90,  y2: 290, curved: true },
  { id: 'dis-tr',x1: 150, y1: 318, x2: 220, y2: 318 },
  { id: 'dis-tt',x1: 150, y1: 318, x2: 350, y2: 318 },
  { id: 'dis-tw',x1: 150, y1: 318, x2: 480, y2: 318 },
  { id: 'tools-h',x1: 90, y1: 290, x2: 90,  y2: 196, curved: true },
];

const ACT2_PATHS = {
  'send-req':  'M 150 165 L 360 165',
  'get-resp':  'M 360 175 L 150 175',
  'to-tool':   'M 460 185 C 520 240 20 240 90 290',
  'tool-back': 'M 90 290 C 20 240 20 180 150 175',
  'dispatch-r':'M 150 315 L 220 315',
  'dispatch-t':'M 150 315 C 200 315 300 315 350 315',
  'dispatch-w':'M 150 315 C 200 315 430 315 480 315',
};

// Act 3: Multi-agent pipeline with orchestrator, explorer, builder, reviewer
const ACT3_RECTS = {
  [C.ORCHESTRATOR]: { x: 30,  y: 30,  w: 140, h: 56, label: 'Orchestrator', colorKey: 'agents' },
  [C.EXPLORER]:     { x: 240, y: 30,  w: 130, h: 56, label: 'Explorer', colorKey: 'agents' },
  [C.BUILDER]:      { x: 240, y: 160, w: 130, h: 56, label: 'Builder', colorKey: 'agents' },
  [C.REVIEWER]:     { x: 240, y: 290, w: 130, h: 56, label: 'Reviewer', colorKey: 'agents' },
  [C.TOOL_READ]:    { x: 430, y: 30,  w: 110, h: 48, label: 'read_file', colorKey: 'tools' },
  [C.TOOL_WRITE]:   { x: 430, y: 160, w: 110, h: 48, label: 'write_file', colorKey: 'tools' },
  [C.TOOL_TESTS]:   { x: 430, y: 220, w: 110, h: 48, label: 'run_tests',  colorKey: 'tools' },
};

const ACT3_LINES = [
  { id: 'orch-exp',  x1: 170, y1: 58,  x2: 240, y2: 58  },
  { id: 'exp-bld',  x1: 305, y1: 86,  x2: 305, y2: 160 },
  { id: 'bld-rev',  x1: 305, y1: 216, x2: 305, y2: 290 },
  { id: 'rev-bld',  x1: 265, y1: 290, x2: 265, y2: 216 },
  { id: 'exp-tr',   x1: 370, y1: 54,  x2: 430, y2: 54  },
  { id: 'bld-tw',   x1: 370, y1: 184, x2: 430, y2: 184 },
  { id: 'bld-tt',   x1: 370, y1: 195, x2: 430, y2: 244 },
];

const ACT3_PATHS = {
  'orch-to-exp':  'M 170 55 L 240 55',
  'exp-to-bld':   'M 305 86 L 305 160',
  'bld-to-rev':   'M 305 216 L 305 290',
  'rev-to-bld':   'M 265 290 L 265 216',
  'exp-tool':     'M 370 50 L 430 50',
  'bld-write':    'M 370 182 L 430 182',
  'bld-tests':    'M 370 195 C 420 195 430 240 430 244',
};

// Act 4: Agentic loop + Compaction Engine + Audit Log
const ACT4_RECTS = {
  [C.HARNESS]:    { x: 30,  y: 140, w: 120, h: 56, label: 'Harness', colorKey: 'harness' },
  [C.API]:        { x: 220, y: 140, w: 140, h: 56, label: 'API / Model', colorKey: 'genai' },
  'decision':     { x: 416, y: 148, w: 80,  h: 40, label: 'stop_reason?', colorKey: 'genai', isDiamond: true },
  'dispatch':     { x: 30,  y: 290, w: 120, h: 56, label: 'Tool Dispatch', colorKey: 'harness' },
  [C.TOOL_READ]:  { x: 200, y: 290, w: 100, h: 48, label: 'read_file', colorKey: 'tools' },
  [C.TOOL_TESTS]: { x: 310, y: 290, w: 100, h: 48, label: 'run_tests', colorKey: 'tools' },
  [C.TOOL_WRITE]: { x: 420, y: 290, w: 100, h: 48, label: 'write_file', colorKey: 'tools' },
  [C.COMPACTOR]:  { x: 30,  y: 420, w: 150, h: 56, label: 'Compaction Engine', colorKey: 'compaction' },
  [C.AUDIT_LOG]:  { x: 230, y: 420, w: 130, h: 56, label: 'Audit Log', colorKey: 'agents' },
};

const ACT4_LINES = [
  { id: 'h-a',    x1: 150, y1: 168, x2: 220, y2: 168 },
  { id: 'a-d',    x1: 360, y1: 168, x2: 416, y2: 168 },
  { id: 'd-dis',  x1: 456, y1: 188, x2: 90,  y2: 290, curved: true },
  { id: 'dis-tr', x1: 150, y1: 318, x2: 200, y2: 318 },
  { id: 'dis-tt', x1: 150, y1: 318, x2: 310, y2: 318 },
  { id: 'dis-tw', x1: 150, y1: 318, x2: 420, y2: 318 },
  { id: 'tools-h',x1: 90,  y1: 290, x2: 90,  y2: 196, curved: true },
  { id: 'h-comp', x1: 90,  y1: 196, x2: 105, y2: 420, curved: true },
  { id: 'comp-al',x1: 180, y1: 448, x2: 230, y2: 448 },
];

const ACT4_PATHS = {
  'send-req':  'M 150 165 L 360 165',
  'get-resp':  'M 360 175 L 150 175',
  'to-tool':   'M 456 185 C 530 240 20 240 90 290',
  'tool-back': 'M 90 290 C 20 240 20 180 150 175',
  'dispatch-r':'M 150 315 L 200 315',
  'dispatch-t':'M 150 315 C 200 315 280 315 310 315',
  'dispatch-w':'M 150 315 C 200 315 380 315 420 315',
  'compact':   'M 90 196 C 70 340 70 400 105 420',
  'to-audit':  'M 180 448 L 230 448',
};

// ---------------------------------------------------------------------------
// CompBox — a labeled rectangle component for SVG diagrams
// ---------------------------------------------------------------------------
function CompBox({ rect, active, hidden, stepKey }) {
  const col = COLORS[rect.colorKey] || COLORS.user;
  const opacity = hidden ? 0.08 : active ? 1.0 : 0.35;
  const filterId = `glow-${rect.label.replace(/\s+/g,'-')}-${stepKey}`;

  if (rect.isDiamond) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const hw = rect.w / 2;
    const hh = rect.h / 2;
    const pts = `${cx},${rect.y} ${rect.x + rect.w},${cy} ${cx},${rect.y + rect.h} ${rect.x},${cy}`;
    return (
      <g opacity={opacity}>
        {active && (
          <defs>
            <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
        )}
        <polygon
          points={pts}
          fill={col.bg}
          stroke={col.border}
          strokeWidth={active ? 2 : 1}
          filter={active ? `url(#${filterId})` : undefined}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill={col.text} fontFamily="monospace">
          {rect.label}
        </text>
      </g>
    );
  }

  return (
    <g opacity={opacity}>
      {active && (
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
      )}
      <rect
        x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={6}
        fill={col.bg}
        stroke={col.border}
        strokeWidth={active ? 2 : 1}
        filter={active ? `url(#${filterId})` : undefined}
      />
      <text x={rect.x + rect.w/2} y={rect.y + rect.h/2 + 5} textAnchor="middle" fontSize="11" fill={col.text} fontFamily="monospace" fontWeight={active ? 'bold' : 'normal'}>
        {rect.label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// MiniContextMeter — small context bar inside agent boxes (Act 3)
// ---------------------------------------------------------------------------
function MiniContextMeter({ x, y, w, h, percent, color }) {
  const fill = Math.min(100, Math.max(0, percent));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={1}/>
      <rect x={x} y={y} width={w * fill / 100} height={h} rx={2} fill={color} opacity={0.8}/>
      <text x={x + w + 4} y={y + h - 1} fontSize="8" fill="#94a3b8" fontFamily="monospace">{fill}%</text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// FlowPacket — animated dot travelling along an SVG path
// ---------------------------------------------------------------------------
function FlowPacket({ pathId, color, duration, delay, stepKey }) {
  const dotColor = color || '#ffffff';
  const filterId = `glow-fp-${pathId}-${stepKey}`;
  return (
    <g key={`fp-${pathId}-${stepKey}`}>
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <circle r={7} fill={dotColor} opacity={0.95} filter={`url(#${filterId})`}>
        <animateMotion
          dur={`${duration || 1.2}s`}
          begin={`${delay || 0}s`}
          repeatCount="indefinite"
          rotate="auto"
        >
          <mpath href={`#${pathId}`}/>
        </animateMotion>
      </circle>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Act 1 Diagram — simple linear flow
// ---------------------------------------------------------------------------
function Act1Diagram({ activeComponents, messageFlow, stepKey }) {
  const active = new Set(activeComponents || []);

  // Layout: boxes at y=150..210, overhead request rail at y=126, underneath response rail at y=234.
  // All traffic routes through Harness (center tap at x=310).
  // User(60-180) --- Harness(250-370) --- API(440-560)
  return (
    <svg viewBox="0 0 640 310" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="dots-a1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1e293b"/>
        </pattern>
        {/* user_prompt: User right edge → up to rail → across to Harness tap → down into Harness */}
        <path id="user-to-harness-a1" d="M 180 150 L 180 126 L 310 126 L 310 150"/>
        {/* api_request: Harness tap → up to rail → across to API → down into API */}
        <path id="harness-to-api-a1"  d="M 310 150 L 310 126 L 440 126 L 440 150"/>
        {/* api_response: API bottom → down to rail → across to Harness tap → up into Harness */}
        <path id="api-to-harness-a1"  d="M 440 210 L 440 234 L 310 234 L 310 210"/>
        {/* harness_response: Harness tap → down to rail → across to User → up into User */}
        <path id="harness-to-user-a1" d="M 310 210 L 310 234 L 180 234 L 180 210"/>
      </defs>
      <rect width="640" height="310" fill="#0f172a"/>
      <rect width="640" height="310" fill="url(#dots-a1)"/>

      {/* Request rail above boxes: User → Harness → API */}
      <path d="M 180 150 L 180 126 L 440 126 L 440 150" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Harness tap to request rail */}
      <line x1="310" y1="150" x2="310" y2="126" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>
      {/* Arrow at API top (pointing down) */}
      <polygon points="436,150 440,141 444,150" fill="#334155"/>

      {/* Response rail below boxes: API → Harness → User */}
      <path d="M 440 210 L 440 234 L 180 234 L 180 210" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Harness tap to response rail */}
      <line x1="310" y1="210" x2="310" y2="234" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>
      {/* Arrow at User bottom (pointing up) */}
      <polygon points="176,210 180,219 184,210" fill="#334155"/>

      {/* Labels on the rails */}
      <text x="310" y="118" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">request →</text>
      <text x="310" y="248" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">← response</text>

      {/* Component boxes */}
      <CompBox rect={{ ...ACT1_RECTS[C.USER],    y: 150 }} active={active.has(C.USER)}    stepKey={stepKey}/>
      <CompBox rect={{ ...ACT1_RECTS[C.HARNESS], y: 150 }} active={active.has(C.HARNESS)} stepKey={stepKey}/>
      <CompBox rect={{ ...ACT1_RECTS[C.API],     y: 150 }} active={active.has(C.API)}     stepKey={stepKey}/>

      {/* Animated flow packets — follow the rails through the Harness tap */}
      {messageFlow && messageFlow.type === 'user_prompt' && (
        <FlowPacket pathId="user-to-harness-a1" color={COLORS.user.border} duration={2.0} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'api_request' && (
        <FlowPacket pathId="harness-to-api-a1" color={COLORS.harness.border} duration={2.0} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'api_response' && (
        <FlowPacket pathId="api-to-harness-a1" color={COLORS.genai.border} duration={2.0} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'harness_response' && (
        <FlowPacket pathId="harness-to-user-a1" color={COLORS.harness.border} duration={2.0} stepKey={stepKey}/>
      )}

      {/* Legend */}
      <g transform="translate(30, 278)">
        <rect width="10" height="10" rx="2" fill={COLORS.user.bg} stroke={COLORS.user.border}/>
        <text x="14" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">User</text>
        <rect x="50" width="10" height="10" rx="2" fill={COLORS.harness.bg} stroke={COLORS.harness.border}/>
        <text x="64" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Harness</text>
        <rect x="130" width="10" height="10" rx="2" fill={COLORS.genai.bg} stroke={COLORS.genai.border}/>
        <text x="144" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">API / Model</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Act 2 Diagram — agentic feedback loop
// ---------------------------------------------------------------------------
function Act2Diagram({ activeComponents, messageFlow, stepKey }) {
  const active = new Set(activeComponents || []);
  const hasToolFlow = active.has(C.TOOL_READ) || active.has(C.TOOL_TESTS) || active.has(C.TOOL_WRITE);

  return (
    <svg viewBox="0 0 620 380" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="dots-a2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1e293b"/>
        </pattern>
        {/* Request above: Harness right-top → up → across → down to decision top */}
        <path id="send-req-a2"   d="M 150 140 L 150 115 L 460 115 L 460 148"/>
        {/* Response below: API right-bottom → down → across → up to Harness right-bottom */}
        <path id="get-resp-a2"   d="M 360 196 L 360 212 L 150 212 L 150 196"/>
        <path id="to-tool-a2"    d="M 456 185 C 530 240 20 240 90 290"/>
        <path id="tool-back-a2"  d="M 90 290 C 20 240 20 212 150 212"/>
        <path id="dispatch-r-a2" d="M 150 315 L 220 315"/>
        <path id="dispatch-t-a2" d="M 150 315 C 200 315 300 315 350 315"/>
        <path id="dispatch-w-a2" d="M 150 315 C 200 315 430 315 480 315"/>
      </defs>
      <rect width="620" height="380" fill="#0f172a"/>
      <rect width="620" height="380" fill="url(#dots-a2)"/>

      {/* Structural lines */}
      {/* Request above (Harness → API → decision) */}
      <path d="M 150 140 L 150 115 L 460 115 L 460 148" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* API notch to request line */}
      <line x1="290" y1="140" x2="290" y2="115" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      {/* Response below (API → Harness) */}
      <path d="M 360 196 L 360 212 L 150 212 L 150 196" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Tool dispatch loop */}
      <path d="M 456 188 C 530 240 20 240 90 290" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M 90 290 C 20 240 20 212 150 212" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="220" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="350" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="480" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>

      {/* Boxes */}
      <CompBox rect={ACT2_RECTS[C.HARNESS]}    active={active.has(C.HARNESS)}    stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS[C.API]}         active={active.has(C.API)}         stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS['decision']}    active={active.has(C.API)}         stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS['dispatch']}    active={hasToolFlow}               stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS[C.TOOL_READ]}   active={active.has(C.TOOL_READ)}   stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS[C.TOOL_TESTS]}  active={active.has(C.TOOL_TESTS)}  stepKey={stepKey}/>
      <CompBox rect={ACT2_RECTS[C.TOOL_WRITE]}  active={active.has(C.TOOL_WRITE)}  stepKey={stepKey}/>

      {/* Flow labels */}
      <text x="255" y="106" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">API call →</text>
      <text x="255" y="226" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">← response</text>
      <text x="520" y="238" fontSize="9" fill="#64748b" fontFamily="monospace">tool_use</text>
      <text x="22"  y="238" fontSize="9" fill="#64748b" fontFamily="monospace">result</text>

      {/* Animated flow packets */}
      {messageFlow && messageFlow.type === 'api_request' && (
        <FlowPacket pathId="send-req-a2" color={COLORS.harness.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'api_response' && (
        <FlowPacket pathId="get-resp-a2" color={COLORS.genai.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'tool_dispatch' && (
        <FlowPacket pathId="to-tool-a2" color={COLORS.harness.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'tool_result' && (
        <FlowPacket pathId="tool-back-a2" color={COLORS.tools.border} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_READ) && (
        <FlowPacket pathId="dispatch-r-a2" color={COLORS.tools.border} duration={0.8} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_TESTS) && (
        <FlowPacket pathId="dispatch-t-a2" color={COLORS.tools.border} duration={1.0} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_WRITE) && (
        <FlowPacket pathId="dispatch-w-a2" color={COLORS.tools.border} duration={1.2} stepKey={stepKey}/>
      )}

      {/* Legend */}
      <g transform="translate(30, 355)">
        <rect width="10" height="10" rx="2" fill={COLORS.harness.bg} stroke={COLORS.harness.border}/>
        <text x="14" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Harness</text>
        <rect x="75" width="10" height="10" rx="2" fill={COLORS.genai.bg} stroke={COLORS.genai.border}/>
        <text x="89" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">API/Model</text>
        <rect x="160" width="10" height="10" rx="2" fill={COLORS.tools.bg} stroke={COLORS.tools.border}/>
        <text x="174" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Tools</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Act 3 Diagram — multi-agent pipeline with mini context meters
// ---------------------------------------------------------------------------
function Act3Diagram({ activeComponents, messageFlow, stepKey, contextState, activeAgent }) {
  const active = new Set(activeComponents || []);

  // Per-agent context percents for mini meters
  const agentPercents = {
    [C.ORCHESTRATOR]: activeAgent === 'orchestrator' ? (contextState?.percentUsed || 0) : 0,
    [C.EXPLORER]:     activeAgent === 'explorer'     ? (contextState?.percentUsed || 0) : 0,
    [C.BUILDER]:      activeAgent === 'builder'      ? (contextState?.percentUsed || 0) : 0,
    [C.REVIEWER]:     activeAgent === 'reviewer'     ? (contextState?.percentUsed || 0) : 0,
  };

  return (
    <svg viewBox="0 0 600 380" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="dots-a3" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1e293b"/>
        </pattern>
        <path id="orch-to-exp-a3" d="M 170 55 L 240 55"/>
        <path id="exp-to-bld-a3"  d="M 305 86 L 305 160"/>
        <path id="bld-to-rev-a3"  d="M 305 216 L 305 290"/>
        <path id="rev-to-bld-a3"  d="M 265 290 L 265 216"/>
        <path id="exp-tool-a3"    d="M 370 50 L 430 50"/>
        <path id="bld-write-a3"   d="M 370 182 L 430 182"/>
        <path id="bld-tests-a3"   d="M 370 195 C 420 195 430 240 430 244"/>
      </defs>
      <rect width="600" height="380" fill="#0f172a"/>
      <rect width="600" height="380" fill="url(#dots-a3)"/>

      {/* Structural lines */}
      <line x1="170" y1="58" x2="240" y2="58" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="305" y1="86" x2="305" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="305" y1="216" x2="305" y2="290" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="265" y1="290" x2="265" y2="216" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="370" y1="54" x2="430" y2="54" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="370" y1="186" x2="430" y2="186" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M 370 198 C 420 198 430 242 430 246" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>

      {/* Handoff labels */}
      <text x="205" y="48" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">task</text>
      <text x="315" y="128" fontSize="8" fill="#64748b" fontFamily="monospace">handoff</text>
      <text x="315" y="258" fontSize="8" fill="#64748b" fontFamily="monospace">review</text>
      <text x="225" y="258" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">notes</text>

      {/* Boxes */}
      <CompBox rect={ACT3_RECTS[C.ORCHESTRATOR]} active={active.has(C.ORCHESTRATOR)} stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.EXPLORER]}     active={active.has(C.EXPLORER)}     stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.BUILDER]}      active={active.has(C.BUILDER)}      stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.REVIEWER]}     active={active.has(C.REVIEWER)}     stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.TOOL_READ]}    active={active.has(C.TOOL_READ)}    stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.TOOL_WRITE]}   active={active.has(C.TOOL_WRITE)}   stepKey={stepKey}/>
      <CompBox rect={ACT3_RECTS[C.TOOL_TESTS]}   active={active.has(C.TOOL_TESTS)}   stepKey={stepKey}/>

      {/* Mini context meters for each agent box */}
      <MiniContextMeter x={242} y={74}  w={90} h={5} percent={agentPercents[C.ORCHESTRATOR]} color={COLORS.agents.border}/>
      <MiniContextMeter x={242} y={74}  w={90} h={5} percent={agentPercents[C.EXPLORER]}     color={COLORS.agents.border}/>
      <MiniContextMeter x={242} y={204} w={90} h={5} percent={agentPercents[C.BUILDER]}      color={COLORS.agents.border}/>
      <MiniContextMeter x={242} y={334} w={90} h={5} percent={agentPercents[C.REVIEWER]}     color={COLORS.agents.border}/>

      {/* Animated flow packets */}
      {messageFlow && messageFlow.type === 'handoff' && messageFlow.to === C.EXPLORER && (
        <FlowPacket pathId="orch-to-exp-a3" color={COLORS.agents.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'handoff' && messageFlow.to === C.BUILDER && (
        <FlowPacket pathId="exp-to-bld-a3" color={COLORS.agents.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'handoff' && messageFlow.to === C.REVIEWER && (
        <FlowPacket pathId="bld-to-rev-a3" color={COLORS.agents.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'review_notes' && (
        <FlowPacket pathId="rev-to-bld-a3" color={COLORS.agents.border} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_READ) && (
        <FlowPacket pathId="exp-tool-a3" color={COLORS.tools.border} duration={0.9} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_WRITE) && (
        <FlowPacket pathId="bld-write-a3" color={COLORS.tools.border} duration={0.9} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_TESTS) && (
        <FlowPacket pathId="bld-tests-a3" color={COLORS.tools.border} duration={1.1} stepKey={stepKey}/>
      )}

      {/* Legend */}
      <g transform="translate(30, 355)">
        <rect width="10" height="10" rx="2" fill={COLORS.agents.bg} stroke={COLORS.agents.border}/>
        <text x="14" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Agent</text>
        <rect x="65" width="10" height="10" rx="2" fill={COLORS.tools.bg} stroke={COLORS.tools.border}/>
        <text x="79" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Tools</text>
        <rect x="125" width="14" height="5" rx="2" fill={COLORS.agents.border} opacity="0.7"/>
        <text x="142" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Context meter</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Act 4 Diagram — agentic loop + compaction engine + audit log
// ---------------------------------------------------------------------------
function Act4Diagram({ activeComponents, messageFlow, stepKey }) {
  const active = new Set(activeComponents || []);
  const hasToolFlow = active.has(C.TOOL_READ) || active.has(C.TOOL_TESTS) || active.has(C.TOOL_WRITE);

  return (
    <svg viewBox="0 0 620 500" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="dots-a4" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1e293b"/>
        </pattern>
        <path id="send-req-a4"   d="M 150 140 L 150 115 L 456 115 L 456 148"/>
        <path id="get-resp-a4"   d="M 360 196 L 360 212 L 150 212 L 150 196"/>
        <path id="to-tool-a4"    d="M 456 185 C 530 240 20 240 90 290"/>
        <path id="tool-back-a4"  d="M 90 290 C 20 240 20 212 150 212"/>
        <path id="dispatch-r-a4" d="M 150 315 L 200 315"/>
        <path id="dispatch-t-a4" d="M 150 315 C 200 315 280 315 310 315"/>
        <path id="dispatch-w-a4" d="M 150 315 C 200 315 380 315 420 315"/>
        <path id="compact-a4"    d="M 90 196 C 70 340 70 400 105 420"/>
        <path id="to-audit-a4"   d="M 180 448 L 230 448"/>
      </defs>
      <rect width="620" height="500" fill="#0f172a"/>
      <rect width="620" height="500" fill="url(#dots-a4)"/>

      {/* Structural lines — main loop */}
      {/* Request above (Harness → API → decision) */}
      <path d="M 150 140 L 150 115 L 456 115 L 456 148" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* API notch */}
      <line x1="290" y1="140" x2="290" y2="115" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      {/* Response below (API → Harness) */}
      <path d="M 360 196 L 360 212 L 150 212 L 150 196" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Tool dispatch loop */}
      <path d="M 456 188 C 530 240 20 240 90 290" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M 90 290 C 20 240 20 212 150 212" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="200" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="310" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="150" y1="315" x2="420" y2="315" stroke="#334155" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Compaction lines */}
      <path d="M 90 196 C 70 340 70 400 105 420" fill="none" stroke={active.has(C.COMPACTOR) ? COLORS.compaction.border : '#334155'} strokeWidth={active.has(C.COMPACTOR) ? 2 : 1} strokeDasharray={active.has(C.COMPACTOR) ? '0' : '4 3'}/>
      <line x1="180" y1="448" x2="230" y2="448" stroke={active.has(C.AUDIT_LOG) ? COLORS.agents.border : '#334155'} strokeWidth="1" strokeDasharray="4 3"/>

      {/* Flow labels */}
      <text x="255" y="106" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">API call →</text>
      <text x="255" y="226" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">← response</text>

      {/* 70% threshold label */}
      <text x="30" y="245" fontSize="8" fill={COLORS.compaction.text} fontFamily="monospace" opacity={active.has(C.COMPACTOR) ? 1 : 0.4}>
        70% threshold ↑
      </text>

      {/* Boxes */}
      <CompBox rect={ACT4_RECTS[C.HARNESS]}    active={active.has(C.HARNESS)}    stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.API]}         active={active.has(C.API)}         stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS['decision']}    active={active.has(C.API)}         stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS['dispatch']}    active={hasToolFlow}               stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.TOOL_READ]}   active={active.has(C.TOOL_READ)}   stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.TOOL_TESTS]}  active={active.has(C.TOOL_TESTS)}  stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.TOOL_WRITE]}  active={active.has(C.TOOL_WRITE)}  stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.COMPACTOR]}   active={active.has(C.COMPACTOR)}   stepKey={stepKey}/>
      <CompBox rect={ACT4_RECTS[C.AUDIT_LOG]}   active={active.has(C.AUDIT_LOG)}   stepKey={stepKey}/>

      {/* Animated flow packets */}
      {messageFlow && messageFlow.type === 'api_request' && (
        <FlowPacket pathId="send-req-a4" color={COLORS.harness.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'api_response' && (
        <FlowPacket pathId="get-resp-a4" color={COLORS.genai.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'tool_dispatch' && (
        <FlowPacket pathId="to-tool-a4" color={COLORS.harness.border} stepKey={stepKey}/>
      )}
      {messageFlow && messageFlow.type === 'tool_result' && (
        <FlowPacket pathId="tool-back-a4" color={COLORS.tools.border} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_READ) && (
        <FlowPacket pathId="dispatch-r-a4" color={COLORS.tools.border} duration={0.8} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_TESTS) && (
        <FlowPacket pathId="dispatch-t-a4" color={COLORS.tools.border} duration={1.0} stepKey={stepKey}/>
      )}
      {active.has(C.TOOL_WRITE) && (
        <FlowPacket pathId="dispatch-w-a4" color={COLORS.tools.border} duration={1.2} stepKey={stepKey}/>
      )}
      {active.has(C.COMPACTOR) && (
        <FlowPacket pathId="compact-a4" color={COLORS.compaction.border} duration={1.5} stepKey={stepKey}/>
      )}
      {active.has(C.AUDIT_LOG) && (
        <FlowPacket pathId="to-audit-a4" color={COLORS.agents.border} duration={0.8} stepKey={stepKey}/>
      )}

      {/* Legend */}
      <g transform="translate(30, 475)">
        <rect width="10" height="10" rx="2" fill={COLORS.harness.bg} stroke={COLORS.harness.border}/>
        <text x="14" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Harness</text>
        <rect x="75" width="10" height="10" rx="2" fill={COLORS.genai.bg} stroke={COLORS.genai.border}/>
        <text x="89" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">API/Model</text>
        <rect x="160" width="10" height="10" rx="2" fill={COLORS.tools.bg} stroke={COLORS.tools.border}/>
        <text x="174" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Tools</text>
        <rect x="215" width="10" height="10" rx="2" fill={COLORS.compaction.bg} stroke={COLORS.compaction.border}/>
        <text x="229" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Compaction</text>
        <rect x="310" width="10" height="10" rx="2" fill={COLORS.agents.bg} stroke={COLORS.agents.border}/>
        <text x="324" y="9" fontSize="9" fill="#94a3b8" fontFamily="monospace">Storage</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main ArchitectureDiagram — switches layout based on currentAct
// ---------------------------------------------------------------------------
function ArchitectureDiagram({ currentAct, activeComponents, messageFlow, stepKey, contextState, activeAgent }) {
  switch (currentAct) {
    case 1:
      return <Act1Diagram activeComponents={activeComponents} messageFlow={messageFlow} stepKey={stepKey}/>;
    case 2:
      return <Act2Diagram activeComponents={activeComponents} messageFlow={messageFlow} stepKey={stepKey}/>;
    case 3:
      return <Act3Diagram activeComponents={activeComponents} messageFlow={messageFlow} stepKey={stepKey} contextState={contextState} activeAgent={activeAgent}/>;
    case 4:
      return <Act4Diagram activeComponents={activeComponents} messageFlow={messageFlow} stepKey={stepKey}/>;
    default:
      return <Act1Diagram activeComponents={activeComponents} messageFlow={messageFlow} stepKey={stepKey}/>;
  }
}
