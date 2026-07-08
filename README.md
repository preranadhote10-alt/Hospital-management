# Hospira — Hospital Queue Management

Patient portal and virtual triage queue for healthcare facilities.

## Architecture

| Layer | Path | Role |
|-------|------|------|
| **Frontend** | `fe/src/` | React SPA — calls `/api/*` REST endpoints |
| **Backend** | `be/server.ts` | Express API + MongoDB + static/Vite host |

All data is stored in **MongoDB**. The browser only talks to the Express API.

## Requirements

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) test cluster)

## Setup

```bash
npm install
cp .env.example .env.local   # set your MongoDB URI
```

### MongoDB URI examples

```bash
# Local MongoDB
MONGODB_URI="mongodb://localhost:27017/hospira"

# MongoDB Atlas (test cluster)
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/hospira?retryWrites=true&w=majority"
```

## Run

```bash
npm run dev        # API + Vite HMR at http://localhost:3000
```

### Default staff logins

| Username | Password | Hospital |
|----------|----------|----------|
| `jane` | `hospira123` | St. Jude Medical Center |
| `alice` | `hospira123` | Heritage Health |

## Production

```bash
npm run build
npm start
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/hospitals` | List hospitals |
| GET | `/api/hospitals/:id` | Get hospital |
| POST | `/api/hospitals` | Create hospital |
| GET | `/api/tickets` | List tickets (`?hospitalId=`) |
| GET | `/api/tickets/:id` | Get ticket |
| POST | `/api/tickets` | Create ticket |
| PATCH | `/api/tickets/:id` | Update status |
| POST | `/api/tickets/:id/reschedule` | Reschedule ticket |
| POST | `/api/tickets/clear` | Clear hospital queue |
| GET | `/api/stats` | Dashboard stats |
| POST | `/api/prescriptions` | Add prescription for a patient |
| GET | `/api/prescriptions` | List prescriptions (`?hospitalId=&phone=&patientId=`) |
| POST | `/api/emergency/activate` | Emergency priority by phone + password (loads history, front of queue) |
| POST | `/api/patients/login` | Patient login (phone + password) |
| POST | `/api/receptionists/login` | Staff login |
| POST | `/api/onboard` | Onboard hospital + staff |
| POST | `/api/uploads` | Upload patient documents |

Patient documents are stored on disk under `uploads/` and served at `/uploads/...`.
