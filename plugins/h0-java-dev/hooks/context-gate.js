#!/usr/bin/env node
/**
 * PreToolUse Hook: Fact-Forcing Gate (standalone)
 *
 * Forces Claude to investigate before editing files.
 * Instead of asking "are you sure?", this hook demands concrete facts:
 * importers, public API, data schemas.
 *
 * On first Edit/Write/MultiEdit to a file → block and demand facts
 * On second attempt (after facts presented) → allow
 *
 * Cross-platform (Windows, macOS, Linux).
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.H0_GATEGUARD_STATE_DIR
  || path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.h0-gateguard');

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_CHECKED_ENTRIES = 500;

let activeStateFile = null;

// --- State management ---

function sanitizeSessionKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const sanitized = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (sanitized && sanitized.length <= 64) return sanitized;
  return 'sid-' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

function hashKey(prefix, value) {
  return prefix + '-' + crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
}

function resolveSessionKey(data) {
  const candidates = [
    data && data.session_id,
    data && data.sessionId,
    process.env.CLAUDE_SESSION_ID
  ];
  for (const c of candidates) {
    const s = sanitizeSessionKey(c);
    if (s) return s;
  }
  const tp = (data && data.transcript_path) || process.env.CLAUDE_TRANSCRIPT_PATH;
  if (tp && String(tp).trim()) return hashKey('tx', path.resolve(String(tp).trim()));
  return hashKey('proj', path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd()));
}

function getStateFile(data) {
  if (!activeStateFile) {
    activeStateFile = path.join(STATE_DIR, `state-${resolveSessionKey(data)}.json`);
  }
  return activeStateFile;
}

function loadState() {
  const stateFile = getStateFile();
  try {
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (Date.now() - (state.last_active || 0) > SESSION_TIMEOUT_MS) {
        try { fs.unlinkSync(stateFile); } catch (_) {}
        return { checked: [], last_active: Date.now() };
      }
      return state;
    }
  } catch (_) {}
  return { checked: [], last_active: Date.now() };
}

function saveState(state) {
  const stateFile = getStateFile();
  let tmpFile = null;
  try {
    state.last_active = Date.now();
    if (state.checked.length > MAX_CHECKED_ENTRIES) {
      state.checked = state.checked.slice(-MAX_CHECKED_ENTRIES);
    }
    fs.mkdirSync(STATE_DIR, { recursive: true });
    tmpFile = stateFile + '.tmp.' + process.pid;
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
    try {
      fs.renameSync(tmpFile, stateFile);
    } catch (error) {
      if (error && (error.code === 'EEXIST' || error.code === 'EPERM')) {
        try { fs.unlinkSync(stateFile); } catch (_) {}
        fs.renameSync(tmpFile, stateFile);
      } else {
        throw error;
      }
    }
  } catch (_) {
    if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch (_) {} }
  }
}

function markChecked(key) {
  const state = loadState();
  if (!state.checked.includes(key)) {
    state.checked.push(key);
    saveState(state);
  }
}

function isChecked(key) {
  return loadState().checked.includes(key);
}

// Prune stale session files older than 1 hour
try {
  const files = fs.readdirSync(STATE_DIR);
  const now = Date.now();
  for (const f of files) {
    if (!f.startsWith('state-') || !f.endsWith('.json')) continue;
    try {
      const stat = fs.statSync(path.join(STATE_DIR, f));
      if (now - stat.mtimeMs > SESSION_TIMEOUT_MS * 2) {
        fs.unlinkSync(path.join(STATE_DIR, f));
      }
    } catch (_) {}
  }
} catch (_) {}

// --- Path helpers ---

function sanitizePath(filePath) {
  let sanitized = '';
  for (const char of String(filePath || '')) {
    const code = char.codePointAt(0);
    const isCtrl = code <= 0x1f || code === 0x7f;
    const isBidi = (code >= 0x200e && code <= 0x200f) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
    sanitized += isCtrl || isBidi ? ' ' : char;
  }
  return sanitized.trim().slice(0, 500);
}

function normalizeForMatch(value) {
  return String(value || '').replace(/\\/g, '/').toLowerCase();
}

function isClaudeSettingsPath(filePath) {
  return /(^|\/)\.claude\/settings(?:\.[^/]+)?\.json$/.test(normalizeForMatch(filePath));
}

// --- Gate messages ---

function editGateMsg(filePath) {
  const safe = sanitizePath(filePath);
  return [
    '[Fact-Forcing Gate]',
    '',
    `Before editing ${safe}, present these facts:`,
    '',
    '1. List ALL files that import/require this file (use Grep)',
    '2. List the public functions/classes affected by this change',
    '3. If this file reads/writes data files, show field names, structure, and date format (use redacted or synthetic values, not raw production data)',
    "4. Quote the user's current instruction verbatim",
    '5. Confirm the proposed changes comply with rules in .claude/rules/ (list relevant rule files and how they apply)',
    '',
    'Present the facts, then retry the same operation.'
  ].join('\n');
}

function writeGateMsg(filePath) {
  const safe = sanitizePath(filePath);
  return [
    '[Fact-Forcing Gate]',
    '',
    `Before creating ${safe}, present these facts:`,
    '',
    '1. Name the file(s) and line(s) that will call this new file',
    '2. Confirm no existing file serves the same purpose (use Glob)',
    '3. If this file reads/writes data files, show field names, structure, and date format (use redacted or synthetic values, not raw production data)',
    "4. Quote the user's current instruction verbatim",
    '5. Confirm the proposed changes comply with rules in .claude/rules/ (list relevant rule files and how they apply)',
    '',
    'Present the facts, then retry the same operation.'
  ].join('\n');
}

// --- Deny helper ---

function denyResult(reason) {
  return {
    stdout: JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason
      }
    }),
    exitCode: 0
  };
}

// --- Core logic ---

function run(rawInput) {
  let data;
  try {
    data = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
  } catch (_) {
    return rawInput;
  }
  activeStateFile = null;
  getStateFile(data);

  const rawToolName = data.tool_name || '';
  const toolInput = data.tool_input || {};
  const TOOL_MAP = { edit: 'Edit', write: 'Write', multiedit: 'MultiEdit' };
  const toolName = TOOL_MAP[rawToolName.toLowerCase()] || rawToolName;

  if (toolName === 'Edit' || toolName === 'Write') {
    const filePath = toolInput.file_path || '';
    if (!filePath || isClaudeSettingsPath(filePath)) {
      return rawInput;
    }
    if (!isChecked(filePath)) {
      markChecked(filePath);
      return denyResult(toolName === 'Edit' ? editGateMsg(filePath) : writeGateMsg(filePath));
    }
    return rawInput;
  }

  if (toolName === 'MultiEdit') {
    const edits = toolInput.edits || [];
    for (const edit of edits) {
      const filePath = edit.file_path || '';
      if (filePath && !isClaudeSettingsPath(filePath) && !isChecked(filePath)) {
        markChecked(filePath);
        return denyResult(editGateMsg(filePath));
      }
    }
    return rawInput;
  }

  return rawInput;
}

// --- stdin entry point ---

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const result = run(input);
    if (result && typeof result === 'object' && result.stdout !== undefined) {
      process.stdout.write(result.stdout);
      process.exit(result.exitCode !== undefined ? result.exitCode : 0);
    }
    process.stdout.write(typeof result === 'string' ? result : input);
    process.exit(0);
  } catch (e) {
    process.stderr.write('[Fact-Forcing Gate] Error: ' + e.message + '\n');
    process.exit(0);
  }
});
