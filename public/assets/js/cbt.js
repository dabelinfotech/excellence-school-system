/* ═══════════════════════════════════════════════════════════════════
   CBT (COMPUTER-BASED TEST) SIMULATOR — EXCELLENCE SCHOOL
   Supports Primary & Secondary Quizzes and IGCSE Mock Examinations
   ═══════════════════════════════════════════════════════════════════ */

let cbtQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let timerInterval = null;
let secondsRemaining = 600; // 10 minutes default
let candidateDetails = {};

document.addEventListener('DOMContentLoaded', () => {
  initCbtLaunchForm();
});

function initCbtLaunchForm() {
  const launchForm = document.getElementById('cbt-launch-form');
  if (!launchForm) return;

  // Handle wing change to update subjects
  const wingSelect = document.getElementById('cbt-wing-select');
  const subjectSelect = document.getElementById('cbt-subject-select');

  if (wingSelect && subjectSelect) {
    wingSelect.addEventListener('change', () => {
      const isPrimary = wingSelect.value === 'primary';
      if (isPrimary) {
        subjectSelect.innerHTML = `
          <option value="Mathematics">KS2 Mathematics & Numeracy</option>
          <option value="Science">KS2 Science & Nature Exploration</option>
          <option value="English">English Vocabulary & Grammar</option>
          <option value="ICT & Computing">ICT & Digital Foundations</option>
        `;
      } else {
        subjectSelect.innerHTML = `
          <option value="Mathematics">IGCSE Mathematics (Extended)</option>
          <option value="Physics">IGCSE Physics & Applied Mechanics</option>
          <option value="Chemistry">IGCSE Chemistry</option>
          <option value="Biology">IGCSE Biology & Cell Physiology</option>
          <option value="English">IGCSE English Language</option>
        `;
      }
    });
  }

  launchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    candidateDetails = {
      name: document.getElementById('cbt-cand-name').value.trim(),
      reg: document.getElementById('cbt-cand-reg').value.trim(),
      wing: document.getElementById('cbt-wing-select').value,
      subject: document.getElementById('cbt-subject-select').value
    };

    if (!candidateDetails.name || !candidateDetails.reg) {
      alert('Please fill candidate name and examination number.');
      return;
    }

    try {
      const res = await fetch(`/api/cbt/questions?wing=${candidateDetails.wing}&subject=${encodeURIComponent(candidateDetails.subject)}`);
      const data = await res.json();

      if (data.success && data.questions.length > 0) {
        cbtQuestions = data.questions;
        startCbtExam();
      } else {
        alert('No questions available for this subject at the moment.');
      }
    } catch (err) {
      alert('Error connecting to CBT examination server.');
    }
  });
}

function startCbtExam() {
  currentIndex = 0;
  userAnswers = {};
  secondsRemaining = cbtQuestions.length * 60; // 1 minute per question

  document.getElementById('cbt-setup-card').style.display = 'none';
  document.getElementById('cbt-exam-card').style.display = 'block';

  document.getElementById('cbt-exam-title').textContent = `${candidateDetails.wing === 'primary' ? 'Nursery & Primary' : 'Secondary School'} — ${candidateDetails.subject}`;
  document.getElementById('cbt-candidate-display').textContent = `Candidate: ${candidateDetails.name} (${candidateDetails.reg})`;

  buildPalette();
  renderCurrentQuestion();
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimerDisplay();

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      alert('Time has expired! Submitting your examination automatically.');
      submitCbtExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerBadge = document.getElementById('cbt-timer');
  if (!timerBadge) return;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  timerBadge.textContent = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (secondsRemaining < 120) {
    timerBadge.classList.add('cbt-timer-urgent');
  } else {
    timerBadge.classList.remove('cbt-timer-urgent');
  }
}

function buildPalette() {
  const paletteContainer = document.getElementById('cbt-palette');
  if (!paletteContainer) return;

  paletteContainer.innerHTML = '';
  cbtQuestions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `palette-btn ${idx === currentIndex ? 'current' : ''} ${userAnswers[q.id] ? 'answered' : ''}`;
    btn.textContent = idx + 1;
    btn.id = `palette-btn-${q.id}`;
    btn.addEventListener('click', () => {
      currentIndex = idx;
      renderCurrentQuestion();
    });
    paletteContainer.appendChild(btn);
  });
}

function renderCurrentQuestion() {
  const q = cbtQuestions[currentIndex];
  if (!q) return;

  document.getElementById('cbt-q-number').textContent = `Question ${currentIndex + 1} of ${cbtQuestions.length}`;
  document.getElementById('cbt-q-text').textContent = q.question;

  const optionsContainer = document.getElementById('cbt-options');
  const letters = ['A', 'B', 'C', 'D'];
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];

  optionsContainer.innerHTML = '';
  letters.forEach((letter, i) => {
    const isSelected = userAnswers[q.id] === letter;
    const optDiv = document.createElement('div');
    optDiv.className = `cbt-option-item ${isSelected ? 'selected' : ''}`;
    optDiv.innerHTML = `
      <div class="cbt-option-letter">${letter}</div>
      <div style="font-size: 1rem;">${opts[i]}</div>
    `;
    optDiv.addEventListener('click', () => {
      userAnswers[q.id] = letter;
      renderCurrentQuestion();
      updatePaletteButton(q.id);
    });
    optionsContainer.appendChild(optDiv);
  });

  // Navigation buttons state
  document.getElementById('cbt-prev-btn').disabled = currentIndex === 0;
  const nextBtn = document.getElementById('cbt-next-btn');
  if (currentIndex === cbtQuestions.length - 1) {
    nextBtn.textContent = 'Review & Finish';
  } else {
    nextBtn.textContent = 'Next Question →';
  }

  // Update palette current indicator
  document.querySelectorAll('.palette-btn').forEach((b, i) => {
    if (i === currentIndex) {
      b.classList.add('current');
    } else {
      b.classList.remove('current');
    }
  });
}

function updatePaletteButton(qId) {
  const btn = document.getElementById(`palette-btn-${qId}`);
  if (btn && userAnswers[qId]) {
    btn.classList.add('answered');
  }
}

window.cbtPrevQuestion = function() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
  }
};

window.cbtNextQuestion = function() {
  if (currentIndex < cbtQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
  } else {
    confirmSubmitCbt();
  }
};

window.confirmSubmitCbt = function() {
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = cbtQuestions.length - answeredCount;

  const confirmMsg = unansweredCount > 0
    ? `You have answered ${answeredCount} of ${cbtQuestions.length} questions (${unansweredCount} unanswered).\nDo you want to submit your test now?`
    : `All ${cbtQuestions.length} questions answered!\nReady to submit for instant evaluation?`;

  if (confirm(confirmMsg)) {
    submitCbtExam();
  }
};

async function submitCbtExam() {
  clearInterval(timerInterval);

  try {
    const res = await fetch('/api/cbt/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_name: candidateDetails.name,
        candidate_reg: candidateDetails.reg,
        school_wing: candidateDetails.wing,
        subject: candidateDetails.subject,
        answers: userAnswers
      })
    });
    const data = await res.json();

    if (data.success) {
      renderCbtResults(data);
    } else {
      alert(data.message || 'Error recording CBT results.');
    }
  } catch (err) {
    alert('Failed to transmit examination submission to server.');
  }
}

function renderCbtResults(data) {
  document.getElementById('cbt-exam-card').style.display = 'none';
  const resultCard = document.getElementById('cbt-result-card');
  resultCard.style.display = 'block';

  const reviewListHtml = data.review.map((item, i) => `
    <div style="border: 1px solid ${item.is_correct ? '#10b981' : '#ef4444'}; background: ${item.is_correct ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px; padding: 16px; margin-bottom: 14px;">
      <p style="font-weight: 700; color: var(--navy-900); margin-bottom: 6px;">
        Q${i + 1}: ${item.question}
      </p>
      <div style="display: flex; gap: 20px; font-size: 0.9rem; margin-bottom: 6px;">
        <span>Your Answer: <strong>${item.user_answer || 'None'}</strong></span>
        <span>Correct Answer: <strong style="color: #065f46;">${item.correct_answer}</strong></span>
        <span>Result: <strong style="color: ${item.is_correct ? '#10b981' : '#dc2626'};">${item.is_correct ? '✓ Correct' : '✗ Incorrect'}</strong></span>
      </div>
      <p style="font-size: 0.84rem; color: #4b5563; font-style: italic; margin: 0;">
        💡 Explanation: ${item.explanation || 'Curriculum standard concept.'}
      </p>
    </div>
  `).join('');

  resultCard.innerHTML = `
    <div style="background: var(--white); border-radius: var(--radius-xl); border: 2px solid var(--gold-500); padding: 40px; box-shadow: var(--shadow-lg);">
      <!-- Certificate Header -->
      <div style="text-align: center; border-bottom: 2px solid var(--slate-200); padding-bottom: 24px; margin-bottom: 24px;">
        <img src="/assets/images/crest.jpg" style="width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 12px auto; border: 2px solid var(--gold-500);" alt="Crest">
        <h2 style="font-size: 1.8rem; color: var(--navy-900);">COMPUTER-BASED EXAMINATION RESULT SLIP</h2>
        <p style="color: var(--gold-700); font-weight: 700;">Excellence Digital Assessment Centre (UK Standard)</p>
      </div>

      <!-- Candidate Performance Card -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: var(--cream-100); padding: 20px; border-radius: 12px; margin-bottom: 28px; text-align: center;">
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--slate-500);">Candidate</span>
          <h4 style="font-size: 1.1rem; color: var(--navy-900);">${candidateDetails.name}</h4>
          <span style="font-size: 0.76rem; font-family: var(--font-mono);">${candidateDetails.reg}</span>
        </div>
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--slate-500);">Subject</span>
          <h4 style="font-size: 1.1rem; color: var(--navy-900);">${candidateDetails.subject}</h4>
          <span style="font-size: 0.76rem;">${candidateDetails.wing === 'primary' ? 'Nursery/Primary' : 'Secondary'}</span>
        </div>
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--slate-500);">Score</span>
          <h4 style="font-size: 1.8rem; color: ${data.passed ? '#059669' : '#dc2626'}; font-family: var(--font-mono); font-weight: 800;">
            ${data.score} / ${data.total}
          </h4>
          <span style="font-weight: 700;">${data.percentage}%</span>
        </div>
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--slate-500);">Grade & Status</span>
          <h4 style="font-size: 1.4rem; color: var(--gold-700); font-weight: 800;">${data.grade}</h4>
          <span style="color: ${data.passed ? '#059669' : '#dc2626'}; font-weight: 700;">${data.remark}</span>
        </div>
      </div>

      <!-- Verification Code -->
      <div style="background: var(--navy-900); color: var(--gold-300); padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <span style="font-size: 0.88rem;">Digital Verification ID: <strong style="font-family: var(--font-mono);">${data.certificate_code}</strong></span>
        <button type="button" class="btn btn-gold" onclick="window.print()" style="padding: 6px 16px; font-size: 0.85rem;">
          🖨️ Print Result Certificate
        </button>
      </div>

      <!-- Detailed Review Accordion -->
      <h3 style="font-size: 1.3rem; margin-bottom: 16px; color: var(--navy-900);">Question Review & Solutions</h3>
      <div style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
        ${reviewListHtml}
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <button type="button" class="btn btn-outline-white" onclick="location.reload()" style="color: var(--navy-900); border-color: var(--slate-300);">
          ← Take Another CBT Test
        </button>
      </div>
    </div>
  `;
}
