/* ═══════════════════════════════════════════════════════════════════
   MAIN APPLICATION CONTROLLER — EXCELLENCE PRIMARY & SECONDARY SCHOOL
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNoticeTicker();
  initWingModal();
  initRsvpModal();
  initAuthModal();
});

// Wing Selector Modal
function initWingModal() {
  const modal = document.getElementById('wing-select-modal');
  const openBtns = document.querySelectorAll('.open-wing-modal-btn');
  const closeBtn = document.getElementById('close-wing-modal');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

// Event RSVP Modal
function initRsvpModal() {
  const modal = document.getElementById('rsvp-modal');
  const rsvpBtns = document.querySelectorAll('.btn-event-rsvp');
  const closeBtn = document.getElementById('close-rsvp-modal');
  const rsvpForm = document.getElementById('rsvp-form');

  if (!modal) return;

  rsvpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-event-id');
      const eventTitle = btn.getAttribute('data-event-title');
      document.getElementById('rsvp-event-id').value = eventId;
      document.getElementById('rsvp-event-name').textContent = eventTitle || 'School Event';
      modal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const event_id = document.getElementById('rsvp-event-id').value;
      const parent_name = document.getElementById('rsvp-name').value;
      const email = document.getElementById('rsvp-email').value;
      const phone = document.getElementById('rsvp-phone').value;
      const attendees = document.getElementById('rsvp-attendees').value;

      try {
        const res = await fetch('/api/events/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id, parent_name, email, phone, attendees })
        });
        const data = await res.json();
        if (data.success) {
          alert(`RSVP Confirmed!\nYour Invitation Pass Code: ${data.ticket_code}\nA confirmation email has been dispatched to ${email}.`);
          modal.style.display = 'none';
          rsvpForm.reset();
        } else {
          alert(data.message || 'Error confirming RSVP.');
        }
      } catch (err) {
        alert('Could not connect to server.');
      }
    });
  }
}

// Portal / Admin Auth Modal
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  const openBtns = document.querySelectorAll('.open-auth-modal-btn');
  const closeBtn = document.getElementById('close-auth-modal');
  const authForm = document.getElementById('portal-auth-form');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const wing = btn.getAttribute('data-wing') || 'all';
      const wingTitle = btn.getAttribute('data-title') || 'Portal Login';
      document.getElementById('auth-modal-title').textContent = wingTitle;
      document.getElementById('auth-portal-type').value = wing;
      modal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();
      const portal_type = document.getElementById('auth-portal-type').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, portal_type })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = data.redirect;
        } else {
          alert(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (err) {
        alert('Network connection error.');
      }
    });
  }
}

// Notice Ticker (With Image & Video Support)
async function initNoticeTicker() {
  const tickerEl = document.getElementById('ticker-content');
  if (!tickerEl) return;

  try {
    const res = await fetch('/api/notices');
    const data = await res.json();
    if (data.success && data.notices && data.notices.length > 0) {
      window._cachedNotices = data.notices;
      const items = data.notices.map((n, idx) => {
        let mediaTag = '';
        if (n.media_url) {
          const isVideo = n.media_type === 'video' || ['.mp4', '.webm', '.ogg', '.mov'].some(ext => n.media_url.toLowerCase().endsWith(ext));
          mediaTag = isVideo 
            ? '<span style="background: #0284c7; color: #fff; font-size: 0.65rem; padding: 1px 6px; border-radius: 3px; font-weight: 700; margin-left: 4px;">🎥 Video</span>' 
            : '<span style="background: #059669; color: #fff; font-size: 0.65rem; padding: 1px 6px; border-radius: 3px; font-weight: 700; margin-left: 4px;">📷 Photo</span>';
        }
        return `<span style="cursor: pointer;" onclick="openNoticeModal(${idx})" title="Click to view bulletin announcement and media">• <strong>${n.category}:</strong> ${n.title} ${mediaTag}</span>`;
      }).join(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');
      tickerEl.innerHTML = items;
    }
  } catch (_) {}
}

window.openNoticeModal = function(idx) {
  const notices = window._cachedNotices;
  if (!notices || !notices[idx]) return;
  const n = notices[idx];

  let modal = document.getElementById('public-notice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'public-notice-modal';
    modal.className = 'admin-modal-overlay';
    modal.style.zIndex = '10001';
    modal.innerHTML = `
      <div class="admin-modal-box" style="max-width: 620px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <span id="p-notice-category" style="background: var(--crimson-700); color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;"></span>
            <span id="p-notice-date" style="font-size: 0.75rem; color: var(--slate-400); margin-left: 8px;"></span>
          </div>
          <button type="button" onclick="document.getElementById('public-notice-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--navy-900);">✕</button>
        </div>
        <h3 id="p-notice-title" style="color: var(--navy-900); font-size: 1.25rem; margin: 0 0 10px 0; line-height: 1.3;"></h3>
        <p id="p-notice-content" style="color: var(--slate-600); font-size: 0.88rem; line-height: 1.6; margin-bottom: 14px;"></p>
        <div id="p-notice-media" style="margin-top: 14px; border-radius: 8px; overflow: hidden; background: #000;"></div>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
    document.body.appendChild(modal);
  }

  document.getElementById('p-notice-category').textContent = n.category;
  document.getElementById('p-notice-date').textContent = `${n.date} • ${n.author || 'School Registry'}`;
  document.getElementById('p-notice-title').textContent = n.title;
  document.getElementById('p-notice-content').textContent = n.content || n.excerpt || '';

  const mediaContainer = document.getElementById('p-notice-media');
  mediaContainer.innerHTML = '';
  if (n.media_url) {
    const isVideo = n.media_type === 'video' || ['.mp4', '.webm', '.ogg', '.mov'].some(ext => n.media_url.toLowerCase().endsWith(ext));
    if (isVideo) {
      mediaContainer.innerHTML = `
        <video controls autoplay playsinline src="${n.media_url}" style="width: 100%; max-height: 320px; display: block; border-radius: 8px;"></video>
      `;
    } else {
      mediaContainer.innerHTML = `
        <img src="${n.media_url}" alt="${n.title}" style="width: 100%; max-height: 340px; object-fit: contain; display: block; border-radius: 8px;">
      `;
    }
    mediaContainer.style.display = 'block';
  } else {
    mediaContainer.style.display = 'none';
  }

  modal.style.display = 'flex';
};

// Download Newsletter Helper
window.downloadNewsletter = function(filename, title) {
  alert(`Initiating download for:\n${title}\nFile: ${filename}\n(Official school publication registered with DfE repository)`);
};
