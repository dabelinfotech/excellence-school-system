/* ═══════════════════════════════════════════════════════════════════
   RESULT CHECKER CLIENT ENGINE — EXCELLENCE BRITISH SCHOOLS
   Supports Excellence Elementary School and Excellence College
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initResultTabs();
  initResultForm();
  initDemoButtons();
});

let currentWing = 'primary'; // 'primary' (Elementary) or 'secondary' (College)

function initResultTabs() {
  const tabs = document.querySelectorAll('.checker-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentWing = tab.getAttribute('data-wing');
      
      const admInput = document.getElementById('admission_number');
      const pinInput = document.getElementById('pin');
      if (admInput) admInput.value = '';
      if (pinInput) pinInput.value = '';

      updateDemoPills(currentWing);
      
      const wingLabel = document.getElementById('active-wing-label');
      if (wingLabel) {
        wingLabel.textContent = currentWing === 'primary' ? 'Excellence Elementary School' : 'Excellence College';
      }
    });
  });
}

function updateDemoPills(wing) {
  const container = document.getElementById('demo-pills-container');
  if (!container) return;

  if (wing === 'primary') {
    container.innerHTML = `
      <button type="button" class="demo-pill-btn" onclick="fillDemo('NPS/2024/001', 'EXCEL001', 'primary')">
        🎓 David Adeleke (Basic 4A)
      </button>
      <button type="button" class="demo-pill-btn" onclick="fillDemo('NPS/2024/002', 'EXCEL002', 'primary')">
        🧸 Fatima Bello (Nursery 2A)
      </button>
      <button type="button" class="demo-pill-btn" onclick="fillDemo('NPS/2024/003', 'EXCEL003', 'primary')">
        ⭐ Chinedu Eze (Basic 5A)
      </button>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="demo-pill-btn" onclick="fillDemo('SEC/2024/001', 'SEC0001', 'secondary')">
        🔬 Emeka Okafor (SSS 1A - Science)
      </button>
      <button type="button" class="demo-pill-btn" onclick="fillDemo('SEC/2024/002', 'SEC0002', 'secondary')">
        📚 Amina Abubakar (SSS 1B - Arts)
      </button>
      <button type="button" class="demo-pill-btn" onclick="fillDemo('SEC/2024/003', 'SEC0003', 'secondary')">
        📐 Tunde Balogun (JSS 3A)
      </button>
    `;
  }
}

function initDemoButtons() {
  updateDemoPills('primary');
}

window.fillDemo = function(adm, pin, wing) {
  const tabs = document.querySelectorAll('.checker-tab');
  tabs.forEach(t => {
    if (t.getAttribute('data-wing') === wing) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  currentWing = wing;
  
  const admInput = document.getElementById('admission_number');
  const pinInput = document.getElementById('pin');
  if (admInput) admInput.value = adm;
  if (pinInput) pinInput.value = pin;

  const btn = document.getElementById('check-btn');
  if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function initResultForm() {
  const form = document.getElementById('checker-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const admission_number = document.getElementById('admission_number').value.trim();
    const pin = document.getElementById('pin').value.trim();
    const errorBox = document.getElementById('error-message');
    const errText = document.getElementById('error-text');
    const btn = document.getElementById('check-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    if (!admission_number || !pin) {
      errText.textContent = 'Please enter both your Admission Number and Result PIN.';
      errorBox.style.display = 'flex';
      return;
    }

    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-flex';
    errorBox.style.display = 'none';

    try {
      const res = await fetch('/api/results/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_number, pin, school_wing: currentWing })
      });
      const data = await res.json();

      if (data.success) {
        renderResultSlip(data);
      } else {
        errText.textContent = data.message || 'Could not retrieve result. Please verify credentials.';
        errorBox.style.display = 'flex';
      }
    } catch (err) {
      errText.textContent = 'Connection error. Please check your network and try again.';
      errorBox.style.display = 'flex';
    } finally {
      btn.disabled = false;
      if (btnText) btnText.style.display = 'inline-flex';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  });
}

function renderResultSlip(data) {
  const { student, results, ratings, summary, settings } = data;
  const slipContainer = document.getElementById('result-slip-output');
  if (!slipContainer) return;

  const isPrimary = student.school_wing === 'primary';
  const wingTitle = isPrimary ? 'EXCELLENCE ELEMENTARY SCHOOL (NURSERY & PRIMARY)' : 'EXCELLENCE COLLEGE (SECONDARY & SIXTH FORM)';
  const principalTitle = isPrimary ? 'Headteacher' : 'Principal';
  const principalName = isPrimary ? (settings.primary_head_name || 'Mrs. Folashade Adeleke, M.Ed (Oxon)') : (settings.secondary_principal_name || 'Dr. Babatunde Alabi, Ph.D (Cantab)');

  // Dynamic photo
  const studentPhoto = student.photo_url || (isPrimary ? '/assets/images/elementary/elementary_classroom.jpg' : '/assets/images/college/college_classroom.jpg');

  // Build subject rows
  const subjectRows = results.map((r, i) => `
    <tr>
      <td style="font-weight: 600;">${i + 1}. ${r.subject}</td>
      <td style="text-align: center;">${r.ca1 || 0}</td>
      <td style="text-align: center;">${r.ca2 || 0}</td>
      <td style="text-align: center;">${r.exam || 0}</td>
      <td style="text-align: center; font-weight: 700;">${r.total || 0}</td>
      <td style="text-align: center;"><span class="badge-grade grade-${r.grade}">${r.grade}</span></td>
      <td>${r.remark || '-'}</td>
    </tr>
  `).join('');

  // Build ratings
  const affectiveItems = Object.entries(ratings.affective || {}).map(([k, v]) => `
    <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; font-size: 0.82rem;">
      <span>${k}</span>
      <strong>${v} / 5</strong>
    </div>
  `).join('');

  const psychomotorItems = Object.entries(ratings.psychomotor || {}).map(([k, v]) => `
    <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; font-size: 0.82rem;">
      <span>${k}</span>
      <strong>${v} / 5</strong>
    </div>
  `).join('');

  slipContainer.innerHTML = `
    <div class="result-slip-modal-view">
      <!-- Watermark Background -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); opacity: 0.04; font-size: 4.8rem; font-family: var(--font-serif); font-weight: 900; pointer-events: none; text-align: center; width: 100%;">
        EXCELLENCE BRITISH SCHOOLS<br>OFFICIAL TERMINAL REPORT
      </div>

      <!-- Action Bar -->
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1px solid var(--slate-200);">
        <button type="button" class="btn btn-outline-white" onclick="resetResultChecker()" style="color: var(--navy-900); border-color: var(--slate-300);">
          ← Check Another Result
        </button>
        <div style="font-weight: 700; color: var(--navy-900); display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
          Verified Terminal Report Slip
        </div>
        <button type="button" class="btn btn-gold" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <!-- Slip Header -->
      <div class="slip-header">
        <div class="slip-header-brand">
          <img src="/assets/images/crest.jpg" alt="Excellence British Schools Crest">
          <div class="slip-school-info">
            <h2>EXCELLENCE BRITISH SCHOOLS</h2>
            <p style="font-weight: 700; color: var(--gold-700);">${wingTitle}</p>
            <p>${settings.school_address || 'Admiralty Way, Victoria Island & Lekki Campus'}</p>
            <p>Tel: ${settings.school_phone || '+234 803 000 8899'} | Email: ${settings.school_email || 'admissions@excellencebritishschools.sch.ng'}</p>
            <p style="font-size: 0.74rem; color: var(--slate-500); font-style: italic;">
              ${settings.accreditations || 'DfE Registered | Cambridge Assessment International Education'}
            </p>
          </div>
        </div>
        <div class="slip-photo-box">
          <img src="${studentPhoto}" alt="Student Photo">
        </div>
      </div>

      <!-- Title Banner -->
      <div style="background: var(--navy-900); color: var(--gold-300); text-align: center; padding: 8px 14px; font-weight: 800; font-size: 1rem; letter-spacing: 1px; border-radius: 4px; margin-bottom: 18px;">
        OFFICIAL STUDENT TERMINAL PROGRESS REPORT — ${student.session.toUpperCase()} (${student.term.toUpperCase()})
      </div>

      <!-- Student Meta Grid -->
      <div class="slip-student-meta-grid">
        <div class="meta-item">
          <strong>Student Name</strong>
          <span>${student.name}</span>
        </div>
        <div class="meta-item">
          <strong>Admission No.</strong>
          <span style="font-family: var(--font-mono);">${student.admission_number}</span>
        </div>
        <div class="meta-item">
          <strong>Class / Grade</strong>
          <span>${student.class}</span>
        </div>
        <div class="meta-item">
          <strong>Gender</strong>
          <span>${student.gender}</span>
        </div>
        <div class="meta-item">
          <strong>House</strong>
          <span>${student.house} House</span>
        </div>
        <div class="meta-item">
          <strong>Class Position</strong>
          <span style="color: var(--crimson-700);">${summary.position} of ${summary.total_in_class} Scholars</span>
        </div>
        <div class="meta-item">
          <strong>Term Average</strong>
          <span style="color: var(--emerald-600);">${summary.average}%</span>
        </div>
        <div class="meta-item">
          <strong>PIN Uses</strong>
          <span>${summary.pin_use_count} of ${summary.pin_max_uses}</span>
        </div>
      </div>

      <!-- Academic Table -->
      <table class="scores-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th style="text-align: center; width: 60px;">CA 1 (20)</th>
            <th style="text-align: center; width: 60px;">CA 2 (20)</th>
            <th style="text-align: center; width: 60px;">Exam (60)</th>
            <th style="text-align: center; width: 60px;">Total (100)</th>
            <th style="text-align: center; width: 70px;">Grade</th>
            <th>Teacher Remark</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <!-- Summary & Behavioral Ratings -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--cream-100); border: 1px solid var(--slate-300); border-radius: 8px; padding: 16px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 12px; border-bottom: 2px solid var(--gold-500); padding-bottom: 4px;">
            Academic Summary
          </h4>
          <p style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem;">
            <span>Grand Total Score:</span>
            <strong>${summary.grand_total} / ${summary.max_possible_total}</strong>
          </p>
          <p style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem;">
            <span>Cumulative Average:</span>
            <strong style="color: var(--navy-900);">${summary.average}%</strong>
          </p>
          <p style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem;">
            <span>Overall Evaluation:</span>
            <strong style="color: var(--emerald-600);">${summary.overall_remark}</strong>
          </p>
          <p style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.84rem; color: var(--slate-600);">
            <span>Next Term Resumption:</span>
            <strong>${settings.next_term_begins || 'January 12, 2026'}</strong>
          </p>
        </div>

        <div style="background: var(--white); border: 1px solid var(--slate-300); border-radius: 8px; padding: 14px;">
          <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--navy-900); border-bottom: 1px solid var(--slate-200); padding-bottom: 4px;">
            Affective Domain (Scale 1-5)
          </h4>
          ${affectiveItems || '<p style="font-size: 0.8rem; color: #777;">Ratings recorded satisfactorily.</p>'}
        </div>

        <div style="background: var(--white); border: 1px solid var(--slate-300); border-radius: 8px; padding: 14px;">
          <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--navy-900); border-bottom: 1px solid var(--slate-200); padding-bottom: 4px;">
            Psychomotor Skills (Scale 1-5)
          </h4>
          ${psychomotorItems || '<p style="font-size: 0.8rem; color: #777;">Skills assessed satisfactorily.</p>'}
        </div>
      </div>

      <!-- Remarks -->
      <div style="background: var(--cream-100); border: 1px solid var(--slate-300); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="font-size: 0.88rem; margin-bottom: 8px;">
          <strong>Form Tutor's Remark:</strong> 
          <em>"${student.name} demonstrates exceptional discipline and commitment to academic excellence."</em>
        </p>
        <p style="font-size: 0.88rem;">
          <strong>${principalTitle}'s Endorsement:</strong> 
          <em>"A stellar performance reflecting the ethos and academic rigour of Excellence British Schools."</em>
        </p>
      </div>

      <!-- Signatures Footer -->
      <div class="slip-signatures-grid">
        <div class="sig-box">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 1.4rem; color: var(--navy-800);">B. Alabi</div>
          <p>${principalName}<br><strong>${principalTitle}</strong></p>
        </div>
        <div class="sig-box">
          <div style="display: inline-block; width: 68px; height: 68px; border: 2px dashed var(--gold-600); border-radius: 50%; padding: 6px; font-size: 0.65rem; color: var(--gold-700); font-weight: 800; text-transform: uppercase;">
            EXCELLENCE<br>REGISTRY<br>SEAL
          </div>
          <p>Official Authentication Stamp</p>
        </div>
        <div class="sig-box">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 1.4rem; color: var(--navy-800);">C. Nwosu</div>
          <p>Mr. Chiemeka Nwosu<br><strong>Registrar & Examinations Director</strong></p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('checker-form-container').style.display = 'none';
  slipContainer.style.display = 'block';
  slipContainer.scrollIntoView({ behavior: 'smooth' });
}

window.resetResultChecker = function() {
  document.getElementById('result-slip-output').style.display = 'none';
  document.getElementById('checker-form-container').style.display = 'block';
  document.getElementById('checker-form-container').scrollIntoView({ behavior: 'smooth' });
};
