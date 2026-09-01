# Project Pulse

> Government Project Monitoring Platform

## ⚠️ DEMO DATA

All data in `data/` folder is **SYNTHETIC / DEMO** data. Not real government data.

## Technology Stack

| Component  | Technology                  |
|------------|------------------------------|
| Frontend   | React 18 + Vite + Tailwind  |
| Backend    | Node.js + Express.js         |
| Database   | PostgreSQL (Supabase)        |
| AI Engine  | Google Gemini API (future)    |
| Data       | JSON seed files             |

## Current Phase

**Phase 1 & 2: Setup** — In Progress

## Project Structure

```
project-pulse/
├── frontend/          # React app
├── backend/         # Express API
├── database/        # PostgreSQL schema
├── data/            # Seed data
│   ├── seed/       # Database seed files
│   └── sample/     # Sample data
└── docs/           # Documentation
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm start
# Test: http://localhost:3001/api/health
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Open: http://localhost:5173
```

## Supabase Setup

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed instructions.

### Required Values

| Variable | Where to Get It |
|----------|-----------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |

## Database

Schema: `database/schema.sql`

Tables:
- departments, districts, users
- projects, milestones, budgets
- risk_assessments, reports, chat_sessions, chat_messages

## Development Phases

- [x] Phase 1: Project Setup
- [x] Phase 2: Database & Seed Data
- [ ] Phase 3: Backend API
- [ ] Phase 4: Frontend Dashboard
- [ ] Phase 5: Map Integration
- [ ] Phase 6: AI Integration
- [ ] Phase 7: Testing & Deployment
