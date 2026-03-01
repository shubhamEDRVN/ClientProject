# ClientProject — Backend API

Multi-Tenant SaaS Business Management System for Service/Trade Companies (HVAC, Plumbing, Electrical Contractors)

---

## Project Overview

This is the backend for a financial decision platform designed for service and trade companies. Module 1 covers Authentication and Company Management.

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
