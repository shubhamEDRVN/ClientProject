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
      .gitkeep              # Placeholder for future module
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
