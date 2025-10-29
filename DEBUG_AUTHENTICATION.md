# 🔍 Debug Authentication Issues

## Step-by-Step Debugging Process

### 1. **Start the Servers**
```bash
# Option 1: Use the batch file
start-servers.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm start
```

### 2. **Access Debug Tool**
1. Open browser to http://localhost:3000/debug
2. Click "Run All Tests" button
3. Check the results for specific error messages

### 3. **Check Browser Console**
1. Open browser dev tools (F12)
2. Go to Console tab
3. Try to login/register
4. Look for detailed error messages starting with "Frontend:"

### 4. **Check Backend Console**
Look for these messages in the backend terminal:
- "Login attempt for email: [email]"
- "Registration attempt for email: [email]"
- "Login successful for email: [email]"
- Any error messages

### 5. **Check Network Tab**
1. Open browser dev tools (F12)
2. Go to Network tab
3. Try to login/register
4. Look for failed requests (red entries)
5. Click on failed requests to see details

## Common Issues and Solutions

### Issue 1: "No response from server"
**Cause**: Frontend can't reach backend
**Solutions**:
- Check if backend is running on port 5000
- Check if frontend proxy is working
- Try accessing http://localhost:5000/api/health directly

### Issue 2: "Invalid credentials"
**Cause**: User doesn't exist or wrong password
**Solutions**:
- Try registering a new account first
- Check if user exists in database
- Verify password is correct

### Issue 3: "Server error during login"
**Cause**: Backend error (check backend console)
**Solutions**:
- Check MongoDB is running
- Check JWT_SECRET is set
- Check database connection

### Issue 4: CORS errors
**Cause**: Cross-origin request blocked
**Solutions**:
- Check CORS configuration in backend
- Verify frontend URL is correct
- Check if proxy is working

### Issue 5: "Invalid response from server"
**Cause**: Backend returns unexpected response format
**Solutions**:
- Check backend logs for errors
- Verify response format matches expected structure
- Check if token is being generated

## Debug Commands

### Test Backend Directly
```bash
# Health check
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Frontend Proxy
```bash
# Test through frontend proxy
curl http://localhost:3000/api/health
```

## Environment Variables Check

Make sure these are set in `backend/.env`:
```
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/grocery_inventory
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
```

## Still Having Issues?

1. **Clear everything and restart**:
   - Stop all servers
   - Clear browser cache and localStorage
   - Restart MongoDB
   - Restart both servers

2. **Check the debug tool results**:
   - Go to http://localhost:3000/debug
   - Run all tests
   - Share the results

3. **Check console logs**:
   - Both frontend and backend console
   - Browser dev tools console
   - Network tab for failed requests

The debug tool will help identify exactly where the authentication is failing!
