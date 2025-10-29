# API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

### Inventory Management

#### Get All Products
```http
GET /api/inventory?page=1&limit=10&category=fruits&search=apple
Authorization: Bearer <token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `search`: Search by name or SKU
- `lowStock`: Filter low stock items (true/false)

#### Get Single Product
```http
GET /api/inventory/:id
Authorization: Bearer <token>
```

#### Create Product
```http
POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Red Apples",
  "description": "Fresh red apples",
  "category": "fruits",
  "sku": "APPLE001",
  "stockLevel": 50,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "costPrice": 1.50,
  "sellingPrice": 2.00,
  "supplier": "Fresh Farms",
  "supplierContact": "contact@freshfarms.com",
  "reorderQuantity": 25
}
```

#### Update Product
```http
PUT /api/inventory/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Green Apples",
  "stockLevel": 75
}
```

#### Delete Product
```http
DELETE /api/inventory/:id
Authorization: Bearer <token>
```

#### Restock Product
```http
POST /api/inventory/:id/restock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 25
}
```

#### Get Low Stock Products
```http
GET /api/inventory/low-stock
Authorization: Bearer <token>
```

#### Get Inventory Analytics
```http
GET /api/inventory/analytics
Authorization: Bearer <token>
```

### Order Management

#### Get All Orders
```http
GET /api/orders?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

Query Parameters:
- `status`: Filter by status (pending, confirmed, processing, shipped, delivered)
- `page`: Page number
- `limit`: Items per page

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 10,
      "unitPrice": 2.00
    }
  ],
  "supplier": "Fresh Farms",
  "notes": "Urgent order"
}
```

#### Update Order Status
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Cancel Order
```http
DELETE /api/orders/:id
Authorization: Bearer <token>
```

### Notifications

#### Get User Notifications
```http
GET /api/notifications?page=1&limit=10&unreadOnly=true
Authorization: Bearer <token>
```

Query Parameters:
- `page`: Page number
- `limit`: Items per page
- `unreadOnly`: Filter unread notifications (true/false)

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Health Check

#### Server Status
```http
GET /api/health
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});

// Listen for stock updates
socket.on('stockUpdate', (product) => {
  console.log('Stock updated:', product);
});
```

### Server Events
- `notification` - New notification created
- `stockUpdate` - Product stock level updated
- `orderUpdate` - Order status changed
