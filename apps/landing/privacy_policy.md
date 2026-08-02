# Privacy Policy – Dort Asia
**Effective Date:** July 5, 2026

## 1. Introduction
Welcome to Dort Asia. [cite_start]Our workforce and financial operations are powered by Vertex HRMS, a complete company operations platform that unifies people management, payroll, finance, equity, projects, and documents[cite: 82]. This Privacy Policy explains how Dort Asia collects, uses, stores, and protects your personal, employment, and financial data.

## 2. Information We Collect
To manage human resources, compliance, and payroll effectively, we collect the following data during onboarding and employment:
* [cite_start]**Identity Information:** Full name, Date of Birth, Nationality, and Identity Type (NRIC for Citizens & PRs, or FIN for foreign workers)[cite: 404, 405]. [cite_start]We also collect Passport numbers, Passport expiry dates, and document copies for all identity types[cite: 407, 408].
* [cite_start]**Work Details:** Job role, department, monthly gross salary in SGD, work email, work pass details, and assigned projects[cite: 412, 413, 414, 415, 416].
* [cite_start]**Financial Information:** Bank Name, Account Holder Name, Account Number, Bank Code, and Branch Code[cite: 418, 419, 420].
* [cite_start]**System Usage & Logs:** Full audit trails of system activity, tracking who made what changes and when[cite: 723].

## 3. How We Use Your Data
Dort Asia processes your data exclusively for operational, financial, and compliance purposes:
* [cite_start]**Singapore Statutory Compliance:** We use your data to automatically apply exact CPF contribution rates based on age brackets and residential status[cite: 85]. [cite_start]We also process ethnicity-based community funds (SINDA, CDAC), the Skills Development Fund (SDF), and actively track foreign worker levies[cite: 87, 88].
* [cite_start]**Payroll & Ledger Processing:** Salary processing occurs strictly inside the Payroll module, which acts as our single source of truth[cite: 96]. [cite_start]Every approved payment automatically generates a unique payment ID (e.g., PAY-DORTASIA-20260531-0001) to create an unbreakable financial audit trail[cite: 16, 357].
* [cite_start]**Project Cost Tracking:** Once payroll is generated, your salary data is automatically posted to your assigned project's expenses to maintain accurate company Profit & Loss (P&L) statements[cite: 98].

## 4. Data Security & Architecture
We enforce heavy, enterprise-grade security measures to protect your sensitive data:
* [cite_start]**Tenant Isolation:** Our backend utilizes detailed PostgreSQL Row Level Security (RLS) SQL policies, ensuring strict tenant isolation so your data is completely protected[cite: 76].
* [cite_start]**Authentication & Authorization:** System access is secured via Supabase Auth combined with OTP (email and mobile) verification[cite: 735].
* [cite_start]**Transaction Security:** Every single financial transaction mandates a PIN authorization from the user[cite: 7]. [cite_start]This relies on a "Double Verification Protocol" utilizing SHA-256 and bcrypt algorithms for financial Authorization PINs[cite: 77].
* [cite_start]**Cloud Infrastructure:** Our platform is built on Next.js 14, utilizes Supabase (PostgreSQL with Realtime WebSockets) for database and cloud document storage, and is securely deployed on Vercel[cite: 59, 735].

## 5. Data Visibility and Access Controls
Within Dort Asia, employee data visibility is heavily restricted to protect your privacy:
* [cite_start]By default, the system rule dictates that an employee cannot view their coworkers' details[cite: 124].
* [cite_start]Data visibility is strictly based on Role Permissions, the "Reports To" hierarchy, explicit project access, and Admin rights—not simply by department membership[cite: 126].
* [cite_start]Only Super Admins are allowed to modify the Admin Payroll Settings, ensuring no unauthorized personnel can alter company-wide calculations[cite: 165].

## 6. Contact Us
For any questions regarding your data, privacy rights, or to request an export of your information, please contact the Dort Asia HR Department or your Super Admin.