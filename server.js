const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}
if (!APP_PASSWORD) {
  console.error('ERROR: APP_PASSWORD environment variable is not set.');
  process.exit(1);
}

app.use(express.json({ limit: '2mb' }));

// ── Password check middleware ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies['auth'];
  if (token === APP_PASSWORD) return next();

  // Allow the login page and login POST through
  if (req.path === '/login') return next();

  res.redirect('/login');
}

// Simple cookie parser (no dependency needed)
app.use(function(req, res, next) {
  req.cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach(function(pair) {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    req.cookies[key] = val;
  });
  next();
});

// ── Login page ─────────────────────────────────────────────────────────────
app.get('/login', function(req, res) {
  const error = req.query.error ? '<p style="color:#c0392b;font-size:0.9rem;">Incorrect password.</p>' : '';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Writing Analysis — Login</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; background: #f8f5f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: white; border-radius: 8px; padding: 2.5rem 2rem; width: 100%; max-width: 360px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; }
  h1 { font-size: 1.6rem; font-weight: 600; font-style: italic; color: #1a1a2e; margin-bottom: 0.3rem; }
  p.sub { font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: #7a7570; margin-bottom: 1.6rem; }
  input { width: 100%; padding: 0.65rem 0.9rem; border: 1px solid #d5cfc5; border-radius: 4px; font-size: 0.95rem; font-family: inherit; margin-bottom: 0.8rem; outline: none; }
  input:focus { border-color: #c0392b; }
  button { width: 100%; padding: 0.7rem; background: #c0392b; color: white; border: none; border-radius: 4px; font-size: 0.95rem; font-family: inherit; font-weight: 600; cursor: pointer; }
  button:hover { background: #a93226; }
</style>
</head>
<body>
<div class="card">
  <h1>Writing Analysis</h1>
  <p class="sub">Enter the password to continue</p>
  ${error}
  <form method="POST" action="/login">
    <input type="password" name="password" placeholder="Password" autofocus autocomplete="current-password" />
    <button type="submit">Enter →</button>
  </form>
</div>
</body>
</html>`);
});

app.post('/login', express.urlencoded({ extended: false }), function(req, res) {
  if (req.body.password === APP_PASSWORD) {
    // Set auth cookie — httpOnly, secure in production
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', 'auth=' + APP_PASSWORD + '; HttpOnly; Path=/' + secure);
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', function(req, res) {
  res.setHeader('Set-Cookie', 'auth=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/login');
});

// ── Apply auth to all other routes ─────────────────────────────────────────
app.use(requireAuth);

// ── Serve the app ──────────────────────────────────────────────────────────
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'esl-checker.html'));
});

// ── Anthropic API proxy ────────────────────────────────────────────────────
app.post('/api/claude', async function(req, res) {
  try {
    const { model, max_tokens, system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model, max_tokens, system, messages })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: { message: 'Server error: ' + err.message } });
  }
});

app.listen(PORT, function() {
  console.log('Writing Analysis running on port ' + PORT);
});
