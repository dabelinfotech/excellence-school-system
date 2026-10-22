# EXCELLENCE BRITISH SCHOOLS — CONVERSATION & SYSTEM ARCHIVE
**Institution Name:** Excellence British Schools  
**Elementary Wing:** Excellence Elementary School (Nursery & Primary)  
**College Wing:** Excellence College (Secondary & Sixth Form)  
**Motto:** *Spectemur Agendo* ("Let Us Be Judged By Our Acts")  
**Colors:** Royal Navy Blue (`#0b1c36`), Imperial Crimson (`#800020`), Rich British Gold (`#c5a059`), Pure White (`#ffffff`)  
**Server Architecture:** Express.js + SQLite (`better-sqlite3`) + Vanilla HTML5/CSS3/JavaScript  
**Operational Port:** `http://localhost:4000`

---

## 1. System Summary & Operational State

The complete institutional platform for **Excellence British Schools** is active, tested, and operational.
All old placeholder and stock photos have been removed and replaced with authentic high-resolution school photography from the user's desktop folders:
1. `@"C:\Users\DABELTECH\Desktop\Elementary School Pictures"`
2. `@"C:\Users\DABELTECH\Desktop\College Pictures"`

The default frontend features a dual **Auto Motion Pictures** experience:
1. **Hero Cinematic Auto Motion Carousel:** Auto-playing Ken-Burns panning and zooming motion reel through 8 collegiate scenes, with real-time HUD timer bar, live motion indicator badge, slide counter, and interactive pause/play/navigation controls.
2. **Excellence Cinema Theater & Filmstrip Showcase:** Dedicated 16:9 widescreen cinema theater featuring all 12 authentic school scenes with dynamic audio equalizer bars, category filters (All Highlights, Excellence College, Excellence Elementary), playback pace selector (Fast 3.5s, Normal 5s, Slow 8s), Westminster collegiate chime audio synthesizer, fullscreen cinema lightbox, and clickable filmstrip thumbnail reel.

---

## 2. Institutional Branding & Dual-Wing Structure

- **Excellence Elementary School (Nursery & Primary Wing):**
  - **Cohorts:** Creche, Nursery 1-2, Basic 1-6 (Ages 18 months – 11 years).
  - **Curriculum:** British Early Years Foundation Stage (EYFS), Key Stage 1 & 2 British National Curriculum, Jolly Phonics, Singapore Maths, Junior STEM.
  - **Portal Route:** `/primary`
  - **Result Checker Wing Filter:** `primary`

- **Excellence College (Secondary & Sixth Form Wing):**
  - **Cohorts:** JSS 1-3, SSS 1-3, British Sixth Form A-Levels (Ages 11 – 18 years).
  - **Curriculum:** Key Stage 3, Cambridge IGCSE, WAEC/NECO Senior School Certificate, and Cambridge Advanced Level (A-Level) pathways for world-leading universities.
  - **Portal Route:** `/secondary`
  - **Result Checker Wing Filter:** `secondary`

---

## 3. Web Pages & Portals

| Route | Source File | Description |
| :--- | :--- | :--- |
| `GET /` | `public/index.html` | UK standard front page with Hero Auto Motion Pictures, Dual-Wing Selection, Headmaster Address, Excellence Cinema Theater, House System, and Portal Gateway. |
| `GET /primary` | `public/primary.html` | **Excellence Elementary School** (Nursery & Primary) — EYFS, KS1-KS2, Jolly Phonics, elementary result checker, and interactive quizzes. |
| `GET /secondary` | `public/secondary.html` | **Excellence College** (Secondary & Sixth Form) — Cambridge IGCSE, British A-Levels, WAEC, college result checker, and timed CBT simulator. |
| `GET /result-checker` | `public/result-checker.html` | Dual-wing terminal result checker with 1-click test credentials for pupils and scholars. |
| `GET /cbt` | `public/cbt.html` | Computer-Based Testing assessment simulator with timer, multiple subjects, and instant certificate generation. |
| `GET /payment-receipt` | `public/payment-receipt.html` | School fee receipt drag-and-drop upload and bursary clearance tracker. |
| `GET /newsletter` | `public/newsletter.html` | Academic newsletters and termly PDF publication downloads. |
| `GET /events` | `public/events.html` | School events calendar and digital RSVP invitation generator. |
| `GET /admin` | `public/admin.html` | Administrative dashboard and bursary reconciliation portal. |

---

## 4. Auto Motion Pictures & Photography Library

All photos are organized within `public/assets/images/`:

### A. Excellence Elementary School (`public/assets/images/elementary/`):
- `elementary_assembly.jpg` (from `Pry School image 10.jpg`): Full outdoor morning parade & flag assembly on school grounds.
- `elementary_classroom.jpg` (from `Pry School image 1.jpg`): Engaging classroom learning session with interactive board and teacher.
- `elementary_ict.jpg` (from `Pry School image 2.jpg`): Modern elementary ICT laboratory with desktop workstations and headphones.
- `elementary_library.jpg` (from `Pry School image 3.jpg`): Elementary storytime reading corner ("Reading is Fun") with teacher and pupils.
- `elementary_exam.jpg` (from `School image 9.jpg`): Spacious examination hall with pupils seated at spaced test desks.

### B. Excellence College (`public/assets/images/college/`):
- `college_assembly.jpg` (from `School image 4.jpg`): Grand collegiate quadrangle assembly & leadership address.
- `college_classroom.jpg` (from `School image 2.jpg`): Senior secondary collegiate classroom lecture with interactive smartboard.
- `college_ict.jpg` (from `School image 3.jpg`): Computer science, programming & coding laboratory with wall monitors.
- `college_sci_lab.jpg` (from `School image 1.jpg`): Senior Chemistry & Physics laboratory practical with flasks and safety goggles.
- `college_sports.jpg` (from `School image 5.jpg`): Inter-house football tournament on pristine grass pitch with spectators.
- `college_cultural.jpg` (from `School image 6.jpg`): Spectacular African Cultural Day celebrations ("Happy Cultural Day") in traditional regalia.
- `college_physics.jpg` (from `School image 7.jpg`): Physics mechanics & electric circuit laboratory.
- `college_biology.jpg` (from `School image 8.jpg`): Biology & life sciences laboratory with microscopes and anatomical models.
- `college_maths.jpg` (from `School image 9.jpg`): Advanced Mathematics & Calculus classroom lecture.
- `college_hall.jpg` (from `School image7.jpg`): Collegiate study & examination hall.

### C. Auto Motion Engine (`public/assets/js/motion-pictures.js`):
- Multi-directional Ken-Burns CSS keyframe animations (`kbZoomIn`, `kbPanRight`, `kbZoomOut`, `kbPanLeft`).
- High-precision progress countdown loop synchronized via `requestAnimationFrame`.
- Dual controller managing both the Hero background ambient motion and the Cinema Theater showcase.

---

## 5. Seeded Test Credentials (Result Checker Integration)

### Excellence Elementary School (Nursery & Primary):
- **Pupil 1:** `NPS/2024/001` | PIN: `EXCEL001` — **David Adeleke** (Basic 4A)
- **Pupil 2:** `NPS/2024/002` | PIN: `EXCEL002` — **Fatima Bello** (Nursery 2A)
- **Pupil 3:** `NPS/2024/003` | PIN: `EXCEL003` — **Chinedu Eze** (Basic 5A)

### Excellence College (Secondary & Sixth Form):
- **Student 1:** `SEC/2024/001` | PIN: `SEC0001` — **Emeka Okafor** (SSS 1A - Science)
- **Student 2:** `SEC/2024/002` | PIN: `SEC0002` — **Amina Abubakar** (SSS 1B - Arts)
- **Student 3:** `SEC/2024/003` | PIN: `SEC0003` — **Tunde Balogun** (JSS 3A)

---

## 6. How to Run & Verify

```powershell
cd C:\Users\DABELTECH\.gemini\antigravity-ide\scratch\excellence-school-system
& "C:\Users\DABELTECH\AppData\Local\Programs\nodejs\node.exe" server.js
```
Open your browser to:
- `http://localhost:4000` (Main Landing Page with Auto Motion Pictures)
- `http://localhost:4000/primary` (Elementary Wing)
- `http://localhost:4000/secondary` (College Wing)
