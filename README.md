# ClientProject — Backend API

Multi-Tenant SaaS Business Management System for Service/Trade Companies (HVAC, Plumbing, Electrical Contractors)

---

## Project Overview

This is the backend for a financial decision platform designed for service and trade companies. Module 1 covers Authentication and Company Management. Additional modules include Overhead Cost Management, Service Pricing Matrix, and Job Costing.

---

## Tech Stack

- **Runtime:** Node.js (≥ 18)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Joi
- **Security:** helmet, express-rate-limit, cors
- **Financial precision:** decimal.js (used in later modules)
- **Environment:** dotenv

---

## Folder Structure

```
/src
  /modules
    /auth
      auth.controller.js    # Request/response handling
      auth.service.js       # Business logic
      auth.routes.js        # Route definitions
      auth.validation.js    # Joi schemas
      user.model.js         # User Mongoose model
    /company
      company.model.js      # Company Mongoose model
    /overhead
      overhead.controller.js
      overhead.service.js
      overhead.routes.js
      overhead.validation.js
      overhead.model.js     # Annual overhead costs
    /pricing
      pricing.controller.js
      pricing.service.js
      pricing.routes.js
      pricing.validation.js
      pricing.model.js      # Service pricing matrix
    /jobCosting
      jobCosting.controller.js
      jobCosting.service.js
      jobCosting.routes.js
      jobCosting.validation.js
      jobCosting.model.js   # Job estimates with line items
    /scoreboard
      scoreboard.controller.js
      scoreboard.service.js
      scoreboard.routes.js
      scoreboard.validation.js
      scoreboard.model.js   # Linked resources & user progress tracking
  /middleware
    verifyJWT.js            # JWT authentication middleware
    roleAuthorization.js    # Role-based access control
    errorHandler.js         # Global error handling
  /config
    db.js                   # MongoDB connection
  /utils
    ApiError.js             # Custom error class
    apiResponse.js          # Consistent response helpers
    logger.js               # Logger utility
  /core
    /financialEngine
      financialEngine.model.js       # FinancialSnapshot Mongoose model
      financialEngine.service.js     # Aggregation & report logic
      financialEngine.controller.js  # Request/response handling
      financialEngine.routes.js      # Route definitions
      financialEngine.validation.js  # Joi schemas
  server.js                 # Entry point
.env.example
.gitignore
package.json
README.md
```

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repo-url>
cd ClientProject
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Run in development mode**

```bash
npm run dev
```

5. **Run in production mode**

```bash
npm start
```

---

## Environment Variables

| Variable    | Description                              | Example                               |
|-------------|------------------------------------------|---------------------------------------|
| `NODE_ENV`  | Environment (`development`/`production`) | `development`                         |
| `PORT`      | Server port                              | `5000`                                |
| `MONGO_URI` | MongoDB connection string                | `mongodb+srv://...`                   |
| `JWT_SECRET`| JWT signing secret (keep secret!)        | `your-super-secret-key`               |
| `CLIENT_URL`| Frontend origin for CORS                 | `http://localhost:5173`               |

---

## API Endpoints

### Health Check

| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | `/api/health`  | Server health check |

### Authentication

| Method | Endpoint            | Auth Required | Description                        |
|--------|---------------------|---------------|------------------------------------|
| POST   | `/api/auth/register`| No            | Register new user + company        |
| POST   | `/api/auth/login`   | No            | Login with email + password        |
| POST   | `/api/auth/logout`  | No            | Clear auth cookie                  |
| GET    | `/api/auth/me`      | Yes (JWT)     | Get current authenticated user     |

#### POST `/api/auth/register`

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "companyName": "Doe HVAC Services"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "companyId": "...",
      "companyName": "Doe HVAC Services"
    }
  }
}
```

#### POST `/api/auth/login`

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### GET `/api/auth/me`

Requires a valid `token` cookie (set automatically on login/register).

### Overhead

| Method | Endpoint            | Auth Required | Description                        |
|--------|---------------------|---------------|------------------------------------|
| POST   | `/api/overhead/save`| Yes (JWT)     | Create or update overhead data     |
| GET    | `/api/overhead/me`  | Yes (JWT)     | Get overhead data + calculations   |

### Pricing

| Method | Endpoint            | Auth Required | Description                        |
|--------|---------------------|---------------|------------------------------------|
| POST   | `/api/pricing/save` | Yes (JWT)     | Create or update pricing matrix    |
| GET    | `/api/pricing/me`   | Yes (JWT)     | Get pricing matrix + calculations  |

### Job Costing

| Method | Endpoint            | Auth Required | Description                                |
|--------|---------------------|--------------|--------------------------------------------|
| POST   | `/api/jobs`         | Yes (JWT)    | Create a new job estimate                  |
| GET    | `/api/jobs`         | Yes (JWT)    | List all jobs for the company              |
| GET    | `/api/jobs/:id`     | Yes (JWT)    | Get job details with cost calculations     |
| PUT    | `/api/jobs/:id`     | Yes (JWT)    | Update job (name, status, line items, etc) |
| DELETE | `/api/jobs/:id`     | Yes (JWT)    | Delete a job                               |

### Scoreboard (Linked Resources & Progress)

| Method | Endpoint                              | Auth Required         | Description                                  |
|--------|---------------------------------------|-----------------------|----------------------------------------------|
| POST   | `/api/scoreboard/resources`           | Yes (owner/admin)     | Add a linked resource (YouTube, PDF, course) |
| GET    | `/api/scoreboard/resources`           | Yes (JWT)             | List all resources for the company           |
| GET    | `/api/scoreboard/resources/:id`       | Yes (JWT)             | Get a specific resource                      |
| PUT    | `/api/scoreboard/resources/:id`       | Yes (owner/admin)     | Update a linked resource                     |
| DELETE | `/api/scoreboard/resources/:id`       | Yes (owner/admin)     | Delete a linked resource                     |
| GET    | `/api/scoreboard/progress`            | Yes (JWT)             | Get current user's progress on all resources |
| PUT    | `/api/scoreboard/progress/:resourceId`| Yes (JWT)             | Mark a resource as complete/incomplete       |
| GET    | `/api/scoreboard/leaderboard`         | Yes (JWT)             | Get company-wide scoreboard (all users)      |

### Financial Engine

| Method | Endpoint                       | Auth Required | Description                                      |
|--------|--------------------------------|---------------|--------------------------------------------------|
| GET    | `/api/financial/report`        | Yes (JWT)     | Generate a live financial report                 |
| POST   | `/api/financial/snapshots`     | Yes (JWT)     | Create and persist a financial snapshot          |
| GET    | `/api/financial/snapshots`     | Yes (JWT)     | List all snapshots for the company               |
| GET    | `/api/financial/snapshots/:id` | Yes (JWT)     | Get a specific financial snapshot                |
| DELETE | `/api/financial/snapshots/:id` | Yes (JWT)     | Delete a financial snapshot                      |

#### POST `/api/jobs`

**Request body:**
```json
{
  "job_name": "Smith Residence AC Install",
  "customer_name": "John Smith",
  "status": "draft",
  "line_items": [
    {
      "name": "AC Condenser Unit",
      "category": "hvac",
      "material_cost": 500,
      "material_markup_pct": 25,
      "labor_hours": 4,
      "quantity": 1
    }
  ],
  "notes": "Weekend job"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": { "...job document..." },
    "calculations": [
      {
        "name": "AC Condenser Unit",
        "material_price": 625,
        "labor_price": 300,
        "unit_price": 925,
        "line_total": 925,
        "line_cost": 500,
        "line_profit": 425,
        "margin_pct": 45.95
      }
    ],
    "totals": {
      "total_material_cost": 500,
      "total_revenue": 925,
      "total_profit": 425,
      "total_labor_hours": 4,
      "overall_margin_pct": 45.95,
      "line_item_count": 1
    },
    "hourlyRate": 75
  }
}
```

#### GET `/api/financial/report`

Returns a live financial report aggregating current overhead data and all jobs for the company. Optionally accepts `period_start` and `period_end` query parameters (ISO 8601 dates) to filter jobs by date range.

**Response (200):**
```json
{
  "success": true,
  "message": "Financial report generated successfully",
  "data": {
    "overhead_summary": {
      "total_annual_overhead": 150000,
      "billable_hourly_rate": 75,
      "revenue_target": 300000,
      "total_billable_hours": 2000
    },
    "job_summary": {
      "total_jobs": 12,
      "total_revenue": 45000,
      "total_material_cost": 18000,
      "total_labor_hours": 160,
      "total_profit": 27000,
      "overall_margin_pct": 60,
      "jobs_by_status": {
        "draft": 2,
        "sent": 3,
        "accepted": 4,
        "completed": 3,
        "cancelled": 0
      }
    }
  }
}
```

#### POST `/api/financial/snapshots`

**Request body:**
```json
{
  "snapshot_name": "Q1 2025 Review",
  "period_start": "2025-01-01",
  "period_end": "2025-03-31",
  "snapshot_type": "quarterly",
  "notes": "First quarter financial review"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Financial snapshot created successfully",
  "data": {
    "snapshot": {
      "_id": "...",
      "snapshot_name": "Q1 2025 Review",
      "period_start": "2025-01-01T00:00:00.000Z",
      "period_end": "2025-03-31T00:00:00.000Z",
      "snapshot_type": "quarterly",
      "overhead_summary": { "...aggregated overhead data..." },
      "job_summary": { "...aggregated job data..." },
      "notes": "First quarter financial review"
    }
  }
}
```

#### POST `/api/scoreboard/resources` (owner/admin only)

**Request body:**
```json
{
  "title": "HVAC Fundamentals Course",
  "description": "Complete video series on HVAC basics",
  "resource_type": "youtube",
  "url": "https://www.youtube.com/watch?v=example123",
  "category": "HVAC Training",
  "display_order": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "resource": {
      "_id": "...",
      "title": "HVAC Fundamentals Course",
      "description": "Complete video series on HVAC basics",
      "resource_type": "youtube",
      "url": "https://www.youtube.com/watch?v=example123",
      "category": "HVAC Training",
      "display_order": 1
    }
  }
}
```

#### GET `/api/scoreboard/progress`

Returns all resources with the current user's completion status.

**Response (200):**
```json
{
  "success": true,
  "message": "Progress retrieved successfully",
  "data": {
    "resources": [
      {
        "_id": "...",
        "title": "HVAC Fundamentals Course",
        "resource_type": "youtube",
        "url": "https://www.youtube.com/watch?v=example123",
        "completed": true,
        "completed_at": "2025-06-15T10:30:00.000Z"
      },
      {
        "_id": "...",
        "title": "Safety Manual PDF",
        "resource_type": "pdf",
        "url": "https://example.com/safety-manual.pdf",
        "completed": false,
        "completed_at": null
      }
    ],
    "summary": {
      "total_resources": 2,
      "completed": 1,
      "remaining": 1,
      "progress_pct": 50
    }
  }
}
```

#### PUT `/api/scoreboard/progress/:resourceId`

**Request body:**
```json
{
  "completed": true
}
```

#### GET `/api/scoreboard/leaderboard`

**Response (200):**
```json
{
  "success": true,
  "message": "Scoreboard retrieved successfully",
  "data": {
    "scoreboard": [
      {
        "userId": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "completed_count": 8,
        "total_resources": 10,
        "progress_pct": 80,
        "last_completed_at": "2025-06-20T14:00:00.000Z"
      }
    ],
    "total_resources": 10
  }
}
```

---

## Architecture Decisions

- **Layered architecture:** Controller → Service → Model
  - Controllers handle HTTP request/response only
  - Services contain business logic
  - Models handle database schemas and queries
- **Multi-tenancy:** Every record links to a `companyId` to enforce data isolation between tenants
- **JWT in httpOnly cookies:** Prevents XSS attacks from reading the token via JavaScript

---

## Security Features

- `bcrypt` with 12 salt rounds for password hashing
- JWT with 1-day expiry
- `httpOnly`, `secure`, `sameSite=strict` cookies
- `helmet` for HTTP security headers
- Rate limiting: 100 req/15min general, 20 req/15min for auth routes
- CORS restricted to configured `CLIENT_URL`
- Joi input validation on all endpoints
- No plaintext passwords in responses or logs
- Consistent error responses that don't leak internals in production
