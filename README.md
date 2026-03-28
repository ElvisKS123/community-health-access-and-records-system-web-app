# Community Health Access & Records System (CHARS)

CHARS is a full‑stack web app for community health centers to replace paper files with secure, searchable digital patient records. It centralizes registration, triage, doctor assignment, clinical records, labs, medications, allergies, immunizations, files, and audit logs so care teams can work faster with a shared source of truth.

## Mission (from the codebase)
Give community clinics a unified, secure platform that:
- Digitizes patient intake and lifelong medical records
- Streamlines clinical workflows (triage, doctor assignment, labs, prescriptions)
- Improves accountability with role-based access and audit logs
- Enables clinics to manage care across staff and patients in one system

## Tech Stack
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + role-based permissions

## Prerequisites
- Node.js 18+ (recommended)
- npm 9+ (comes with Node)
- PostgreSQL 14+

## Setup (Every Step)

### 1) Install dependencies
From the repo root:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

### 2) Configure environment variables

#### Backend
Create `backend/.env` from the example and edit values as needed:

```powershell
cd ..\backend
Copy-Item .env.example .env
```

Required variables:
- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `PORT`
- `JWT_SECRET`

Optional (seed first admin on first run):
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Note: set `DB_PORT` to whatever your Postgres is running on (default is `5432`).

#### Frontend
Create `frontend/.env` from the example:

```powershell
cd ..\frontend
Copy-Item .env.example .env
```

Required variable:
- `VITE_API_BASE_URL` (must match backend URL)

### 3) Create the PostgreSQL database
Make sure PostgreSQL is running, then create the database and (optionally) a user.

Example using `psql`:

```sql
CREATE DATABASE chars;
-- Optional: create a dedicated user
-- CREATE USER chars_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE chars TO chars_user;
```

Match these values to your `backend/.env`.

### 4) Start the backend (API)
The backend will auto-create tables on startup.

```powershell
cd ..\backend
npm run dev
```

By default the API runs on `http://localhost:5001`.

### 5) Start the frontend (Web app)

```powershell
cd ..\frontend
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 6) First-time usage
- Visit `http://localhost:3000`
- Register a health center via the “Register Health Center” button
- Use the created admin account to log in and add staff (doctors/receptionists)

## Key Features (from the API + UI)
- Clinic registration and multi‑tenant data separation
- Role-based access: admin, doctor, receptionist
- Patient registration and searchable directory
- Triage queue and doctor assignment
- Medical records, labs, medications, allergies, immunizations, problem list
- Secure file uploads per patient
- Audit logs for key actions
- Reports summary for clinic metrics

## Folder Structure
- `backend/` Express API + PostgreSQL schema + uploads
- `frontend/` React UI

## Troubleshooting
- If you see database connection errors, re-check `backend/.env` and ensure Postgres is running.
- If the frontend can’t reach the API, confirm `frontend/.env` has the correct `VITE_API_BASE_URL`.
