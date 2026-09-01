# 🇮🇳 YUVA-RAKT AI
### National Youth Blood Intelligence & Emergency Response Network
**Tagline:** *"Predict the Need. Mobilize the Youth. Save Lives."*

*Developed for Government Hackathon in India*

---

## 📌 Project Overview & Problem Statement
Blood availability in India suffers from fragmented coordination between voluntary donors, authorized blood banks, and critical care hospitals. Traditional blood management is reactive—leading to acute localized shortages, emergency distress calls, and lack of youth donor engagement.

**YUVA-RAKT AI** provides a unified, secure national digital foundation connecting:
1. **Youth Voluntary Donors** across all Indian States & Districts
2. **Authorized Healthcare Hospitals**
3. **Licensed Blood Banks & Transfusion Centres**
4. **Public Health & Government Officials**
5. **National Super Administrators**

---

## 🛠️ Technology Stack
- **Framework:** Next.js 16 (App Router, Turbopack) & React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS v4 & Lucide Icons
- **Database & ORM:** PostgreSQL & Prisma ORM 6.19
- **Authentication & Security:** Bcrypt Password Hashing, Jose JWT Session Management (HTTP-only cookies), Zod Schema Validation
- **I18n (Multilingual):** English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు)
- **Geographic Data:** Indian States & Districts registry

---

## 🚀 Phase 1 Features Implemented
- ✅ **Database & Prisma Schema:** Real PostgreSQL schema supporting all 5 user roles, clinical blood groups, verification states, consent management, and immutable audit logs.
- ✅ **Dynamic Role-Based Registration:** Dedicated registration flows for Youth Donors, Hospitals, and Blood Banks with India state/district selector and mandatory consent declarations. (Privileged roles restricted).
- ✅ **Secure Authentication & RBAC Middleware:** Email/password login with bcrypt verification, JWT session tokens stored in secure HTTP-only cookies, and server-side route protection across `/youth/*`, `/hospital/*`, `/blood-bank/*`, `/government/*`, `/admin/*`.
- ✅ **Role Dashboards:**
  - **Youth Donor Dashboard (`/youth/dashboard`):** Real donor status, blood group with clinical disclaimer, verification stamp, availability status, and profile overview.
  - **Hospital Dashboard (`/hospital/dashboard`):** Organization credentials, NABH registration number, verification state, and Phase 2 workflow preview.
  - **Blood Bank Dashboard (`/blood-bank/dashboard`):** State drug control license, nodal officer details, and Phase 2 inventory roadmap.
  - **Government Dashboard (`/government/dashboard`):** Public health authority jurisdiction and national intelligence overview.
  - **Super Admin Dashboard (`/admin/dashboard`):** Real live database counts for all users and live platform audit feed.
- ✅ **Youth Profile Management (`/youth/profile`):** Edit personal info, location, preferred language, donor availability status, and notification preferences.
- ✅ **Privacy & Consent Management (`/settings/privacy`):** Transparent toggle for emergency alerts, location sharing, research consent, and historical audit ledger.
- ✅ **Super Admin Controls:**
  - User Registry (`/admin/users`) with search, filter, and account suspension/reactivation.
  - Organization Verification (`/admin/organizations`) to verify or reject hospital and blood bank licenses.
  - Security Audit Trail (`/admin/audit-logs`) with search and filter by actor, action, and entity.
- ✅ **Medical Principle:** Embedded clinical disclaimer: *"Final blood-donation eligibility is determined by authorized medical and blood-bank personnel."*

---

## 🔑 Demo / Seed Accounts
All accounts use the development password: **`YuvaRakt@2026`**

| Role | Email | Password | Scope / Jurisdiction |
| :--- | :--- | :--- | :--- |
| **Youth Donor** | `donor@yuvarakt.demo` | `YuvaRakt@2026` | Pune, Maharashtra (O+ Verified) |
| **Hospital** | `hospital@yuvarakt.demo` | `YuvaRakt@2026` | AIIMS New Delhi (DL-HOSP-AIIMS-001) |
| **Blood Bank** | `bloodbank@yuvarakt.demo` | `YuvaRakt@2026` | Red Cross Pune (MH-PUN-RC-2024-88) |
| **Govt Official** | `government@yuvarakt.demo` | `YuvaRakt@2026` | Public Health Authority, Maharashtra |
| **Super Admin** | `admin@yuvarakt.demo` | `YuvaRakt@2026` | National Platform Control |

---

## ⚡ Quick Start & Run Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure PostgreSQL in .env
# DATABASE_URL="postgresql://username:password@localhost:5432/yuva_rakt_ai?schema=public"

# 3. Synchronize database schema with PostgreSQL
npm run prisma:push

# 4. Populate demo accounts and synthetic donor pool
npm run prisma:seed

# 5. Run Phase 1 automated test suite
npx tsx scripts/test-phase1.ts

# 6. Start the local development server
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 🧭 Complete Phase Roadmap
- **Phase 1 (Completed):** Authentication, PostgreSQL Database, Role-Based Access Control, Profiles, Consent & Audit Foundation.
- **Phase 2 (Next):** Donor Verification Workflow, Blood Units & Component Inventory, Hospital Blood Requisitions, Blood Bank Dispatch Coordination.
- **Phase 3:** AI Demand Prediction, Shortage Forecasting & Proactive Donor Matching.
- **Phase 4:** National Public Health Dashboard, District Shortage Heatmap, Rare Blood Group Intelligence.
- **Phase 5:** Critical Emergency Response Mode, End-to-End Mobile Notifications & Final Polish.
