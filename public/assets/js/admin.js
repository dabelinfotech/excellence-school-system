/* ═══════════════════════════════════════════════════════════════════
   ADMIN & MANAGEMENT DASHBOARD CLIENT — EXCELLENCE BRITISH SCHOOLS
   Dual-Category Role Engine: Super Admin (Main Admin) & Moderator
   ═══════════════════════════════════════════════════════════════════ */

let currentUser = null;
let currentPermissions = {};
let allStudentsCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupModalDismissals();
  setupFormHandlers();
  await checkAuthAndInitialize();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & ROLE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

async function checkAuthAndInitialize() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        currentPermissions = data.permissions || {};
        applyRoleInterface();
        await refreshDashboard();
        return;
      }
    }
  } catch (_) {}

  // Not authenticated, auto-authenticate with default Super Admin or show login modal
  try {
    const autoLog = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const autoData = await autoLog.json();
    if (autoData.success) {
      currentUser = autoData.user;
      currentPermissions = autoData.permissions || {};
      applyRoleInterface();
      await refreshDashboard();
      return;
    }
  } catch (_) {}

  openModal('modal-auth');
}

function applyRoleInterface() {
  if (!currentUser) return;

  const roleBadge = document.getElementById('admin-role-badge');
  const nameEl = document.getElementById('admin-display-name');
  const wingEl = document.getElementById('admin-display-wing');
  const ribbonIcon = document.getElementById('ribbon-icon');
  const ribbonText = document.getElementById('ribbon-text');
  const usersLockPill = document.getElementById('users-lock-pill');
  const settingsLockPill = document.getElementById('settings-lock-pill');
  const usersLockedView = document.getElementById('users-locked-view');
  const usersActiveView = document.getElementById('users-active-view');
  const settingsLockedView = document.getElementById('settings-locked-view');
  const settingsActiveView = document.getElementById('settings-active-view');
  const superOnlyButtons = document.querySelectorAll('.superadmin-only-btn');

  const isSuper = currentUser.role === 'superadmin';

  if (nameEl) nameEl.textContent = currentUser.full_name;
  if (wingEl) {
    const wingName = currentUser.school_wing === 'primary' ? 'Excellence Elementary' :
                     currentUser.school_wing === 'secondary' ? 'Excellence College' : 'All Wings';
    wingEl.textContent = `Scope: ${wingName}`;
  }

  if (isSuper) {
    // 👑 Super Admin Mode
    if (roleBadge) {
      roleBadge.className = 'admin-role-badge superadmin';
      roleBadge.textContent = '👑 SUPER ADMIN (MAIN)';
    }
    if (ribbonIcon) ribbonIcon.textContent = '👑';
    if (ribbonText) {
      ribbonText.innerHTML = '<strong>Super Admin Master Mode:</strong> Full administrative clearance active. Authorized for Admin Management, Student Records, Bursary Reconciliation, PIN Minting, CBT & Master Configuration.';
    }

    if (usersLockPill) usersLockPill.style.display = 'none';
    if (settingsLockPill) settingsLockPill.style.display = 'none';
    if (usersLockedView) usersLockedView.style.display = 'none';
    if (usersActiveView) usersActiveView.style.display = 'block';
    if (settingsLockedView) settingsLockedView.style.display = 'none';
    if (settingsActiveView) settingsActiveView.style.display = 'block';

    superOnlyButtons.forEach(btn => btn.style.display = 'inline-flex');
  } else {
    // 🛡️ Moderator Mode
    if (roleBadge) {
      roleBadge.className = 'admin-role-badge moderator';
      roleBadge.textContent = '🛡️ STAFF MODERATOR';
    }
    if (ribbonIcon) ribbonIcon.textContent = '🛡️';
    if (ribbonText) {
      ribbonText.innerHTML = '<strong>Staff Moderator Clearance:</strong> Operational audit and supervisory mode active. Authorized to review Bursary receipts, record grades, enrol students, and monitor CBT tests. Admin personnel management is restricted to Super Admin.';
    }

    if (usersLockPill) usersLockPill.style.display = 'inline-block';
    if (settingsLockPill) settingsLockPill.style.display = 'inline-block';
    if (usersLockedView) usersLockedView.style.display = 'block';
    if (usersActiveView) usersActiveView.style.display = 'none';
    if (settingsLockedView) settingsLockedView.style.display = 'block';
    if (settingsActiveView) settingsActiveView.style.display = 'none';

    superOnlyButtons.forEach(btn => btn.style.display = 'none');
  }
}

window.switchUserRole = async function(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      currentPermissions = data.permissions || {};
      closeModal('modal-auth');
      applyRoleInterface();
      await refreshDashboard();
      alert(`Switched account to:\n${data.user.full_name}\nRole: ${data.user.role.toUpperCase()}`);
    } else {
      alert(data.message || 'Authentication error.');
    }
  } catch (err) {
    alert('Failed to connect to authentication backend.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DASHBOARD DATA REFRESH & TELEMETRY
// ─────────────────────────────────────────────────────────────────────────────

async function refreshDashboard() {
  await loadTelemetry();
  await loadStudents();
  await loadReceipts();
  await loadPins();
  await loadResults();
  await loadCbt();
  await loadNotices();
  await loadSettings();

  if (currentUser && currentUser.role === 'superadmin') {
    await loadUsers();
  }
}

async function loadTelemetry() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById('stat-total-students').textContent = s.totalStudents;
      document.getElementById('stat-primary-students').textContent = s.primaryStudents;
      document.getElementById('stat-secondary-students').textContent = s.secondaryStudents;
      document.getElementById('stat-approved-receipts').textContent = s.approvedReceipts;
      document.getElementById('stat-pending-sub').textContent = `${s.pendingReceipts || 0} Pending Audit`;
      document.getElementById('stat-cbt-count').textContent = s.totalCbtAttempts;
      document.getElementById('stat-pins-count').textContent = `${s.usedPins} / ${s.totalPins}`;
      document.getElementById('stat-admins-count').textContent = s.totalAdmins;
      document.getElementById('stat-admins-breakdown').textContent = `${s.superAdmins} Super / ${s.moderators} Mod`;

      const badge = document.getElementById('badge-pending-receipts');
      if (badge) {
        if (s.pendingReceipts > 0) {
          badge.textContent = s.pendingReceipts;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADMIN USER MANAGEMENT (SUPER ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

async function loadUsers() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/users');
    const data = await res.json();

    if (data.success && data.users && data.users.length > 0) {
      container.innerHTML = data.users.map(u => {
        const isSelf = currentUser && currentUser.id === u.id;
        const isRoot = u.id === 1;
        const isSuper = u.role === 'superadmin';

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 700;">#${u.id}</td>
            <td>
              <strong>${u.full_name}</strong> ${isSelf ? '<span style="font-size:0.7rem; background:#dbeafe; color:#1e40af; padding:1px 6px; border-radius:4px; font-weight:700;">You</span>' : ''}
            </td>
            <td><code style="background: #e2e8f0; padding: 2px 6px; font-weight: 700;">${u.username}</code></td>
            <td>
              <span class="admin-role-badge ${isSuper ? 'superadmin' : 'moderator'}" style="font-size:0.68rem; padding: 2px 8px;">
                ${isSuper ? '👑 SUPER ADMIN' : '🛡️ MODERATOR'}
              </span>
            </td>
            <td>
              <span class="wing-tag ${u.school_wing === 'primary' ? 'wing-tag-primary' : u.school_wing === 'secondary' ? 'wing-tag-secondary' : ''}" style="position: static; font-size: 0.7rem; padding: 2px 8px;">
                ${u.school_wing === 'primary' ? 'Elementary' : u.school_wing === 'secondary' ? 'College' : 'All Wings'}
              </span>
            </td>
            <td style="font-size: 0.78rem; color: var(--slate-500);">${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
              ${isRoot || isSelf ? `
                <span style="font-size: 0.75rem; color: var(--slate-400); font-style: italic;">Protected Root</span>
              ` : `
                <button type="button" class="btn btn-outline-white" onclick="deleteUser(${u.id}, '${u.username}')" style="padding: 3px 8px; font-size: 0.72rem; color: #b91c1c; border-color: #fecaca;">
                  🗑 Delete
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No personnel accounts found.</td></tr>';
    }
  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #b91c1c; padding: 20px;">Error loading admin personnel. Super Admin privileges required.</td></tr>`;
  }
}

window.deleteUser = async function(id, username) {
  if (!confirm(`Are you sure you want to delete administrator/moderator account: "${username}"?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadUsers();
      await loadTelemetry();
    } else {
      alert(data.message || 'Error deleting account.');
    }
  } catch (_) {
    alert('Failed to connect to server.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. STUDENT DIRECTORY & ENROLMENT
// ─────────────────────────────────────────────────────────────────────────────

async function loadStudents() {
  const container = document.getElementById('students-table-body');
  if (!container) return;

  const wing = document.getElementById('students-wing-filter')?.value || 'all';
  const search = document.getElementById('students-search-input')?.value || '';

  try {
    const res = await fetch(`/api/admin/students?wing=${wing}&search=${encodeURIComponent(search)}`);
    const data = await res.json();

    if (data.success && data.students) {
      allStudentsCache = data.students;
      populateStudentSelectors(data.students);

      if (data.students.length > 0) {
        const isSuper = currentUser && currentUser.role === 'superadmin';

        container.innerHTML = data.students.map(s => `
          <tr>
            <td>
              <span class="wing-tag ${s.school_wing === 'primary' ? 'wing-tag-primary' : 'wing-tag-secondary'}" style="position: static; font-size: 0.7rem; padding: 2px 8px;">
                ${s.school_wing === 'primary' ? 'ELEMENTARY' : 'COLLEGE'}
              </span>
            </td>
            <td style="font-family: var(--font-mono); font-weight: 700;">${s.admission_number}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.class}</td>
            <td>${s.gender}</td>
            <td style="font-size: 0.78rem;">
              ${s.parent_name || 'N/A'}<br>
              <span style="color: var(--slate-400);">${s.parent_phone || s.parent_email || ''}</span>
            </td>
            <td><span style="font-weight: 700; color: var(--navy-900);">${s.house}</span></td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-outline-white" onclick="openScoreModalForStudent(${s.id})" style="padding: 3px 8px; font-size: 0.72rem; color: var(--navy-900);">
                  + Score
                </button>
                ${isSuper ? `
                  <button type="button" class="btn btn-outline-white" onclick="deleteStudent(${s.id}, '${s.name}')" style="padding: 3px 8px; font-size: 0.72rem; color: #b91c1c; border-color: #fecaca;">
                    🗑
                  </button>
                ` : `
                  <span style="font-size: 0.7rem; color: var(--slate-400); padding: 3px 6px;" title="Only Super Admin can delete students">🔒</span>
                `}
              </div>
            </td>
          </tr>
        `).join('');
      } else {
        container.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No students matching current filter.</td></tr>';
      }
    }
  } catch (_) {}
}

window.deleteStudent = async function(id, name) {
  if (!confirm(`SUPER ADMIN ACTION:\nAre you sure you want to permanently delete student "${name}"?\nAll associated results and scratch card PINs will be removed.`)) return;

  try {
    const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadStudents();
      await loadTelemetry();
    } else {
      alert(data.message || 'Error deleting student.');
    }
  } catch (_) {
    alert('Failed to connect to server.');
  }
};

function populateStudentSelectors(students) {
  const pinSel = document.getElementById('pin-student-select');
  const scoreSel = document.getElementById('score-student-select');

  const options = '<option value="">Select Student...</option>' + students.map(s => `
    <option value="${s.id}" data-wing="${s.school_wing}" data-class="${s.class}" data-name="${s.name}">[${s.admission_number}] ${s.name} (${s.class} - ${s.school_wing.toUpperCase()})</option>
  `).join('');

  if (pinSel) pinSel.innerHTML = options;
  if (scoreSel) scoreSel.innerHTML = options;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BURSARY RECEIPTS AUDIT
// ─────────────────────────────────────────────────────────────────────────────

async function loadReceipts() {
  const container = document.getElementById('receipts-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/receipts/all');
    const data = await res.json();

    if (data.success && data.receipts && data.receipts.length > 0) {
      container.innerHTML = data.receipts.map(r => `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;">${r.teller_ref}</td>
          <td>
            <strong>${r.student_name}</strong><br>
            <span style="font-size: 0.78rem; color: var(--slate-500);">${r.admission_number} • ${r.class}</span>
          </td>
          <td>
            <span class="wing-tag ${r.school_wing === 'primary' ? 'wing-tag-primary' : 'wing-tag-secondary'}" style="position: static; font-size: 0.7rem; padding: 2px 8px;">
              ${r.school_wing.toUpperCase()}
            </span>
          </td>
          <td>
            <strong>${r.fee_type}</strong><br>
            <span style="font-size: 0.78rem; color: var(--slate-500);">${r.bank_name}</span>
          </td>
          <td style="font-weight: 800; color: var(--navy-900);">₦${Number(r.amount).toLocaleString()}</td>
          <td>
            <span class="${r.status === 'Approved' ? 'status-badge-approved' : r.status === 'Rejected' ? 'status-badge-pending' : 'status-badge-pending'}">
              ${r.status}
            </span>
          </td>
          <td>
            ${r.status === 'Pending' ? `
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-gold" onclick="updateReceiptStatus(${r.id}, 'Approved')" style="padding: 4px 10px; font-size: 0.74rem;">
                  ✓ Approve
                </button>
                <button type="button" class="btn btn-outline-white" onclick="updateReceiptStatus(${r.id}, 'Rejected')" style="padding: 4px 8px; font-size: 0.74rem; color: #b91c1c; border-color: #fecaca;">
                  ✕ Reject
                </button>
              </div>
            ` : `
              <span style="font-size: 0.76rem; color: #059669; font-weight: 700;">
                ✓ Reconciled<br>
                <small style="color: var(--slate-500); font-weight: 400;">by ${r.verified_by || 'Bursary'}</small>
              </span>
            `}
          </td>
        </tr>
      `).join('');
    } else {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No receipts uploaded yet.</td></tr>';
    }
  } catch (_) {}
}

window.updateReceiptStatus = async function(id, status) {
  const remarks = status === 'Approved' ? 'Cleared by Bursary Directorate Audit' : 'Receipt rejected: bank slip unclear or mismatch';
  try {
    const res = await fetch(`/api/admin/receipts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadReceipts();
      await loadTelemetry();
    } else {
      alert(data.message || 'Error updating status.');
    }
  } catch (_) {
    alert('Failed to connect to server.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCRATCH CARD / PIN INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

async function loadPins() {
  const container = document.getElementById('pins-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/pins');
    const data = await res.json();

    if (data.success && data.pins && data.pins.length > 0) {
      const isSuper = currentUser && currentUser.role === 'superadmin';

      container.innerHTML = data.pins.map(p => `
        <tr>
          <td><code style="background: #fef3c7; color: #92400e; padding: 3px 8px; font-weight: 800; font-size: 0.88rem; border-radius: 4px;">${p.pin}</code></td>
          <td><strong>${p.student_name}</strong></td>
          <td style="font-family: var(--font-mono);">${p.admission_number}</td>
          <td>
            <span class="wing-tag ${p.school_wing === 'primary' ? 'wing-tag-primary' : 'wing-tag-secondary'}" style="position: static; font-size: 0.7rem; padding: 2px 8px;">
              ${p.school_wing.toUpperCase()}
            </span>
          </td>
          <td>
            <span style="font-weight: 700; color: ${p.use_count >= p.max_uses ? '#b91c1c' : 'var(--navy-900)'};">
              ${p.use_count} / ${p.max_uses} Uses
            </span>
          </td>
          <td>
            <span class="${p.use_count >= p.max_uses ? 'status-badge-pending' : 'status-badge-approved'}">
              ${p.use_count >= p.max_uses ? 'Exhausted' : 'Active'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline-white" onclick="resetPin(${p.id})" style="padding: 3px 8px; font-size: 0.72rem; color: var(--navy-900);">
                🔄 Reset (0/5)
              </button>
              ${isSuper ? `
                <button type="button" class="btn btn-outline-white" onclick="deletePin(${p.id})" style="padding: 3px 8px; font-size: 0.72rem; color: #b91c1c; border-color: #fecaca;">
                  🗑
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    } else {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No scratch card PINs issued yet.</td></tr>';
    }
  } catch (_) {}
}

window.resetPin = async function(id) {
  try {
    const res = await fetch(`/api/admin/pins/${id}/reset`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadPins();
      await loadTelemetry();
    }
  } catch (_) {
    alert('Failed to reset PIN.');
  }
};

window.deletePin = async function(id) {
  if (!confirm('SUPER ADMIN: Delete this PIN?')) return;
  try {
    const res = await fetch(`/api/admin/pins/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadPins();
      await loadTelemetry();
    }
  } catch (_) {
    alert('Failed to delete PIN.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. RESULTS & GRADING DESK
// ─────────────────────────────────────────────────────────────────────────────

async function loadResults() {
  const container = document.getElementById('results-table-body');
  if (!container) return;

  const wing = document.getElementById('results-wing-filter')?.value || 'all';

  try {
    const res = await fetch(`/api/admin/results?wing=${wing}`);
    const data = await res.json();

    if (data.success && data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(r => `
        <tr>
          <td><strong>${r.student_name}</strong></td>
          <td style="font-family: var(--font-mono);">${r.admission_number}</td>
          <td>${r.student_class}</td>
          <td><strong>${r.subject}</strong></td>
          <td>${r.ca1}</td>
          <td>${r.ca2}</td>
          <td>${r.exam}</td>
          <td style="font-weight: 800; color: var(--navy-900);">${r.total}</td>
          <td><span style="font-weight: 800; color: ${r.grade === 'A1' ? '#059669' : '#b45309'};">${r.grade}</span></td>
          <td><span style="font-size: 0.78rem; color: var(--slate-500);">${r.remark}</span></td>
        </tr>
      `).join('');
    } else {
      container.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">No assessment scores recorded.</td></tr>';
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CBT QUESTION BANK & ATTEMPTS
// ─────────────────────────────────────────────────────────────────────────────

async function loadCbt() {
  const qContainer = document.getElementById('cbt-questions-list');
  const aContainer = document.getElementById('cbt-attempts-table-body');

  try {
    const qRes = await fetch('/api/admin/cbt/questions');
    const qData = await qRes.json();
    if (qData.success && qData.questions && qContainer) {
      if (qData.questions.length > 0) {
        qContainer.innerHTML = qData.questions.map(q => `
          <div style="background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 8px; padding: 14px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="wing-tag ${q.school_wing === 'primary' ? 'wing-tag-primary' : 'wing-tag-secondary'}" style="position:static; font-size:0.68rem; padding: 1px 6px;">
                ${q.school_wing.toUpperCase()} • ${q.subject}
              </span>
              <span style="font-weight: 700; color: #059669; font-size: 0.78rem;">Correct: Option ${q.correct_option}</span>
            </div>
            <p style="font-weight: 600; color: var(--navy-900); font-size: 0.88rem; margin: 0 0 8px 0;">${q.question}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.78rem; color: var(--slate-600);">
              <div><strong>A:</strong> ${q.option_a}</div>
              <div><strong>B:</strong> ${q.option_b}</div>
              <div><strong>C:</strong> ${q.option_c}</div>
              <div><strong>D:</strong> ${q.option_d}</div>
            </div>
          </div>
        `).join('');
      } else {
        qContainer.innerHTML = '<p>No questions authoring in bank.</p>';
      }
    }

    const aRes = await fetch('/api/admin/cbt/attempts');
    const aData = await aRes.json();
    if (aData.success && aData.attempts && aContainer) {
      if (aData.attempts.length > 0) {
        aContainer.innerHTML = aData.attempts.map(a => `
          <tr>
            <td><strong>${a.candidate_name}</strong></td>
            <td style="font-family: var(--font-mono);">${a.candidate_reg}</td>
            <td><span class="wing-tag ${a.school_wing === 'primary' ? 'wing-tag-primary' : 'wing-tag-secondary'}" style="position:static; font-size:0.68rem; padding:1px 6px;">${a.school_wing.toUpperCase()}</span></td>
            <td>${a.subject}</td>
            <td style="font-weight: 700;">${a.score} / ${a.total_questions}</td>
            <td style="font-weight: 800; color: var(--navy-900);">${a.percentage}%</td>
            <td>
              <span class="${a.passed ? 'status-badge-approved' : 'status-badge-pending'}">
                ${a.passed ? 'PASSED' : 'RETAKE'}
              </span>
            </td>
            <td style="font-size: 0.75rem; color: var(--slate-500);">${new Date(a.attempted_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      } else {
        aContainer.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 16px;">No attempts recorded.</td></tr>';
      }
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. BULLETIN NOTICES (WITH IMAGES & VIDEOS)
// ─────────────────────────────────────────────────────────────────────────────

async function loadNotices() {
  const container = document.getElementById('notices-list');
  if (!container) return;

  try {
    const res = await fetch('/api/notices');
    const data = await res.json();
    if (data.success && data.notices && data.notices.length > 0) {
      container.innerHTML = data.notices.map(n => {
        let mediaHtml = '';
        if (n.media_url) {
          const isVideo = n.media_type === 'video' || ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some(ext => n.media_url.toLowerCase().endsWith(ext));
          if (isVideo) {
            mediaHtml = `
              <div style="margin-top: 12px; background: #000; border-radius: 8px; overflow: hidden; border: 1px solid var(--gold-500); max-width: 540px;">
                <div style="background: rgba(15,23,42,0.9); padding: 4px 10px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">🎥 Video Broadcast Attachment</span>
                  <a href="${n.media_url}" target="_blank" style="color: var(--gold-300); font-size: 0.72rem; text-decoration: none;">Full View ↗</a>
                </div>
                <video controls playsinline preload="metadata" src="${n.media_url}" style="width: 100%; max-height: 260px; display: block;"></video>
              </div>
            `;
          } else {
            mediaHtml = `
              <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid var(--slate-200); position: relative; max-width: 500px; box-shadow: var(--shadow-sm);">
                <div style="background: rgba(15,23,42,0.85); padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; position: absolute; top: 0; left: 0; right: 0; z-index: 2;">
                  <span style="font-size: 0.72rem; color: #34d399; font-weight: 700;">📷 Photographic Attachment</span>
                  <a href="${n.media_url}" target="_blank" style="color: #fff; font-size: 0.72rem; text-decoration: none;">Open Photo ↗</a>
                </div>
                <img src="${n.media_url}" alt="${n.title}" style="width: 100%; max-height: 240px; object-fit: cover; display: block; padding-top: 24px; background: #0f172a;">
              </div>
            `;
          }
        }

        return `
          <div style="background: #fff; border: 1px solid var(--slate-200); border-radius: 10px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span style="background: var(--crimson-700); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                  ${n.category}
                </span>
                <span class="wing-tag ${n.target_wing === 'primary' ? 'wing-tag-primary' : n.target_wing === 'secondary' ? 'wing-tag-secondary' : ''}" style="position:static; font-size:0.68rem; padding: 1px 6px;">
                  ${n.target_wing === 'primary' ? 'Elementary' : n.target_wing === 'secondary' ? 'College' : 'All Wings'}
                </span>
                <span style="font-size: 0.75rem; color: var(--slate-400);">${n.date} • by ${n.author}</span>
                ${n.is_pinned ? '<span style="font-size:0.7rem; background:#fef3c7; color:#92400e; font-weight:700; padding:1px 6px; border-radius:4px;">📌 Pinned to Ticker</span>' : ''}
              </div>
              <h4 style="color: var(--navy-900); font-size: 1.05rem; margin: 0 0 6px 0;">${n.title}</h4>
              <p style="color: var(--slate-600); font-size: 0.85rem; margin: 0; line-height: 1.5;">${n.content}</p>
              ${mediaHtml}
            </div>
            <button type="button" class="btn btn-outline-white" onclick="deleteNotice(${n.id})" style="padding: 4px 10px; font-size: 0.74rem; color: #b91c1c; border-color: #fecaca; white-space: nowrap;">
              🗑 Remove
            </button>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p>No bulletins currently active.</p>';
    }
  } catch (_) {}
}

window.deleteNotice = async function(id) {
  if (!confirm('Remove this bulletin notice from the live ticker?')) return;
  try {
    const res = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadNotices();
    }
  } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. SCHOOL SETTINGS (SUPER ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      if (s.session) document.getElementById('setting-session').value = s.session;
      if (s.term) document.getElementById('setting-term').value = s.term;
      if (s.tuition_fee_primary) document.getElementById('setting-fee-primary').value = s.tuition_fee_primary;
      if (s.tuition_fee_secondary) document.getElementById('setting-fee-secondary').value = s.tuition_fee_secondary;
      if (s.accreditations) document.getElementById('setting-accreditations').value = s.accreditations;
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. FORM HANDLERS & MODAL BINDINGS
// ─────────────────────────────────────────────────────────────────────────────

function setupFormHandlers() {
  // Login form
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value.trim();
      await switchUserRole(username, password);
    });
  }

  // Create Staff Admin User (Super Admin only)
  const userForm = document.getElementById('form-user');
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('user-fullname').value.trim();
      const username = document.getElementById('user-username').value.trim();
      const password = document.getElementById('user-password').value.trim();
      const role = document.getElementById('user-role').value;
      const school_wing = document.getElementById('user-wing').value;

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name, username, password, role, school_wing })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Account created successfully!\nRole: ${role.toUpperCase()}\nUser: ${username}`);
          closeModal('modal-user');
          userForm.reset();
          await loadUsers();
          await loadTelemetry();
        } else {
          alert(data.message || 'Error creating account.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Enrol Student
  const enrolForm = document.getElementById('form-enrol');
  if (enrolForm) {
    enrolForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const school_wing = document.getElementById('enrol-wing').value;
      const admission_number = document.getElementById('enrol-adm').value.trim();
      const name = document.getElementById('enrol-name').value.trim();
      const class_name = document.getElementById('enrol-class').value.trim();
      const gender = document.getElementById('enrol-gender').value;
      const parent_name = document.getElementById('enrol-parent').value.trim();
      const house = document.getElementById('enrol-house').value;

      try {
        const res = await fetch('/api/admin/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_wing, admission_number, name, class_name, gender, parent_name, house })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Enrolment Successful!\nStudent: ${name} (${admission_number})\nComplimentary Scratch Card PIN: ${data.generated_pin}`);
          closeModal('modal-enrol');
          enrolForm.reset();
          await loadStudents();
          await loadPins();
          await loadTelemetry();
        } else {
          alert(data.message || 'Error enrolling student.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Generate PIN
  const pinForm = document.getElementById('form-pin');
  if (pinForm) {
    pinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const student_id = document.getElementById('pin-student-select').value;
      const session = document.getElementById('pin-session').value.trim();
      const max_uses = parseInt(document.getElementById('pin-max-uses').value) || 5;

      try {
        const res = await fetch('/api/admin/pins/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id, session, max_uses })
        });
        const data = await res.json();
        if (data.success) {
          alert(`New Scratch Card PIN Minted: ${data.pin}`);
          closeModal('modal-pin');
          pinForm.reset();
          await loadPins();
          await loadTelemetry();
        } else {
          alert(data.message || 'Error generating PIN.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Record Score (With Subject Dropdown for Elementary & College)
  const scoreStudentSelect = document.getElementById('score-student-select');
  if (scoreStudentSelect) {
    scoreStudentSelect.addEventListener('change', () => {
      const selectedOpt = scoreStudentSelect.selectedOptions[0];
      const badge = document.getElementById('score-student-wing-badge');
      if (!selectedOpt || !selectedOpt.value) {
        if (badge) badge.style.display = 'none';
        if (typeof window.filterScoreSubjectDropdown === 'function') {
          window.filterScoreSubjectDropdown('all');
        }
        return;
      }
      const wing = selectedOpt.getAttribute('data-wing') || '';
      const className = selectedOpt.getAttribute('data-class') || '';
      if (badge) {
        if (wing === 'primary') {
          badge.style.display = 'inline-block';
          badge.style.background = '#ecfdf5';
          badge.style.color = '#065f46';
          badge.style.border = '1px solid #a7f3d0';
          badge.textContent = `🧸 Elementary Pupil (${className})`;
          if (typeof window.filterScoreSubjectDropdown === 'function') {
            window.filterScoreSubjectDropdown('primary');
          }
        } else if (wing === 'secondary') {
          badge.style.display = 'inline-block';
          badge.style.background = '#eff6ff';
          badge.style.color = '#1e40af';
          badge.style.border = '1px solid #bfdbfe';
          badge.textContent = `🏛️ College Scholar (${className})`;
          if (typeof window.filterScoreSubjectDropdown === 'function') {
            window.filterScoreSubjectDropdown('secondary');
          }
        } else {
          badge.style.display = 'none';
          if (typeof window.filterScoreSubjectDropdown === 'function') {
            window.filterScoreSubjectDropdown('all');
          }
        }
      }
    });
  }

  const scoreSubjectSelect = document.getElementById('score-subject');
  const scoreCustomWrapper = document.getElementById('score-custom-subject-wrapper');
  const scoreCustomInput = document.getElementById('score-custom-subject');
  if (scoreSubjectSelect && scoreCustomWrapper && scoreCustomInput) {
    scoreSubjectSelect.addEventListener('change', () => {
      if (scoreSubjectSelect.value === '__custom__') {
        scoreCustomWrapper.style.display = 'block';
        scoreCustomInput.focus();
        scoreCustomInput.required = true;
      } else {
        scoreCustomWrapper.style.display = 'none';
        scoreCustomInput.required = false;
      }
    });
  }

  const scoreForm = document.getElementById('form-score');
  if (scoreForm) {
    scoreForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const student_id = document.getElementById('score-student-select').value;
      let subject = document.getElementById('score-subject').value;

      if (subject === '__custom__') {
        subject = document.getElementById('score-custom-subject').value.trim();
        if (!subject) {
          alert('Please type the custom subject name.');
          document.getElementById('score-custom-subject').focus();
          return;
        }
      }

      if (!subject) {
        alert('Please select a subject from the available list.');
        document.getElementById('score-subject').focus();
        return;
      }

      const ca1 = parseFloat(document.getElementById('score-ca1').value) || 0;
      const ca2 = parseFloat(document.getElementById('score-ca2').value) || 0;
      const exam = parseFloat(document.getElementById('score-exam').value) || 0;

      try {
        const res = await fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id, subject, ca1, ca2, exam })
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          closeModal('modal-score');
          scoreForm.reset();
          if (scoreCustomWrapper) scoreCustomWrapper.style.display = 'none';
          const badge = document.getElementById('score-student-wing-badge');
          if (badge) badge.style.display = 'none';
          if (typeof window.filterScoreSubjectDropdown === 'function') {
            window.filterScoreSubjectDropdown('all');
          }
          if (typeof window.updateScorePreview === 'function') {
            window.updateScorePreview();
          }
          await loadResults();
        } else {
          alert(data.message || 'Error recording score.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Add CBT Question
  const cbtForm = document.getElementById('form-cbt-q');
  if (cbtForm) {
    cbtForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const school_wing = document.getElementById('cbt-q-wing').value;
      const subject = document.getElementById('cbt-q-subject').value.trim();
      const question = document.getElementById('cbt-q-text').value.trim();
      const option_a = document.getElementById('cbt-q-a').value.trim();
      const option_b = document.getElementById('cbt-q-b').value.trim();
      const option_c = document.getElementById('cbt-q-c').value.trim();
      const option_d = document.getElementById('cbt-q-d').value.trim();
      const correct_option = document.getElementById('cbt-q-correct').value;

      try {
        const res = await fetch('/api/admin/cbt/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_wing, subject, question, option_a, option_b, option_c, option_d, correct_option })
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          closeModal('modal-cbt');
          cbtForm.reset();
          await loadCbt();
        } else {
          alert(data.message || 'Error saving question.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Post Notice (With Images & Videos)
  const noticeMediaInput = document.getElementById('notice-media-file');
  if (noticeMediaInput) {
    noticeMediaInput.addEventListener('change', () => {
      const file = noticeMediaInput.files[0];
      const previewBox = document.getElementById('notice-preview-box');
      const previewRender = document.getElementById('notice-preview-render');
      const previewInfo = document.getElementById('notice-preview-info');

      if (!file) {
        if (previewBox) previewBox.style.display = 'none';
        return;
      }

      const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some(ext => file.name.toLowerCase().endsWith(ext));
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const url = URL.createObjectURL(file);

      if (previewInfo) {
        previewInfo.textContent = `${isVideo ? '🎥 Video Selected' : '📷 Image Selected'}: ${file.name} (${sizeMB} MB)`;
      }

      if (previewRender) {
        if (isVideo) {
          previewRender.innerHTML = `<video controls playsinline src="${url}" style="max-height: 200px; max-width: 100%; border-radius: 6px;"></video>`;
        } else {
          previewRender.innerHTML = `<img src="${url}" style="max-height: 200px; max-width: 100%; object-fit: contain; border-radius: 6px;">`;
        }
      }

      if (previewBox) previewBox.style.display = 'block';
    });
  }

  const noticeForm = document.getElementById('form-notice');
  if (noticeForm) {
    noticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const target_wing = document.getElementById('notice-wing')?.value || 'all';
      const category = document.getElementById('notice-category').value.trim();
      const title = document.getElementById('notice-title').value.trim();
      const content = document.getElementById('notice-content').value.trim();
      const is_pinned = document.getElementById('notice-pinned').checked;
      const mediaFile = document.getElementById('notice-media-file')?.files[0];
      const mediaUrlInput = document.getElementById('notice-media-url')?.value.trim();
      const submitBtn = document.getElementById('btn-submit-notice');

      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Uploading Media & Broadcasting...';
      }

      try {
        const formData = new FormData();
        formData.append('target_wing', target_wing);
        formData.append('category', category);
        formData.append('title', title);
        formData.append('content', content);
        formData.append('is_pinned', is_pinned ? 'true' : 'false');
        if (mediaFile) {
          formData.append('media', mediaFile);
        }
        if (mediaUrlInput) {
          formData.append('media_url_input', mediaUrlInput);
        }

        const res = await fetch('/api/admin/notices', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          alert(`Success!\n${data.message}`);
          closeModal('modal-notice');
          noticeForm.reset();
          clearNoticeMedia();
          await loadNotices();
        } else {
          alert(data.message || 'Error publishing notice.');
        }
      } catch (err) {
        alert('Could not connect to server or upload media.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  window.clearNoticeMedia = function() {
    const fileInput = document.getElementById('notice-media-file');
    const urlInput = document.getElementById('notice-media-url');
    const previewBox = document.getElementById('notice-preview-box');
    const previewRender = document.getElementById('notice-preview-render');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (previewRender) previewRender.innerHTML = '';
    if (previewBox) previewBox.style.display = 'none';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // INLINE BULLETIN TICKER HEADLINE PUBLISHER (TAB 8)
  // ─────────────────────────────────────────────────────────────────────────
  const inlineDropzone = document.getElementById('inline-media-dropzone');
  const inlineFileInput = document.getElementById('inline-notice-file');

  if (inlineDropzone && inlineFileInput) {
    inlineDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      inlineDropzone.classList.add('dragover');
    });

    inlineDropzone.addEventListener('dragleave', () => {
      inlineDropzone.classList.remove('dragover');
    });

    inlineDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      inlineDropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        inlineFileInput.files = e.dataTransfer.files;
        handleInlineFileSelected(inlineFileInput.files[0]);
      }
    });

    inlineFileInput.addEventListener('change', () => {
      if (inlineFileInput.files && inlineFileInput.files[0]) {
        handleInlineFileSelected(inlineFileInput.files[0]);
      }
    });
  }

  function handleInlineFileSelected(file) {
    const previewBox = document.getElementById('inline-media-preview-box');
    const previewRender = document.getElementById('inline-preview-render');
    const previewMeta = document.getElementById('inline-preview-meta');

    // Deselect preset thumbnails
    document.querySelectorAll('#campus-photo-ribbon .quick-media-thumb').forEach(t => t.classList.remove('selected'));
    const presetUrl = document.getElementById('inline-preset-media-url');
    const presetType = document.getElementById('inline-preset-media-type');
    if (presetUrl) presetUrl.value = '';
    if (presetType) presetType.value = '';

    const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some(ext => file.name.toLowerCase().endsWith(ext));
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const blobUrl = URL.createObjectURL(file);

    if (previewMeta) {
      previewMeta.textContent = `${isVideo ? '🎥 Video Broadcast Clip' : '📷 High-Resolution Image'}: ${file.name} (${sizeMB} MB)`;
    }

    if (previewRender) {
      if (isVideo) {
        previewRender.innerHTML = `<video controls playsinline src="${blobUrl}" style="max-height: 260px; max-width: 100%; border-radius: 6px;"></video>`;
      } else {
        previewRender.innerHTML = `<img src="${blobUrl}" alt="Preview" style="max-height: 260px; max-width: 100%; object-fit: contain; border-radius: 6px;">`;
      }
    }

    if (previewBox) previewBox.style.display = 'block';
  }

  window.selectPresetMedia = function(url, type, title) {
    const previewBox = document.getElementById('inline-media-preview-box');
    const previewRender = document.getElementById('inline-preview-render');
    const previewMeta = document.getElementById('inline-preview-meta');
    const presetUrlInput = document.getElementById('inline-preset-media-url');
    const presetTypeInput = document.getElementById('inline-preset-media-type');
    const fileInput = document.getElementById('inline-notice-file');

    if (fileInput) fileInput.value = '';
    if (presetUrlInput) presetUrlInput.value = url;
    if (presetTypeInput) presetTypeInput.value = type;

    // Highlight selected thumbnail
    document.querySelectorAll('#campus-photo-ribbon .quick-media-thumb').forEach(t => {
      t.classList.toggle('selected', t.getAttribute('src') === url);
    });

    if (previewMeta) {
      previewMeta.textContent = `📷 Attached From Campus Library: ${title}`;
    }

    if (previewRender) {
      previewRender.innerHTML = `<img src="${url}" alt="${title}" style="max-height: 260px; max-width: 100%; object-fit: contain; border-radius: 6px;">`;
    }

    if (previewBox) previewBox.style.display = 'block';
  };

  window.attachSampleVideo = function() {
    const sampleUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    const previewBox = document.getElementById('inline-media-preview-box');
    const previewRender = document.getElementById('inline-preview-render');
    const previewMeta = document.getElementById('inline-preview-meta');
    const presetUrlInput = document.getElementById('inline-preset-media-url');
    const presetTypeInput = document.getElementById('inline-preset-media-type');
    const fileInput = document.getElementById('inline-notice-file');

    if (fileInput) fileInput.value = '';
    if (presetUrlInput) presetUrlInput.value = sampleUrl;
    if (presetTypeInput) presetTypeInput.value = 'video';

    document.querySelectorAll('#campus-photo-ribbon .quick-media-thumb').forEach(t => t.classList.remove('selected'));

    if (previewMeta) {
      previewMeta.textContent = `🎥 Video Clip Broadcast Attached (Official Campus Sports Showcase)`;
    }

    if (previewRender) {
      previewRender.innerHTML = `<video controls playsinline src="${sampleUrl}" style="max-height: 260px; max-width: 100%; border-radius: 6px;"></video>`;
    }

    if (previewBox) previewBox.style.display = 'block';
  };

  window.clearInlineNoticeMedia = function() {
    const fileInput = document.getElementById('inline-notice-file');
    const presetUrlInput = document.getElementById('inline-preset-media-url');
    const presetTypeInput = document.getElementById('inline-preset-media-type');
    const previewBox = document.getElementById('inline-media-preview-box');
    const previewRender = document.getElementById('inline-preview-render');

    if (fileInput) fileInput.value = '';
    if (presetUrlInput) presetUrlInput.value = '';
    if (presetTypeInput) presetTypeInput.value = '';
    if (previewRender) previewRender.innerHTML = '';
    if (previewBox) previewBox.style.display = 'none';
    document.querySelectorAll('#campus-photo-ribbon .quick-media-thumb').forEach(t => t.classList.remove('selected'));
  };

  // Inline Form Submit
  const inlineNoticeForm = document.getElementById('form-inline-notice');
  if (inlineNoticeForm) {
    inlineNoticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const target_wing = document.getElementById('inline-notice-wing')?.value || 'all';
      const category = document.getElementById('inline-notice-category').value.trim();
      const title = document.getElementById('inline-notice-title').value.trim();
      const content = document.getElementById('inline-notice-content').value.trim();
      const is_pinned = document.getElementById('inline-notice-pinned').checked;
      const mediaFile = document.getElementById('inline-notice-file')?.files[0];
      const presetUrl = document.getElementById('inline-preset-media-url')?.value;
      const submitBtn = document.getElementById('btn-broadcast-headline');

      const origText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Uploading Media & Broadcasting Headline...';
      }

      try {
        const formData = new FormData();
        formData.append('target_wing', target_wing);
        formData.append('category', category);
        formData.append('title', title);
        formData.append('content', content);
        formData.append('is_pinned', is_pinned ? 'true' : 'false');
        if (mediaFile) {
          formData.append('media', mediaFile);
        } else if (presetUrl) {
          formData.append('media_url_input', presetUrl);
        }

        const res = await fetch('/api/admin/notices', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          alert(`📢 Headline Broadcast Live!\n${data.message}\nThis headline is now actively scrolling on the homepage ticker tape.`);
          inlineNoticeForm.reset();
          clearInlineNoticeMedia();
          await loadNotices();
        } else {
          alert(data.message || 'Error broadcasting notice.');
        }
      } catch (err) {
        alert('Could not connect to server or upload media.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }

  // School Settings (Super Admin only)
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const session = document.getElementById('setting-session').value.trim();
      const term = document.getElementById('setting-term').value;
      const tuition_fee_primary = document.getElementById('setting-fee-primary').value;
      const tuition_fee_secondary = document.getElementById('setting-fee-secondary').value;
      const accreditations = document.getElementById('setting-accreditations').value.trim();

      try {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session, term, tuition_fee_primary, tuition_fee_secondary, accreditations })
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
        } else {
          alert(data.message || 'Error updating settings. Super Admin access required.');
        }
      } catch (_) {
        alert('Could not connect to server.');
      }
    });
  }

  // Filter change listeners
  const wingFilter = document.getElementById('students-wing-filter');
  if (wingFilter) wingFilter.addEventListener('change', loadStudents);

  const searchInput = document.getElementById('students-search-input');
  if (searchInput) searchInput.addEventListener('input', loadStudents);

  const resultsWingFilter = document.getElementById('results-wing-filter');
  if (resultsWingFilter) resultsWingFilter.addEventListener('change', loadResults);

  // Switch Account Button
  const btnSwitch = document.getElementById('btn-switch-account');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', () => openModal('modal-auth'));
  }

  // Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      currentPermissions = {};
      openModal('modal-auth');
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. TABS & MODAL CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Check permissions for locked tabs
      if (targetTab === 'users' && currentUser && currentUser.role !== 'superadmin') {
        // Show locked message tab
      }

      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      const activeContent = document.getElementById(`tab-${targetTab}`);
      if (activeContent) activeContent.classList.add('active');
    });
  });
}

function setupModalDismissals() {
  document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

window.openUserModal = function() {
  if (currentUser && currentUser.role !== 'superadmin') {
    alert('Access Denied: Only Super Admin can create administrator or moderator accounts.');
    return;
  }
  openModal('modal-user');
};

window.openEnrolModal = function() {
  openModal('modal-enrol');
};

window.openPinModal = function() {
  openModal('modal-pin');
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. SCORE MODAL SUBJECT CONTROLS & GRADE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

window.filterScoreSubjectDropdown = function(filter) {
  const pillAll = document.getElementById('pill-filter-all');
  const pillPrimary = document.getElementById('pill-filter-primary');
  const pillSecondary = document.getElementById('pill-filter-secondary');
  const optPrimary = document.getElementById('optgroup-score-primary');
  const optSecondary = document.getElementById('optgroup-score-secondary');

  if (pillAll) pillAll.classList.toggle('active', filter === 'all');
  if (pillPrimary) pillPrimary.classList.toggle('active', filter === 'primary');
  if (pillSecondary) pillSecondary.classList.toggle('active', filter === 'secondary');

  if (optPrimary) {
    optPrimary.style.display = (filter === 'all' || filter === 'primary') ? '' : 'none';
  }
  if (optSecondary) {
    optSecondary.style.display = (filter === 'all' || filter === 'secondary') ? '' : 'none';
  }
};

window.updateScorePreview = function() {
  const ca1Input = document.getElementById('score-ca1');
  const ca2Input = document.getElementById('score-ca2');
  const examInput = document.getElementById('score-exam');
  const previewBadge = document.getElementById('score-preview-badge');
  if (!previewBadge) return;

  const ca1 = parseFloat(ca1Input?.value) || 0;
  const ca2 = parseFloat(ca2Input?.value) || 0;
  const exam = parseFloat(examInput?.value) || 0;
  const total = Math.min(100, Math.round((ca1 + ca2 + exam) * 10) / 10);

  let grade = 'F9', remark = 'Fail', color = '#b91c1c';
  if (total >= 75) { grade = 'A1'; remark = 'Distinction'; color = '#047857'; }
  else if (total >= 70) { grade = 'B2'; remark = 'Very Good'; color = '#059669'; }
  else if (total >= 65) { grade = 'B3'; remark = 'Good'; color = '#0284c7'; }
  else if (total >= 60) { grade = 'C4'; remark = 'Credit'; color = '#2563eb'; }
  else if (total >= 55) { grade = 'C5'; remark = 'Credit'; color = '#4f46e5'; }
  else if (total >= 50) { grade = 'C6'; remark = 'Credit'; color = '#d97706'; }
  else if (total >= 45) { grade = 'D7'; remark = 'Pass'; color = '#ea580c'; }
  else if (total >= 40) { grade = 'E8'; remark = 'Pass'; color = '#dc2626'; }

  previewBadge.innerHTML = `Total: <strong style="color: ${color}; font-size: 0.95rem;">${total} / 100</strong> • Grade <strong style="color: ${color};">${grade}</strong> (${remark})`;
};

window.openScoreModal = function() {
  window.updateScorePreview();
  openModal('modal-score');
};

window.openScoreModalForStudent = function(studentId) {
  const sel = document.getElementById('score-student-select');
  if (sel) {
    sel.value = studentId;
    sel.dispatchEvent(new Event('change'));
  }
  window.updateScorePreview();
  openModal('modal-score');
};

window.openCbtModal = function() {
  openModal('modal-cbt');
};

window.openNoticeModal = function() {
  openModal('modal-notice');
};

