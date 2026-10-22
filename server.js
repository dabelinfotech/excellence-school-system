require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('./database');

const isVercel = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const app = express();
const PORT = process.env.PORT || 4000;
const publicDir = path.join(__dirname, 'public');
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
}

// Multer storage configuration for Receipts
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = 'receipt_' + Date.now() + '_' + Math.round(Math.random() * 1E6) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Multer storage configuration for Bulletin Notices (supports Images and Videos up to 100MB)
const bulletinStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const uniqueName = 'bulletin_' + Date.now() + '_' + cleanBase + ext;
    cb(null, uniqueName);
  }
});
const uploadBulletinMedia = multer({
  storage: bulletinStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for high-res photos and video clips
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadDir));

app.use(session({
  secret: process.env.SESSION_SECRET || 'excellence-school-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

// Helper: Calculate grades
function calculateGrade(total) {
  if (total >= 75) return { grade: 'A1', remark: 'Distinction' };
  if (total >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (total >= 65) return { grade: 'B3', remark: 'Good' };
  if (total >= 60) return { grade: 'C4', remark: 'Credit' };
  if (total >= 55) return { grade: 'C5', remark: 'Credit' };
  if (total >= 50) return { grade: 'C6', remark: 'Credit' };
  if (total >= 45) return { grade: 'D7', remark: 'Pass' };
  if (total >= 40) return { grade: 'E8', remark: 'Pass' };
  return { grade: 'F9', remark: 'Fail' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESULT CHECKER API (Connected to Primary and Secondary Repositories)
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/results/check', (req, res) => {
  const { admission_number, pin, school_wing } = req.body;

  if (!admission_number || !pin) {
    return res.status(400).json({ success: false, message: 'Both Admission Number and Result PIN are required.' });
  }

  const cleanAdm = admission_number.trim().toUpperCase();
  const cleanPin = pin.trim().toUpperCase();

  let query = `
    SELECT p.*, s.name, s.class, s.admission_number, s.gender, s.date_of_birth, 
           s.school_wing, s.house, s.parent_name, s.photo_url
    FROM pins p
    JOIN students s ON p.student_id = s.id
    WHERE p.pin = ? AND s.admission_number = ?
  `;
  const params = [cleanPin, cleanAdm];

  if (school_wing && school_wing !== 'all') {
    query += ` AND s.school_wing = ?`;
    params.push(school_wing.toLowerCase());
  }

  const pinRecord = db.prepare(query).get(params);

  if (!pinRecord) {
    return res.status(404).json({
      success: false,
      message: 'Invalid Admission Number or PIN. Please confirm your credentials.'
    });
  }

  // Check pin usage limit
  if (pinRecord.use_count >= pinRecord.max_uses) {
    return res.status(403).json({
      success: false,
      message: `This PIN has reached its maximum allowed checking limit of ${pinRecord.max_uses} times. Please contact the Bursary.`
    });
  }

  // Fetch results
  const results = db.prepare(`
    SELECT * FROM results
    WHERE student_id = ? AND session = ? AND term = ?
    ORDER BY subject ASC
  `).all(pinRecord.student_id, pinRecord.session, pinRecord.term);

  if (!results || results.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No academic results found for this student for the current term.'
    });
  }

  // Calculate position in class
  const classPositions = db.prepare(`
    SELECT student_id, SUM(total) AS grand_total
    FROM results
    WHERE session = ? AND term = ? AND class = ?
    GROUP BY student_id
    ORDER BY grand_total DESC
  `).all(pinRecord.session, pinRecord.term, pinRecord.class);

  const position = classPositions.findIndex(r => r.student_id === pinRecord.student_id) + 1;
  const totalInClass = classPositions.length;
  const grandTotal = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const average = Number((grandTotal / results.length).toFixed(1));

  // Process grades
  const processedResults = results.map(r => {
    const { grade, remark } = calculateGrade(r.total);
    return { ...r, grade, remark };
  });

  // Ratings
  const ratingRows = db.prepare(`
    SELECT type, trait, rating FROM student_ratings 
    WHERE student_id = ? AND session = ? AND term = ?
  `).all(pinRecord.student_id, pinRecord.session, pinRecord.term);

  const affective = {};
  const psychomotor = {};
  ratingRows.forEach(r => {
    if (r.type === 'affective') affective[r.trait] = r.rating;
    if (r.type === 'psychomotor') psychomotor[r.trait] = r.rating;
  });

  // Settings
  const settings = {};
  db.prepare('SELECT key, value FROM school_settings').all().forEach(s => {
    settings[s.key] = s.value;
  });

  // Increment pin usage
  db.prepare(`
    UPDATE pins 
    SET use_count = use_count + 1, is_used = 1, used_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(pinRecord.id);

  res.json({
    success: true,
    student: {
      id: pinRecord.student_id,
      name: pinRecord.name,
      admission_number: pinRecord.admission_number,
      class: pinRecord.class,
      gender: pinRecord.gender,
      date_of_birth: pinRecord.date_of_birth,
      school_wing: pinRecord.school_wing,
      house: pinRecord.house,
      parent_name: pinRecord.parent_name,
      photo_url: pinRecord.photo_url || (pinRecord.school_wing === 'primary' ? '/assets/images/elementary/elementary_classroom.jpg' : '/assets/images/college/college_classroom.jpg'),
      session: pinRecord.session,
      term: pinRecord.term
    },
    results: processedResults,
    ratings: { affective, psychomotor },
    summary: {
      grand_total: grandTotal,
      max_possible_total: results.length * 100,
      average: average,
      position: position,
      total_in_class: totalInClass,
      overall_grade: calculateGrade(average).grade,
      overall_remark: calculateGrade(average).remark,
      pin_use_count: (pinRecord.use_count || 0) + 1,
      pin_max_uses: pinRecord.max_uses
    },
    settings
  });
});

// Demo students list for 1-click checking
app.get('/api/results/demo-list', (req, res) => {
  const demos = [
    {
      wing: 'primary',
      wing_title: 'Nursery & Primary Wing',
      student_name: 'David Adeleke',
      class: 'Basic 4A',
      admission_number: 'NPS/2024/001',
      pin: 'EXCEL001'
    },
    {
      wing: 'primary',
      wing_title: 'Nursery & Primary Wing',
      student_name: 'Fatima Bello',
      class: 'Nursery 2A',
      admission_number: 'NPS/2024/002',
      pin: 'EXCEL002'
    },
    {
      wing: 'secondary',
      wing_title: 'Secondary School Wing',
      student_name: 'Emeka Okafor',
      class: 'SSS 1A (IGCSE Track)',
      admission_number: 'SEC/2024/001',
      pin: 'SEC0001'
    },
    {
      wing: 'secondary',
      wing_title: 'Secondary School Wing',
      student_name: 'Amina Abubakar',
      class: 'SSS 1B (Humanities & Arts)',
      admission_number: 'SEC/2024/002',
      pin: 'SEC0002'
    }
  ];
  res.json({ success: true, demos });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1B. CURRICULUM SUBJECTS REGISTRY (ELEMENTARY & COLLEGE)
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_SUBJECTS = {
  primary: [
    'Mathematics & Numeracy',
    'English Language & Grammar',
    'Jolly Phonics & Diction',
    'Basic Science & Technology',
    'Social Studies & History',
    'Quantitative Reasoning',
    'Verbal Reasoning',
    'Computer Science & Robotics',
    'Creative Arts & Craft',
    'French & Modern Languages',
    'Agricultural Science (Primary)',
    'Civic Education',
    'Music & Rhythm',
    'Physical & Health Education (PHE)',
    'Christian Religious Studies (CRS)',
    'Islamic Religious Studies (IRS)',
    'Handwriting & Penmanship',
    'Early Numeracy & Counting',
    'Rhymes, Poems & Roleplay',
    'Health Habits & Personal Care',
    'Social & Emotional Development'
  ],
  secondary: [
    'Mathematics (IGCSE Standard)',
    'Further Mathematics',
    'English Language & Composition',
    'Literature in English',
    'Physics & Applied Mechanics',
    'Chemistry',
    'Biology & Physiology',
    'Computer Science & AI',
    'Agricultural Science (Collegiate)',
    'Economics',
    'Commerce & Business Studies',
    'Financial Accounting',
    'Government & Politics',
    'Civic Education & Global Affairs',
    'Geography & Environment',
    'Technical Drawing / Basic Technology',
    'French & Modern Languages',
    'Christian Religious Knowledge (CRK)',
    'Islamic Religious Studies (IRS)',
    'Visual & Fine Arts',
    'Music & Performing Arts',
    'Food & Nutrition'
  ]
};

app.get('/api/subjects', (req, res) => {
  res.json({
    success: true,
    subjects: {
      primary: SCHOOL_SUBJECTS.primary,
      secondary: SCHOOL_SUBJECTS.secondary,
      all: [...new Set([...SCHOOL_SUBJECTS.primary, ...SCHOOL_SUBJECTS.secondary])].sort()
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CBT (COMPUTER-BASED TEST) API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/cbt/questions', (req, res) => {
  const wing = req.query.wing || 'secondary';
  const subject = req.query.subject || '';

  let query = 'SELECT id, school_wing, subject, class_level, question, option_a, option_b, option_c, option_d FROM cbt_questions WHERE school_wing = ?';
  const params = [wing.toLowerCase()];

  if (subject) {
    query += ' AND subject = ?';
    params.push(subject);
  }

  const questions = db.prepare(query).all(params);
  res.json({ success: true, count: questions.length, questions });
});

app.post('/api/cbt/submit', (req, res) => {
  const { candidate_name, candidate_reg, school_wing, subject, answers } = req.body;

  if (!candidate_name || !candidate_reg || !answers) {
    return res.status(400).json({ success: false, message: 'Missing submission details.' });
  }

  const questions = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, correct_option, explanation 
    FROM cbt_questions 
    WHERE school_wing = ? AND subject = ?
  `).all(school_wing.toLowerCase(), subject);

  if (questions.length === 0) {
    return res.status(404).json({ success: false, message: 'No questions found for this exam category.' });
  }

  let score = 0;
  const review = questions.map(q => {
    const userAnswer = (answers[q.id] || '').toUpperCase();
    const isCorrect = userAnswer === q.correct_option;
    if (isCorrect) score++;

    return {
      id: q.id,
      question: q.question,
      user_answer: userAnswer,
      correct_answer: q.correct_option,
      is_correct: isCorrect,
      explanation: q.explanation
    };
  });

  const total = questions.length;
  const percentage = Number(((score / total) * 100).toFixed(1));
  const passed = percentage >= 50 ? 1 : 0;

  // Record attempt
  db.prepare(`
    INSERT INTO cbt_attempts (school_wing, candidate_name, candidate_reg, subject, score, total_questions, percentage, passed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(school_wing, candidate_name, candidate_reg, subject, score, total, percentage, passed);

  const certificateCode = `EXC-CBT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  res.json({
    success: true,
    score,
    total,
    percentage,
    passed: passed === 1,
    grade: calculateGrade(percentage).grade,
    remark: calculateGrade(percentage).remark,
    certificate_code: certificateCode,
    review
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PAYMENT RECEIPT UPLOAD & CLEARANCE API
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/receipts/upload', upload.single('receipt_file'), (req, res) => {
  const {
    school_wing,
    admission_number,
    student_name,
    class_name,
    fee_type,
    amount,
    teller_ref,
    bank_name,
    payment_date
  } = req.body;

  if (!admission_number || !teller_ref || !amount || !fee_type) {
    return res.status(400).json({ success: false, message: 'Please provide all mandatory payment information.' });
  }

  const existingRef = db.prepare('SELECT id FROM payment_receipts WHERE teller_ref = ?').get(teller_ref.trim());
  if (existingRef) {
    return res.status(409).json({ success: false, message: 'A payment receipt with this transaction reference has already been uploaded.' });
  }

  const fileName = req.file ? req.file.filename : null;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(`
    INSERT INTO payment_receipts 
    (school_wing, admission_number, student_name, class, fee_type, amount, teller_ref, bank_name, payment_date, file_name, file_url, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    school_wing || 'secondary',
    admission_number.trim().toUpperCase(),
    student_name.trim(),
    class_name || 'General',
    fee_type,
    parseFloat(amount),
    teller_ref.trim().toUpperCase(),
    bank_name || 'Direct Bank Transfer',
    payment_date || new Date().toISOString().split('T')[0],
    fileName,
    fileUrl,
    'Pending',
    'Submitted for bursary reconciliation'
  );

  const clearanceCode = `CLR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  res.json({
    success: true,
    message: 'Payment receipt uploaded successfully! Your submission is being processed by the Bursary.',
    receipt_id: result.lastInsertRowid,
    clearance_code: clearanceCode,
    details: {
      admission_number: admission_number.toUpperCase(),
      student_name,
      amount,
      teller_ref: teller_ref.toUpperCase(),
      status: 'Pending Verification',
      submitted_at: new Date().toISOString()
    }
  });
});

app.get('/api/receipts/track/:ref', (req, res) => {
  const ref = req.params.ref.trim().toUpperCase();
  const receipt = db.prepare(`
    SELECT * FROM payment_receipts 
    WHERE teller_ref = ? OR admission_number = ?
    ORDER BY id DESC LIMIT 1
  `).get(ref, ref);

  if (!receipt) {
    return res.status(404).json({ success: false, message: 'No payment transaction found matching this reference.' });
  }

  res.json({ success: true, receipt });
});

app.get('/api/receipts/all', (req, res) => {
  const receipts = db.prepare('SELECT * FROM payment_receipts ORDER BY id DESC LIMIT 50').all();
  res.json({ success: true, receipts });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. NOTICES, NEWSLETTERS, EVENTS & SETTINGS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/notices', (req, res) => {
  const wing = req.query.wing;
  let query = 'SELECT * FROM notices WHERE 1=1';
  const params = [];
  if (wing && wing !== 'all') {
    query += " AND (target_wing = ? OR target_wing = 'all')";
    params.push(wing);
  }
  query += ' ORDER BY is_pinned DESC, id DESC';
  const notices = db.prepare(query).all(params);
  res.json({ success: true, notices });
});

app.get('/api/newsletters', (req, res) => {
  const newsletters = db.prepare('SELECT * FROM newsletters ORDER BY id DESC').all();
  res.json({ success: true, newsletters });
});

app.get('/api/events', (req, res) => {
  const wing = req.query.wing;
  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];
  if (wing && wing !== 'all') {
    query += " AND (target_wing = ? OR target_wing = 'all')";
    params.push(wing);
  }
  query += ' ORDER BY event_date ASC';
  const events = db.prepare(query).all(params);
  res.json({ success: true, events });
});

app.post('/api/events/rsvp', (req, res) => {
  const { event_id, parent_name, email, phone, attendees } = req.body;
  if (!event_id || !parent_name || !email) {
    return res.status(400).json({ success: false, message: 'Please provide event, full name, and email.' });
  }

  const ticketCode = `EXC-EVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  db.prepare(`
    INSERT INTO event_rsvps (event_id, parent_name, email, phone, attendees, ticket_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(event_id, parent_name, email, phone || '', attendees || 1, ticketCode);

  db.prepare('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = ?').run(event_id);

  res.json({
    success: true,
    message: 'RSVP confirmed! Your official invitation pass has been generated.',
    ticket_code: ticketCode
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ADMIN BACKEND & ACCESS CONTROL (SUPER ADMIN & MODERATOR)
// ─────────────────────────────────────────────────────────────────────────────

// Permission Middlewares
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.user && ['superadmin', 'moderator', 'admin'].includes(req.session.user.role)) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Administrative authentication required. Please log in.' });
}

function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Action requires Super Admin (Main Admin) authorization.' });
}

// Admin & Portal Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Credentials are required.' });
  }

  // Admin / Moderator login check
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username.trim());
  if (admin && bcrypt.compareSync(password, admin.password_hash)) {
    req.session.user = {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role,
      school_wing: admin.school_wing
    };
    return res.json({
      success: true,
      user_type: 'staff',
      user: req.session.user,
      permissions: {
        isSuperAdmin: admin.role === 'superadmin',
        isModerator: admin.role === 'moderator',
        canManageAdmins: admin.role === 'superadmin',
        canDeleteStudents: admin.role === 'superadmin',
        canDeleteResults: admin.role === 'superadmin',
        canManageSettings: admin.role === 'superadmin'
      },
      redirect: '/admin'
    });
  }

  // Student/Parent admission check
  const student = db.prepare('SELECT * FROM students WHERE admission_number = ?').get(username.trim().toUpperCase());
  if (student) {
    const pin = db.prepare('SELECT * FROM pins WHERE student_id = ? AND pin = ?').get(student.id, password.trim().toUpperCase());
    if (pin) {
      req.session.student = student;
      return res.json({
        success: true,
        user_type: 'student',
        user: student,
        redirect: student.school_wing === 'primary' ? '/primary' : '/secondary'
      });
    }
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username and password/PIN.' });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    const isSuperAdmin = req.session.user.role === 'superadmin';
    const isModerator = req.session.user.role === 'moderator';
    return res.json({
      success: true,
      user: req.session.user,
      permissions: {
        isSuperAdmin,
        isModerator,
        canManageAdmins: isSuperAdmin,
        canDeleteStudents: isSuperAdmin,
        canDeleteResults: isSuperAdmin,
        canManageSettings: isSuperAdmin,
        canManageReceipts: true,
        canManagePins: true,
        canManageCBT: true,
        canManageNotices: true,
        canManageEvents: true
      }
    });
  }
  return res.status(401).json({ success: false, message: 'Not logged in.' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// Admin Dashboard Telemetry
app.get('/api/admin/stats', (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const primaryStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE school_wing = 'primary'").get().count;
  const secondaryStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE school_wing = 'secondary'").get().count;
  const totalReceipts = db.prepare('SELECT COUNT(*) as count FROM payment_receipts').get().count;
  const approvedReceipts = db.prepare("SELECT COUNT(*) as count FROM payment_receipts WHERE status = 'Approved'").get().count;
  const pendingReceipts = db.prepare("SELECT COUNT(*) as count FROM payment_receipts WHERE status = 'Pending'").get().count;
  const totalCbtAttempts = db.prepare('SELECT COUNT(*) as count FROM cbt_attempts').get().count;
  const totalPins = db.prepare('SELECT COUNT(*) as count FROM pins').get().count;
  const usedPins = db.prepare('SELECT COUNT(*) as count FROM pins WHERE is_used = 1').get().count;
  const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  const superAdmins = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'superadmin'").get().count;
  const moderators = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'moderator'").get().count;

  res.json({
    success: true,
    stats: {
      totalStudents,
      primaryStudents,
      secondaryStudents,
      totalReceipts,
      approvedReceipts,
      pendingReceipts,
      totalCbtAttempts,
      totalPins,
      usedPins,
      totalAdmins,
      superAdmins,
      moderators
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN USER MANAGEMENT (SUPER ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/users', requireSuperAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, role, school_wing, created_at FROM admins ORDER BY id ASC').all();
  res.json({ success: true, users });
});

app.post('/api/admin/users', requireSuperAdmin, (req, res) => {
  const { username, password, full_name, role, school_wing } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Username, password, and full name are required.' });
  }

  const validRoles = ['superadmin', 'moderator'];
  const userRole = validRoles.includes(role) ? role : 'moderator';
  const userWing = ['all', 'primary', 'secondary'].includes(school_wing) ? school_wing : 'all';

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(409).json({ success: false, message: 'An administrator or moderator with this username already exists.' });
  }

  const hash = bcrypt.hashSync(password.trim(), 10);
  const result = db.prepare(`
    INSERT INTO admins (username, password_hash, full_name, role, school_wing)
    VALUES (?, ?, ?, ?, ?)
  `).run(username.trim(), hash, full_name.trim(), userRole, userWing);

  res.json({
    success: true,
    message: `${userRole === 'superadmin' ? 'Super Admin' : 'Staff Moderator'} account created successfully.`,
    user_id: result.lastInsertRowid
  });
});

app.put('/api/admin/users/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { full_name, role, school_wing, password } = req.body;

  const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Admin account not found.' });
  }

  const newRole = ['superadmin', 'moderator'].includes(role) ? role : target.role;
  const newWing = ['all', 'primary', 'secondary'].includes(school_wing) ? school_wing : target.school_wing;
  const newName = full_name ? full_name.trim() : target.full_name;

  if (password && password.trim().length > 0) {
    const hash = bcrypt.hashSync(password.trim(), 10);
    db.prepare('UPDATE admins SET full_name = ?, role = ?, school_wing = ?, password_hash = ? WHERE id = ?')
      .run(newName, newRole, newWing, hash, id);
  } else {
    db.prepare('UPDATE admins SET full_name = ?, role = ?, school_wing = ? WHERE id = ?')
      .run(newName, newRole, newWing, id);
  }

  res.json({ success: true, message: 'Staff profile updated successfully.' });
});

app.delete('/api/admin/users/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (req.session && req.session.user && id === req.session.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own active administrator account.' });
  }
  if (id === 1) {
    return res.status(400).json({ success: false, message: 'The primary root Super Admin cannot be deleted.' });
  }

  db.prepare('DELETE FROM admins WHERE id = ?').run(id);
  res.json({ success: true, message: 'Administrator/moderator account deleted successfully.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. STUDENT DIRECTORY & ENROLMENT
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/students', requireAdminAuth, (req, res) => {
  const { wing, search } = req.query;
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (wing && wing !== 'all') {
    sql += ' AND school_wing = ?';
    params.push(wing);
  }

  if (search && search.trim()) {
    sql += ' AND (name LIKE ? OR admission_number LIKE ? OR class LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY id DESC';
  const students = db.prepare(sql).all(params);
  res.json({ success: true, students });
});

app.post('/api/admin/students', requireAdminAuth, (req, res) => {
  const { school_wing, admission_number, name, class_name, gender, date_of_birth, parent_name, parent_phone, parent_email, house, photo_url } = req.body;

  if (!admission_number || !name || !class_name) {
    return res.status(400).json({ success: false, message: 'Admission number, name, and class are required.' });
  }

  const adm = admission_number.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM students WHERE admission_number = ?').get(adm);
  if (existing) {
    return res.status(409).json({ success: false, message: 'A student with this admission number already exists.' });
  }

  const wing = (school_wing === 'primary' || school_wing === 'elementary') ? 'primary' : 'secondary';
  const defaultPhoto = wing === 'primary' 
    ? '/assets/images/elementary/elementary_classroom.jpg' 
    : '/assets/images/college/college_classroom.jpg';

  const result = db.prepare(`
    INSERT INTO students (school_wing, admission_number, name, class, gender, date_of_birth, parent_name, parent_phone, parent_email, house, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    wing,
    adm,
    name.trim(),
    class_name.trim(),
    gender || 'Male',
    date_of_birth || '2016-01-01',
    parent_name || 'Parent/Guardian',
    parent_phone || '',
    parent_email || '',
    house || 'Churchill',
    photo_url || defaultPhoto
  );

  const newStudentId = result.lastInsertRowid;

  // Auto-generate complimentary Scratch Card PIN
  const prefix = wing === 'primary' ? 'EXCEL' : 'SEC';
  const pinCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  db.prepare(`
    INSERT INTO pins (pin, student_id, school_wing, session, term, is_used, use_count, max_uses)
    VALUES (?, ?, ?, '2025/2026', 'First Term', 0, 0, 5)
  `).run(pinCode, newStudentId, wing);

  res.json({
    success: true,
    message: 'Student enrolled successfully and complimentary result PIN generated.',
    student_id: newStudentId,
    generated_pin: pinCode
  });
});

app.put('/api/admin/students/:id', requireAdminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, class_name, gender, parent_name, parent_phone, parent_email, house, photo_url } = req.body;

  const target = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });

  db.prepare(`
    UPDATE students 
    SET name = ?, class = ?, gender = ?, parent_name = ?, parent_phone = ?, parent_email = ?, house = ?, photo_url = ?
    WHERE id = ?
  `).run(
    name ? name.trim() : target.name,
    class_name ? class_name.trim() : target.class,
    gender || target.gender,
    parent_name || target.parent_name,
    parent_phone || target.parent_phone,
    parent_email || target.parent_email,
    house || target.house,
    photo_url || target.photo_url,
    id
  );

  res.json({ success: true, message: 'Student profile updated successfully.' });
});

// DELETE Student (SUPER ADMIN ONLY — Moderators cannot delete students)
app.delete('/api/admin/students/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  res.json({ success: true, message: 'Student and related records deleted successfully by Super Admin.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCRATCH CARD / PIN INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/pins', requireAdminAuth, (req, res) => {
  const pins = db.prepare(`
    SELECT p.*, s.name as student_name, s.admission_number, s.class
    FROM pins p
    JOIN students s ON p.student_id = s.id
    ORDER BY p.id DESC
  `).all();
  res.json({ success: true, pins });
});

app.post('/api/admin/pins/generate', requireAdminAuth, (req, res) => {
  const { student_id, session, term, max_uses } = req.body;
  if (!student_id) return res.status(400).json({ success: false, message: 'Student selection is required.' });

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  const prefix = student.school_wing === 'primary' ? 'EXCEL' : 'SEC';
  const pinCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

  db.prepare(`
    INSERT INTO pins (pin, student_id, school_wing, session, term, is_used, use_count, max_uses)
    VALUES (?, ?, ?, ?, ?, 0, 0, ?)
  `).run(
    pinCode,
    student.id,
    student.school_wing,
    session || '2025/2026',
    term || 'First Term',
    max_uses || 5
  );

  res.json({ success: true, message: 'Scratch Card PIN generated successfully.', pin: pinCode });
});

app.put('/api/admin/pins/:id/reset', requireAdminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('UPDATE pins SET is_used = 0, use_count = 0 WHERE id = ?').run(id);
  res.json({ success: true, message: 'PIN usage counter reset to 0.' });
});

app.delete('/api/admin/pins/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM pins WHERE id = ?').run(id);
  res.json({ success: true, message: 'PIN deleted by Super Admin.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. BURSARY RECEIPTS STATUS (SUPER ADMIN & MODERATOR)
// ─────────────────────────────────────────────────────────────────────────────

app.put('/api/admin/receipts/:id/status', requireAdminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, remarks } = req.body;

  const validStatuses = ['Approved', 'Rejected', 'Pending'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const verifier = req.session.user ? req.session.user.full_name : 'Staff Auditor';
  db.prepare(`
    UPDATE payment_receipts 
    SET status = ?, verified_by = ?, remarks = ?
    WHERE id = ?
  `).run(status, verifier, remarks || `Marked as ${status} by ${verifier}`, id);

  res.json({ success: true, message: `Receipt #${id} updated to ${status}.` });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. RESULTS & ACADEMIC GRADES
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/results', requireAdminAuth, (req, res) => {
  const { student_id, wing } = req.query;
  let sql = `
    SELECT r.*, s.name as student_name, s.admission_number, s.class as student_class
    FROM results r
    JOIN students s ON r.student_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (student_id) {
    sql += ' AND r.student_id = ?';
    params.push(student_id);
  }
  if (wing && wing !== 'all') {
    sql += ' AND r.school_wing = ?';
    params.push(wing);
  }
  sql += ' ORDER BY r.id DESC LIMIT 100';

  const results = db.prepare(sql).all(params);
  res.json({ success: true, results });
});

app.post('/api/admin/results', requireAdminAuth, (req, res) => {
  const { student_id, session, term, subject, ca1, ca2, exam } = req.body;
  if (!student_id || !subject) {
    return res.status(400).json({ success: false, message: 'Student and subject are required.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  const c1 = parseFloat(ca1) || 0;
  const c2 = parseFloat(ca2) || 0;
  const ex = parseFloat(exam) || 0;
  const total = Math.min(100, Math.round((c1 + c2 + ex) * 10) / 10);
  const { grade, remark } = calculateGrade(total);

  const existing = db.prepare(`
    SELECT id FROM results 
    WHERE student_id = ? AND session = ? AND term = ? AND subject = ?
  `).get(student.id, session || '2025/2026', term || 'First Term', subject.trim());

  if (existing) {
    db.prepare(`
      UPDATE results 
      SET ca1 = ?, ca2 = ?, exam = ?, total = ?, grade = ?, remark = ?
      WHERE id = ?
    `).run(c1, c2, ex, total, grade, remark, existing.id);
  } else {
    db.prepare(`
      INSERT INTO results (student_id, school_wing, session, term, class, subject, ca1, ca2, exam, total, grade, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student.id, student.school_wing, session || '2025/2026', term || 'First Term', student.class, subject.trim(), c1, c2, ex, total, grade, remark);
  }

  res.json({ success: true, message: `Score for ${subject} recorded: Total ${total} (${grade} - ${remark})` });
});

app.delete('/api/admin/results/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM results WHERE id = ?').run(id);
  res.json({ success: true, message: 'Result record deleted by Super Admin.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CBT QUESTIONS & EXAMINATION ATTEMPTS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/cbt/questions', requireAdminAuth, (req, res) => {
  const questions = db.prepare('SELECT * FROM cbt_questions ORDER BY id DESC').all();
  res.json({ success: true, questions });
});

app.post('/api/admin/cbt/questions', requireAdminAuth, (req, res) => {
  const { school_wing, subject, class_level, question, option_a, option_b, option_c, option_d, correct_option, explanation } = req.body;
  if (!question || !option_a || !option_b || !correct_option) {
    return res.status(400).json({ success: false, message: 'Question, options, and correct option are required.' });
  }

  db.prepare(`
    INSERT INTO cbt_questions (school_wing, subject, class_level, question, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    school_wing || 'secondary',
    subject || 'General Knowledge',
    class_level || 'General',
    question.trim(),
    option_a.trim(),
    option_b.trim(),
    option_c.trim(),
    option_d.trim(),
    correct_option.trim().toUpperCase(),
    explanation || ''
  );

  res.json({ success: true, message: 'CBT examination question added to question bank.' });
});

app.delete('/api/admin/cbt/questions/:id', requireSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM cbt_questions WHERE id = ?').run(id);
  res.json({ success: true, message: 'CBT question deleted by Super Admin.' });
});

app.get('/api/admin/cbt/attempts', requireAdminAuth, (req, res) => {
  const attempts = db.prepare('SELECT * FROM cbt_attempts ORDER BY id DESC LIMIT 50').all();
  res.json({ success: true, attempts });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. NOTICES & BULLETIN TICKER (WITH IMAGE & VIDEO UPLOADS)
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/admin/notices', requireAdminAuth, uploadBulletinMedia.single('media'), (req, res) => {
  const { title, category, target_wing, excerpt, content, is_pinned, media_url_input } = req.body;
  if (!title || !category) return res.status(400).json({ success: false, message: 'Title and category required.' });

  const author = req.session.user ? req.session.user.full_name : 'School Registry';
  const today = new Date().toISOString().split('T')[0];

  let mediaUrl = null;
  let mediaType = null;

  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    const ext = path.extname(req.file.filename).toLowerCase();
    if (['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(ext) || (req.file.mimetype && req.file.mimetype.startsWith('video/'))) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  } else if (media_url_input && media_url_input.trim()) {
    mediaUrl = media_url_input.trim();
    const lower = mediaUrl.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov') || lower.includes('youtube') || lower.includes('vimeo')) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  }

  const result = db.prepare(`
    INSERT INTO notices (title, category, target_wing, excerpt, content, date, is_pinned, author, media_url, media_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    category.trim(),
    target_wing || 'all',
    excerpt || title,
    content || title,
    today,
    (is_pinned === 'true' || is_pinned === true || is_pinned === 1 || is_pinned === '1') ? 1 : 0,
    author,
    mediaUrl,
    mediaType
  );

  res.json({
    success: true,
    message: `Notice published successfully with ${mediaType ? `${mediaType.toUpperCase()} attachment` : 'no media attachment'}.`,
    notice_id: result.lastInsertRowid,
    media_url: mediaUrl,
    media_type: mediaType
  });
});

app.delete('/api/admin/notices/:id', requireAdminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM notices WHERE id = ?').run(id);
  res.json({ success: true, message: 'Notice removed.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SCHOOL SETTINGS (SUPER ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/settings', (req, res) => {
  const settings = {};
  db.prepare('SELECT key, value FROM school_settings').all().forEach(s => {
    settings[s.key] = s.value;
  });
  res.json({ success: true, settings });
});

app.post('/api/admin/settings', requireSuperAdmin, (req, res) => {
  const settings = req.body;
  const updateSetting = db.prepare('INSERT OR REPLACE INTO school_settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    updateSetting.run(key, String(value));
  }
  res.json({ success: true, message: 'School settings updated successfully by Super Admin.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. HTML PAGE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.sendFile('index.html', { root: publicDir }));
app.get('/primary', (req, res) => res.sendFile('primary.html', { root: publicDir }));
app.get('/secondary', (req, res) => res.sendFile('secondary.html', { root: publicDir }));
app.get('/cbt', (req, res) => res.sendFile('cbt.html', { root: publicDir }));
app.get('/result-checker', (req, res) => res.sendFile('result-checker.html', { root: publicDir }));
app.get('/payment-receipt', (req, res) => res.sendFile('payment-receipt.html', { root: publicDir }));
app.get('/newsletter', (req, res) => res.sendFile('newsletter.html', { root: publicDir }));
app.get('/events', (req, res) => res.sendFile('events.html', { root: publicDir }));
app.get('/admin', (req, res) => res.sendFile('admin.html', { root: publicDir }));

// Catch-all route for Express 5
app.get('/{*path}', (req, res) => res.sendFile('index.html', { root: publicDir }));

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`\n══════════════════════════════════════════════════════════════════`);
    console.log(`  EXCELLENCE BRITISH SCHOOLS MANAGEMENT SYSTEM`);
    console.log(`  UK Standard Academic Platform & Dual-Wing Portal Hub`);
    console.log(`══════════════════════════════════════════════════════════════════`);
    console.log(`  Main Portal:           http://localhost:${PORT}`);
    console.log(`  Elementary Wing:       http://localhost:${PORT}/primary (Excellence Elementary School)`);
    console.log(`  College Wing:          http://localhost:${PORT}/secondary (Excellence College)`);
    console.log(`  Result Checker:        http://localhost:${PORT}/result-checker`);
    console.log(`  CBT Assessment:        http://localhost:${PORT}/cbt`);
    console.log(`  Payment Upload:        http://localhost:${PORT}/payment-receipt`);
    console.log(`  Academic Newsletters:  http://localhost:${PORT}/newsletter`);
    console.log(`  Upcoming Events:       http://localhost:${PORT}/events`);
    console.log(`  Admin Dashboard:       http://localhost:${PORT}/admin (admin / admin123)`);
    console.log(`══════════════════════════════════════════════════════════════════\n`);
  });
}

module.exports = app;
