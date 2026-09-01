# Project Pulse - Data

This directory contains seed and sample data for Project Pulse.

## Structure

```
data/
├── seed/                # Data for loading into database
│   ├── departments.json
│   ├── districts.json
│   ├── projects.json
│   ├── milestones.json
│   └── budgets.json
└── sample/              # Sample data for testing without database
    └── sample.json
```

## Seed Data (`data/seed/`)

These JSON files will be loaded into the PostgreSQL database.

| File | Records | Description |
|------|---------|-------------|
| `departments.json` | 8 | Government departments |
| `districts.json` | 5 | Geographic districts with coordinates |
| `projects.json` | 10 | Sample government projects |
| `milestones.json` | 10 | Project milestones |
| `budgets.json` | 12 | Budget entries by category |

## Sample Data (`data/sample/`)

This file contains pre-aggregated data for testing the frontend and backend before the database is connected.

- `sample.json` — Dashboard summary statistics

## Data Relationships

```
departments ──► projects ──► milestones
                  │
                  ├──► budgets
                  └──► (future: risk_assessments, reports)
                  
districts ─────► projects
```

## Notes

- All IDs use simple string format (e.g., "dept-001", "proj-001") for easy reference
- Data is intentionally small and focused for development/testing
- Realistic government project scenarios are used
- Budget figures are in USD

## Future Plans

- **Phase 3**: Backend seed script to load JSON into database
- **Phase 4**: Frontend uses sample data for initial development
- **Phase 5+**: Real database integration replaces sample data
