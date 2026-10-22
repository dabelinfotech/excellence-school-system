/* ═══════════════════════════════════════════════════════════════════
   PAYMENT RECEIPT UPLOAD & CLEARANCE CLIENT — EXCELLENCE SCHOOL
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initReceiptUpload();
  initReceiptTracker();
});

function initReceiptUpload() {
  const form = document.getElementById('receipt-upload-form');
  const fileInput = document.getElementById('receipt_file');
  const dropzone = document.getElementById('receipt-dropzone');
  const previewBox = document.getElementById('receipt-file-preview');

  if (!form || !fileInput) return;

  // Dropzone drag-and-drop
  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        showFilePreview(e.dataTransfer.files[0]);
      }
    });
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      showFilePreview(fileInput.files[0]);
    }
  });

  function showFilePreview(file) {
    if (!previewBox) return;
    const isImage = file.type.startsWith('image/');
    previewBox.style.display = 'block';

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 14px; background: var(--cream-100); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-300);">
            <img src="${e.target.result}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" alt="Receipt">
            <div>
              <p style="font-weight: 700; font-size: 0.9rem; margin: 0;">${file.name}</p>
              <span style="font-size: 0.78rem; color: #666;">${(file.size / 1024).toFixed(1)} KB (Ready to upload)</span>
            </div>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      previewBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px; background: var(--cream-100); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-300);">
          <div style="font-size: 2rem;">📄</div>
          <div>
            <p style="font-weight: 700; font-size: 0.9rem; margin: 0;">${file.name}</p>
            <span style="font-size: 0.78rem; color: #666;">PDF Document • ${(file.size / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      `;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('upload-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Uploading & Validating...';

    const formData = new FormData(form);

    try {
      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        renderUploadSuccess(data);
      } else {
        alert(data.message || 'Error uploading receipt.');
      }
    } catch (err) {
      alert('Network transmission failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Payment Receipt';
    }
  });
}

function renderUploadSuccess(data) {
  const formCard = document.getElementById('receipt-upload-card');
  const resultCard = document.getElementById('receipt-result-output');
  if (!formCard || !resultCard) return;

  formCard.style.display = 'none';
  resultCard.style.display = 'block';

  resultCard.innerHTML = `
    <div style="background: var(--white); border-radius: var(--radius-xl); border: 2px solid var(--gold-500); padding: 40px; box-shadow: var(--shadow-lg); text-align: center;">
      <div style="width: 70px; height: 70px; background: #ecfdf5; border-radius: 50%; color: #059669; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        ✓
      </div>
      <h2 style="font-size: 1.8rem; color: var(--navy-900); margin-bottom: 6px;">Receipt Uploaded Successfully</h2>
      <p style="color: var(--slate-600); margin-bottom: 24px;">Your payment slip has been submitted to the Excellence British Schools Bursary Audit unit.</p>

      <div style="background: var(--cream-100); border: 1px solid var(--slate-300); border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto 28px auto; text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--slate-500); font-size: 0.88rem;">Student Admission:</span>
          <strong>${data.details.admission_number}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--slate-500); font-size: 0.88rem;">Student Name:</span>
          <strong>${data.details.student_name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--slate-500); font-size: 0.88rem;">Amount:</span>
          <strong>₦${Number(data.details.amount).toLocaleString()}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--slate-500); font-size: 0.88rem;">Teller / Reference:</span>
          <strong style="font-family: var(--font-mono);">${data.details.teller_ref}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--slate-500); font-size: 0.88rem;">Status:</span>
          <span class="status-badge-pending">Pending Verification</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--slate-300); padding-top: 8px; margin-top: 8px;">
          <span style="color: var(--gold-700); font-weight: 700; font-size: 0.88rem;">Clearance Code:</span>
          <strong style="font-family: var(--font-mono); color: var(--navy-900);">${data.clearance_code}</strong>
        </div>
      </div>

      <div style="display: flex; gap: 14px; justify-content: center;">
        <button type="button" class="btn btn-gold" onclick="window.print()">
          🖨️ Print Submission Slip
        </button>
        <button type="button" class="btn btn-outline-white" onclick="location.reload()" style="color: var(--navy-900); border-color: var(--slate-300);">
          Upload Another Receipt
        </button>
      </div>
    </div>
  `;
}

function initReceiptTracker() {
  const trackForm = document.getElementById('receipt-track-form');
  if (!trackForm) return;

  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ref = document.getElementById('track-ref-input').value.trim();
    const resultBox = document.getElementById('track-result-output');

    if (!ref) return;

    try {
      const res = await fetch(`/api/receipts/track/${encodeURIComponent(ref)}`);
      const data = await res.json();

      if (data.success && data.receipt) {
        const r = data.receipt;
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="background: var(--white); border: 2px solid ${r.status === 'Approved' ? '#10b981' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="margin: 0; font-size: 1.1rem; color: var(--navy-900);">Transaction: ${r.teller_ref}</h4>
              <span class="${r.status === 'Approved' ? 'status-badge-approved' : 'status-badge-pending'}">${r.status}</span>
            </div>
            <p style="margin-bottom: 6px; font-size: 0.9rem;"><strong>Student:</strong> ${r.student_name} (${r.admission_number}) — Class: ${r.class}</p>
            <p style="margin-bottom: 6px; font-size: 0.9rem;"><strong>Fee Item:</strong> ${r.fee_type} — ₦${Number(r.amount).toLocaleString()}</p>
            <p style="margin-bottom: 6px; font-size: 0.9rem;"><strong>Bank & Date:</strong> ${r.bank_name} (${r.payment_date})</p>
            <p style="margin: 0; font-size: 0.85rem; color: #666; font-style: italic;">Auditor Note: ${r.remarks || 'Receipt queued for clearance verification.'}</p>
          </div>
        `;
      } else {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<p style="color: #dc2626; margin-top: 14px; font-weight: 600;">No receipt found with reference "${ref}".</p>`;
      }
    } catch (_) {
      alert('Error querying tracking service.');
    }
  });
}
