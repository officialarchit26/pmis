# Project Pulse API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@projectpulse.gov",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@projectpulse.gov",
      "full_name": "Admin User",
      "role": "admin"
    },
    "token": "jwt-token"
  }
}
```

#### GET /auth/me
Get current user info.

---

### Projects

#### GET /projects
List all projects with optional filters.

**Query Parameters:**
- `status` - Filter by status (planning, active, on_hold, completed, cancelled)
- `department_id` - Filter by department
- `search` - Search in name/description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Highway 101 Expansion",
      "status": "active",
      "progress_percent": 65,
      "budget_total": 5000000,
      "risk_score": 45
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

#### GET /projects/:id
Get single project with milestones and budget.

#### POST /projects
Create new project.

#### PUT /projects/:id
Update project.

#### DELETE /projects/:id
Delete project.

---

### Dashboard

#### GET /dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_projects": 150,
    "active_projects": 85,
    "at_risk_projects": 18,
    "budget_total": 50000000,
    "budget_utilized": 23500000
  }
}
```

#### GET /dashboard/departments
Department-wise statistics.

#### GET /dashboard/risky
At-risk projects list.

#### GET /dashboard/budget-summary
Budget overview.

---

### AI

#### POST /ai/risk-analysis/:projectId
Generate AI risk analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "risk_score": 45,
    "risk_level": "medium",
    "ai_analysis": {
      "summary": "Project is on track...",
      "factors": ["Schedule delays", "Budget variance"],
      "recommendations": ["Monitor closely", "Reallocate budget"]
    }
  }
}
```

#### POST /ai/chat
Chat with AI assistant.

**Request:**
```json
{
  "message": "What projects are at risk?"
}
```

#### POST /ai/reports/:projectId
Generate AI report.

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found"
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |