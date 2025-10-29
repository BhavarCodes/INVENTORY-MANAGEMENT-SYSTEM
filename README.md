# Grocery Inventory Management System

A comprehensive inventory management system for grocery stores with real-time notifications, automatic stock renewal, and vendor communication.

## Features

### 🛒 Inventory Management
- Add, edit, delete products with detailed information
- Track stock levels, pricing, and supplier details
- Categorize products (fruits, vegetables, dairy, etc.)
- Barcode support for easy product identification
- Real-time stock status monitoring

### 📊 Dashboard & Analytics
- Overview of total products, low stock items, and inventory value
- Category-wise analytics and reporting
- Visual charts and statistics
- Quick access to critical information

### 📦 Order Management
- Create manual orders for restocking
- Automatic order generation for low stock items
- Track order status (pending, confirmed, processing, shipped, delivered)
- Order history and management

### 🔔 Smart Notifications
- Low stock alerts via email and in-app notifications
- Out of stock warnings
- Order status updates
- Real-time notification system

### 🤖 Automation
- Automatic stock renewal when items reach minimum levels
- Scheduled daily stock checks
- Vendor notification system for new orders
- Email alerts for critical stock levels

### 👤 User Management
- Secure user registration and authentication
- Profile management
- Role-based access control

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Nodemailer** - Email notifications
- **Cron** - Scheduled tasks
- **Socket.io** - Real-time communication

### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Styled Components** - CSS-in-JS

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd grocery-inventory-management
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/grocery_inventory
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email configuration (using Gmail as example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Vendor email for notifications
VENDOR_EMAIL=vendor@example.com

# Low stock threshold
LOW_STOCK_THRESHOLD=10
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB service
mongod
```

### 5. Start the Application

#### Option 1: Start both frontend and backend together
```bash
# From the root directory
npm run dev
```

#### Option 2: Start them separately

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### 6. Seed the Database
```bash
cd backend
npm run seed
```

### 7. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Owner Credentials

The system comes with a pre-configured owner account:

**Email:** `owner@gmail.com`  
**Password:** `owner123`

You can use these credentials to log in from any device without needing to create a new account.

## Usage Guide

### 1. Login
- Visit the application at http://localhost:3000
- Use the default owner credentials above, or
- Click "Sign up here" to create additional accounts

### 2. Adding Products
- Navigate to "Inventory" from the sidebar
- Click "Add Product" button
- Fill in product details:
  - Basic info (name, description, category, SKU)
  - Stock levels (current, minimum, maximum)
  - Pricing (cost price, selling price)
  - Supplier information
  - Reorder quantity
- Save the product

### 3. Managing Stock
- View all products in the inventory table
- Filter by category or stock status
- Edit product details by clicking the edit button
- Restock products using the restock button
- Delete products when no longer needed

### 4. Order Management
- Go to "Orders" section
- Create new orders manually or let the system auto-generate them
- Track order status and update as needed
- View order history and details

### 5. Monitoring Notifications
- Check the notifications panel in the header
- View low stock alerts and system notifications
- Mark notifications as read
- Delete old notifications

### 6. Dashboard Overview
- Monitor key metrics on the dashboard
- View low stock products that need attention
- Check recent orders and their status
- Access quick analytics

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Inventory
- `GET /api/inventory` - Get all products (with pagination and filters)
- `GET /api/inventory/:id` - Get single product
- `POST /api/inventory` - Create new product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product
- `POST /api/inventory/:id/restock` - Restock product
- `GET /api/inventory/low-stock` - Get low stock products
- `GET /api/inventory/analytics` - Get inventory analytics

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

## Automation Features

### Daily Stock Check
- Runs every day at 9:00 AM
- Checks all products for low stock conditions
- Sends email notifications to store owners
- Creates in-app notifications

### Automatic Stock Renewal
- Runs every day at 10:00 AM
- Automatically creates orders for low stock items
- Groups products by supplier for efficient ordering
- Sends order notifications to vendors
- Creates notifications for store owners

### Real-time Updates
- WebSocket integration for real-time notifications
- Live stock updates
- Order status changes
- New notification alerts

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the app password in your `.env` file

### Other Email Providers
Update the email configuration in `.env`:
```env
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## Customization

### Low Stock Threshold
Modify the `LOW_STOCK_THRESHOLD` in your `.env` file to change when low stock alerts are triggered.

### Notification Schedule
Update the cron job schedules in `backend/server.js`:
```javascript
// Daily stock check at 9 AM
const dailyStockCheck = new cron.CronJob('0 9 * * *', ...);

// Auto stock renewal at 10 AM
const autoStockRenewal = new cron.CronJob('0 10 * * *', ...);
```

### Email Templates
Customize email templates in `backend/services/notificationService.js`.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify database permissions

2. **Email Not Sending**
   - Verify email credentials in `.env`
   - Check SMTP settings
   - Ensure app password is correct for Gmail

3. **Frontend Not Loading**
   - Check if backend is running on port 5000
   - Verify proxy settings in `frontend/package.json`
   - Clear browser cache

4. **Authentication Issues**
   - Check JWT secret in `.env`
   - Verify token expiration settings
   - Clear localStorage and try again

### Logs
- Backend logs are displayed in the terminal
- Check browser console for frontend errors
- MongoDB logs can be found in the MongoDB log directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Future Enhancements

- Barcode scanning integration
- Mobile app development
- Advanced reporting and analytics
- Multi-store support
- Integration with POS systems
- Advanced user roles and permissions
- Inventory forecasting
- Supplier portal
- API rate limiting
- Data backup and recovery
