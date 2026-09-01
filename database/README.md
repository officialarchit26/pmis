# Database Module

This directory contains the database schema and queries.

## Planned Structure

```
database/
├── migrations/     # SQL migration files (will be created in Phase 2)
├── queries/        # Reusable SQL queries (will be created in Phase 3)
└── schema.sql      # Full database schema (will be created in Phase 2)
```

## Current Status

**Phase 1**: Only the directory structure is set up. No schema yet.

## What Will Be Added Later

- **Phase 2**: Full PostgreSQL schema with tables for:
  - Users and authentication
  - Departments and districts
  - Projects, milestones, budgets
  - AI analysis results and reports

## Note

- Database connection will be set up in Phase 2
- Supabase PostgreSQL will be used as the database provider
