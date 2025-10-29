# Authentication Troubleshooting Guide

## Common Authentication Issues and Solutions

### 1. Environment Variables Not Set

**Problem**: JWT_SECRET or other environment variables are not properly configured.

**Solution**: 
- Ensure `backend/.env` file exists with all required variables
- Check that JWT_SECRET is set to a secure value
- Verify MONGODB_URI is correct

### 2. CORS Issues

**Problem**: Frontend cannot communicate with backend due to CORS restrictions.

**Solution**: 
- Backend CORS is configured to allow `http://localhost:3000`
- Ensure frontend is running on the correct port
- Check that FRONTEND_URL in .env matches your frontend URL

### 3. Token Issues

**Problem**: JWT tokens are not being properly generated or validated.

**Solution**:
- Verify JWT_SECRET is set in backend/.env
- Check that tokens are being stored in localStorage
- Ensure Authorization header is properly formatted: `Bearer <token>`

### 4. Database Connection Issues

**Problem**: MongoDB connection fails, causing authentication to fail.

**Solution**:
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env
- Verify database name and connection string

### 5. Google OAuth Issues

**Problem**: Google OAuth authentication fails.

**Solution**:
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Check that callback URL is correctly configured
- Ensure Google OAuth credentials are valid

## Testing Authentication

### Run Authentication Tests

```bash
# Test the authentication system
npm run test:auth
```

### Manual Testing Steps

1. **Start the servers**:
   ```bash
   npm run dev
   ```

2. **Test registration**:
   - Go to http://localhost:3000/register
   - Create a new account
   - Verify you're redirected to dashboard

3. **Test login**:
   - Go to http://localhost:3000/login
   - Login with your credentials
   - Verify you're redirected to dashboard

4. **Test protected routes**:
   - Try accessing http://localhost:3000/dashboard without login
   - Should redirect to login page

## Debugging Steps

### 1. Check Backend Logs

Look for errors in the backend console:
- JWT_SECRET not defined
- MongoDB connection errors
- CORS errors
- Authentication middleware errors

### 2. Check Frontend Console

Look for errors in browser console:
- Network request failures
- Token validation errors
- CORS errors
- Authentication context errors

### 3. Check Network Tab

In browser dev tools, check:
- API requests are being made to correct endpoints
- Authorization headers are present
- Response status codes
- Error messages in responses

### 4. Verify Environment Variables

```bash
# Check if .env file exists and has correct values
cat backend/.env
```

## Common Error Messages and Solutions

### "No token, authorization denied"
- User is not logged in
- Token is not being sent in request
- Check if token is stored in localStorage

### "Token is not valid"
- Token is malformed or expired
- JWT_SECRET mismatch
- User account is deactivated

### "Invalid token format"
- Authorization header is not properly formatted
- Missing "Bearer " prefix

### "Server configuration error"
- JWT_SECRET is not defined in environment variables

### "No response from server"
- Backend server is not running
- Network connectivity issues
- CORS configuration problems

## Quick Fixes

### Reset Authentication State
```javascript
// In browser console
localStorage.removeItem('token');
window.location.reload();
```

### Check Token Validity
```javascript
// In browser console
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token value:', token);
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

## Still Having Issues?

1. Check that all dependencies are installed: `npm run install-all`
2. Restart both servers
3. Clear browser cache and localStorage
4. Check MongoDB is running and accessible
5. Verify all environment variables are set correctly
6. Check firewall/antivirus settings that might block localhost connections
