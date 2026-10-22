# 🏛️ Excellence British Schools Management System

> **UK Standard Dual-Wing Academic Platform & Central Administrative Directorate Hub**  
> Serving **Excellence Elementary School** (Nursery & Primary) and **Excellence College** (Junior & Senior Secondary / IGCSE / WASSCE).

---

## 🌟 System Architecture & Key Capabilities

Excellence British Schools Management System is an enterprise-grade academic portal and school governance platform designed with a modern dual-wing institutional model:

### 1. Dual-Wing Academic Portals
- **Excellence Elementary School (`/primary`):** Dedicated portal for Early Years (Crèche, Nursery 1-2) and Key Stage 1 & 2 (Basic 1-6). Features foundational literacy, numeracy showcase, British phonics, and co-curricular galleries.
- **Excellence College (`/secondary`):** Dedicated portal for Key Stage 3 & 4 (JSS1 - SSS3). Features Cambridge IGCSE, WASSCE STEM tracks, modern science laboratories, robotics, and collegiate athletics.
- **Auto-Motion Campus Showcase:** Dynamically positioned right below the school identity banner on the homepage, rotating campus photography from both school wings.

### 2. Dual-Category Role-Based Administration Engine (`/admin`)
- **Super Admin (Main Admin):** Full directorate governance, staff administrator provisioning, delete capabilities, financial reconciliation, and master school configuration.
- **Staff Moderator (Academic Registrar):** Enrolment oversight, continuous assessment score recording, CBT examination supervisor, and bulletin broadcaster without access to destructive actions.

### 3. Cryptographic Scratch Card PIN & Terminal Result Checker (`/result-checker`)
- 10-digit serialised scratch card verification with usage limits (max 5 checks per PIN).
- Generates official British/WAEC-format terminal scorecards with total scores, letter grades (A1 to F9), class positions, and principal remarks.

### 4. Interactive Computer-Based Testing (CBT) Assessment (`/cbt`)
- Real-time timed online test environment for both elementary numeracy/literacy and secondary IGCSE/WASSCE subjects.
- Automated instant grading, pass/fail thresholds, and question review.

### 5. Official Bulletin & Homepage Ticker Tape (Photo & Video Enabled)
- Live scrolling marquee ticker at the top of every public portal page.
- Direct image and video upload up to **100MB** from the Admin Directorate suite.
- Clickable ticker headlines that launch rich multimedia lightbox modals.

### 6. Terminal Subject Score Gradebook with Dual-Wing Subject Dropdown
- Intelligent curriculum dropdown preloaded with academic subjects for both Elementary and College wings.
- Interactive filter pills (`All`, `🧸 Elementary`, `🏛️ College`) and automatic student wing detection.
- Live continuous assessment (CA1, CA2, Exam) grade preview banner.

### 7. Bursary Payment Reconciliation (`/payment-receipt`)
- Public digital payment slip uploader for tuition fees, Cambridge examination registrations, and school uniforms.
- Admin bursary clearance workflow with approval/rejection audit tracking.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/dabelinfotech/excellence-school-system.git

# Navigate to project folder
cd excellence-school-system

# Install dependencies
npm install

# Start the application
npm start
```

The portal will be live at **`http://localhost:4000`**.

---

## 🔑 Default Credentials & Demo Records

### Administrative Access (`/admin`)
| Role | Username | Password | Jurisdiction |
| :--- | :--- | :--- | :--- |
| **Super Admin** (Main Admin) | `admin` | `admin123` | Full Directorate Authority (All Wings) |
| **Staff Moderator** | `moderator` | `mod123` | Academic Operations & Grading |

### Demo Student Scratch Cards (`/result-checker`)
| Student Name | Wing | Class | Admission No. | Scratch Card PIN |
| :--- | :--- | :--- | :--- | :--- |
| **David Adeleke** | Elementary | Basic 4A | `PRI/2024/001` | `PRI0001` |
| **Fatima Bello** | Elementary | Nursery 2A | `PRI/2024/002` | `PRI0002` |
| **Emeka Okafor** | College | SSS 1A | `SEC/2024/001` | `SEC0001` |
| **Amina Abubakar** | College | SSS 1B | `SEC/2024/002` | `SEC0002` |

---

## ☁️ Deployment

### Deploy to Vercel
This project includes pre-configured Vercel serverless integration (`vercel.json` and `api/index.js`):
1. Push this repository to your GitHub account.
2. In [Vercel](https://vercel.com), click **Add New Project** and select this repository.
3. Keep default settings and click **Deploy**.

---

## 📄 License & Attribution
Designed and built for **Excellence British Schools** (Elementary & College Wings).  
© 2026 Central Directorate. All rights reserved.
