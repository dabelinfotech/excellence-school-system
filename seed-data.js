const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('Seeding Excellence British Schools data with African imagery & updated structure...');

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

db.transaction(() => {
  // 1. Settings
  const settings = [
    ['school_name', 'EXCELLENCE BRITISH SCHOOLS'],
    ['elementary_name', 'Excellence Elementary School'],
    ['college_name', 'Excellence College'],
    ['school_motto', 'Virtus, Sapientia et Excellentia (Virtue, Wisdom and Excellence)'],
    ['school_address', 'Excellence Boulevard, Off Admiralty Way, Victoria Island / Lekki Peninsula Campus'],
    ['school_phone', '+234 803 000 8899 | +44 (0) 20 7946 0921'],
    ['school_email', 'admissions@excellencebritishschools.sch.ng'],
    ['school_portal_url', 'http://localhost:4000'],
    ['current_session', '2024/2025'],
    ['current_term', 'First Term'],
    ['next_term_begins', 'January 12, 2026'],
    ['primary_head_name', 'Mrs. Folashade Adeleke, M.Ed (Oxon)'],
    ['secondary_principal_name', 'Dr. Babatunde Alabi, Ph.D (Cantab), FRSA'],
    ['college_principal_name', 'Mr. Chiemeka Nwosu, M.Sc, FIMC'],
    ['accreditations', 'DfE Standard Registered | British Council Partner | Cambridge International Assessment Centre | COBIS Accredited']
  ];
  const insertSetting = db.prepare('INSERT OR REPLACE INTO school_settings (key, value) VALUES (?, ?)');
  settings.forEach(([k, v]) => insertSetting.run(k, v));

  // 2. Admins (Super Admin & Moderator Categories)
  const passAdmin = bcrypt.hashSync('admin123', 10);
  const passMod = bcrypt.hashSync('mod123', 10);

  const insertAdmin = db.prepare('INSERT OR REPLACE INTO admins (id, username, password_hash, full_name, role, school_wing) VALUES (?, ?, ?, ?, ?, ?)');
  insertAdmin.run(1, 'admin', passAdmin, 'Dr. Babatunde Alabi', 'superadmin', 'all');
  insertAdmin.run(2, 'moderator', passMod, 'Mrs. Folashade Adeleke', 'moderator', 'all');
  insertAdmin.run(3, 'elementary_mod', passMod, 'Mr. Kenneth Balogun', 'moderator', 'primary');
  insertAdmin.run(4, 'college_mod', passMod, 'Mrs. Chidinma Okafor', 'moderator', 'secondary');

  // 3. Students
  // ELEMENTARY STUDENTS (Excellence Elementary School)
  const insertStudent = db.prepare(`
    INSERT OR REPLACE INTO students 
    (id, school_wing, admission_number, name, class, gender, date_of_birth, parent_name, parent_phone, parent_email, house, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run(1, 'primary', 'NPS/2024/001', 'David Adeleke', 'Basic 4A', 'Male', '2015-04-12', 'Chief Deji Adeleke', '+234 802 334 1122', 'deji.adeleke@gmail.com', 'Churchill', '/assets/images/elementary/elementary_classroom.jpg');
  insertStudent.run(2, 'primary', 'NPS/2024/002', 'Fatima Bello', 'Nursery 2A', 'Female', '2019-09-08', 'Alhaji Umar Bello', '+234 803 445 2233', 'bello.umar@yahoo.com', 'Nightingale', '/assets/images/elementary/elementary_library.jpg');
  insertStudent.run(3, 'primary', 'NPS/2024/003', 'Chinedu Eze', 'Basic 5A', 'Male', '2014-11-20', 'Barr. Christopher Eze', '+234 805 556 3344', 'chris.eze@ezelegal.com', 'Newton', '/assets/images/elementary/elementary_ict.jpg');
  insertStudent.run(4, 'primary', 'NPS/2024/004', 'Zainab Danjuma', 'Basic 4A', 'Female', '2015-07-03', 'Gen. Theophilus Danjuma', '+234 803 221 4455', 'zainab.danjuma@outlook.com', 'Shakespeare', '/assets/images/elementary/elementary_assembly.jpg');
  insertStudent.run(5, 'primary', 'NPS/2024/005', 'Kofi Mensah', 'Basic 4A', 'Male', '2015-02-18', 'Dr. Kwame Mensah', '+234 806 331 9900', 'dr.mensah@unilag.edu.ng', 'Churchill', '/assets/images/elementary/elementary_exam.jpg');

  // COLLEGE STUDENTS (Excellence College)
  insertStudent.run(10, 'secondary', 'SEC/2024/001', 'Emeka Okafor', 'SSS1A', 'Male', '2009-03-15', 'Engr. Lawrence Okafor', '+234 803 778 9900', 'okafor.law@gmail.com', 'Churchill', '/assets/images/college/college_sci_lab.jpg');
  insertStudent.run(11, 'secondary', 'SEC/2024/002', 'Amina Abubakar', 'SSS1B', 'Female', '2009-08-22', 'Senator Kabir Abubakar', '+234 802 889 0011', 'abubakar.sen@gov.ng', 'Shakespeare', '/assets/images/college/college_classroom.jpg');
  insertStudent.run(12, 'secondary', 'SEC/2024/003', 'Tunde Balogun', 'JSS3A', 'Male', '2011-06-10', 'Mrs. Folake Balogun', '+234 807 990 1122', 'folake.balogun@access.com', 'Newton', '/assets/images/college/college_ict.jpg');
  insertStudent.run(13, 'secondary', 'SEC/2024/004', 'Chidimma Okoli', 'SSS1A', 'Female', '2009-01-25', 'Chief Anthony Okoli', '+234 805 112 3344', 'okoli.anthony@fidelity.com', 'Newton', '/assets/images/college/college_cultural.jpg');
  insertStudent.run(14, 'secondary', 'SEC/2024/005', 'Tariq Al-Mansoor', 'SSS1A', 'Male', '2009-11-14', 'Dr. Tariq Al-Mansoor', '+234 809 778 1122', 'tariq.mansoor@almansoor.ae', 'Nightingale', '/assets/images/college/college_assembly.jpg');

  // 4. Scratch Card PINs
  const insertPin = db.prepare(`
    INSERT OR REPLACE INTO pins (id, pin, student_id, school_wing, session, term, is_used, used_at, use_count, max_uses)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Elementary PINs
  insertPin.run(1, 'EXCEL001', 1, 'primary', '2024/2025', 'First Term', 1, '2026-10-20 11:25:05', 2, 5);
  insertPin.run(2, 'EXCEL002', 2, 'primary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(3, 'EXCEL003', 3, 'primary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(4, 'EXCEL004', 4, 'primary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(5, 'EXCEL005', 5, 'primary', '2024/2025', 'First Term', 0, null, 0, 5);

  // College PINs
  insertPin.run(10, 'SEC0001', 10, 'secondary', '2024/2025', 'First Term', 1, '2026-10-20 12:34:08', 2, 5);
  insertPin.run(11, 'SEC0002', 11, 'secondary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(12, 'SEC0003', 12, 'secondary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(13, 'SEC0004', 13, 'secondary', '2024/2025', 'First Term', 0, null, 0, 5);
  insertPin.run(14, 'SEC0005', 14, 'secondary', '2024/2025', 'First Term', 0, null, 0, 5);

  // Clear and Re-insert Results
  db.prepare('DELETE FROM results').run();
  const insertResult = db.prepare(`
    INSERT INTO results (student_id, school_wing, session, term, class, subject, ca1, ca2, exam, total, grade, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // David Adeleke (Basic 4A)
  const davidScores = [
    ['Mathematics', 18, 19, 58],
    ['English Language', 19, 18, 55],
    ['Basic Science & Technology', 17, 18, 52],
    ['Social Studies & History', 18, 17, 50],
    ['Quantitative Reasoning', 19, 19, 56],
    ['Verbal Reasoning', 18, 18, 53],
    ['French & Modern Languages', 16, 17, 49],
    ['Computer Science & Robotics', 20, 20, 57],
    ['Creative Arts & Design', 18, 19, 54],
    ['Music & Orchestra', 17, 18, 51]
  ];
  davidScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(1, 'primary', '2024/2025', 'First Term', 'Basic 4A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Zainab Danjuma (Basic 4A peer)
  const zainabScores = [
    ['Mathematics', 17, 18, 54],
    ['English Language', 19, 20, 58],
    ['Basic Science & Technology', 18, 17, 51],
    ['Social Studies & History', 19, 18, 55],
    ['Quantitative Reasoning', 17, 18, 50],
    ['Verbal Reasoning', 19, 19, 57],
    ['French & Modern Languages', 18, 18, 52],
    ['Computer Science & Robotics', 18, 19, 53],
    ['Creative Arts & Design', 20, 19, 56],
    ['Music & Orchestra', 19, 19, 55]
  ];
  zainabScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(4, 'primary', '2024/2025', 'First Term', 'Basic 4A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Fatima Bello (Nursery 2A)
  const fatimaScores = [
    ['Early Numeracy & Counting', 19, 18, 57],
    ['Jolly Phonics & Pre-Reading', 20, 19, 58],
    ['Health Habits & Personal Care', 18, 19, 56],
    ['Social & Emotional Development', 19, 18, 55],
    ['Rhymes, Poems & Roleplay', 19, 19, 58],
    ['Colouring, Craft & Motor Skills', 18, 18, 54]
  ];
  fatimaScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(2, 'primary', '2024/2025', 'First Term', 'Nursery 2A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Chinedu Eze (Basic 5A)
  const chineduScores = [
    ['Mathematics', 19, 20, 57],
    ['English Language', 17, 18, 51],
    ['Basic Science & Technology', 19, 18, 56],
    ['Social Studies', 16, 17, 48],
    ['Quantitative Reasoning', 20, 19, 59],
    ['Verbal Reasoning', 17, 18, 50],
    ['Computer Studies', 19, 19, 55]
  ];
  chineduScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(3, 'primary', '2024/2025', 'First Term', 'Basic 5A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Emeka Okafor (College SSS1A)
  const emekaScores = [
    ['Mathematics (IGCSE Standard)', 19, 19, 58],
    ['English Language & Composition', 17, 18, 52],
    ['Physics', 18, 19, 55],
    ['Chemistry', 19, 18, 56],
    ['Biology', 17, 18, 50],
    ['Further Mathematics', 18, 19, 54],
    ['Computer Science & AI', 20, 20, 59],
    ['Economics', 16, 17, 49],
    ['Civic Education & Global Affairs', 18, 18, 51]
  ];
  emekaScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(10, 'secondary', '2024/2025', 'First Term', 'SSS1A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Chidimma Okoli (College SSS1A peer)
  const chidimmaScores = [
    ['Mathematics (IGCSE Standard)', 18, 18, 53],
    ['English Language & Composition', 20, 19, 58],
    ['Physics', 17, 17, 50],
    ['Chemistry', 16, 17, 48],
    ['Biology', 18, 18, 52],
    ['Further Mathematics', 16, 17, 47],
    ['Computer Science & AI', 19, 19, 54],
    ['Economics', 19, 18, 55],
    ['Civic Education & Global Affairs', 19, 19, 56]
  ];
  chidimmaScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(13, 'secondary', '2024/2025', 'First Term', 'SSS1A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Amina Abubakar (SSS1B)
  const aminaScores = [
    ['Mathematics', 17, 18, 51],
    ['English Language', 19, 20, 57],
    ['Literature in English', 20, 19, 58],
    ['Government & Politics', 18, 19, 54],
    ['Economics', 18, 17, 52],
    ['French', 19, 18, 55],
    ['Biology', 16, 17, 49],
    ['Computer Studies', 18, 18, 51]
  ];
  aminaScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(11, 'secondary', '2024/2025', 'First Term', 'SSS1B', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // Tunde Balogun (JSS3A)
  const tundeScores = [
    ['Mathematics', 18, 17, 53],
    ['English Studies', 17, 18, 50],
    ['Basic Science', 18, 19, 54],
    ['Basic Technology', 19, 18, 55],
    ['Social Studies & History', 16, 17, 48],
    ['ICT & Programming', 20, 19, 57],
    ['Business Studies', 17, 18, 50],
    ['Agricultural Science', 18, 17, 52]
  ];
  tundeScores.forEach(([sub, ca1, ca2, ex]) => {
    const tot = ca1 + ca2 + ex;
    const { grade, remark } = calculateGrade(tot);
    insertResult.run(12, 'secondary', '2024/2025', 'First Term', 'JSS3A', sub, ca1, ca2, ex, tot, grade, remark);
  });

  // 6. Affective & Psychomotor Ratings
  db.prepare('DELETE FROM student_ratings').run();
  const insertRating = db.prepare(`
    INSERT INTO student_ratings (student_id, school_wing, session, term, type, trait, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const affectiveTraits = ['Punctuality', 'Attentiveness', 'Politeness & Demeanour', 'Honesty & Integrity', 'Leadership & Initiative', 'Teamwork & Collaboration', 'Emotional Maturity'];
  const psychomotorTraits = ['Handwriting & Presentation', 'Verbal Fluency', 'Sports & Physical Dexterity', 'Laboratory & Experimental Skill', 'Musical & Artistic Expression', 'Digital & Computer Dexterity'];

  [1, 2, 3, 4, 10, 11, 12, 13].forEach(sid => {
    const wing = sid >= 10 ? 'secondary' : 'primary';
    affectiveTraits.forEach((trait, i) => {
      const val = 4 + ((sid + i) % 2);
      insertRating.run(sid, wing, '2024/2025', 'First Term', 'affective', trait, Math.min(5, val));
    });
    psychomotorTraits.forEach((trait, i) => {
      const val = 4 + ((sid + i + 1) % 2);
      insertRating.run(sid, wing, '2024/2025', 'First Term', 'psychomotor', trait, Math.min(5, val));
    });
  });

  // 7. Update initial receipts
  db.prepare('DELETE FROM payment_receipts').run();
  const insertReceipt = db.prepare(`
    INSERT INTO payment_receipts 
    (school_wing, admission_number, student_name, class, fee_type, amount, teller_ref, bank_name, payment_date, file_name, file_url, status, verified_by, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReceipt.run(
    'primary',
    'NPS/2024/001',
    'David Adeleke',
    'Basic 4A',
    'Tuition Fee (Term 1)',
    450000.00,
    'TXN-GTB-9982341',
    'Guaranty Trust Bank',
    '2026-09-02',
    'David_Adeleke_Tuition_Receipt.pdf',
    '/assets/images/elementary/elementary_assembly.jpg',
    'Approved',
    'Bursar E. Jenkins',
    'Fully reconciled for Michaelmas term at Excellence Elementary School.'
  );
  insertReceipt.run(
    'secondary',
    'SEC/2024/001',
    'Emeka Okafor',
    'SSS1A',
    'Cambridge Exam & Tuition Fee',
    780000.00,
    'TXN-ZENITH-440182',
    'Zenith Bank PLC',
    '2026-09-05',
    'Emeka_Okafor_ExamFee.png',
    '/assets/images/college/college_sci_lab.jpg',
    'Approved',
    'Bursar E. Jenkins',
    'Verified for Cambridge IGCSE examination clearance at Excellence College.'
  );
  insertReceipt.run(
    'secondary',
    'SEC/2024/002',
    'Amina Abubakar',
    'SSS1B',
    'Boarding & Welfare Fee',
    620000.00,
    'TXN-STANBIC-110943',
    'Stanbic IBTC Bank',
    '2026-10-18',
    'Amina_Abubakar_BoardingReceipt.jpg',
    '/assets/images/college/college_assembly.jpg',
    'Pending',
    null,
    'Under review by Excellence College Bursary unit.'
  );

})();

console.log('Excellence British Schools data seeded successfully!');
