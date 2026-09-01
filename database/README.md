# Project Pulse - Database

This directory contains the database schema and seed data for Project Pulse.

## Contents

```
database/
├── schema.sql           # Full PostgreSQL schema (10 tables, indexes, RLS)
├── migrations/          # Placeholder for future migration files
├── queries/             # Reusable SQL queries
└── README.md            # This file
```

## Database Schema

The database has **10 tables**:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (admin, department_officer, district_officer, viewer) |
| `departments` | Government departments (Transportation, Education, etc.) |
| `districts` | Geographic districts with coordinates |
| `projects` | Government projects with status, budget, progress |
| `milestones` | Project milestones with due dates and completion status |
| `budgets` | Budget allocation by project and category |
| `risk_assessments` | AI-generated risk analysis for projects |
| `reports` | AI-generated reports for projects |
| `chat_sessions` | AI chat conversation sessions |
| `chat_messages` | Individual messages in chat sessions |

## Features

- ✅ **UUIDs** for all primary keys (globally unique, secure)
- ✅ **Foreign keys** with proper ON DELETE rules
- ✅ **CHECK constraints** for data validation
- ✅ **Indexes** on frequently queried columns
- ✅ **Triggers** to auto-update `updated_at` timestamps
- ✅ **Row Level Security (RLS)** for multi-tenant access control

## Setup Instructions

### Option 1: Supabase (Recommended for beginners)

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Go to **SQL Editor** in the Supabase dashboard
4. Copy the contents of `schema.sql` and paste into the editor
5. Click **Run** to execute the schema

### Option 2: Local PostgreSQL

```bash
# Connect to your local PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE project_pulse;

# Connect to the new database
\c project_pulse

# Run the schema
\i /path/to/project-pulse/database/schema.sql
```

## Seed Data

Seed data is located in `../data/seed/`:

- `departments.json` — 8 government departments
- `districts.json` — 5 districts with coordinates
- `projects.json` — 10 sample projects
- `milestones.json` — 10 milestones
- `budgets.json` — 12 budget entries

### Loading Seed Data

Seed data is in JSON format for easy editing. It can be loaded:

1. **Via backend script** (Phase 3 will include seed script)
2. **Manually via SQL** — Convert JSON to INSERT statements
3. **Via Supabase Table Editor** — Import CSV format

## Relationships

```
users ──────► departments ──► projects ──┬──► milestones
                    │                    ├──► budgets
                    │                    ├──► risk_assessments
                    │                    ├──► reports
                    │                    └──► districts
                                            │
                                            ▼
                                       chat_sessions
                                            │
                                            ▼
                                       chat_messages
```

## Row Level Security

The schema includes RLS policies for:

- **users**: Admins can manage all users
- **projects**: All can view, admins/department officers can modify
- **milestones**: All can view, admins/department officers can modify
- **budgets**: All can view, admins/department officers can modify
- **risk_assessments**: All can view, admins/department officers can create
- **reports**: All can view, admins/department officers can create
- **chat_sessions/messages**: Users can only see their own conversations
