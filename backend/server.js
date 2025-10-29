const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('cron');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const path = require('path');

// Load environment variables
dotenv.config();

// Import passport configuration
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const maintenanceRoutes = require('./routes/maintenance');
const salesRoutes = require('./routes/sales');

// Import services
const notificationService = require('./services/notificationService');
const stockService = require('./services/stockService');

const app = express();
const server = http.createServer(app);
const allowedSocketOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const io = socketIo(server, {
  cors: {
    origin: allowedSocketOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/sales', salesRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  
  // Don't send error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Something went wrong!' });
  } else {
    res.status(500).json({ 
      message: 'Something went wrong!', 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Schedule daily stock check
const dailyStockCheck = new cron.CronJob('0 9 * * *', async () => {
  console.log('Running daily stock check...');
  await stockService.checkLowStock();
}, null, true, 'America/New_York');

// Schedule automatic stock renewal (daily at 10 AM)
const autoStockRenewal = new cron.CronJob('0 10 * * *', async () => {
  console.log('Running automatic stock renewal...');
  await stockService.autoRenewStock();
}, null, true, 'America/New_York');

// Schedule frequent low stock check and auto-reorder (every 30 minutes)
const frequentAutoReorder = new cron.CronJob('*/30 * * * *', async () => {
  console.log('Running frequent auto-reorder check...');
  await stockService.checkAndAutoReorder();
}, null, true, 'America/New_York');

// Schedule hourly low stock check (every hour)
const hourlyStockCheck = new cron.CronJob('0 * * * *', async () => {
  console.log('Running hourly stock check...');
  await stockService.checkLowStock();
}, null, true, 'America/New_York');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
