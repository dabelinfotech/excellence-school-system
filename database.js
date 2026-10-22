const { Database } = require('node-sqlite3-wasm');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Environment-aware SQLite DB path (Vercel Serverless Function compatibility)
const isVercel = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
let dbPath;
let lockPath;

if (isVercel) {
  const tmpDbPath = '/tmp/excellence_school.db';
  const seedDbPath = path.join(__dirname, 'excellence_school.db');
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(seedDbPath)) {
    try {
      fs.copyFileSync(seedDbPath, tmpDbPath);
    } catch (e) {
      console.error('Failed to copy seed db to /tmp:', e);
    }
  }
  dbPath = tmpDbPath;
  lockPath = '/tmp/excellence_school.db.lock';
} else {
  dbPath = path.join(__dirname, 'excellence_school.db').replace(/\\/g, '/');
  lockPath = path.join(__dirname, 'excellence_school.db.lock');
}

try { fs.rmSync(lockPath, { recursive: true, force: true }); } catch (_) {}

const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = ON');

process.on('exit', () => {
  try { db.close(); } catch (_) {}
  try { fs.rmSync(lockPath, { recursive: true, force: true }); } catch (_) {}
});
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Compatibility wrapper for db.prepare to handle both array and spread arguments
const _origPrepare = db.prepare.bind(db);
db.prepare = (sql) => {
  const stmt = _origPrepare(sql);
  const wrapMethod = (method) => (...args) => {
    let params;
    if (args.length === 0) {
      params = [];
    } else if (args.length === 1 && (Array.isArray(args[0]) || (typeof args[0] === 'object' && args[0] !== null))) {
      params = args[0];
    } else {
      params = args;
    }
    return stmt[method](params);
  };
  return { run: wrapMethod('run'), get: wrapMethod('get'), all: wrapMethod('all') };
};

// Polyfill transaction
db.transaction = function(fn) {
  return function(...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
};

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    school_wing TEXT NOT NULL DEFAULT 'all',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_wing TEXT NOT NULL, -- 'primary' or 'secondary'
    admission_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    house TEXT DEFAULT 'Churchill',
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pin TEXT UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    school_wing TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_at DATETIME,
    use_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    school_wing TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    ca1 REAL DEFAULT 0,
    ca2 REAL DEFAULT 0,
    exam REAL DEFAULT 0,
    total REAL DEFAULT 0,
    grade TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS student_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    school_wing TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    type TEXT NOT NULL, -- 'affective' or 'psychomotor'
    trait TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_wing TEXT NOT NULL,
    admission_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    class TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    amount REAL NOT NULL,
    teller_ref TEXT UNIQUE NOT NULL,
    bank_name TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Verified', 'Approved'
    verified_by TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cbt_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_wing TEXT NOT NULL,
    subject TEXT NOT NULL,
    class_level TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS cbt_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_wing TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_reg TEXT NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    target_wing TEXT NOT NULL DEFAULT 'all',
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    author TEXT DEFAULT 'School Registry',
    media_url TEXT,
    media_type TEXT
  );

  CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    edition TEXT NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    publish_date TEXT NOT NULL,
    summary TEXT NOT NULL,
    file_name TEXT,
    download_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    target_wing TEXT NOT NULL DEFAULT 'all',
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    description TEXT NOT NULL,
    rsvp_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    parent_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    attendees INTEGER NOT NULL DEFAULT 1,
    ticket_code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS school_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Auto-migrate notices table for media attachments (images and videos)
try { db.exec('ALTER TABLE notices ADD COLUMN media_url TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE notices ADD COLUMN media_type TEXT'); } catch (_) {}

module.exports = db;
