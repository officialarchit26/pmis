# PMIS - Project Monitoring & Intelligence System

> Government Project Monitoring Platform with Role-Based Access Control

## ⚠️ DEMO DATA

All data in `data/` folder is **SYNTHETIC / DEMO** data. Not real government data.

## Features

- **Role-Based Access Control (RBAC)** with 4 user roles:
  - **Worker** - Limited access to assigned projects
  - **Official** - Department-level monitoring
  - **Senior Official** - State-wide analytics
  - **Admin** - Full system access

- **Dashboard** - Real-time KPIs and project analytics
- **Project Management** - Track progress, budgets, milestones
- **Interactive Map** - Geographic project visualization
- **Alerts System** - Risk and delay notifications
- **Department/District Management** - Organizational oversight

## Technology Stack

| Component  | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18 + Vite + Tailwind |
| Backend    | Node.js + Express.js       |
| Database   | PostgreSQL (Supabase)       |
| Maps       | Leaflet + OpenStreetMap     |
| Charts     | Recharts                   |
| Auth       | Supabase Auth / JWT        |

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

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Worker | worker@pmis.demo | any |
| Official | official@pmis.demo | any |
| Senior Official | senior@pmis.demo | any |
| Admin | admin@pmis.demo | any |

## Project Structure

```
pmis/
├── frontend/          # React app (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── pages/      # Page components
│   │   └── services/   # API service layer
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── config/    # Database config
│   │   ├── middleware/ # Auth middleware
│   │   ├── routes/    # API routes
│   │   └── services/  # Business logic
│   └── ...
├── database/         # PostgreSQL schema
├── data/             # Seed data
└── docs/             # Documentation
```

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-secret-key
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed Supabase setup.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Dashboard
- `GET /api/dashboard/summary` - Dashboard KPIs

### Projects
- `GET /api/projects` - List projects (filtered by role)
- `GET /api/projects/:id` - Project details
- `GET /api/projects/map-data` - Map coordinates
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project

### Other
- `GET /api/departments` - List departments
- `GET /api/districts` - List districts
- `GET /api/alerts` - List alerts

## Development Phases

- [x] Phase 1: Project Setup
- [x] Phase 2: Database & Seed Data
- [x] Phase 3: Backend API with RBAC
- [x] Phase 4: Frontend Dashboard & UI
- [x] Phase 5: Map Integration
- [ ] Phase 6: AI Integration (planned)
- [ ] Phase 7: Testing & Deployment

## License

ISC