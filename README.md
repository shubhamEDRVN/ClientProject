# Multi-Tenant SaaS Business Management System — Module 1

A production-ready backend for a multi-tenant SaaS platform designed for service/trade companies (HVAC, plumbing, electrical contractors).

## Tech Stack

- **Runtime:** Node.js (≥18)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Joi
- **Security:** helmet, express-rate-limit, cors
- **Financial Precision:** decimal.js
- **Environment:** dotenv

## Folder Structure

```
/src
  /modules
    /auth
      auth.controller.js    # Request/response handling
      auth.service.js       # Business logic
      auth.routes.js        # Express routes
      auth.validation.js    # Joi validation schemas
      user.model.js         # User Mongoose schema
    /company
      company.model.js      # Company Mongoose schema
  /middleware
    verifyJWT.js            # JWT authentication middleware
    roleAuthorization.js    # Role-based access control
    errorHandler.js         # Global error handler
  /config
    db.js                   # MongoDB connection
  /utils
    ApiError.js             # Custom error class
    apiResponse.js          # Consistent response helpers
    logger.js               # Environment-aware logger
  /core
    /financialEngine
      .gitkeep              # Placeholder for future financial engine
server.js                   # Application entry point
.env.example
.gitignore
package.json
README.md
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ClientProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your values:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this
   CLIENT_URL=http://localhost:5173
   ```

4. **Run the server**
   ```bash
   # Development (with hot reload)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user and company.

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

#### POST /api/auth/login
Authenticate a user.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "companyId": "..."
    }
  }
}
```

#### POST /api/auth/logout
Log out the current user (clears cookie).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

#### GET /api/auth/me
Get the currently authenticated user's data. **Requires authentication.**

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "companyId": {
        "_id": "...",
        "name": "Doe HVAC Services"
      }
    }
  }
}
```

### Health Check

#### GET /api/health

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running"
}
```

## Architecture Decisions

- **Layered Architecture:** Controllers handle HTTP concerns only; services contain all business logic; models define schemas.
- **Multi-Tenancy:** Every record includes `companyId` enforced at the model level.
- **JWT in httpOnly Cookies:** Prevents XSS attacks on token theft.
- **Separate Auth Rate Limiter:** Stricter limits on auth routes to prevent brute-force attacks.

## Security Features

- bcrypt password hashing (12 salt rounds)
- JWT authentication (1-day expiry)
- httpOnly, secure, sameSite cookies
- Helmet for HTTP security headers
- Rate limiting (100 req/15min general; 20 req/15min for auth)
- CORS configured for specific origin
- Input validation with Joi on all endpoints
- No plaintext passwords in responses
- Consistent error responses (no stack traces in production)
- MongoDB duplicate key and validation error handling
