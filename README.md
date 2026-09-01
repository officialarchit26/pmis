# Project Pulse

> **Government Project Monitoring Platform**

## Project Purpose

A web-based integrated platform to help government administrators and officers monitor government projects across departments and districts. The platform will track project progress, budgets, milestones, and locations with AI-powered risk analysis and reports.

---

## Technology Stack

| Component  | Technology                  |
|------------|------------------------------|
| Frontend   | React 18 + Vite              |
| Backend    | Node.js + Express.js         |
| Database   | PostgreSQL (Supabase)        |
| AI Engine  | Google Gemini API            |
| Data       | JSON seed files              |

---

## Current Development Phase

**Phase 1: Project Setup** — _In Progress_

Only the basic project structure has been created. No application features are implemented yet.

### Phase Roadmap

- [x] **Phase 1** — Project Setup ← _You are here_
- [ ] **Phase 2** — Database & Seed Data
- [ ] **Phase 3** — Backend API
- [ ] **Phase 4** — Frontend Dashboard
- [ ] **Phase 5** — Map Integration
- [ ] **Phase 6** — AI Integration
- [ ] **Phase 7** — Testing & Deployment

---

## Project Structure

```
project-pulse/
├── frontend/          # React application
├── backend/           # Node.js + Express API
├── ai/                # AI engine (future Gemini integration)
├── database/          # Database schema and migrations
├── data/              # Seed and sample data
│   ├── seed/
│   └── sample/
├── docs/              # Documentation
├── .gitignore
└── README.md
```

---

## How to Start the Frontend

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open your browser
#    Frontend: http://localhost:5173
```

**Note**: Frontend will show a placeholder page until the backend is connected.

---

## How to Start the Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (optional for Phase 1)
cp .env.example .env

# 4. Start the development server
npm start

# 5. Test the health endpoint
#    Visit: http://localhost:3001/api/health
```

**Expected response from `/api/health`:**
```json
{
  "status": "ok",
  "service": "project-pulse-backend"
}
```

---

## Testing the Setup

### 1. Test the Backend

After starting the backend, run this in your terminal:

```bash
curl http://localhost:3001/api/health
```

You should see:
```json
{"status":"ok","service":"project-pulse-backend"}
```

### 2. Test the Frontend

After starting the frontend, open `http://localhost:5173` in your browser. You should see:

> **Project Pulse**
> Government Project Monitoring Platform
> Frontend is ready. Connect the backend to continue.

---

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **npm** (comes with Node.js)
- A modern web browser

---

## License

This project is for educational and prototype purposes.
