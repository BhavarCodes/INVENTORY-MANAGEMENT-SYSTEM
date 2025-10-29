// MongoDB initialization script for Docker
db = db.getSiblingDB('grocery_inventory');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "stockLevel": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "read": 1 });

print('Database initialized successfully');
