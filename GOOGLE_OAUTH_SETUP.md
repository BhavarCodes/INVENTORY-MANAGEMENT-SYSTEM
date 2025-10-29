# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Grocery Inventory Management System.

## Prerequisites

- Google Cloud Console account
- Node.js and npm installed
- MongoDB running

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
5. Copy the Client ID and Client Secret

## Step 2: Update Environment Variables

1. Copy `backend/.env.example` to `backend/.env`
2. Add your Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:3000
```

## Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 4: Database Migration

The new multi-tenant system requires database schema updates. Run these commands to update your existing data:

```bash
# Connect to your MongoDB instance
mongo your_database_name

# Add business field to existing products
db.products.updateMany({}, { $set: { business: ObjectId("your_default_business_id") } })

# Add business field to existing orders
db.orders.updateMany({}, { $set: { business: ObjectId("your_default_business_id") } })

# Add business field to existing notifications
db.notifications.updateMany({}, { $set: { business: ObjectId("your_default_business_id") } })
```

## Step 5: Start the Application

```bash
# Start both backend and frontend
npm run dev
```

## Features Implemented

### 1. Google OAuth Authentication
- Users can sign in with their Google account
- Automatic account creation for new Google users
- Seamless integration with existing email/password authentication

### 2. Multi-Tenant Business System
- Each user can have multiple businesses
- Data isolation between businesses
- Business switcher in the header
- Automatic business creation for Google OAuth users

### 3. Business Management
- Create new businesses
- Switch between businesses
- Business-specific settings and configurations
- Role-based access (owner, admin, employee)

### 4. Data Isolation
- All products, orders, and notifications are filtered by business
- SKU uniqueness per business (not globally)
- Order numbers unique per business
- Complete data separation between businesses

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/business` - Create new business
- `PUT /api/auth/business/:id/switch` - Switch current business
- `GET /api/auth/businesses` - Get user's businesses

### Business Management
- All existing endpoints now filter by current business
- Products, orders, and notifications are business-specific

## Frontend Components

### New Components
- `AuthCallback.js` - Handles OAuth callback
- `BusinessContext.js` - Manages business state
- Updated `Login.js` - Google sign-in button
- Updated `Header.js` - Business switcher

### Updated Components
- All inventory components now work with business context
- Dashboard shows business-specific data
- Navigation includes business switching

## Security Considerations

1. **Data Isolation**: All database queries include business filtering
2. **Access Control**: Users can only access their own businesses
3. **Token Security**: JWT tokens include user and business context
4. **OAuth Security**: Google OAuth follows security best practices

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that your redirect URI in Google Console matches exactly
   - Ensure no trailing slashes or extra characters

2. **"Client ID not found" error**
   - Verify GOOGLE_CLIENT_ID in your .env file
   - Ensure the OAuth consent screen is configured

3. **Database connection issues**
   - Check MongoDB connection string
   - Ensure database indexes are created properly

4. **Business switching not working**
   - Check that user has access to the business
   - Verify business ID in the request

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=passport:*
```

## Production Deployment

1. Update redirect URIs in Google Console
2. Set production environment variables
3. Configure HTTPS for OAuth callbacks
4. Update CORS settings for production domain
5. Set up proper database indexes

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check database connectivity and permissions
