/* ═══════════════════════════════════════════════════════════════════
   MAIN APPLICATION CONTROLLER — EXCELLENCE PRIMARY & SECONDARY SCHOOL
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNoticeTicker();
  initWingModal();
  initRsvpModal();
  initAuthModal();
  initMobileDrawer();
  initHeaderDropdowns();
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
        <video controls autoplay playsinline src="${n.media_url}" style="width: 100%; max-height: 220px; display: block; border-radius: 8px; background: #000;"></video>
      `;
    } else {
      mediaContainer.innerHTML = `
        <img src="${n.media_url}" alt="${n.title}" style="width: 100%; max-height: 220px; object-fit: contain; display: block; border-radius: 8px; margin: 0 auto;">
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

// ═══════════════════════════════════════════════════════════════════
// UNIVERSAL MOBILE NAVIGATION DRAWER CONTROLLER
// ═══════════════════════════════════════════════════════════════════
function initMobileDrawer() {
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;

  // Ensure hamburger toggle button exists in header
  let toggleBtn = headerInner.querySelector('.mobile-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'mobile-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    toggleBtn.innerHTML = '☰';
    headerInner.appendChild(toggleBtn);
  }

  // Create drawer DOM element if not already present
  let drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobile-nav-drawer';
    drawer.className = 'mobile-nav-drawer';
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    drawer.innerHTML = `
      <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
      <div class="mobile-nav-panel">
        <div class="mobile-nav-header">
          <div class="brand-wrapper" style="gap: 10px;">
            <div class="brand-crest" style="width: 38px; height: 38px; flex-shrink: 0;">
              <img src="/assets/images/crest.jpg" alt="Excellence British Schools Crest">
            </div>
            <div>
              <strong style="color: #fff; font-size: 0.92rem; display: block; line-height: 1.2;">EXCELLENCE BRITISH SCHOOLS</strong>
              <span style="color: var(--gold-300); font-size: 0.68rem;">Virtus, Sapientia et Excellentia</span>
            </div>
          </div>
          <button type="button" class="mobile-nav-close-btn" id="mobile-nav-close" aria-label="Close Navigation">✕</button>
        </div>

        <div class="mobile-nav-links">
          <!-- CATEGORY 1: SCHOOL -->
          <div class="mobile-nav-section-title">School</div>
          <a href="/" class="mobile-nav-link ${path === '/' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">🏠</span> <span>Home</span>
          </a>
          <a href="/primary" class="mobile-nav-link ${path === '/primary' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">🧸</span> <span>Excellence Elementary</span>
          </a>
          <a href="/secondary" class="mobile-nav-link ${path === '/secondary' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">🏛️</span> <span>Excellence College</span>
          </a>
          <a href="/facilities" class="mobile-nav-link ${path === '/facilities' || path === '/gallery' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">🏫</span> <span>Facilities</span>
          </a>

          <!-- CATEGORY 2: INFORMATION -->
          <div class="mobile-nav-section-title">Information</div>
          <a href="/newsletter" class="mobile-nav-link ${path === '/newsletter' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">📰</span> <span>Newsletters</span>
          </a>
          <a href="/events" class="mobile-nav-link ${path === '/events' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">📅</span> <span>Events</span>
          </a>

          <!-- CATEGORY 3: STUDENT SERVICES -->
          <div class="mobile-nav-section-title">Student Services</div>
          <a href="/result-checker" class="mobile-nav-link ${path === '/result-checker' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">📜</span> <span>Result Checker</span>
          </a>
          <a href="/cbt" class="mobile-nav-link ${path === '/cbt' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">💻</span> <span>CBT Testing</span>
          </a>
          <a href="/payment-receipt" class="mobile-nav-link ${path === '/payment-receipt' ? 'active' : ''}">
            <span style="font-size: 1.15rem;">💳</span> <span>Fee Receipts</span>
          </a>

          <!-- SCHOOL WING SELECTOR & ADMIN -->
          <div class="mobile-nav-section-title">School Wings</div>
          <button type="button" class="mobile-nav-link open-wing-modal-btn" style="background: rgba(197, 160, 89, 0.08); border-color: rgba(197, 160, 89, 0.3); width: 100%; text-align: left; cursor: pointer;">
            <span style="font-size: 1.15rem;">🎓</span> <span>Select School Wing Modal</span>
          </button>

          <div style="border-top: 1px solid rgba(197, 160, 89, 0.25); margin: 10px 0 4px 0;"></div>
          <a href="/admin" class="mobile-nav-link" style="color: var(--gold-300); font-weight: 700; background: rgba(197, 160, 89, 0.12); border-color: rgba(197, 160, 89, 0.35);">
            <span style="font-size: 1.15rem;">👑</span> <span>Directorate Admin Login →</span>
          </a>
        </div>

        <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; color: var(--slate-400);">
          <div style="color: var(--gold-300); font-weight: 700; margin-bottom: 4px;">🇬🇧 British Curriculum Standards</div>
          <div>Admiralty Way, Victoria Island & Lekki Campus</div>
          <div style="margin-top: 2px;">Tel: +234 803 000 8899</div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Re-bind open-wing-modal-btn inside drawer if needed
    const drawerWingBtn = drawer.querySelector('.open-wing-modal-btn');
    if (drawerWingBtn) {
      drawerWingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.classList.remove('open');
        document.body.style.overflow = '';
        const modal = document.getElementById('wing-select-modal');
        if (modal) modal.style.display = 'flex';
      });
    }
  }

  // Open drawer event
  toggleBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Close drawer events
  const closeBtn = document.getElementById('mobile-nav-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    };
  }

  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (backdrop) {
    backdrop.onclick = () => {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// DESKTOP & MOBILE HEADER DROPDOWNS CONTROLLER
// ═══════════════════════════════════════════════════════════════════
function initHeaderDropdowns() {
  const dropdownContainers = document.querySelectorAll('.nav-dropdown, .wing-dropdown');
  if (!dropdownContainers.length) return;

  dropdownContainers.forEach(container => {
    const trigger = container.querySelector('.nav-dropdown-trigger, .wing-select-btn');
    const menu = container.querySelector('.nav-dropdown-menu, .wing-dropdown-menu');
    if (!trigger || !menu) return;

    // Click toggle handler
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = container.classList.contains('open');

      // Close all other dropdowns
      dropdownContainers.forEach(other => {
        if (other !== container) {
          other.classList.remove('open');
          const otherTrigger = other.querySelector('.nav-dropdown-trigger, .wing-select-btn');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        container.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        container.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard support: Escape closes current dropdown
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        container.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });
  });

  // Global click outside to dismiss open dropdowns
  document.addEventListener('click', (e) => {
    dropdownContainers.forEach(container => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
        const trigger = container.querySelector('.nav-dropdown-trigger, .wing-select-btn');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Sync active states on load
  syncActiveNavigation();
}

function syncActiveNavigation() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  // 1. Primary Nav Direct Links (School category)
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const cleanHref = href.replace(/\/$/, '') || '/';
    if (cleanHref === currentPath || (cleanHref === '/facilities' && (currentPath === '/facilities' || currentPath === '/gallery'))) {
      link.classList.add('active');
    }
  });

  // 2. Dropdown Menus (Information & Student Services categories)
  const navDropdowns = document.querySelectorAll('.nav-dropdown');
  navDropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    const menuItems = dropdown.querySelectorAll('.dropdown-item');
    let hasActiveChild = false;

    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
      const cleanHref = href.replace(/\/$/, '') || '/';
      if (cleanHref === currentPath || (cleanHref === '/facilities' && (currentPath === '/facilities' || currentPath === '/gallery'))) {
        item.classList.add('active');
        hasActiveChild = true;
      }
    });

    if (hasActiveChild && trigger) {
      trigger.classList.add('active');
      dropdown.classList.add('active');
    }
  });
}


