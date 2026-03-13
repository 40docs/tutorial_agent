// ============================================================================
// SECTION 1-5: SIMULATION ENGINE
// Agentic AI Glass Box Demo
// ============================================================================

const { useState, useCallback, useEffect, useRef, useMemo } = React;

// ============================================================================
// 1. SHARED CONSTANTS
// ============================================================================

const COLORS = {
  genai:      { bg: '#581c87', border: '#a855f7', text: '#c084fc', glow: 'rgba(168,85,247,0.4)' },
  harness:    { bg: '#92400e', border: '#f59e0b', text: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  tools:      { bg: '#065f46', border: '#10b981', text: '#34d399', glow: 'rgba(16,185,129,0.4)' },
  agents:     { bg: '#1e3a5f', border: '#3b82f6', text: '#60a5fa', glow: 'rgba(59,130,246,0.4)' },
  compaction: { bg: '#7c2d12', border: '#f97316', text: '#fb923c', glow: 'rgba(249,115,22,0.4)' },
  user:       { bg: '#052e16', border: '#4ade80', text: '#86efac', glow: 'rgba(74,222,128,0.4)' },
};

const COMPONENT_IDS = {
  USER:         'user',
  API:          'anthropic-api',
  MODEL:        'model',
  HARNESS:      'harness',
  TOOL_READ:    'tool-read-file',
  TOOL_TESTS:   'tool-run-tests',
  TOOL_WRITE:   'tool-write-file',
  ORCHESTRATOR: 'orchestrator',
  EXPLORER:     'explorer-agent',
  BUILDER:      'builder-agent',
  REVIEWER:     'reviewer-agent',
  COMPACTOR:    'compaction-engine',
  AUDIT_LOG:    'audit-log',
};

const C = COMPONENT_IDS;

const MAX_CONTEXT_TOKENS = 200000;

// ============================================================================
// 2. SIMULATED CODEBASE
// ============================================================================

const SIMULATED_CODEBASE = {
  'src/auth/auth.js': `const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');

/**
 * Authentication module
 * Handles JWT token validation and user sessions
 */

/**
 * Validate a JWT token against expiry and signature
 * @param {Object} token - Token object { value: string, expiry: number }
 * @returns {boolean|Object} false if invalid, decoded payload if valid
 */
const validateToken = (token) => {
  if (!token || !token.value || !token.expiry) {
    return false;
  }

  // Check if the token has expired
  // BUG: token.expiry is stored in Unix seconds, but Date.now() returns milliseconds
  // This comparison is ALWAYS true (seconds < milliseconds), so all tokens appear expired
  if (token.expiry < Date.now()) {  // line 23 — should be: token.expiry * 1000 < Date.now()
    return false;
  }

  try {
    return jwt.verify(token.value, SECRET);
  } catch (err) {
    return false;
  }
};

/**
 * Invalidate a token by adding to blocklist
 */
const invalidateToken = async (tokenValue) => {
  await redis.sadd('token:blocklist', tokenValue);
};

/**
 * Check if token is on blocklist
 */
const isBlocklisted = async (tokenValue) => {
  return await redis.sismember('token:blocklist', tokenValue);
};

// TODO: Implement refresh token rotation - currently refresh tokens are issued
// but never rotated on use, creating a security vulnerability where stolen
// refresh tokens remain valid indefinitely. See ticket AUTH-247.
// This needs to be addressed before the Q3 security audit.

module.exports = { validateToken, invalidateToken, isBlocklisted };`,

  'src/auth/tokens.js': `const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { SECRET, REFRESH_SECRET } = require('../config');

const ACCESS_TOKEN_TTL  = 3600;    // 1 hour in seconds
const REFRESH_TOKEN_TTL = 604800;  // 7 days in seconds

/**
 * Generate an access token for a user
 * Expiry is stored as Unix timestamp in SECONDS
 */
const generateAccessToken = (userId, roles = []) => {
  const expiry = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL;  // SECONDS

  const value = jwt.sign(
    { userId, roles, type: 'access' },
    SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  return { value, expiry };  // expiry is in SECONDS — this is the key mismatch
};

/**
 * Generate a refresh token
 */
const generateRefreshToken = (userId) => {
  const expiry = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL;
  const value = crypto.randomBytes(40).toString('hex');

  return { value, expiry, userId };
};

/**
 * Decode token without verification (for logging only)
 */
const decodeToken = (tokenValue) => {
  try {
    return jwt.decode(tokenValue);
  } catch {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, decodeToken };`,

  'src/middleware/authMiddleware.js': `const { validateToken } = require('../auth/auth');

/**
 * Express middleware for JWT authentication
 * Extracts token from Authorization header and validates it
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const rawToken = authHeader.split(' ')[1];

  // Token format from client: "value:expiry" (base64 encoded)
  let token;
  try {
    const decoded = Buffer.from(rawToken, 'base64').toString('utf-8');
    const [value, expiryStr] = decoded.split(':');
    token = { value, expiry: parseInt(expiryStr, 10) };
  } catch {
    return res.status(401).json({ error: 'Malformed token' });
  }

  const result = validateToken(token);  // This always returns false due to the bug
  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = result;
  next();
};

module.exports = { authMiddleware };`,

  'src/routes/userRoutes.js': `const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const UserService = require('../services/UserService');

/**
 * All routes require valid authentication
 * Due to the auth bug, ALL of these endpoints are returning 401
 */

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getById(req.user.userId);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updated = await UserService.update(req.user.userId, req.body);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings', authMiddleware, async (req, res) => {
  const settings = await UserService.getSettings(req.user.userId);
  res.json({ settings });
});

module.exports = router;`,

  'tests/auth.test.js': `const { validateToken } = require('../src/auth/auth');
const { generateAccessToken } = require('../src/auth/tokens');

describe('validateToken', () => {

  it('should accept a valid, non-expired token', () => {
    const { value, expiry } = generateAccessToken(123);
    // expiry is in SECONDS (e.g. 1741234567)
    // Date.now() is in MILLISECONDS (e.g. 1741234567000)
    // The bug: expiry (seconds) < Date.now() (ms) is ALWAYS true
    // So validateToken always returns false, and this test incorrectly PASSES
    // because we expect false here — but for the wrong reason
    const result = validateToken({ value, expiry });
    expect(result).not.toBe(false);  // This test FAILS — bug is live
  });

  it('should reject an expired token', () => {
    const expiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago in SECONDS
    const { value } = generateAccessToken(123);
    const result = validateToken({ value, expiry });
    // This PASSES — but only because the bug makes ALL tokens appear expired
    // The test is testing the right behavior but for the wrong reason
    expect(result).toBe(false);
  });

  it('should reject a token with no expiry', () => {
    const result = validateToken({ value: 'sometoken' });
    expect(result).toBe(false);  // PASSES correctly
  });

  it('should reject null token', () => {
    expect(validateToken(null)).toBe(false);  // PASSES correctly
  });
});`,
};

// ============================================================================
// 3. TOOL DEFINITIONS (Anthropic API format)
// ============================================================================

const TOOL_DEFINITIONS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the codebase',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'run_tests',
    description: 'Execute the test suite and return results',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Optional specific test file to run' }
      }
    }
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file with new content',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['path', 'content']
    }
  }
];

const SYSTEM_PROMPT = 'You are a senior software engineer. You have access to tools to read files, run tests, and write fixes. Work methodically: read the relevant files first, understand the bug, then fix it and verify.';

// ============================================================================
// 4. PRE-BUILT API PAYLOADS
// ============================================================================

const CODE_SNIPPET = `const validateToken = (token) => {
  if (!token || !token.value || !token.expiry) return false;
  if (token.expiry < Date.now()) {  // line 23
    return false;
  }
  return jwt.verify(token.value, SECRET);
};`;

const API = {

  // --- ACT 1: Traditional GenAI ---

  act1Request1: {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Our authentication is broken — users can't log in. Here's the validation function:\n\n\`\`\`javascript\n${CODE_SNIPPET}\n\`\`\`\n\nFind the bug and suggest a fix.`
      }
    ]
  },

  act1Response1: {
    id: 'msg_act1_001',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: "Looking at the `validateToken` function, I can see a potential issue on line 23. The comparison `token.expiry < Date.now()` might be comparing values in different units.\n\n`Date.now()` returns milliseconds since Unix epoch (e.g., `1741234567000`), while JWT expiry fields are typically stored as Unix timestamps in **seconds** (e.g., `1741234567`).\n\nIf `token.expiry` is in seconds, then it will always be much smaller than `Date.now()` in milliseconds, causing every token to appear expired immediately.\n\n**Suggested fix:**\n```javascript\nif (token.expiry * 1000 < Date.now()) {\n```\nOr alternatively:\n```javascript\nif (token.expiry < Math.floor(Date.now() / 1000)) {\n```\n\nHowever, I can't confirm this without seeing how `token.expiry` is set. If you can share `tokens.js` where the token is generated, I can verify the units being used."
    }],
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    usage: { input_tokens: 892, output_tokens: 198 }
  },

  act1Request2: {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Our authentication is broken — users can't log in. Here's the validation function:\n\n\`\`\`javascript\n${CODE_SNIPPET}\n\`\`\`\n\nFind the bug and suggest a fix.`
      },
      {
        role: 'assistant',
        content: "Looking at the `validateToken` function, I can see a potential issue on line 23. The comparison `token.expiry < Date.now()` might be comparing values in different units.\n\n`Date.now()` returns milliseconds since Unix epoch (e.g., `1741234567000`), while JWT expiry fields are typically stored as Unix timestamps in **seconds** (e.g., `1741234567`).\n\nIf `token.expiry` is in seconds, then it will always be much smaller than `Date.now()` in milliseconds, causing every token to appear expired immediately.\n\n**Suggested fix:**\n```javascript\nif (token.expiry * 1000 < Date.now()) {\n```\n\nHowever, I can't confirm this without seeing how `token.expiry` is set."
      },
      {
        role: 'user',
        content: 'Can you also check tokens.js to confirm the expiry format?'
      }
    ]
  },

  act1Response2: {
    id: 'msg_act1_002',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: "I don't have access to `tokens.js` — you've only shared the `validateToken` function from `auth.js`. To confirm the expiry format, I'd need you to paste the contents of `src/auth/tokens.js`.\n\nBased on what I can see, my best assessment is that `token.expiry` is in seconds (standard JWT practice), which would make the fix `token.expiry * 1000 < Date.now()`. But I can't verify this or check whether the test suite would pass — I'm working only from what's been shared with me."
    }],
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    usage: { input_tokens: 1247, output_tokens: 112 }
  },

  // --- ACT 2: Agentic Loop ---

  act2Request1: {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." }
    ]
  },

  act2Response1: {
    id: 'msg_act2_001', type: 'message', role: 'assistant',
    content: [
      { type: 'text', text: "I'll start by reading the authentication module to understand the code." },
      { type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }
    ],
    model: 'claude-sonnet-4-6', stop_reason: 'tool_use',
    usage: { input_tokens: 612, output_tokens: 58 }
  },

  act2Request2: {
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
      { role: 'assistant', content: [
        { type: 'text', text: "I'll start by reading the authentication module to understand the code." },
        { type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }
      ]},
      { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'toolu_a2_01', content: SIMULATED_CODEBASE['src/auth/auth.js'] }
      ]}
    ]
  },

  act2Response2: {
    id: 'msg_act2_002', type: 'message', role: 'assistant',
    content: [
      { type: 'text', text: "I can see the comparison on line 23: `token.expiry < Date.now()`. The expiry might be in seconds while Date.now() is milliseconds. Let me check tokens.js to confirm how expiry is stored." },
      { type: 'tool_use', id: 'toolu_a2_02', name: 'read_file', input: { path: 'src/auth/tokens.js' } }
    ],
    model: 'claude-sonnet-4-6', stop_reason: 'tool_use',
    usage: { input_tokens: 1205, output_tokens: 74 }
  },

  act2Request3: {
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
      { role: 'assistant', content: [
        { type: 'text', text: "I'll start by reading the authentication module to understand the code." },
        { type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_01', content: SIMULATED_CODEBASE['src/auth/auth.js'] }]},
      { role: 'assistant', content: [
        { type: 'text', text: "I can see the comparison on line 23. Let me check tokens.js to confirm how expiry is stored." },
        { type: 'tool_use', id: 'toolu_a2_02', name: 'read_file', input: { path: 'src/auth/tokens.js' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_02', content: SIMULATED_CODEBASE['src/auth/tokens.js'] }]}
    ]
  },

  act2Response3: {
    id: 'msg_act2_003', type: 'message', role: 'assistant',
    content: [
      { type: 'text', text: "Confirmed. `tokens.js` line 14: `Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL` — expiry is in **seconds**. But auth.js compares against `Date.now()` which is milliseconds. Let me run the tests first to see the current state." },
      { type: 'tool_use', id: 'toolu_a2_03', name: 'run_tests', input: { target: 'tests/auth.test.js' } }
    ],
    model: 'claude-sonnet-4-6', stop_reason: 'tool_use',
    usage: { input_tokens: 1892, output_tokens: 88 }
  },

  act2Request4: {
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_01', content: SIMULATED_CODEBASE['src/auth/auth.js'] }]},
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'toolu_a2_02', name: 'read_file', input: { path: 'src/auth/tokens.js' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_02', content: SIMULATED_CODEBASE['src/auth/tokens.js'] }]},
      { role: 'assistant', content: [
        { type: 'text', text: "Confirmed. expiry is in seconds. Let me run the tests to see the current state." },
        { type: 'tool_use', id: 'toolu_a2_03', name: 'run_tests', input: { target: 'tests/auth.test.js' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_03', content: `FAIL tests/auth.test.js
  validateToken
    ✓ should reject an expired token (3ms)
    ✓ should reject a token with no expiry (1ms)
    ✓ should reject null token (0ms)
    ✗ should accept a valid, non-expired token (4ms)
      Expected: not false
      Received: false

Tests: 1 failed, 3 passed, 4 total` }]}
    ]
  },

  act2Response4: {
    id: 'msg_act2_004', type: 'message', role: 'assistant',
    content: [
      { type: 'text', text: "As expected — valid tokens are being rejected. Now I'll write the fix: multiply expiry by 1000 to convert seconds to milliseconds before comparison." },
      { type: 'tool_use', id: 'toolu_a2_04', name: 'write_file', input: {
        path: 'src/auth/auth.js',
        content: SIMULATED_CODEBASE['src/auth/auth.js'].replace(
          'if (token.expiry < Date.now()) {  // line 23 — should be: token.expiry * 1000 < Date.now()',
          'if (token.expiry * 1000 < Date.now()) {  // fixed: convert seconds to milliseconds'
        )
      }}
    ],
    model: 'claude-sonnet-4-6', stop_reason: 'tool_use',
    usage: { input_tokens: 2617, output_tokens: 112 }
  },

  act2Request5: {
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_01', content: SIMULATED_CODEBASE['src/auth/auth.js'] }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_02', name: 'read_file', input: { path: 'src/auth/tokens.js' } }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_02', content: SIMULATED_CODEBASE['src/auth/tokens.js'] }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_03', name: 'run_tests', input: {} }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_03', content: 'FAIL tests/auth.test.js\n  ✗ should accept a valid, non-expired token\n  ✓ should reject an expired token\n  ✓ should reject null token' }]},
      { role: 'assistant', content: [
        { type: 'text', text: "Writing the fix now." },
        { type: 'tool_use', id: 'toolu_a2_04', name: 'write_file', input: { path: 'src/auth/auth.js', content: '...(fixed content)...' } }
      ]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_04', content: 'File written successfully: src/auth/auth.js' }]}
    ]
  },

  act2Response5: {
    id: 'msg_act2_005', type: 'message', role: 'assistant',
    content: [
      { type: 'text', text: "Fix applied. Running tests to verify." },
      { type: 'tool_use', id: 'toolu_a2_05', name: 'run_tests', input: { target: 'tests/auth.test.js' } }
    ],
    model: 'claude-sonnet-4-6', stop_reason: 'tool_use',
    usage: { input_tokens: 3102, output_tokens: 45 }
  },

  act2Request6: {
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, tools: TOOL_DEFINITIONS,
    messages: [
      { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_01', name: 'read_file', input: { path: 'src/auth/auth.js' } }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_01', content: SIMULATED_CODEBASE['src/auth/auth.js'] }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_02', name: 'read_file', input: { path: 'src/auth/tokens.js' } }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_02', content: SIMULATED_CODEBASE['src/auth/tokens.js'] }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_03', name: 'run_tests', input: {} }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_03', content: 'FAIL — 1 test failing' }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_04', name: 'write_file', input: { path: 'src/auth/auth.js', content: '...fixed...' } }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_04', content: 'File written successfully' }]},
      { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_a2_05', name: 'run_tests', input: {} }]},
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a2_05', content: `PASS tests/auth.test.js
  validateToken
    ✓ should accept a valid, non-expired token (2ms)
    ✓ should reject an expired token (1ms)
    ✓ should reject a token with no expiry (0ms)
    ✓ should reject null token (0ms)

Tests: 4 passed, 4 total
Time: 0.8s` }]}
    ]
  },

  act2Response6: {
    id: 'msg_act2_006', type: 'message', role: 'assistant',
    content: [{
      type: 'text',
      text: "All 4 tests passing. The bug was a units mismatch: `token.expiry` was stored in Unix **seconds** (from `Math.floor(Date.now() / 1000)` in tokens.js), but the comparison used `Date.now()` which returns **milliseconds**. Since seconds are always ~1000x smaller than the equivalent millisecond value, every token appeared expired immediately.\n\n**Fix applied:** `token.expiry * 1000 < Date.now()` — converting seconds to milliseconds before comparison.\n\nUsers should now be able to log in successfully."
    }],
    model: 'claude-sonnet-4-6', stop_reason: 'end_turn',
    usage: { input_tokens: 3587, output_tokens: 147 }
  },

  // --- ACT 3: Multi-Agent (representative payloads) ---

  orchestratorRequest: {
    model: 'claude-sonnet-4-6', max_tokens: 2048,
    system: 'You are an orchestrator agent. Break down complex engineering tasks into a plan for specialist agents: an Explorer (reads code, produces findings), a Builder (writes fixes), and a Reviewer (validates changes).',
    tools: TOOL_DEFINITIONS,
    messages: [{ role: 'user', content: "The authentication module has a bug — users can't log in. Coordinate the team to find and fix it." }]
  },

  orchestratorResponse: {
    id: 'msg_orch_001', type: 'message', role: 'assistant',
    content: [{ type: 'text', text: "I'll coordinate three specialist agents:\n\n**Plan:**\n1. **Explorer Agent** — Read all auth-related files, trace the bug, produce a handoff document\n2. **Builder Agent** — Receive Explorer's findings, write the fix, run verification tests\n3. **Reviewer Agent** — Review the patch with fresh context, validate correctness\n\nDeploying Explorer now." }],
    model: 'claude-sonnet-4-6', stop_reason: 'end_turn',
    usage: { input_tokens: 387, output_tokens: 98 }
  },

  explorerHandoff: {
    title: 'Codebase Exploration Summary',
    recipient: 'builder_agent',
    task: "Find and fix the authentication bug preventing user logins",
    architectureOverview: "JWT auth system with three key modules: auth.js (validation), tokens.js (generation), authMiddleware.js (Express integration).",
    bugLocation: {
      file: 'src/auth/auth.js',
      line: 23,
      code: 'if (token.expiry < Date.now())',
      issue: "token.expiry is stored in Unix SECONDS (see tokens.js line 14: Math.floor(Date.now() / 1000)). Date.now() returns MILLISECONDS. Seconds are always ~1000x smaller, so this comparison is always true — all tokens appear expired."
    },
    fix: "Change to: if (token.expiry * 1000 < Date.now())",
    testNote: "tests/auth.test.js has a test 'should accept a valid, non-expired token' that currently fails. After fix it should pass. The 'should reject an expired token' test currently passes but for the wrong reason.",
    filesToChange: ['src/auth/auth.js'],
    filesToIgnore: ['src/routes/userRoutes.js', 'src/middleware/authMiddleware.js'],
    tokenCount: 312
  },

  // --- ACT 4: Compaction ---

  compactionSummary: {
    summary: "Investigating auth bug in validateToken() (src/auth/auth.js line 23). Root cause identified: token.expiry is in Unix seconds, compared against Date.now() which is milliseconds. Fix: multiply expiry by 1000. Confirmed by reading tokens.js which uses Math.floor(Date.now() / 1000). Tests show 1 failing: 'should accept valid non-expired token'. Fix is: change `token.expiry < Date.now()` to `token.expiry * 1000 < Date.now()`. Ready to apply fix.",
    tokenCount: 287
  },

  whatWasLost: [
    {
      title: 'Verbose middleware trace',
      detail: 'Full request flow analysis through authMiddleware.js showing how the 401 error propagates to clients...',
      risk: 'low'
    },
    {
      title: 'Refresh token TODO (auth.js line ~92)',
      detail: 'TODO: Implement refresh token rotation - currently refresh tokens are issued but never rotated on use, creating a security vulnerability where stolen refresh tokens remain valid indefinitely. See ticket AUTH-247.',
      risk: 'high',
      flagged: true
    },
    {
      title: 'Routes investigation notes',
      detail: 'Analysis of userRoutes.js showing all endpoints returning 401 due to the auth bug...',
      risk: 'low'
    }
  ],
};

// ============================================================================
// 5. ACT METADATA
// ============================================================================

const ACT_METADATA = [
  null,
  {
    number: 1,
    title: 'Traditional GenAI',
    subtitle: 'The Pure Function',
    description: 'A single API call in, a single response out. The model has no tools, no memory, no loop. Watch the context window fill as history accumulates — and see what happens when the model needs information it was never given.',
    watchFor: 'Notice how the entire conversation history is re-sent on every call. The model has no memory — just a growing transcript. And when asked about tokens.js, it can only admit it doesn\'t have access.',
    accentColor: '#a855f7',
  },
  {
    number: 2,
    title: 'The Agentic Loop',
    subtitle: 'Tools and Feedback',
    description: 'The model gains tools and a feedback cycle. It reads files, runs tests, writes fixes, and verifies — driven by the harness. This is the first time the model can be wrong and recover.',
    watchFor: 'The stop_reason field tells you everything: "tool_use" means the loop continues, "end_turn" means it\'s done. Watch the context window grow with each iteration — tool results accumulate fast.',
    accentColor: '#f59e0b',
  },
  {
    number: 3,
    title: 'Multi-Agent Systems',
    subtitle: 'Division of Cognitive Labor',
    description: 'Four specialized agents tackle the same task. Each gets its own fresh context, its own system prompt, its own tool set. Watch how 40,000 tokens of exploration compress to a 300-token handoff.',
    watchFor: 'Compare the Explorer\'s context fill (85%) with the Builder\'s starting context (nearly empty). The handoff document is the key — it\'s where all the compression happens.',
    accentColor: '#3b82f6',
  },
  {
    number: 4,
    title: 'Compaction',
    subtitle: 'The Necessary Tradeoff',
    description: 'When the context window fills to 70%, the harness triggers compaction. Watch the token count drop dramatically — and then see what information was lost in the process.',
    watchFor: 'The "What Was Lost" panel reveals items that were present in the raw context but did not survive compaction. One of them — the refresh token TODO — will matter later.',
    accentColor: '#f97316',
  },
];

// ============================================================================
// 6. STEP SEQUENCES (49 total steps)
// ============================================================================

const mk = (systemPromptTokens, conversationTokens, toolResultTokens) => {
  const totalTokens = systemPromptTokens + conversationTokens + toolResultTokens;
  const percentUsed = parseFloat((totalTokens / MAX_CONTEXT_TOKENS * 100).toFixed(2));
  const breakdown = [
    { label: 'System prompt', tokens: systemPromptTokens, color: '#a855f7' },
    { label: 'Conversation', tokens: conversationTokens, color: '#f59e0b' },
  ];
  if (toolResultTokens > 0) breakdown.push({ label: 'Tool results', tokens: toolResultTokens, color: '#10b981' });
  return { systemPromptTokens, conversationTokens, toolResultTokens, totalTokens, percentUsed, breakdown };
};

const STEPS = [

  // ===========================================================================
  // ACT 1 — Traditional GenAI (8 steps)
  // ===========================================================================

  {
    id: 'act1-step1', act: 1, phase: 'message',
    label: 'User Sends Code + Question',
    activeComponents: [C.USER, C.HARNESS],
    messageFlow: { from: C.USER, to: C.HARNESS, type: 'user_prompt', label: 'User prompt' },
    message: null,
    narration: "The user pastes auth.js and asks: \"Find the bug.\" The harness receives this and prepares an API request. There are no tools declared. No loop. No memory. Just one shot at an answer.",
    stateMutations: { systemPhase: 'processing', harnessState: 'building_request' },
    chatUpdate: {
      role: 'user',
      content: "The authentication module has a bug — users can't log in. Here's validateToken from auth.js — find the bug and suggest a fix.",
      codeAttachment: {
        filename: 'src/auth/auth.js',
        code: `const validateToken = (token) => {
  if (!token || !token.value || !token.expiry) {
    return false;
  }

  // Check if the token has expired
  // BUG on line 23: token.expiry is in seconds, Date.now() is milliseconds
  if (token.expiry < Date.now()) {
    return false;
  }

  try {
    return jwt.verify(token.value, SECRET);
  } catch (err) {
    return false;
  }
};`,
      },
    },
    contextState: mk(500, 392, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step2', act: 1, phase: 'api_call',
    label: 'API Request #1 — No Tools',
    activeComponents: [C.HARNESS, C.API],
    messageFlow: { from: C.HARNESS, to: C.API, type: 'api_request', label: 'Request #1' },
    message: API.act1Request1,
    narration: "The harness sends a single HTTP request to the Anthropic API. The messages array has one entry. Notice what's missing: no tools array. The model will receive this payload, run inference once, and return text. That's it. One request, one response.",
    stateMutations: { harnessState: 'waiting_for_api', apiCallCount: 1 },
    chatUpdate: null,
    contextState: mk(500, 392, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step3', act: 1, phase: 'api_response',
    label: 'Model Responds — A Guess',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response', label: 'Response #1' },
    message: API.act1Response1,
    narration: "The model returns a text response. stop_reason is end_turn — it's done. The model spotted the likely issue (seconds vs milliseconds) and even guessed at the fix. But look carefully: it says \"If token.expiry is in seconds...\" and \"I can't confirm without seeing tokens.js.\" It's reasoning from training data, not from evidence.",
    stateMutations: { harnessState: 'rendering' },
    chatUpdate: null,
    contextState: mk(500, 392, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step4', act: 1, phase: 'render',
    label: 'Response Rendered',
    activeComponents: [C.HARNESS, C.USER],
    messageFlow: { from: C.HARNESS, to: C.USER, type: 'harness_response', label: 'Response delivered' },
    message: null,
    narration: "The model's response appears in the chat. It gave a plausible answer — but it couldn't verify. It couldn't read tokens.js. It couldn't run the tests to confirm the fix works. It made an educated guess. That's all traditional GenAI can do: pattern-match from training, not from evidence.",
    stateMutations: { harnessState: 'idle', systemPhase: 'idle' },
    chatUpdate: { role: 'assistant', content: API.act1Response1.content[0].text },
    contextState: mk(500, 392, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step5', act: 1, phase: 'message',
    label: 'Follow-Up: Check tokens.js',
    activeComponents: [C.USER, C.HARNESS],
    messageFlow: { from: C.USER, to: C.HARNESS, type: 'user_prompt', label: 'Follow-up' },
    message: null,
    narration: "The user asks a natural follow-up: \"Can you check tokens.js to confirm?\" The harness now builds a second API request. Watch what happens to the messages array — the entire conversation so far must be re-sent. The model has no memory. It only knows what's in the payload.",
    stateMutations: { systemPhase: 'processing', harnessState: 'building_request' },
    chatUpdate: { role: 'user', content: 'Can you also check tokens.js to confirm the expiry format?' },
    contextState: mk(500, 745, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step6', act: 1, phase: 'api_call',
    label: 'API Request #2 — Full History Re-sent',
    activeComponents: [C.HARNESS, C.API],
    messageFlow: { from: C.HARNESS, to: C.API, type: 'api_request', label: 'Request #2' },
    message: API.act1Request2,
    narration: "Look at this payload. The messages array now has 3 entries: the original user message, the model's full response, and the new follow-up question. Every token from turn 1 is being re-sent. The model doesn't \"remember\" — the harness re-packages the full transcript into each new request. Token count jumps from 892 to 1,247.",
    stateMutations: { harnessState: 'waiting_for_api', apiCallCount: 2 },
    chatUpdate: null,
    contextState: mk(500, 1247, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step7', act: 1, phase: 'api_response',
    label: 'Model: I Cannot Access tokens.js',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response', label: 'Response #2' },
    message: API.act1Response2,
    narration: "The model responds: \"I don't have access to tokens.js.\" This is the honest truth. The model can only analyze what was literally pasted into the messages array. It cannot look up files, run code, or reach outside the payload. This is a structural limit, not an intelligence limit.",
    stateMutations: { harnessState: 'rendering' },
    chatUpdate: { role: 'assistant', content: API.act1Response2.content[0].text },
    contextState: mk(500, 1247, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act1-step8', act: 1, phase: 'insight',
    label: 'Act 1 Summary',
    activeComponents: [C.HARNESS],
    messageFlow: null,
    message: null,
    narration: "Traditional GenAI: one shot, no tools, no loop. The model gave a plausible guess but couldn't verify it. It couldn't read files it wasn't given. It couldn't run the tests. And every turn re-sends the full history, growing the payload. This is powerful for well-bounded tasks — but for anything requiring discovery or verification, there has to be a better way.",
    stateMutations: { systemPhase: 'idle', harnessState: 'idle', apiCallCount: 0 },
    chatUpdate: null,
    contextState: mk(500, 1247, 0),
    activeAgent: null, compactionData: null,
  },

  // ===========================================================================
  // ACT 2 — The Agentic Loop (14 steps)
  // ===========================================================================

  {
    id: 'act2-step1', act: 2, phase: 'setup',
    label: 'Harness Initializes with Tools',
    activeComponents: [C.HARNESS, C.TOOL_READ, C.TOOL_TESTS, C.TOOL_WRITE],
    messageFlow: null,
    message: TOOL_DEFINITIONS,
    narration: "The harness initializes with a tools array declared: read_file, run_tests, write_file. Each tool has a name, description, and JSON Schema for its inputs. These will be sent to the model on every API call. The model can now request tool execution — but it can't execute them itself. That's the harness's job.",
    stateMutations: { systemPhase: 'idle', harnessState: 'idle' },
    chatUpdate: null,
    contextState: mk(500, 0, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step2', act: 2, phase: 'message',
    label: 'User Submits Task',
    activeComponents: [C.USER, C.HARNESS],
    messageFlow: null,
    message: null,
    narration: "Same task as Act 1: find and fix the auth bug. But this time the harness is set up very differently. The model will receive tool definitions. Instead of guessing, it can actually read the files it needs. The harness is ready to execute whatever the model requests.",
    stateMutations: { systemPhase: 'processing', harnessState: 'building_request' },
    chatUpdate: { role: 'user', content: "The authentication module has a bug — users can't log in. Find the bug and fix it." },
    contextState: mk(500, 112, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step3', act: 2, phase: 'api_call',
    label: 'API Request #1 — With Tools',
    activeComponents: [C.HARNESS, C.API],
    messageFlow: { from: C.HARNESS, to: C.API, type: 'api_request', label: 'Request #1' },
    message: API.act2Request1,
    narration: "Notice this request includes a tools array — 3 tool definitions with full JSON Schema. The harness always sends all available tools. The model will decide whether to use them. Token count is higher than Act 1's first request because the tool definitions themselves consume ~350 tokens.",
    stateMutations: { harnessState: 'waiting_for_api', apiCallCount: 1 },
    chatUpdate: null,
    contextState: mk(500, 612, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step4', act: 2, phase: 'api_response',
    label: 'Model Returns tool_use — Not Text',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_tool_use', label: 'Response #1' },
    message: API.act2Response1,
    narration: "This is different from Act 1. Instead of text, the model returns a tool_use block: { name: \"read_file\", input: { path: \"src/auth/auth.js\" } }. And the stop_reason is \"tool_use\" — not \"end_turn\". The model has stopped generating and is waiting for the tool result. The harness must now execute the tool.",
    stateMutations: { harnessState: 'executing_tool', currentTool: 'read_file' },
    chatUpdate: { role: 'assistant', content: "I'll start by reading the authentication module to understand the code.", toolCalls: [{ name: 'read_file', input: { path: 'src/auth/auth.js' }, id: 'toolu_a2_01' }] },
    contextState: mk(500, 670, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step5', act: 2, phase: 'tool_execute',
    label: 'Harness Executes read_file',
    activeComponents: [C.HARNESS, C.TOOL_READ],
    messageFlow: { from: C.HARNESS, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { file: 'src/auth/auth.js', contents: SIMULATED_CODEBASE['src/auth/auth.js'] },
    narration: "The harness parses the tool_use block, dispatches to the read_file function, and gets the file contents back. The harness then injects this as a tool_result into the messages array — the model will see it on the next API call. Context is growing: the full auth.js content (~800 tokens) just joined the payload.",
    stateMutations: { harnessState: 'injecting_result', currentTool: null },
    chatUpdate: { role: 'assistant', toolResults: [{ content: 'Read src/auth/auth.js — 48 lines', tool_use_id: 'toolu_a2_01' }] },
    contextState: mk(500, 670, 850),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step6', act: 2, phase: 'api_response',
    label: 'Model Returns tool_use — tokens.js',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_tool_use', label: 'Response #2' },
    message: API.act2Response2,
    narration: "The model reads auth.js, spots the suspicious comparison on line 23, and decides it needs to see tokens.js to confirm how expiry is stored. Another tool_use, another stop_reason: \"tool_use\". The loop continues. The model is building evidence before committing to a fix — this is the self-grounding that GenAI lacked.",
    stateMutations: { harnessState: 'executing_tool', currentTool: 'read_file', apiCallCount: 2 },
    chatUpdate: { role: 'assistant', content: "I can see a suspicious comparison on line 23. I need to check tokens.js to confirm how expiry is stored.", toolCalls: [{ name: 'read_file', input: { path: 'src/auth/tokens.js' }, id: 'toolu_a2_02' }] },
    contextState: mk(500, 1205, 850),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step7', act: 2, phase: 'tool_execute',
    label: 'Harness Executes read_file — tokens.js',
    activeComponents: [C.HARNESS, C.TOOL_READ],
    messageFlow: { from: C.HARNESS, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { file: 'src/auth/tokens.js', contents: SIMULATED_CODEBASE['src/auth/tokens.js'] },
    narration: "tokens.js is read. Line 14 is the smoking gun: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL. The expiry is stored in seconds. Now the model has the evidence it needs. Context has grown again — another ~700 tokens of file contents added to the payload.",
    stateMutations: { harnessState: 'injecting_result' },
    chatUpdate: { role: 'assistant', toolResults: [{ content: 'Read src/auth/tokens.js — 38 lines', tool_use_id: 'toolu_a2_02' }] },
    contextState: mk(500, 1205, 1580),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step8', act: 2, phase: 'api_response',
    label: 'Model Returns tool_use — run_tests',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_tool_use', label: 'Response #3' },
    message: API.act2Response3,
    narration: "Bug confirmed. But the model doesn't just write the fix — it runs the tests first to understand the current state. This is methodical, evidence-driven reasoning. It wants to see what's failing before changing anything. A human engineer would do the same.",
    stateMutations: { harnessState: 'executing_tool', currentTool: 'run_tests', apiCallCount: 3 },
    chatUpdate: { role: 'assistant', content: "Bug confirmed — expiry is in seconds but Date.now() is milliseconds. Let me run the tests to see the current state.", toolCalls: [{ name: 'run_tests', input: { target: 'tests/auth.test.js' }, id: 'toolu_a2_03' }] },
    contextState: mk(500, 1892, 1580),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step9', act: 2, phase: 'tool_execute',
    label: 'Harness Executes run_tests',
    activeComponents: [C.HARNESS, C.TOOL_TESTS],
    messageFlow: { from: C.HARNESS, to: C.TOOL_TESTS, type: 'tool_call', label: 'run_tests' },
    message: { result: 'FAIL — 1 test failing: "should accept a valid, non-expired token"' },
    narration: "Test results: 3 pass, 1 fails. The failing test is \"should accept a valid, non-expired token\" — exactly what we'd expect from this bug. Interesting: the \"should reject an expired token\" test passes, but only because the bug makes ALL tokens appear expired. The tests are misleading. Context now at ~5,700 tokens.",
    stateMutations: { harnessState: 'injecting_result', currentTool: null },
    chatUpdate: { role: 'assistant', toolResults: [{ content: 'FAIL — 1 failing: should accept a valid, non-expired token', tool_use_id: 'toolu_a2_03', isError: true }] },
    contextState: mk(500, 1892, 2480),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step10', act: 2, phase: 'api_response',
    label: 'Model Returns tool_use — write_file (fix)',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_tool_use', label: 'Response #4' },
    message: API.act2Response4,
    narration: "The model now writes the fix: change line 23 from token.expiry < Date.now() to token.expiry * 1000 < Date.now(). The write_file tool call contains the complete corrected file. Note: this is the model requesting the write — the harness will execute it.",
    stateMutations: { harnessState: 'executing_tool', currentTool: 'write_file', apiCallCount: 4 },
    chatUpdate: { role: 'assistant', content: "The fix is to multiply token.expiry by 1000 before comparing with Date.now().", toolCalls: [{ name: 'write_file', input: { path: 'src/auth/auth.js' }, id: 'toolu_a2_04' }] },
    contextState: mk(500, 2617, 2480),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step11', act: 2, phase: 'tool_execute',
    label: 'Harness Executes write_file',
    activeComponents: [C.HARNESS, C.TOOL_WRITE],
    messageFlow: { from: C.HARNESS, to: C.TOOL_WRITE, type: 'tool_call', label: 'write_file' },
    message: { file: 'src/auth/auth.js', action: 'written', lines: 48 },
    narration: "The harness writes the fixed file to disk. The side effect has happened in the real world. The model requested it, the harness executed it. This clean separation — model requests, harness acts — is fundamental to the agentic architecture.",
    stateMutations: { harnessState: 'injecting_result', currentTool: null },
    chatUpdate: { role: 'assistant', toolResults: [{ content: 'File written: src/auth/auth.js', tool_use_id: 'toolu_a2_04' }] },
    contextState: mk(500, 2617, 2650),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step12', act: 2, phase: 'api_response',
    label: 'Model Returns tool_use — Verify Tests',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_tool_use', label: 'Response #5' },
    message: API.act2Response5,
    narration: "The model doesn't stop at writing the fix — it runs the tests again to verify. This is the self-correction loop in action: try → observe → verify. If the tests still failed, the model would iterate. It won't return end_turn until it has evidence that the fix works.",
    stateMutations: { harnessState: 'executing_tool', currentTool: 'run_tests', apiCallCount: 5 },
    chatUpdate: { role: 'assistant', content: "Fix applied. Let me verify by running the tests again.", toolCalls: [{ name: 'run_tests', input: {}, id: 'toolu_a2_05' }] },
    contextState: mk(500, 3102, 2650),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step13', act: 2, phase: 'tool_execute',
    label: 'Tests Pass — Fix Verified',
    activeComponents: [C.HARNESS, C.TOOL_TESTS],
    messageFlow: { from: C.HARNESS, to: C.TOOL_TESTS, type: 'tool_call', label: 'run_tests' },
    message: { result: 'PASS — 4/4 tests passing' },
    narration: "All 4 tests pass. The fix is verified. The harness injects the successful test output as a tool_result. Now the model has all the evidence it needs to write a final summary and return end_turn.",
    stateMutations: { harnessState: 'injecting_result', currentTool: null },
    chatUpdate: { role: 'assistant', toolResults: [{ content: 'PASS — 4/4 tests passing', tool_use_id: 'toolu_a2_05' }] },
    contextState: mk(500, 3102, 3350),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act2-step14', act: 2, phase: 'api_response',
    label: 'Model Returns end_turn — Done',
    activeComponents: [C.API, C.HARNESS],
    messageFlow: { from: C.API, to: C.HARNESS, type: 'api_response_end_turn', label: 'Response #6' },
    message: API.act2Response6,
    narration: "stop_reason: \"end_turn\". The model is done. 6 API calls, 5 tool executions, 1 verified fix. Compare this to Act 1: the model didn't guess — it found the bug by reading the right files, confirmed it by running the tests, applied the fix, and verified it. But look at the context window: ~8,200 tokens after just 2 files and a few test runs. For a large codebase, this grows fast.",
    stateMutations: { systemPhase: 'idle', harnessState: 'idle', apiCallCount: 0, currentTool: null },
    chatUpdate: { role: 'assistant', content: API.act2Response6.content[0].text },
    contextState: mk(500, 3587, 3350),
    activeAgent: null, compactionData: null,
  },

  // ===========================================================================
  // ACT 3 — Multi-Agent Systems (16 steps)
  // ===========================================================================

  {
    id: 'act3-step1', act: 3, phase: 'orchestrator',
    label: 'Orchestrator Receives Task',
    activeComponents: [C.ORCHESTRATOR],
    messageFlow: null,
    message: API.orchestratorRequest,
    narration: "The same task arrives, but now it goes to an Orchestrator agent first. The orchestrator has its own system prompt, its own context, its own API call. It doesn't do domain work — it does coordination work. Its job is to break the task down and route it to the right specialists.",
    stateMutations: { systemPhase: 'processing', activeAgent: 'orchestrator', orchestratorState: 'planning' },
    chatUpdate: { role: 'user', content: "The authentication module has a bug — users can't log in. Coordinate the team to find and fix it." },
    contextState: mk(500, 387, 0),
    activeAgent: 'orchestrator', compactionData: null,
    agentContexts: { orchestrator: 0.44, explorer: 0, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step2', act: 3, phase: 'orchestrator',
    label: 'Orchestrator Creates Plan',
    activeComponents: [C.ORCHESTRATOR],
    messageFlow: { from: C.ORCHESTRATOR, to: C.EXPLORER, type: 'internal', label: 'Deploy Explorer' },
    message: API.orchestratorResponse,
    narration: "The orchestrator outputs a plan: (1) Explorer reads the codebase and produces a handoff document, (2) Builder receives the handoff and writes the fix, (3) Reviewer validates with fresh eyes. The orchestrator won't do any coding itself — it manages the sequence. Its context stays small because it receives summaries, not raw content.",
    stateMutations: { orchestratorState: 'dispatched' },
    chatUpdate: { role: 'assistant', content: API.orchestratorResponse.content[0].text, agent: 'orchestrator' },
    contextState: mk(500, 485, 0),
    activeAgent: 'orchestrator', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 0, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step3', act: 3, phase: 'handoff',
    label: 'Explorer Agent Activated',
    activeComponents: [C.ORCHESTRATOR, C.EXPLORER],
    messageFlow: { from: C.ORCHESTRATOR, to: C.EXPLORER, type: 'handoff', label: 'Task handoff' },
    message: { task: "Find the auth bug. Read all relevant files. Produce a structured handoff document for the Builder.", tools: ['read_file', 'run_tests'], context: 'fresh' },
    narration: "The Explorer agent starts with a completely fresh context: just the system prompt and the task. 500 + 150 = 650 tokens. The Explorer's system prompt gives it read-only tools (no write_file) and instructions to produce a structured handoff document when done. Each agent is a scoped instance of the same agentic loop mechanism.",
    stateMutations: { activeAgent: 'explorer', explorerState: 'reading' },
    chatUpdate: null,
    contextState: mk(500, 150, 0),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 0.33, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step4', act: 3, phase: 'explorer',
    label: 'Explorer Reads auth.js',
    activeComponents: [C.EXPLORER, C.TOOL_READ],
    messageFlow: { from: C.EXPLORER, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { file: 'src/auth/auth.js', contents: SIMULATED_CODEBASE['src/auth/auth.js'] },
    narration: "The Explorer reads auth.js. Its context grows as the file contents are injected as a tool_result. The Explorer is building a picture of the codebase from scratch — no prior context, no shortcuts. This is methodical exploration.",
    stateMutations: { explorerState: 'reading' },
    chatUpdate: null,
    contextState: mk(500, 400, 850),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 0.88, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step5', act: 3, phase: 'explorer',
    label: 'Explorer Reads tokens.js',
    activeComponents: [C.EXPLORER, C.TOOL_READ],
    messageFlow: { from: C.EXPLORER, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { file: 'src/auth/tokens.js', contents: SIMULATED_CODEBASE['src/auth/tokens.js'] },
    narration: "The Explorer reads tokens.js — finding the key evidence that expiry is stored in seconds. Context is growing: now at ~2,500 tokens (about 1.25% of the window). This is still small, but the Explorer will read every relevant file to ensure the Builder has complete information.",
    stateMutations: {},
    chatUpdate: null,
    contextState: mk(500, 750, 1550),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 1.4, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step6', act: 3, phase: 'explorer',
    label: 'Explorer Reads Middleware',
    activeComponents: [C.EXPLORER, C.TOOL_READ],
    messageFlow: { from: C.EXPLORER, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { file: 'src/middleware/authMiddleware.js', contents: SIMULATED_CODEBASE['src/middleware/authMiddleware.js'] },
    narration: "The Explorer reads authMiddleware.js to understand how validateToken is called in production. Context at ~4,800 tokens (~2.4%). The Explorer is being thorough — understanding the full blast radius of the bug before writing its findings.",
    stateMutations: {},
    chatUpdate: null,
    contextState: mk(500, 1200, 3100),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 2.4, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step7', act: 3, phase: 'explorer',
    label: 'Explorer Reads Routes + Tests',
    activeComponents: [C.EXPLORER, C.TOOL_READ],
    messageFlow: { from: C.EXPLORER, to: C.TOOL_READ, type: 'tool_call', label: 'read_file + run_tests' },
    message: { files: ['src/routes/userRoutes.js', 'tests/auth.test.js'], testResult: 'FAIL — 1 failing' },
    narration: "The Explorer reads the routes file and the test suite, then runs the tests. It's building a complete picture: which endpoints are broken, what the tests currently show, what the failure signature is. Explorer's context is now at ~85,000 tokens — it has read everything relevant and is nearly full.",
    stateMutations: { explorerState: 'summarizing' },
    chatUpdate: null,
    contextState: mk(500, 24000, 61500),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step8', act: 3, phase: 'explorer',
    label: 'Explorer Produces Handoff Document',
    activeComponents: [C.EXPLORER],
    messageFlow: { from: C.EXPLORER, to: C.BUILDER, type: 'handoff', label: 'Handoff doc' },
    message: API.explorerHandoff,
    narration: "The Explorer's final action: produce a structured handoff document. It compresses ~85,000 tokens of exploration into ~300 tokens of precisely what the Builder needs: file location, the exact bug, the evidence, the fix approach, the affected test. Everything else — the dead ends, the file navigation, the verbose tool output — is discarded. The Builder will never see the Explorer's raw context.",
    stateMutations: { explorerState: 'done', activeAgent: 'builder' },
    chatUpdate: null,
    contextState: mk(500, 24000, 61500),
    activeAgent: 'explorer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 0, reviewer: 0 },
  },
  {
    id: 'act3-step9', act: 3, phase: 'handoff',
    label: 'Builder Starts Fresh — 800 Tokens',
    activeComponents: [C.EXPLORER, C.BUILDER],
    messageFlow: { from: C.EXPLORER, to: C.BUILDER, type: 'handoff', label: 'Handoff received' },
    message: API.explorerHandoff,
    narration: "The Builder agent receives the handoff document and starts with a fresh context: system prompt (500) + task (50) + handoff document (312) = ~862 tokens. The Builder has almost its entire context window free for precise construction work. Compare: Explorer ended at 85,000 tokens; Builder starts at 862. This is context sharding — dividing cognitive labor to manage context pressure.",
    stateMutations: { builderState: 'building', explorerState: 'done' },
    chatUpdate: null,
    contextState: mk(500, 362, 0),
    activeAgent: 'builder', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 0.43, reviewer: 0 },
  },
  {
    id: 'act3-step10', act: 3, phase: 'builder',
    label: 'Builder Writes the Fix',
    activeComponents: [C.BUILDER, C.TOOL_WRITE],
    messageFlow: { from: C.BUILDER, to: C.TOOL_WRITE, type: 'tool_call', label: 'write_file' },
    message: { file: 'src/auth/auth.js', change: 'token.expiry < Date.now() → token.expiry * 1000 < Date.now()' },
    narration: "The Builder uses the Explorer's precise instructions to write the fix directly. It doesn't need to explore — the handoff told it exactly which file, which line, and what change to make. Context barely grows. This is the power of role separation: the Builder does precision work with focused context.",
    stateMutations: { builderState: 'verifying' },
    chatUpdate: null,
    contextState: mk(500, 800, 0),
    activeAgent: 'builder', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 0.65, reviewer: 0 },
  },
  {
    id: 'act3-step11', act: 3, phase: 'builder',
    label: 'Builder Runs Tests — All Pass',
    activeComponents: [C.BUILDER, C.TOOL_TESTS],
    messageFlow: { from: C.BUILDER, to: C.TOOL_TESTS, type: 'tool_call', label: 'run_tests' },
    message: { result: 'PASS — 4/4 tests passing' },
    narration: "Tests pass. The Builder confirms the fix works. Its context is still only ~2,400 tokens — tiny compared to the Explorer. The Builder is ready to produce its output: the patch and the test results, formatted as a handoff for the Reviewer.",
    stateMutations: { builderState: 'done' },
    chatUpdate: null,
    contextState: mk(500, 800, 1100),
    activeAgent: 'builder', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.2, reviewer: 0 },
  },
  {
    id: 'act3-step12', act: 3, phase: 'handoff',
    label: 'Builder Hands Off to Reviewer',
    activeComponents: [C.BUILDER, C.REVIEWER],
    messageFlow: { from: C.BUILDER, to: C.REVIEWER, type: 'handoff', label: 'Patch review' },
    message: { patch: 'auth.js line 23: seconds→ms fix', testResults: 'PASS 4/4', context: 'fresh' },
    narration: "The Builder packages its output — the patch diff and test results — and passes it to the Reviewer. The Reviewer starts with a completely fresh context. No attachment to the Builder's decisions. No accumulated reasoning. Just fresh eyes evaluating the output on its merits.",
    stateMutations: { reviewerState: 'reviewing', activeAgent: 'reviewer' },
    chatUpdate: null,
    contextState: mk(500, 280, 0),
    activeAgent: 'reviewer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.2, reviewer: 0.39 },
  },
  {
    id: 'act3-step13', act: 3, phase: 'reviewer',
    label: 'Reviewer Evaluates the Patch',
    activeComponents: [C.REVIEWER, C.TOOL_READ],
    messageFlow: { from: C.REVIEWER, to: C.TOOL_READ, type: 'tool_call', label: 'read_file' },
    message: { evaluation: 'Fix is correct. But tests/auth.test.js also has a flawed test fixture.' },
    narration: "The Reviewer reads the test file and catches something: the \"should reject an expired token\" test was passing for the wrong reason. Its fixture uses the same seconds format correctly, but the test logic was relying on the bug to make expired tokens appear expired. The Reviewer flags this — the test passes after the fix but could be more explicit.",
    stateMutations: { reviewerState: 'reviewing' },
    chatUpdate: null,
    contextState: mk(500, 500, 900),
    activeAgent: 'reviewer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.2, reviewer: 0.95 },
  },
  {
    id: 'act3-step14', act: 3, phase: 'reviewer',
    label: 'Reviewer Returns Notes to Builder',
    activeComponents: [C.REVIEWER, C.BUILDER],
    messageFlow: { from: C.REVIEWER, to: C.BUILDER, type: 'handoff', label: 'Review notes' },
    message: { verdict: 'APPROVE WITH NOTES', notes: 'Fix is correct. Recommend adding explicit comment to test explaining the seconds/ms distinction.' },
    stateMutations: { reviewerState: 'done', builderState: 'revising', activeAgent: 'builder' },
    narration: "The Reviewer approves the fix but sends notes back: the test could be more explicit. This is the fresh-context critique value — the Reviewer wasn't invested in the Builder's choices, so it evaluated the output cleanly. The Builder will make a small clarifying update.",
    chatUpdate: null,
    contextState: mk(500, 500, 900),
    activeAgent: 'reviewer', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.2, reviewer: 0.95 },
  },
  {
    id: 'act3-step15', act: 3, phase: 'builder',
    label: 'Builder Updates Test Comment',
    activeComponents: [C.BUILDER, C.TOOL_WRITE],
    messageFlow: { from: C.BUILDER, to: C.TOOL_WRITE, type: 'tool_call', label: 'write_file' },
    message: { file: 'tests/auth.test.js', change: 'Added clarifying comment about seconds vs milliseconds' },
    narration: "The Builder adds a clarifying comment to the test. Task complete. Five agents (user, orchestrator, explorer, builder, reviewer), each with focused context, each doing one thing well. The total work was the same as Act 2 — but no single agent was overwhelmed.",
    stateMutations: { builderState: 'done', systemPhase: 'idle' },
    chatUpdate: null,
    contextState: mk(500, 900, 1100),
    activeAgent: 'builder', compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.25, reviewer: 0.95 },
  },
  {
    id: 'act3-step16', act: 3, phase: 'insight',
    label: 'Act 3 Summary — Context Sharding',
    activeComponents: [C.ORCHESTRATOR, C.EXPLORER, C.BUILDER, C.REVIEWER],
    messageFlow: null,
    message: { explorer_peak: '86,000 tokens (43%)', builder_start: '862 tokens (0.4%)', handoff_size: '312 tokens' },
    narration: "The Explorer used 86,000 tokens understanding the codebase. The Builder received 312 tokens and had 99.6% of its context free. Each agent was doing one thing, with the right amount of information. No agent was overwhelmed. This is context sharding — you get scale by dividing the problem, not by giving one agent infinite memory.",
    stateMutations: { activeAgent: null },
    chatUpdate: null,
    contextState: mk(500, 900, 1100),
    activeAgent: null, compactionData: null,
    agentContexts: { orchestrator: 0.49, explorer: 43, builder: 1.25, reviewer: 0.95 },
  },

  // ===========================================================================
  // ACT 4 — Compaction (11 steps)
  // ===========================================================================

  {
    id: 'act4-step1', act: 4, phase: 'setup',
    label: 'Agentic Loop Resumes',
    activeComponents: [C.HARNESS, C.TOOL_READ, C.TOOL_TESTS, C.TOOL_WRITE],
    messageFlow: null,
    message: null,
    narration: "Back to the single-agent agentic loop — but now the task is larger. The codebase has more files to explore, and the agent needs to do a thorough investigation. The harness has a critical addition: context window monitoring. When usage exceeds 70%, compaction will be triggered automatically.",
    stateMutations: { systemPhase: 'processing', harnessState: 'building_request', compactionState: 'idle' },
    chatUpdate: { role: 'user', content: "The authentication system needs a comprehensive audit. Find all bugs and security issues, then fix them." },
    contextState: mk(500, 150, 0),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step2', act: 4, phase: 'loop_run',
    label: 'Reading Files — Context Growing',
    activeComponents: [C.HARNESS, C.TOOL_READ],
    messageFlow: { from: C.HARNESS, to: C.TOOL_READ, type: 'tool_call', label: 'read_file ×4' },
    message: { filesRead: ['src/auth/auth.js', 'src/auth/tokens.js', 'src/middleware/authMiddleware.js', 'src/routes/userRoutes.js'] },
    narration: "The agent reads all four source files. Each file adds ~800-1,200 tokens to the messages array. After reading the codebase: system (500) + conversation (12,000) + tool results (28,000) = 40,500 tokens. That's 20% of the context window used, and the agent has only read the source files — not the tests, not the docs.",
    stateMutations: { harnessState: 'executing_tool' },
    chatUpdate: null,
    contextState: mk(500, 12000, 28000),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step3', act: 4, phase: 'loop_run',
    label: 'More Exploration — Context Approaching Threshold',
    activeComponents: [C.HARNESS, C.TOOL_READ, C.TOOL_TESTS],
    messageFlow: { from: C.HARNESS, to: C.TOOL_READ, type: 'tool_call', label: 'read_file + run_tests' },
    message: { filesRead: ['tests/auth.test.js', 'package.json', 'src/config.js'], testResults: 'FAIL — multiple issues found' },
    narration: "The agent reads more files and runs the test suite. More tool results accumulate. The harness's token counter is climbing: 65,000 tokens now (32.5%). The agent has found the timestamp bug and several other issues. The loop continues, adding more context with every iteration.",
    stateMutations: { harnessState: 'injecting_result' },
    chatUpdate: null,
    contextState: mk(500, 24000, 41000),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step4', act: 4, phase: 'threshold',
    label: 'Context Reaches 70% Threshold',
    activeComponents: [C.HARNESS, C.COMPACTOR],
    messageFlow: null,
    message: { tokenCount: 140000, threshold: 70, action: 'COMPACTION TRIGGERED' },
    narration: "The harness's context monitor fires: 140,000 tokens — 70% of the 200,000-token window. The harness pauses the agentic loop. If it continued without intervention, the context would overflow in a few more iterations, causing an API error. Compaction is the only way to continue.",
    stateMutations: { harnessState: 'paused', compactionState: 'triggered' },
    chatUpdate: null,
    contextState: mk(500, 42500, 97000),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step5', act: 4, phase: 'compaction_trigger',
    label: 'Compaction Engine Activates',
    activeComponents: [C.HARNESS, C.COMPACTOR, C.AUDIT_LOG],
    messageFlow: { from: C.HARNESS, to: C.AUDIT_LOG, type: 'internal', label: 'Save raw context' },
    message: { rawContextTokens: 140000, action: 'Writing full history to audit log before compaction' },
    narration: "Before compacting, the harness writes the full raw context to an external audit log. This is the audit log pattern: the compressed context goes forward into the active window, but the raw history is preserved externally for debugging. The audit log grows unboundedly — but the model doesn't read it during normal operation.",
    stateMutations: { compactionState: 'running' },
    chatUpdate: null,
    contextState: mk(500, 42500, 97000),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step6', act: 4, phase: 'compaction_run',
    label: 'Compaction Prompt Sent to Model',
    activeComponents: [C.COMPACTOR, C.API],
    messageFlow: { from: C.COMPACTOR, to: C.API, type: 'api_request', label: 'Summarize' },
    message: {
      model: 'claude-sonnet-4-6',
      messages: [{
        role: 'user',
        content: "Below is the full history of an agent working on an authentication audit. Produce a dense summary that captures: what has been done, what was found, what decisions were made, and what still needs to happen. Preserve any specific file paths, line numbers, error messages, or technical details that will be needed to continue.\n\n[FULL 140,000 TOKEN HISTORY]"
      }]
    },
    narration: "The compaction engine sends the full 140,000-token context to the model with explicit instructions: preserve file paths, line numbers, error messages, decisions, open questions. What to discard: exploratory traces, dead ends, raw file contents that were summarized, redundant information. The compaction prompt quality determines the summary quality.",
    stateMutations: {},
    chatUpdate: null,
    contextState: mk(500, 42500, 97000),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step7', act: 4, phase: 'compaction_result',
    label: 'Summary Returned — 140k → 3.5k Tokens',
    activeComponents: [C.COMPACTOR, C.HARNESS],
    messageFlow: { from: C.API, to: C.COMPACTOR, type: 'api_response', label: 'Summary' },
    message: API.compactionSummary,
    narration: "The model returns a 287-token summary. The harness replaces the 140,000-token history with this summary. Context drops from 140,000 to 3,500 tokens — a 97.5% reduction. The loop can now continue. But 136,500 tokens of content were just discarded. What was in them?",
    stateMutations: { compactionState: 'complete', harnessState: 'resuming' },
    chatUpdate: { type: 'compaction_marker' },
    contextState: mk(500, 3000, 0),
    activeAgent: null,
    compactionData: {
      before: { tokens: 140000, percent: 70 },
      after: { tokens: 3500, percent: 1.75 },
      lost: API.whatWasLost,
    }
  },
  {
    id: 'act4-step8', act: 4, phase: 'what_was_lost',
    label: 'What Was Lost in Compaction',
    activeComponents: [C.COMPACTOR],
    messageFlow: null,
    message: API.whatWasLost,
    narration: "Three items from the raw context did not survive compaction. The verbose middleware trace — low risk, just noise. The routes investigation notes — low risk, already resolved. But the third item: a TODO comment in auth.js about unimplemented refresh token rotation. The model judged it a future concern, not relevant to the current task. That judgment may be wrong.",
    stateMutations: { compactionState: 'idle' },
    chatUpdate: null,
    contextState: mk(500, 3000, 0),
    activeAgent: null,
    compactionData: {
      before: { tokens: 140000, percent: 70 },
      after: { tokens: 3500, percent: 1.75 },
      lost: API.whatWasLost,
    }
  },
  {
    id: 'act4-step9', act: 4, phase: 'loop_resume',
    label: 'Loop Resumes — Fresh Context',
    activeComponents: [C.HARNESS, C.TOOL_WRITE],
    messageFlow: { from: C.HARNESS, to: C.TOOL_WRITE, type: 'tool_call', label: 'write_file' },
    message: { action: 'Applying the timestamp fix from compacted summary', file: 'src/auth/auth.js' },
    narration: "The loop resumes from the compacted summary. The agent writes the timestamp fix and continues working. From its perspective, the history is intact — it can see what was decided. What it can't see is the refresh token TODO that was compacted away. The agent doesn't know what it doesn't know.",
    stateMutations: { harnessState: 'executing_tool', compactionState: 'idle' },
    chatUpdate: null,
    contextState: mk(500, 3500, 400),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step10', act: 4, phase: 'audit_log',
    label: 'The Audit Log Pattern',
    activeComponents: [C.AUDIT_LOG],
    messageFlow: null,
    message: { pattern: 'Audit Log', description: 'Full raw history preserved externally, never compacted, available for investigation' },
    narration: "The audit log contains the complete uncompressed history — including the refresh token TODO. The model doesn't read the audit log during normal operation. But if something goes wrong downstream, an engineer can retrieve the raw history and find the information that was compacted away. The audit log is the safety net that compaction requires.",
    stateMutations: {},
    chatUpdate: null,
    contextState: mk(500, 3500, 400),
    activeAgent: null, compactionData: null,
  },
  {
    id: 'act4-step11', act: 4, phase: 'insight',
    label: 'Act 4 Summary — The Necessary Tradeoff',
    activeComponents: [C.HARNESS, C.COMPACTOR, C.AUDIT_LOG],
    messageFlow: null,
    message: null,
    narration: "Compaction let this agent run three times longer than it could have otherwise. The timestamp bug was found and fixed. But the refresh token TODO — a real security issue — was compacted away. The model made a reasonable judgment: it seemed like a future concern. It was wrong. Compaction is necessary. But every compaction is a bet. The audit log is how you hedge it.",
    stateMutations: { systemPhase: 'idle', harnessState: 'idle' },
    chatUpdate: null,
    contextState: mk(500, 3500, 400),
    activeAgent: null, compactionData: null,
  },
];

// ============================================================================
// 7. STEP INDEX HELPERS
// ============================================================================

const ACT_OFFSETS = {};
const ACT_LENGTHS = {};
[1, 2, 3, 4].forEach(act => {
  const firstIdx = STEPS.findIndex(s => s.act === act);
  const count    = STEPS.filter(s => s.act === act).length;
  ACT_OFFSETS[act] = firstIdx;
  ACT_LENGTHS[act] = count;
});

// ============================================================================
// 8. INITIAL STATE
// ============================================================================

const INITIAL_STATE = {
  systemPhase:      'idle',
  harnessState:     'idle',
  apiCallCount:     0,
  loopIteration:    0,
  currentTool:      null,
  activeAgent:      null,
  orchestratorState:'idle',
  explorerState:    'idle',
  builderState:     'idle',
  reviewerState:    'idle',
  compactionState:  'idle',
};

// ============================================================================
// 9. useSimulation HOOK
// ============================================================================

function useSimulation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentAct, setCurrentAct]             = useState(1);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [playSpeed, setPlaySpeed]               = useState(2000);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [messageLog, setMessageLog]             = useState([]);
  const [componentStates, setComponentStates]   = useState({ ...INITIAL_STATE });

  const intervalRef = useRef(null);

  const currentStep   = STEPS[currentStepIndex] || STEPS[0];
  const actSteps      = STEPS.filter(s => s.act === currentAct);
  const actStepIndex  = currentStepIndex - (ACT_OFFSETS[currentAct] ?? 0);
  const totalSteps    = STEPS.length;
  const totalActSteps = ACT_LENGTHS[currentAct] ?? 0;

  const activeComponents = currentStep.activeComponents || [];
  const messageFlow      = currentStep.messageFlow || null;
  const contextState     = currentStep.contextState || { systemPromptTokens: 500, conversationTokens: 0, toolResultTokens: 0, totalTokens: 500, percentUsed: 0.25, breakdown: [] };

  const computeStateAtStep = useCallback((targetIndex) => {
    const state = { ...INITIAL_STATE };
    for (let i = 0; i <= targetIndex; i++) {
      const step = STEPS[i];
      if (step && step.stateMutations) Object.assign(state, step.stateMutations);
    }
    return state;
  }, []);

  const computeConversationAtStep = useCallback((targetIndex) => {
    const targetAct = STEPS[targetIndex]?.act || 1;
    const history = [];
    for (let i = 0; i <= targetIndex; i++) {
      const step = STEPS[i];
      if (step && step.act === targetAct && step.chatUpdate) {
        history.push({ ...step.chatUpdate, stepId: step.id });
      }
    }
    return history;
  }, []);

  const computeMessageLogAtStep = useCallback((targetIndex) => {
    const targetAct = STEPS[targetIndex]?.act || 1;
    const log = [];
    for (let i = 0; i <= targetIndex; i++) {
      const step = STEPS[i];
      if (step && step.act === targetAct && step.message && step.messageFlow) {
        log.push({
          stepId: step.id, act: step.act, phase: step.phase,
          label: step.label, flow: step.messageFlow,
          payload: step.message, timestamp: i,
          activeAgent: step.activeAgent,
        });
      }
    }
    return log;
  }, []);

  const goToStep = useCallback((index) => {
    const clamped = Math.max(0, Math.min(index, STEPS.length - 1));
    const step    = STEPS[clamped];
    setCurrentStepIndex(clamped);
    setCurrentAct(step.act);
    setComponentStates(computeStateAtStep(clamped));
    setConversationHistory(computeConversationAtStep(clamped));
    setMessageLog(computeMessageLogAtStep(clamped));
  }, [computeStateAtStep, computeConversationAtStep, computeMessageLogAtStep]);

  const next = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) goToStep(currentStepIndex + 1);
    else setIsPlaying(false);
  }, [currentStepIndex, goToStep]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  const goToAct = useCallback((act) => {
    const offset = ACT_OFFSETS[act];
    if (offset !== undefined) goToStep(offset);
  }, [goToStep]);

  const play        = useCallback(() => setIsPlaying(true), []);
  const pause       = useCallback(() => setIsPlaying(false), []);
  const togglePlay  = useCallback(() => setIsPlaying(p => !p), []);
  const reset       = useCallback(() => { setIsPlaying(false); goToStep(0); }, [goToStep]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          const nextIdx = prev + 1;
          if (nextIdx >= STEPS.length) { setIsPlaying(false); return prev; }
          const step = STEPS[nextIdx];
          setCurrentAct(step.act);
          setComponentStates(computeStateAtStep(nextIdx));
          setConversationHistory(computeConversationAtStep(nextIdx));
          setMessageLog(computeMessageLogAtStep(nextIdx));
          return nextIdx;
        });
      }, playSpeed);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPlaying, playSpeed, computeStateAtStep, computeConversationAtStep, computeMessageLogAtStep]);

  return {
    state: componentStates, currentStep, currentStepIndex, currentAct,
    actStepIndex, totalActSteps, steps: STEPS, actSteps, totalSteps,
    next, prev, play, pause, togglePlay, goToAct, goToStep, reset,
    isPlaying, playSpeed, setPlaySpeed,
    conversationHistory, messageLog,
    activeComponents, messageFlow, componentStates, contextState,
    actMetadata: ACT_METADATA, actOffsets: ACT_OFFSETS, actLengths: ACT_LENGTHS,
    simulatedCodebase: SIMULATED_CODEBASE, toolDefinitions: TOOL_DEFINITIONS,
  };
}
