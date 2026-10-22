/* ═══════════════════════════════════════════════════════════════════
   AUTO MOTION PICTURES CONTROLLER — EXCELLENCE BRITISH SCHOOLS
   Cinematic Auto-Playing Photography Reel, Ken-Burns Animation,
   Filmstrip Navigation, & Full-Screen Cinema Lightbox
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Photo Registry with Authentic User Pictures
  const cinemaGallery = [
    {
      id: 1,
      title: 'Main Quadrangle Morning Assembly & Leadership Parade',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'Discipline & Leadership',
      description: 'Daily collegiate assembly on the main quadrangle facing school leadership, cultivating oratorical poise, civic duty, and school pride.',
      src: '/assets/images/college/college_assembly.jpg',
      aspect: '16:9'
    },
    {
      id: 2,
      title: 'Advanced Chemistry & Experimental Sciences Laboratory',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'STEM & Scientific Rigour',
      description: 'Senior Cambridge IGCSE and WAEC scholars conducting volumetric titration, chemical synthesis, and rigorous physical experiments.',
      src: '/assets/images/college/college_sci_lab.jpg',
      aspect: '16:9'
    },
    {
      id: 3,
      title: 'Inter-House Football Championship & Athletics Tournament',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'Athletics & Character',
      description: 'High-octane inter-house sports on pristine natural grass pitches, pitting Churchill, Newton, Shakespeare, and Nightingale in sportsmanship.',
      src: '/assets/images/college/college_sports.jpg',
      aspect: '16:9'
    },
    {
      id: 4,
      title: 'Annual African Cultural Day Gala & Traditional Pageantry',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'African Cultural Dignity',
      description: 'Spectacular festival celebrating African heritage, resplendent traditional royal attire, indigenous arts, and multicultural harmony.',
      src: '/assets/images/college/college_cultural.jpg',
      aspect: '16:9'
    },
    {
      id: 5,
      title: 'Computer Science, Coding & Digital Innovation Complex',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'AI & Digital Literacy',
      description: 'Modern computing suite equipped for Python algorithms, robotics programming, automated CBT assessments, and digital research.',
      src: '/assets/images/college/college_ict.jpg',
      aspect: '16:9'
    },
    {
      id: 6,
      title: 'Excellence Elementary Morning Parade & Flagpole Assembly',
      wing: 'elementary',
      wingLabel: 'Excellence Elementary School',
      category: 'Primary Foundation',
      description: 'Enthusiastic primary pupils and teachers assembled under the morning sun, singing the national anthem and reciting the school pledge.',
      src: '/assets/images/elementary/elementary_assembly.jpg',
      aspect: '16:9'
    },
    {
      id: 7,
      title: 'Excellence Elementary Storytime & Literature Discovery Corner',
      wing: 'elementary',
      wingLabel: 'Excellence Elementary School',
      category: 'Literacy & Phonics',
      description: 'Colourful reading nook inspiring young readers through storytelling, Jolly Phonics blending, rich storybooks, and guided discovery.',
      src: '/assets/images/elementary/elementary_library.jpg',
      aspect: '16:9'
    },
    {
      id: 8,
      title: 'Interactive Key Stage Classroom Learning Session',
      wing: 'elementary',
      wingLabel: 'Excellence Elementary School',
      category: 'Interactive Learning',
      description: 'Inquisitive elementary pupils raising hands enthusiastically during an engaging Singapore Maths and science lesson.',
      src: '/assets/images/elementary/elementary_classroom.jpg',
      aspect: '16:9'
    },
    {
      id: 9,
      title: 'Elementary ICT Suite & Junior Computing Workstations',
      wing: 'elementary',
      wingLabel: 'Excellence Elementary School',
      category: 'Junior Tech Suite',
      description: 'Young pupils equipped with headphones and individual workstations mastering digital numeracy, keyboarding, and STEM exploration.',
      src: '/assets/images/elementary/elementary_ict.jpg',
      aspect: '16:9'
    },
    {
      id: 10,
      title: 'Spacious Academic Examination Hall & Study Arena',
      wing: 'elementary',
      wingLabel: 'Excellence Elementary School',
      category: 'Academic Assessment',
      description: 'Quiet, disciplined examination setting with pupils seated at spaced individual desks during terminal and Cambridge checkpoint assessments.',
      src: '/assets/images/elementary/elementary_exam.jpg',
      aspect: '16:9'
    },
    {
      id: 11,
      title: 'Physics Mechanics, Optics & Electric Circuits Laboratory',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'Physics Research',
      description: 'Hands-on practical physics apparatus investigating pulley mechanics, optical refraction, electrical circuits, and kinetic energy.',
      src: '/assets/images/college/college_physics.jpg',
      aspect: '16:9'
    },
    {
      id: 12,
      title: 'Senior Secondary Collegiate Classroom & Smart Instruction',
      wing: 'college',
      wingLabel: 'Excellence College',
      category: 'Higher Academic Rigour',
      description: 'Senior students in smart collegiate blazers engaged in analytical seminar discussions guided by expert Cambridge faculty.',
      src: '/assets/images/college/college_classroom.jpg',
      aspect: '16:9'
    }
  ];

  /* ═══════════════════════════════════════════════════════════════════
     1. HERO AUTO MOTION PICTURE SLIDESHOW
     ═══════════════════════════════════════════════════════════════════ */
  function initHeroMotion() {
    const slides = document.querySelectorAll('.hero-motion-slides .motion-slide');
    if (!slides.length) return;

    let currentIndex = 0;
    let isPlaying = true;
    let slideTimer = null;
    const slideDuration = 5500; // 5.5 seconds per motion picture
    let startTime = Date.now();
    let animFrame = null;

    const progressBar = document.getElementById('hero-motion-progress');
    const titleEl = document.getElementById('hero-motion-title');
    const wingEl = document.getElementById('hero-motion-wing');
    const counterEl = document.getElementById('hero-motion-counter');
    const playPauseBtn = document.getElementById('hero-motion-playpause');
    const prevBtn = document.getElementById('hero-motion-prev');
    const nextBtn = document.getElementById('hero-motion-next');
    const sliderContainer = document.getElementById('hero-slider-section');

    function updateHud(index) {
      const slide = slides[index];
      if (!slide) return;
      const caption = slide.getAttribute('data-caption') || 'Excellence British Schools Campus';
      const wing = slide.getAttribute('data-wing') || 'Academic Campus';

      if (titleEl) titleEl.textContent = caption;
      if (wingEl) wingEl.textContent = `${wing} • Motion Picture ${index + 1} of ${slides.length}`;
      if (counterEl) {
        const curStr = String(index + 1).padStart(2, '0');
        const totStr = String(slides.length).padStart(2, '0');
        counterEl.textContent = `${curStr} / ${totStr}`;
      }
    }

    function showSlide(index) {
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === index);
      });
      currentIndex = index;
      updateHud(index);
      startTime = Date.now();
    }

    function nextSlide() {
      const nextIdx = (currentIndex + 1) % slides.length;
      showSlide(nextIdx);
    }

    function prevSlide() {
      const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(prevIdx);
    }

    function startProgressLoop() {
      function tick() {
        if (isPlaying) {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / slideDuration) * 100);
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
          if (elapsed >= slideDuration) {
            nextSlide();
          }
        }
        animFrame = requestAnimationFrame(tick);
      }
      animFrame = requestAnimationFrame(tick);
    }

    function togglePlayPause() {
      isPlaying = !isPlaying;
      if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying ? '⏸' : '▶';
        playPauseBtn.setAttribute('title', isPlaying ? 'Pause Auto Motion' : 'Resume Auto Motion');
      }
      if (isPlaying) {
        startTime = Date.now();
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startTime = Date.now(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startTime = Date.now(); });
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

    // Pause on hover over controls
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', () => {
        // We slow down or pause on intentional hover if needed, or keep playing smoothly
      });
    }

    showSlide(0);
    startProgressLoop();
  }

  /* ═══════════════════════════════════════════════════════════════════
     2. DEDICATED CINEMA THEATER AUTO MOTION SHOWCASE
     ═══════════════════════════════════════════════════════════════════ */
  function initCinemaTheater() {
    const stage = document.getElementById('cinema-stage-viewport');
    if (!stage) return;

    let filteredItems = [...cinemaGallery];
    let currentIndex = 0;
    let isPlaying = true;
    let slideDuration = 5000;
    let startTime = Date.now();
    let animFrame = null;

    const imgEl = document.getElementById('cinema-active-img');
    const titleEl = document.getElementById('cinema-active-title');
    const categoryEl = document.getElementById('cinema-active-category');
    const wingEl = document.getElementById('cinema-active-wing');
    const descEl = document.getElementById('cinema-active-desc');
    const counterEl = document.getElementById('cinema-slide-counter');
    const progressBar = document.getElementById('cinema-progress-fill');
    const playPauseBtn = document.getElementById('cinema-toggle-play');
    const prevBtn = document.getElementById('cinema-prev-btn');
    const nextBtn = document.getElementById('cinema-next-btn');
    const filmstripTrack = document.getElementById('cinema-filmstrip-track');
    const filterBtns = document.querySelectorAll('.cinema-filter-btn');
    const fullscreenBtn = document.getElementById('cinema-fullscreen-btn');
    const speedSelect = document.getElementById('cinema-speed-select');
    const chimeBtn = document.getElementById('cinema-chime-btn');

    // Ken-Burns motion classes rotation
    const motionClasses = ['motion-kb-zoom-in', 'motion-kb-pan-right', 'motion-kb-zoom-out', 'motion-kb-pan-left'];

    function renderFilmstrip() {
      if (!filmstripTrack) return;
      filmstripTrack.innerHTML = '';

      filteredItems.forEach((item, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `cinema-filmstrip-item ${idx === currentIndex ? 'active' : ''}`;
        thumb.setAttribute('data-index', idx);
        thumb.innerHTML = `
          <div class="thumb-img-box">
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <span class="thumb-badge">${item.wing === 'college' ? 'College' : 'Elementary'}</span>
          </div>
          <div class="thumb-caption">${item.title}</div>
        `;

        thumb.addEventListener('click', () => {
          goToSlide(idx);
        });

        filmstripTrack.appendChild(thumb);
      });
    }

    function goToSlide(idx) {
      if (idx < 0) idx = filteredItems.length - 1;
      if (idx >= filteredItems.length) idx = 0;
      currentIndex = idx;
      const item = filteredItems[currentIndex];
      if (!item) return;

      // Swap image with smooth motion dissolve
      if (imgEl) {
        imgEl.style.opacity = '0';
        setTimeout(() => {
          imgEl.src = item.src;
          imgEl.alt = item.title;

          // Cycle through Ken Burns animations for genuine motion picture feel
          const motionClass = motionClasses[currentIndex % motionClasses.length];
          imgEl.className = 'cinema-screen-img ' + motionClass;
          imgEl.style.opacity = '1';
        }, 300);
      }

      if (titleEl) titleEl.textContent = item.title;
      if (categoryEl) categoryEl.textContent = item.category;
      if (wingEl) wingEl.textContent = item.wingLabel;
      if (descEl) descEl.textContent = item.description;

      if (counterEl) {
        const curStr = String(currentIndex + 1).padStart(2, '0');
        const totStr = String(filteredItems.length).padStart(2, '0');
        counterEl.textContent = `${curStr} / ${totStr}`;
      }

      // Update filmstrip active state & auto-scroll ONLY within filmstripTrack (NEVER scroll the page/window)
      if (filmstripTrack) {
        const thumbs = filmstripTrack.querySelectorAll('.cinema-filmstrip-item');
        thumbs.forEach((t, i) => {
          const isActive = (i === currentIndex);
          t.classList.toggle('active', isActive);
          if (isActive) {
            // Scroll only the inner filmstrip track horizontally without moving page scroll
            const trackWidth = filmstripTrack.clientWidth;
            const thumbLeft = t.offsetLeft;
            const thumbWidth = t.clientWidth;
            const scrollTarget = thumbLeft - (trackWidth / 2) + (thumbWidth / 2);
            filmstripTrack.scrollTo({
              left: Math.max(0, scrollTarget),
              behavior: 'smooth'
            });
          }
        });
      }

      startTime = Date.now();
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function tick() {
      if (isPlaying) {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / slideDuration) * 100);
        if (progressBar) {
          progressBar.style.width = progress + '%';
        }
        if (elapsed >= slideDuration) {
          nextSlide();
        }
      }
      animFrame = requestAnimationFrame(tick);
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying 
          ? '<span class="status-dot green"></span> ⏸ Pause Motion' 
          : '<span class="status-dot amber"></span> ▶ Auto Motion';
      }
      startTime = Date.now();
    }

    // Filter Buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const wing = btn.getAttribute('data-filter');

        if (wing === 'all') {
          filteredItems = [...cinemaGallery];
        } else {
          filteredItems = cinemaGallery.filter(item => item.wing === wing);
        }

        currentIndex = 0;
        renderFilmstrip();
        goToSlide(0);
      });
    });

    // Speed selector
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        slideDuration = parseInt(e.target.value, 10) || 5000;
        startTime = Date.now();
      });
    }

    // Prev / Next / Play Controls
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);

    // Fullscreen Cinema Lightbox
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        openCinemaLightbox(filteredItems[currentIndex]);
      });
    }

    // Synthesized School Bell Chime via Web Audio API (Gentle British Collegiate Chime)
    if (chimeBtn) {
      chimeBtn.addEventListener('click', () => {
        playCollegiateChime();
      });
    }

    // Initial render
    renderFilmstrip();
    goToSlide(0);
    animFrame = requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════════════
     3. FULLSCREEN CINEMA THEATER LIGHTBOX
     ═══════════════════════════════════════════════════════════════════ */
  function openCinemaLightbox(item) {
    if (!item) return;

    let lightbox = document.getElementById('cinema-lightbox-modal');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'cinema-lightbox-modal';
      lightbox.className = 'cinema-lightbox-overlay';
      lightbox.innerHTML = `
        <div class="cinema-lightbox-container">
          <button type="button" class="cinema-lightbox-close" id="close-cinema-lightbox">&times;</button>
          <div class="cinema-lightbox-viewport">
            <img id="cinema-lightbox-img" src="" alt="Fullscreen Motion Picture" class="cinema-lightbox-img motion-kb-zoom-in">
          </div>
          <div class="cinema-lightbox-caption">
            <span id="cinema-lightbox-badge" class="motion-badge">Excellence British Schools Cinema</span>
            <h2 id="cinema-lightbox-title" style="color:#fff; margin: 8px 0;"></h2>
            <p id="cinema-lightbox-desc" style="color: var(--slate-300); margin:0;"></p>
          </div>
        </div>
      `;
      document.body.appendChild(lightbox);

      document.getElementById('close-cinema-lightbox').addEventListener('click', () => {
        lightbox.style.display = 'none';
      });

      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.style.display = 'none';
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'flex') {
          lightbox.style.display = 'none';
        }
      });
    }

    const img = document.getElementById('cinema-lightbox-img');
    const title = document.getElementById('cinema-lightbox-title');
    const badge = document.getElementById('cinema-lightbox-badge');
    const desc = document.getElementById('cinema-lightbox-desc');

    if (img) img.src = item.src;
    if (title) title.textContent = item.title;
    if (badge) badge.textContent = `${item.wingLabel} • ${item.category}`;
    if (desc) desc.textContent = item.description;

    lightbox.style.display = 'flex';
  }

  /* ═══════════════════════════════════════════════════════════════════
     4. GENTLE SYNTHESIZED COLLEGIATE CHIME (Pure Web Audio)
     ═══════════════════════════════════════════════════════════════════ */
  function playCollegiateChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 Westminster / Academic chord
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        gain.gain.setValueAtTime(0, now + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 2.5);
      });
    } catch (_) {}
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHeroMotion();
      initCinemaTheater();
    });
  } else {
    initHeroMotion();
    initCinemaTheater();
  }
})();
