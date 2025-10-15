# Authentication API Documentation

## Overview
The VeridaX Authentication API provides comprehensive user management, including registration, login, profile management, password reset, email verification, and skill management.

## Base URL
```
http://localhost:5000/api/auth
```

## Authentication
Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. User Registration
**POST** `/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400` - Validation error or user already exists
- `500` - Server error

### 2. User Login
**POST** `/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false,
    "lastLogin": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400` - Invalid credentials
- `403` - Account locked (too many failed attempts)

### 3. Get Current User
**GET** `/me`

Returns the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "User bio",
  "phone": "+1234567890",
  "address": "123 Main St",
  "role": "user",
  "isEmailVerified": true,
  "skills": [
    {
      "name": "JavaScript",
      "level": "intermediate",
      "category": "Technology"
    }
  ],
  "interests": ["Technology", "Environment"],
  "location": {
    "country": "USA",
    "city": "New York"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "profileVisibility": "public",
      "showEmail": false,
      "showPhone": false
    },
    "language": "en",
    "timezone": "UTC"
  },
  "stats": {
    "totalVolunteerHours": 50,
    "totalDonations": 1000,
    "projectsCompleted": 5,
    "campaignsCreated": 2,
    "rating": 4.5,
    "reviewsCount": 10
  }
}
```

### 4. Update Profile
**PUT** `/profile`

Updates the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Updated bio",
  "phone": "+1234567890",
  "address": "456 New St",
  "skills": [
    {
      "name": "React",
      "level": "advanced",
      "category": "Technology"
    }
  ],
  "interests": ["Technology", "Education"],
  "location": {
    "country": "USA",
    "city": "San Francisco"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johnupdated",
    "github": "https://github.com/johnupdated"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": false,
      "sms": false
    },
    "privacy": {
      "profileVisibility": "private",
      "showEmail": true,
      "showPhone": false
    },
    "language": "en",
    "timezone": "PST"
  }
}
```

**Response (200):**
```json
{
  "user": {
    // Updated user object
  }
}
```

### 5. Send Email Verification
**POST** `/send-email-verification`

Sends an email verification link to the user's email address.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Verification email sent",
  "token": "verification_token_here" // Only in development
}
```

### 6. Verify Email
**GET** `/verify-email/:token`

Verifies the user's email address using the verification token.

**Parameters:**
- `token` - Email verification token

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

### 7. Forgot Password
**POST** `/forgot-password`

Sends a password reset email to the user.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If email exists, password reset instructions have been sent",
  "token": "reset_token_here" // Only in development
}
```

### 8. Reset Password
**POST** `/reset-password/:token`

Resets the user's password using the reset token.

**Parameters:**
- `token` - Password reset token

**Request Body:**
```json
{
  "password": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

### 9. Change Password
**POST** `/change-password`

Changes the user's password (requires current password).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### 10. Add Skill
**POST** `/skills`

Adds a skill to the user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Python",
  "level": "intermediate",
  "category": "Technology"
}
```

**Response (200):**
```json
{
  "message": "Skill added successfully",
  "skills": [
    // Array of all user skills
  ]
}
```

### 11. Remove Skill
**DELETE** `/skills/:skillName`

Removes a skill from the user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `skillName` - Name of the skill to remove

**Response (200):**
```json
{
  "message": "Skill removed successfully",
  "skills": [
    // Array of remaining user skills
  ]
}
```

### 12. Update Statistics
**POST** `/stats`

Updates user statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "statType": "totalVolunteerHours",
  "value": 10
}
```

**Valid stat types:**
- `totalVolunteerHours`
- `totalDonations`
- `projectsCompleted`
- `campaignsCreated`
- `rating`
- `reviewsCount`

**Response (200):**
```json
{
  "message": "Stats updated successfully",
  "stats": {
    // Updated stats object
  }
}
```

### 13. Logout
**POST** `/logout`

Logs out the current user (invalidates the token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "message": "Validation error",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

### Authentication Error (401)
```json
{
  "message": "Access denied. No token provided."
}
```

### Forbidden Error (403)
```json
{
  "message": "Account is locked. Please try again in 30 minutes."
}
```

### Not Found Error (404)
```json
{
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

## Password Requirements

- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters are optional but recommended

## Account Security Features

1. **Account Lockout**: Account is locked after 5 failed login attempts for 30 minutes
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **JWT Tokens**: Secure token-based authentication with 7-day expiration
4. **Email Verification**: Optional email verification system
5. **Password Reset**: Secure password reset via email tokens
6. **Input Validation**: Comprehensive server-side validation

## Rate Limiting

- Login attempts are limited to prevent brute force attacks
- Account lockout after 5 failed attempts
- Password reset tokens expire after 1 hour
- Email verification tokens expire after 24 hours

## Testing

Run the authentication tests:
```bash
npm test -- auth.test.js
```

## Environment Variables

Required environment variables:
- `JWT_SECRET` - Secret key for JWT token signing
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)

