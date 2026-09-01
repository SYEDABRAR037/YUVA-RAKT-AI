# 🇮🇳 YUVA-RAKT AI — Hackathon Judge & Evaluator Guide

## Phase 1: Authentication, Database & User Foundation

Welcome! This guide is designed to help hackathon judges and evaluators test all Phase 1 capabilities of **YUVA-RAKT AI** step by step.

---

## 🚀 Fast-Track Evaluation (1-Minute Quick Start)

### 1. Launch the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

### 2. Fast Demo Credentials
All demo accounts share the password: **`YuvaRakt@2026`**

On the **[/login](http://localhost:3000/login)** page, you can click the quick-fill buttons at the bottom:
- 🩸 **Youth Donor:** `donor@yuvarakt.demo`
- 🏥 **Hospital:** `hospital@yuvarakt.demo`
- 🏢 **Blood Bank:** `bloodbank@yuvarakt.demo`
- 🏛️ **Govt Official:** `government@yuvarakt.demo`
- 🛡️ **Super Administrator:** `admin@yuvarakt.demo`

---

## 🧪 Detailed Step-by-Step Testing Walkthrough

### 1. Landing Page & Multilingual Switcher
- Navigate to `/`.
- Observe the national branding: *"National Youth Blood Intelligence & Emergency Response Network"*.
- Use the language selector in the top navbar to switch between **English**, **Hindi (हिंदी)**, **Marathi (मराठी)**, and **Telugu (తెలుగు)**.
- Notice the prominent safety principle banner: *"Final blood-donation eligibility is determined by authorized medical and blood-bank personnel."*

### 2. Youth Donor Registration & Validation
- Go to `/register`.
- Select the **Youth Donor** tab.
- Test client and server validation:
  - Try submitting with mismatched passwords or weak passwords (< 8 chars).
  - Select an Indian State (e.g., Karnataka) and observe the dynamic district dropdown (Bengaluru Urban, Mysuru, etc.).
  - Select a Blood Group (e.g., B+).
  - Check the mandatory **Privacy Policy** and **Data Processing** checkboxes.
  - Submit the form.
- Upon completion, you are automatically signed in and redirected to `/youth/dashboard`.

### 3. Youth Donor Dashboard & Profile Updates
- Observe the donor dashboard showing real user details from PostgreSQL:
  - Blood Group with disclaimer: *"Self-reported — verification pending"*.
  - Verification & Availability Status.
  - District location.
- Click **Edit Profile** (`/youth/profile`):
  - Change your availability status to `NOT AVAILABLE` or update phone/location.
  - Save changes. Notice immediate persistence and audit trail generation.
- Click **Privacy Settings** (`/settings/privacy`):
  - Toggle emergency alert notifications or location sharing.
  - Inspect the **Recorded Consent Ledger** showing timestamped cryptographic consent versioning.

### 4. Role-Based Access Control (RBAC) Protection
- While logged in as a Youth Donor, try navigating directly in the address bar to:
  - `/admin/dashboard`
  - `/government/dashboard`
  - `/hospital/dashboard`
- **Result:** You will be automatically redirected to your authorized `/youth/dashboard` by the server-side RBAC middleware.

### 5. Super Admin Platform Control Center
- Click **Sign Out** in the top navbar.
- Log in as Super Admin: `admin@yuvarakt.demo` / `YuvaRakt@2026`.
- You will be redirected to `/admin/dashboard`.
- Observe:
  - **Real Database Statistics:** Real live counts for Total Users, Youth Donors, Hospitals, Blood Banks, Active Accounts, and Pending Organizations (calculated directly from PostgreSQL queries).
  - **Live Audit Trail:** Real-time stream of all user actions (registrations, logins, consent updates, profile changes).

### 6. User Management & Suspension (`/admin/users`)
- Navigate to `/admin/users`.
- Use the search bar to search for any synthetic donor (e.g. `Kolkata`, `Priya`, or `AB_NEGATIVE`).
- Filter by role (`YOUTH_DONOR`, `HOSPITAL`, `BLOOD_BANK`) or status (`ACTIVE`, `PENDING`, `SUSPENDED`).
- Click **Suspend** on any user account.
- The user is suspended in the database and an `ACCOUNT_STATUS_CHANGE` audit log is created.
- Attempting to log in with that user will immediately show an account suspension block.
- Click **Reactivate** to restore the account.

### 7. Organization License Verification (`/admin/organizations`)
- Navigate to `/admin/organizations`.
- Switch between **Hospitals** and **Blood Banks** tabs.
- Review facilities awaiting verification (e.g., `Apollo Speciality Hospital Kochi` or `Rotary Metro Blood Bank Lucknow`).
- Click **Verify & Activate** to approve the clinical facility.
- The organization status updates to `VERIFIED`, activating the account and logging an `ORGANIZATION_VERIFIED` audit event.

### 8. Immutable Security Audit Trail (`/admin/audit-logs`)
- Navigate to `/admin/audit-logs`.
- Filter by action (`REGISTER`, `LOGIN`, `LOGOUT`, `PROFILE_UPDATE`, `ACCOUNT_STATUS_CHANGE`, `ORGANIZATION_VERIFIED`, `CONSENT_UPDATED`).
- Search by actor email or entity ID.
- Verify that **NO** plaintext passwords or sensitive secrets are stored.

### 9. Automated Test Suite Execution
To verify all 30 core tests across registration, password hashing, token validation, duplicate rejection, and database constraints, run:
```bash
npx tsx scripts/test-phase1.ts
```
**Expected Output:** `30 PASSED, 0 FAILED`.

---

## 📋 Security & Compliance Highlights for Judges
1. **Password Protection:** Standard bcrypt hashing with salt rounds. Passwords hashes are filtered out of all API responses.
2. **Session Security:** Cryptographically signed JWT tokens stored in HTTP-only, SameSite=Lax secure cookies.
3. **Medical Safety:** The platform adheres strictly to the rule that AI/platform systems only match and coordinate, while clinical eligibility is verified by licensed healthcare and blood bank personnel.
4. **Data Minimization & Consent:** Individual consent records (`PRIVACY_POLICY`, `DATA_PROCESSING`, `EMERGENCY_NOTIFICATION`, `LOCATION_SHARING`) are versioned and logged.
