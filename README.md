# Community Health Access & Records System (CHARS)

CHARS is a full-stack clinic management platform for community health centers. It replaces paper-based workflows with secure digital records, triage, doctor assignment, clinical history, lab tracking, medication/allergy/immunization management, patient file storage, and audit visibility.

## Live Deployment
- Frontend: Vercel
- Backend: Railway
- Production backend URL: `https://community-health-access-and-records-system-web-a-production.up.railway.app`

## What The System Supports
- Health center registration with clinic admin account creation
- Multi-tenant clinic separation using `clinic_id`
- Login with role-based access for `admin`, `doctor`, and `receptionist`
- Patient registration, editing, search, status management, and profiles
- Receptionist-led triage and doctor assignment workflows
- Return-visit doctor assignment directly from the patient profile
- Doctor-facing medical records review with search, filters, and full-record detail view
- Clinical data management: records, labs, medications, allergies, immunizations, and problem list
- Secure patient document upload and retrieval
- Audit logging for important data changes


## Tech Stack
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- File uploads: Multer

## Project Structure
- `frontend/`: React application
- `backend/`: Express API, PostgreSQL setup, file uploads, and auth

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+

### 1. Install dependencies
```powershell
cd backend
npm install
cd ..\frontend
npm install
```

### 2. Configure environment variables

Backend:
```powershell
cd ..\backend
Copy-Item .env.example .env
```

Frontend:
```powershell
cd ..\frontend
Copy-Item .env.example .env
```

### 3. Backend environment
For local development, configure:
- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `PORT`
- `JWT_SECRET`

Optional:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Notes:
- Local PostgreSQL usually runs on port `5174`
- In production on Railway, prefer `DATABASE_URL` instead of local DB variables

### 4. Frontend environment
Required:
- `VITE_API_BASE_URL`

Optional:
- `VITE_WS_URL`
- `VITE_BACKEND_URL`

For production, these should point to:
`https://community-health-access-and-records-system-web-a-production.up.railway.app`

### 5. Create the database locally
```sql
CREATE DATABASE chars;
```

### 6. Start the backend
```powershell
cd ..\backend
npm run dev
```

Default local backend:
`http://localhost:5001`

### 7. Start the frontend
```powershell
cd ..\frontend
npm run dev
```

Default local frontend:
`http://localhost:3000`

## Production Deployment Notes

### Railway backend
- Set `DATABASE_URL` from your Railway PostgreSQL service
- Set `JWT_SECRET`
- Do not use `localhost` for database configuration in Railway
- The app auto-creates and updates tables on startup

### Vercel frontend
- Set:
- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_BACKEND_URL`
- All should point to your Railway backend URL

## Role Overview

### Receptionist
- Register and manage patients
- Record triage and intake details
- Assign or reassign doctors
- Use the patient profile to assign a doctor when a patient returns for treatment

### Doctor
- View assigned patients
- Review relevant medical records
- Update assignment progress
- Access labs, clinical history, and patient profiles

### Admin
- Full clinic oversight
- User management
- Audit logs and system-level supervision

## Troubleshooting
- `ECONNREFUSED 127.0.0.1:5432` on Railway usually means `DATABASE_URL` is missing
- If the frontend cannot reach the API, check the Vercel environment variables
- If clinic registration returns `500`, check Railway logs for schema or database connection errors
- If deployment succeeds but data operations fail, confirm Railway Postgres is attached to the backend service

## Verification Commands
Frontend typecheck:
```powershell
cd frontend
cmd /c npm run lint
```

Backend syntax check:
```powershell
node --check backend\server.js
```
