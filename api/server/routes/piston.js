const express = require('express');
const { generateCheckAccess } = require('@librechat/api');
const { PermissionTypes, Permissions } = require('librechat-data-provider');
const { getRoleByName } = require('~/models/Role');
const { requireJwtAuth, toolCallLimiter } = require('~/server/middleware');
const pistonProxy = require('~/server/services/pistonProxy');

const router = express.Router();

const MAX_CODE_BYTES = 200 * 1024;
const DEFAULT_VERSION = '*';

const languageMap = new Map([
  ['python', 'python'],
  ['py', 'python'],
  ['python3', 'python'],
  ['javascript', 'javascript'],
  ['js', 'javascript'],
  ['node', 'javascript'],
  ['nodejs', 'javascript'],
  ['bash', 'bash'],
  ['sh', 'bash'],
  ['shell', 'bash'],
  ['go', 'go'],
  ['golang', 'go'],
  ['rust', 'rust'],
  ['rs', 'rust'],
  ['c', 'c'],
  ['cpp', 'cpp'],
  ['c++', 'cpp'],
  ['cplusplus', 'cpp'],
]);

const allowedLanguages = [...new Set(languageMap.values())];

const extensionMap = {
  python: 'py',
  javascript: 'js',
  bash: 'sh',
  go: 'go',
  rust: 'rs',
  c: 'c',
  cpp: 'cpp',
};

const checkRunCode = generateCheckAccess({
  permissionType: PermissionTypes.RUN_CODE,
  permissions: [Permissions.USE],
  getRoleByName,
});

const normalizeLanguage = (language = '') => {
  const normalized = String(language).toLowerCase().trim();
  return languageMap.get(normalized) || '';
};

const isProxyConfigured = () => {
  const config = pistonProxy.getProxyConfig();
  return Boolean(config?.baseURL && config?.apiKey);
};

router.use(requireJwtAuth);

router.get('/runtimes', checkRunCode, async (_req, res) => {
  if (!isProxyConfigured()) {
    return res.status(503).json({ ok: false, error: 'Piston proxy is not configured' });
  }

  try {
    const runtimes = await pistonProxy.getRuntimes();
    return res.json({ ok: true, runtimes });
  } catch (error) {
    return res
      .status(502)
      .json({ ok: false, error: 'Failed to fetch runtimes', details: error.message });
  }
});

router.post('/execute', toolCallLimiter, checkRunCode, async (req, res) => {
  if (!isProxyConfigured()) {
    return res.status(503).json({ ok: false, error: 'Piston proxy is not configured' });
  }

  const { language, version = DEFAULT_VERSION, code, stdin = '' } = req.body ?? {};
  const normalizedLanguage = normalizeLanguage(language || 'python');

  if (!normalizedLanguage) {
    return res.status(400).json({
      ok: false,
      error: 'Unsupported language',
      details: `Supported languages: ${allowedLanguages.join(', ')}`,
    });
  }

  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Code is required' });
  }

  const stdinValue = typeof stdin === 'string' ? stdin : '';
  const codeBytes = Buffer.byteLength(code, 'utf8');
  const stdinBytes = Buffer.byteLength(stdinValue, 'utf8');

  if (codeBytes + stdinBytes > MAX_CODE_BYTES) {
    return res
      .status(413)
      .json({ ok: false, error: 'Payload too large', details: 'Max 200KB' });
  }

  try {
    const extension = extensionMap[normalizedLanguage] ?? 'txt';
    const payload = {
      language: normalizedLanguage,
      version: typeof version === 'string' && version.length > 0 ? version : DEFAULT_VERSION,
      files: [{ name: `main.${extension}`, content: code }],
      stdin: stdinValue,
    };

    const result = await pistonProxy.execute(payload);

    if (!result?.run) {
      return res.status(502).json({ ok: false, error: 'Invalid response from Piston proxy' });
    }

    return res.json({
      ok: true,
      language: result.language ?? normalizedLanguage,
      version: result.version ?? payload.version,
      run: {
        stdout: result.run.stdout ?? '',
        stderr: result.run.stderr ?? '',
        output: result.run.output ?? '',
        code: result.run.code ?? null,
      },
    });
  } catch (error) {
    return res
      .status(502)
      .json({ ok: false, error: 'Failed to execute code', details: error.message });
  }
});

module.exports = router;
