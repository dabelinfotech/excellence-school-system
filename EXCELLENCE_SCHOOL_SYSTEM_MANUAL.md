# Excellence British Schools Management System
**UK Standard International Academy Platform & Dual-Wing Administrative Suite**

> [!NOTE]
> **Live Portal URL:** [http://localhost:4000](http://localhost:4000)  
> **Project Directory:** `C:\Users\DABELTECH\.gemini\antigravity-ide\scratch\excellence-school-system`  
> **1-Click Windows Launcher:** Double-click [`start-school-system.bat`](file:///C:/Users/DABELTECH/.gemini/antigravity-ide/scratch/excellence-school-system/start-school-system.bat)

---

## 1. School Identity & Authentic Photography Integration

The web application blends British educational pedigree with authentic school photography provided directly by the user:

- **Official Institution:** **Excellence British Schools** (Regulated under British International School Standards).
- **School Motto:** *"Spectemur Agendo"* ("Let Us Be Judged By Our Acts").
- **Regal Crest:** British heraldic coat of arms in Royal Navy and Imperial Gold featuring the lion, griffin, torch of wisdom, and motto ribbon.
- **Authentic Photographic Assets (`public/assets/images/`):**

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

---

## 2. Separate School Wing Structure & Dedicated Portals

Parents, pupils, and visitors can independently select their wing of interest:

### 🧸 Excellence Elementary School (Nursery & Primary)
- **URL:** [http://localhost:4000/primary](http://localhost:4000/primary)
- **Age Cohort:** 18 Months – 11 Years (Creche, Nursery 1-2, Basic 1-6)
- **Curriculum:** Early Years Foundation Stage (EYFS), British Primary National Curriculum (KS1 & KS2), Jolly Phonics framework, Singapore Mathematics, and Junior STEM robotics.
- **Head of Elementary School:** Dame Eleanor Vance, M.Ed (Oxon).
- **Key Features:** Elementary Result Slip Checker, KS2 Fun Quizzes, and Nursery fee receipt upload.

### 🔬 Excellence College (Secondary & Sixth Form)
- **URL:** [http://localhost:4000/secondary](http://localhost:4000/secondary)
- **Age Cohort:** 11 – 18 Years (JSS 1-3, SSS 1-3, and British A-Levels)
- **Curriculum:** Key Stage 3, Cambridge IGCSE, WAEC/NECO dual accreditation, British A-Levels, and Russell Group / Ivy League admissions advisory.
- **Principal of Excellence College:** Dr. Alistair Sterling, Ph.D, FRSA.
- **Key Features:** College Terminal Result Checker, Cambridge IGCSE Mock CBT Exams, and Exam Fee receipts.

---

## 3. GitHub Result Portals Integration & Test Credentials

The portal integrates the data models and grading algorithms from both of your local GitHub repositories:
- `C:\Users\DABELTECH\.gemini\antigravity-ide\scratch\nursery-primary-result-school-portal`
- `C:\Users\DABELTECH\.gemini\antigravity-ide\scratch\Secondary-School-Result-Portal`

### 1-Click Demo Testing Credentials:

| Wing | Candidate Name | Admission No. | Scratch Card PIN | Class |
| :--- | :--- | :--- | :--- | :--- |
| **Elementary** | David Adeleke | `NPS/2024/001` | `EXCEL001` | Basic 4A |
| **Elementary** | Fatima Bello | `NPS/2024/002` | `EXCEL002` | Nursery 2A |
| **Elementary** | Chinedu Eze | `NPS/2024/003` | `EXCEL003` | Basic 5A |
| **College** | Emeka Okafor | `SEC/2024/001` | `SEC0001` | SSS 1A (Sciences) |
| **College** | Amina Abubakar | `SEC/2024/002` | `SEC0002` | SSS 1B (Arts) |
| **College** | Tunde Balogun | `SEC/2024/003` | `SEC0003` | JSS 3A |

---

## 4. Key Portal Features & Endpoints

1. **Main Gateway (`/`):** UK standard collegiate navigation, real-time marquee ticker, wing selection cards, photographic showcase grid, house points tracker, leadership address, and tuition fee schedule.
2. **Elementary Portal (`/primary`):** Dedicated to EYFS and KS1-KS2 pupils with Jolly Phonics highlights, quick result checker, and gamified interactive quizzes.
3. **College Portal (`/secondary`):** Dedicated to Cambridge IGCSE and WAEC scholars with advanced science lab highlights, college result checker, and timed CBT mock examinations.
4. **Result Checker (`/result-checker`):** Dual-wing terminal slip retrieval with pin management and watermarked printable PDF-ready result cards.
5. **CBT Simulator (`/cbt`):** Timed computerized examination environment with instant scoring, question navigation grid, and printable certificate of completion.
6. **Bursary Receipt Upload (`/payment-receipt`):** Drag-and-drop bank teller receipt clearance portal.
7. **Academic Newsletters (`/newsletter`):** Downloadable termly publication archive.
8. **School Events & RSVP (`/events`):** Interactive event reservation generator.
9. **Administrative Directorate Suite (`/admin`):** Dual-category administrative suite with Role-Based Access Control (RBAC):
   - **👑 Super Admin (Main Admin):** Full master authority (Username: `admin`, Password: `admin123`). Grants unrestricted management over Staff & Moderator accounts, student records, deletion rights, tuition & term settings, bursary clearance, PIN generation, and CBT banks.
   - **🛡️ Staff Moderator:** Operational clearance (Username: `moderator`, Password: `mod123`). Authorized to review and approve bursary receipts, record continuous assessment marks, enrol students, and supervise CBT tests. Protected against deleting students, managing staff accounts, or modifying core school policies.
   - **⚡ 1-Click Role Switcher:** Switch seamlessly between Super Admin and Moderator roles directly within the dashboard header to test and audit permission boundaries in real time.

---

## 5. Verification & Service Management

Start or restart the service from PowerShell:
```powershell
cd C:\Users\DABELTECH\.gemini\antigravity-ide\scratch\excellence-school-system
& "C:\Users\DABELTECH\AppData\Local\Programs\nodejs\node.exe" server.js
```
The server will bind to port 4000 and serve all static photography and dynamic API routes.
