# Project Pulse - Government Project Monitoring Platform

## Overview
A web-based integrated government project monitoring platform that helps government administrators and officers monitor government projects across departments and districts.

## Technology Stack
- **Frontend**: React, Tailwind CSS, Recharts, Leaflet
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL via Supabase
- **AI**: Google Gemini API
- **Data**: JSON/CSV seed data

## Architecture
The system is divided into 5 major components:
1. FRONTEND - React application with UI and data visualization
2. BACKEND - Node.js/Express REST API
3. AI ENGINE - Google Gemini API integration
4. DATABASE - Supabase PostgreSQL
5. DATA & RESOURCES - JSON/CSV seed data

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account
- Google AI Studio account for Gemini API key

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env.local` in both `frontend/` and `backend/` directories
   - Fill in your Supabase and Gemini API credentials

3. **Set up Supabase**
   - Create a new project at supabase.com
   - Get your URL and anon key from the dashboard
   - Run database migrations

4. **Start the development servers**
   ```bash
   # Start backend
   npm run dev:backend

   # Start frontend
   npm run dev:frontend
   ```

5. **Open the app**
   Visit `http://localhost:5173` in your browser

## Documentation
- [Architecture Design](docs/architecture.md)
- [API Reference](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Setup Guide](docs/setup-guide.md)
- [Development Phases](docs/development-phases.md)

## Development Phases
1. Project Setup and Team Coordination (Week 1-2)
2. Database Design and Seed Data (Week 2-3)
3. Backend API Development (Week 3-6)
4. Frontend Dashboard (Week 5-8)
5. Map Integration (Week 8-9)
6. AI Integration (Week 9-12)
7. Testing and Deployment (Week 12-14)

## License
This project is for educational and prototype purposes.