# Fix: "Authentication failed. Please try again."

## Quick Fix Steps

### 1. Start the Servers
Run the batch file to start both servers:
```bash
start-servers.bat
```

Or manually start them:
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 2. Check Server Status
- Backend should show: "Server running on port 5000"
- Frontend should open in browser at http://localhost:3000

### 3. Test Authentication
1. Go to http://localhost:3000/register
2. Create a new account
3. Try logging in

## Common Issues and Solutions

### Issue 1: "Cannot connect to server"
**Solution**: Make sure MongoDB is running
```bash
# Start MongoDB (if installed locally)
mongod
```

### Issue 2: CORS errors in browser console
**Solution**: The CORS configuration has been updated to handle this

### Issue 3: JWT token errors
**Solution**: Check that JWT_SECRET is set in backend/.env

### Issue 4: Database connection errors
**Solution**: Verify MONGODB_URI in backend/.env points to correct database

## Debug Steps

### 1. Check Backend Logs
Look for these messages in the backend console:
- "Login attempt for email: [email]"
- "Login successful for email: [email]"
- "Registration attempt for email: [email]"

### 2. Check Browser Console
Open browser dev tools (F12) and look for:
- Network errors
- CORS errors
- JavaScript errors

### 3. Test API Directly
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Environment Variables Check

Make sure these are set in `backend/.env`:
```
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
MONGODB_URI=mongodb://localhost:27017/grocery_inventory
FRONTEND_URL=http://localhost:3000
```

## Still Having Issues?

1. **Clear browser cache and localStorage**
2. **Restart both servers**
3. **Check MongoDB is running**
4. **Verify all environment variables are set**
5. **Check firewall/antivirus settings**

The authentication system should now work properly with better error logging and CORS handling!
