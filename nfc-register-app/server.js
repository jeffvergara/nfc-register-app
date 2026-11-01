const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite'); // built into Node 22.13+, nothing to compile
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PHOTO_DIR = path.join(DATA_DIR, 'photos');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

// ---------- Database ----------
const db = new DatabaseSync(path.join(DATA_DIR, 'app.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  photo_file TEXT,
  nfc_uid TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
`);

// ---------- Admin account (created on first start) ----------
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
if (!db.prepare('SELECT 1 FROM admins WHERE username = ?').get(ADMIN_USER)) {
  const pwd = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
    .run(ADMIN_USER, bcrypt.hashSync(pwd, 12));
  const note = `Admin login\nUsername: ${ADMIN_USER}\nPassword: ${pwd}\n(Delete this file after saving the password.)\n`;
  fs.writeFileSync(path.join(DATA_DIR, 'admin-credentials.txt'), note);
  console.log('\n=== ADMIN ACCOUNT CREATED ===\n' + note + '=============================\n');
}

// ---------- App ----------
const app = express();
app.use(express.json({ limit: '8mb' })); // photos arrive as base64
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}));

// Simple in-memory rate limit for login/register
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many attempts, try again later.' });
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Admin login required' });
}

// ---------- Public: registration ----------
app.post('/api/register', rateLimit(20, 60 * 60 * 1000), (req, res) => {
  const { fullName, email, phone, password, photo, nfcUid } = req.body || {};
  const name = String(fullName || '').trim();
  const mail = String(email || '').trim().toLowerCase();
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return res.status(400).json({ error: 'Please enter a valid email.' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  let uid = null;
  if (nfcUid) {
    uid = String(nfcUid).replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    if (uid.length < 4 || uid.length > 20) return res.status(400).json({ error: 'Invalid NFC card UID.' });
  }

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(mail))
    return res.status(409).json({ error: 'This email is already registered.' });
  if (uid && db.prepare('SELECT 1 FROM users WHERE nfc_uid = ?').get(uid))
    return res.status(409).json({ error: 'This NFC card is already registered.' });

  let photoFile = null;
  if (photo) {
    const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(photo);
    if (!m) return res.status(400).json({ error: 'Invalid photo format.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Photo is too large.' });
    photoFile = crypto.randomBytes(16).toString('hex') + (m[1] === 'png' ? '.png' : '.jpg');
    fs.writeFileSync(path.join(PHOTO_DIR, photoFile), buf);
  }

  db.prepare(`INSERT INTO users (full_name, email, phone, password_hash, photo_file, nfc_uid)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(name, mail, String(phone || '').trim() || null, bcrypt.hashSync(String(password), 12), photoFile, uid);
  res.json({ ok: true });
});

// ---------- Admin ----------
app.post('/api/admin/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const { username, password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(String(username || ''));
  if (!admin || !bcrypt.compareSync(String(password || ''), admin.password_hash))
    return res.status(401).json({ error: 'Wrong username or password.' });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.adminId = admin.id;
    res.json({ ok: true, username: admin.username });
  });
});

app.post('/api/admin/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const one = sql => db.prepare(sql).get().n;
  res.json({
    totalUsers: one('SELECT COUNT(*) n FROM users'),
    today: one("SELECT COUNT(*) n FROM users WHERE date(created_at) = date('now')"),
    last7Days: one("SELECT COUNT(*) n FROM users WHERE created_at >= datetime('now','-7 days')"),
    withPhoto: one('SELECT COUNT(*) n FROM users WHERE photo_file IS NOT NULL'),
    withNfc: one('SELECT COUNT(*) n FROM users WHERE nfc_uid IS NOT NULL')
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json(db.prepare(
    'SELECT id, full_name, email, phone, photo_file, nfc_uid, created_at FROM users ORDER BY id DESC'
  ).all());
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const u = db.prepare('SELECT photo_file FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  if (u.photo_file) fs.rmSync(path.join(PHOTO_DIR, path.basename(u.photo_file)), { force: true });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/export.csv', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, full_name, email, phone, nfc_uid, created_at FROM users ORDER BY id').all();
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['id,full_name,email,phone,nfc_uid,created_at',
    ...rows.map(r => [r.id, r.full_name, r.email, r.phone, r.nfc_uid, r.created_at].map(esc).join(','))].join('\n');
  res.type('text/csv').attachment('users.csv').send(csv);
});

// Photos are private: admin only
app.get('/photos/:file', requireAdmin, (req, res) => {
  const f = path.join(PHOTO_DIR, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`App running:  http://localhost:${PORT}\nAdmin panel:  http://localhost:${PORT}/admin.html`));
