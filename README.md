# Academic Connect

A full-stack appointment scheduling system for academic institutions. Students can browse teachers, view available time slots, and book appointments. Teachers manage slots and approve/reject requests. Admins get a platform-wide overview.

Built with **React + Vite + Tailwind CSS** (frontend) and **Node.js + Express + PostgreSQL** (backend). Uses **JWT authentication** with role-based access (`student`, `teacher`, `admin`).

---

## Project Structure

```
academic-connect/
├── backend/src/
│   ├── index.js             # Express server entry point (port 4000)
│   ├── db.js                # PostgreSQL connection pool
│   ├── auth.js              # Register & login routes (with photo upload)
│   ├── auth_middleware.js   # JWT verification middleware
│   ├── slots.js             # Slot CRUD & teacher listing
│   ├── appointments.js      # Book, approve, reject, complete appointments
│   ├── admin.js             # Admin stats & user listing
│   └── users.js             # Public user profile lookup
├── frontend/src/
│   ├── main.jsx             # App routing (Login, Register, Student, Teacher, Admin)
│   ├── api.js               # Axios instance with JWT interceptor
│   ├── pages/               # Role-based dashboard pages
│   └── components/          # Avatar, SlotModal
├── db/schema_postgres.sql   # Full schema, triggers, views, stored procedures & seed data
└── migrations/run_migrations.ps1  # PowerShell script to run DB migrations
```

---

## Getting Started (Windows)

### 1. Database

```powershell
# Create a PostgreSQL database & user, then run migrations:
$env:PGPASSWORD='ac_pass'
.\migrations\run_migrations.ps1 -DbUser ac_user -DbName academic_connect
```

### 2. Backend

```powershell
cd backend
# Edit .env — set DATABASE_URL, JWT_SECRET (see below)
npm install
npm run start       # or: npm run dev (with nodemon)
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev         # Opens on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (multipart form, optional photo) |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/slots` | Create slot (teacher, auth required) |
| GET | `/api/slots/teachers` | List all teachers |
| GET | `/api/slots/teacher/:id` | Get teacher's upcoming slots |
| POST | `/api/appointments/book` | Book an appointment |
| GET | `/api/appointments/student` | Student's appointments |
| GET | `/api/appointments/teacher` | Teacher's appointments |
| PATCH | `/api/appointments/:id/approve` | Approve appointment |
| PATCH | `/api/appointments/:id/reject` | Reject appointment |
| POST | `/api/appointments/:id/complete` | Complete & delete appointment + slot |
| GET | `/api/admin/stats` | Platform stats (admin, auth required) |
| GET | `/api/admin/users` | All users (admin, auth required) |
| GET | `/api/users/:user_id` | Public user profile |
| GET | `/api/health` | Health check |

---

## Database

Three core tables — `users`, `slots`, `appointments` — with auto-generated IDs via triggers (`U*`, `SL*`, `A*`). A unique index prevents double-booking. Seed data includes one admin, one teacher, and one student for testing.

---

## Dashboards

- **Student** (`/student`) — Browse teachers → view slots → book appointments → track status
- **Teacher** (`/teacher`) — Create slots → approve/reject requests → mark complete
- **Admin** (`/admin`) — View stats (teachers, students, appointments) and all users
