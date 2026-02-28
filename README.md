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
/client                     # React frontend (Vite + Tailwind)
.env.example
docker-compose.yml          # Local MongoDB via Docker
verify-module1.sh           # Script to verify Module 1 endpoints
package.json
README.md
```

---

## Running Locally (Quick Start)

### Prerequisites

- **Node.js ≥ 18** — [Download](https://nodejs.org/)
- **MongoDB** — choose one option below:
  - **Option A (Recommended):** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
  - **Option B:** [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed locally
  - **Option C:** A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### Step 1 — Start MongoDB

**Option A — Docker (easiest):**

```bash
docker compose up -d
```

This starts a local MongoDB on `mongodb://localhost:27017` using the included `docker-compose.yml`.

**Option B — Local MongoDB:**

Make sure `mongod` is running. It defaults to `mongodb://localhost:27017`.

**Option C — MongoDB Atlas:**

Use your Atlas connection string (see Step 3).

### Step 2 — Install dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/clientproject
JWT_SECRET=any-secret-string-for-local-dev
CLIENT_URL=http://localhost:5173
```

> **Note:** If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### Step 4 — Start the backend

```bash
npm run dev
```

You should see:

```
[INFO] MongoDB connected: localhost
[INFO] Server running on port 5000 in development mode
```

### Step 5 — Start the frontend (separate terminal)

```bash
cd client
npm run dev
```

The frontend opens at **http://localhost:5173**. It proxies API calls to the backend on port 5000.

### Step 6 — Verify everything works

Open a **third terminal** and run:

```bash
npm run verify
```

This runs `verify-module1.sh`, which checks all Module 1 endpoints:

```
============================================
  Module 1 — Local Verification Script
============================================

── Health Check ──
✓ GET /api/health (HTTP 200)

── Register ──
✓ POST /api/auth/register (HTTP 201)

── Get Current User ──
✓ GET /api/auth/me (with cookie) (HTTP 200)

── Logout ──
✓ POST /api/auth/logout (HTTP 200)

── Get Current User (after logout, should fail) ──
✓ GET /api/auth/me (no cookie) (HTTP 401)

── Login ──
✓ POST /api/auth/login (HTTP 200)

── Get Current User (after login) ──
✓ GET /api/auth/me (after login) (HTTP 200)

── Register Duplicate Email (should fail) ──
✓ POST /api/auth/register (duplicate) (HTTP 409)

── Login with Wrong Password (should fail) ──
✓ POST /api/auth/login (wrong password) (HTTP 401)

── Register with Invalid Data (should fail) ──
✓ POST /api/auth/register (invalid data) (HTTP 400)

============================================
  Results: 10 passed, 0 failed
============================================
```

### Step 7 — Try it in the browser

1. Open **http://localhost:5173**
2. Click **Register** and create an account
3. You'll be redirected to the **Dashboard**
4. Try **Logout** and **Login** with your credentials

---

## Manual API Verification with curl

You can also test individual endpoints manually:

```bash
# Health check
curl http://localhost:5000/api/health

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"John Doe","email":"john@example.com","password":"securepassword","companyName":"Doe HVAC Services"}'

# Get current user (uses cookie from register/login)
curl http://localhost:5000/api/auth/me -b cookies.txt

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@example.com","password":"securepassword"}'

# Logout
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt -c cookies.txt
```

---

## Stopping the Project

```bash
# Stop the backend: Ctrl+C in the backend terminal
# Stop the frontend: Ctrl+C in the frontend terminal

# Stop MongoDB (if using Docker):
docker compose down

# Stop MongoDB and delete data:
docker compose down -v
```

---

## Environment Variables

| Variable    | Description                              | Example                               |
|-------------|------------------------------------------|---------------------------------------|
| `NODE_ENV`  | Environment (`development`/`production`) | `development`                         |
| `PORT`      | Server port                              | `5000`                                |
| `MONGO_URI` | MongoDB connection string                | `mongodb://localhost:27017/clientproject` |
| `JWT_SECRET`| JWT signing secret (keep secret!)        | `any-secret-string-for-local-dev`     |
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

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection error` | Make sure MongoDB is running (`docker compose up -d` or check `mongod`) |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running — start it with Docker or locally |
| `Cannot find module` errors | Run `npm install` in both root and `client/` directories |
| CORS errors in browser | Make sure `CLIENT_URL` in `.env` matches the frontend URL (`http://localhost:5173`) |
| `JWT_SECRET` errors | Make sure `JWT_SECRET` is set in your `.env` file |
| Frontend can't reach API | Make sure the backend is running on port 5000 |
