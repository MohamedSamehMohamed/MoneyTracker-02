# API Contract: Authentication

**Base URL**: `/api/auth`

## POST /register

Create a new user account.

**Request Body**:
```json
{
  "name": "string (1-100 chars, required)",
  "email": "string (valid email, max 255 chars, required)",
  "password": "string (min 8 chars, required)"
}
```

**Success Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "baseCurrency": "EGP",
    "createdAt": "ISO 8601 datetime"
  },
  "token": "jwt-string"
}
```

**Error Responses**:
- 400 Bad Request: Validation errors (missing fields, invalid email, short password)
  ```json
  { "error": "Validation failed", "details": [{ "field": "email", "message": "Invalid email format" }] }
  ```
- 409 Conflict: Email already registered
  ```json
  { "error": "Email already in use" }
  ```

## POST /login

Authenticate an existing user.

**Request Body**:
```json
{
  "email": "string (valid email, required)",
  "password": "string (required)"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "baseCurrency": "EGP",
    "createdAt": "ISO 8601 datetime"
  },
  "token": "jwt-string"
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
  ```json
  { "error": "Validation failed", "details": [{ "field": "email", "message": "Email is required" }] }
  ```
- 401 Unauthorized: Invalid credentials
  ```json
  { "error": "Invalid email or password" }
  ```

## GET /me

Get the authenticated user's profile.

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "baseCurrency": "EGP",
    "createdAt": "ISO 8601 datetime"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid token
  ```json
  { "error": "Authentication required" }
  ```

## Common Error Format

All error responses follow:
```json
{
  "error": "string (human-readable message)",
  "details": [{ "field": "string", "message": "string" }]  // optional, for validation errors
}
```

## Authentication Header

All protected endpoints require:
```
Authorization: Bearer <jwt-token>
```

The JWT payload contains:
```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Token expiration: 7 days absolute from login.
