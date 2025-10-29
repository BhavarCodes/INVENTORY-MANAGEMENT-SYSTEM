# Email Verification Setup Guide

## Overview
The application now requires email verification when new users register. Users must verify their email address before they can log in.

## How It Works

### Registration Flow
1. User fills out registration form
2. User submits the form
3. Backend creates the user account with `isEmailVerified: false`
4. Backend generates a unique verification token
5. Backend sends a verification email with a link
6. User sees a "Check Your Email" message
7. User clicks the verification link in their email
8. Backend verifies the token and marks email as verified
9. User can now log in

### Login Flow
1. User enters email and password
2. Backend checks if email is verified
3. If not verified, login is rejected with a message to check email
4. If verified, user is logged in normally

## Email Configuration

### For Development (No Email Service)
If you don't configure email settings, the verification links will be printed in the backend console. Simply copy the link from the console and paste it into your browser.

Example console output:
```
📧 Email Verification Link (Copy this link):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
Link: http://localhost:3000/verify-email/abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### For Production (With Real Email)
Add these environment variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Grocery Inventory Management

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup
If using Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as your `EMAIL_PASSWORD`

### Other Email Providers
- **Outlook/Hotmail**: smtp-mail.outlook.com (Port 587)
- **Yahoo**: smtp.mail.yahoo.com (Port 587)
- **SendGrid**: smtp.sendgrid.net (Port 587)
- **Mailgun**: smtp.mailgun.org (Port 587)

## API Endpoints

### POST /api/auth/register
Registers a new user and sends verification email.

Response:
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "requiresVerification": true,
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "isEmailVerified": false
  }
}
```

### GET /api/auth/verify-email/:token
Verifies the user's email address.

Success Response:
```json
{
  "message": "Email verified successfully! You can now log in.",
  "success": true
}
```

### POST /api/auth/resend-verification
Resends the verification email.

Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

### POST /api/auth/login
Login requires verified email.

Error Response (if email not verified):
```json
{
  "message": "Please verify your email address before logging in. Check your email for the verification link.",
  "requiresVerification": true
}
```

## User Model Updates
New fields added to the User schema:
- `isEmailVerified` (Boolean, default: false)
- `emailVerificationToken` (String)
- `emailVerificationExpires` (Date, 24 hours from creation)

## Frontend Routes
- `/register` - Registration page
- `/verify-email/:token` - Email verification page
- `/login` - Login page (checks if email is verified)

## Features
✅ Email verification required for new accounts
✅ Verification link expires after 24 hours
✅ Resend verification email functionality
✅ Beautiful email templates with branding
✅ Console fallback for development without email config
✅ Automatic redirect to login after verification
✅ Clear error messages for expired/invalid tokens
✅ Google OAuth users bypass email verification (already verified by Google)

## Testing Without Email Service
1. Register a new account
2. Check the backend console for the verification link
3. Copy the verification link
4. Paste it in your browser
5. You'll be redirected to the verification success page
6. Click "Go to Login" or wait for automatic redirect
7. Log in with your credentials

## Security Notes
- Verification tokens are 32-byte random hex strings
- Tokens expire after 24 hours
- Each token can only be used once
- Login is blocked until email is verified
- Password is hashed before storage
- Verification status is checked on every login attempt
