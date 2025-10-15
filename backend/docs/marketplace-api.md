# Marketplace API Documentation

## Overview
The Marketplace API provides comprehensive functionality for managing products, shopping cart, orders, and AI-powered recommendations in the VeridaX sustainable marketplace.

## Base URL
```
http://localhost:5000/api/marketplace
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Product Endpoints

### Get All Products
```http
GET /products
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `minSustainabilityScore` (optional): Minimum sustainability score (0-100)
- `ecoFriendly` (optional): Filter eco-friendly products (true/false)
- `search` (optional): Search query
- `sortBy` (optional): Sort field (createdAt, pricing.basePrice, reviews.averageRating, sustainabilityScore)
- `sortOrder` (optional): Sort order (asc, desc)
- `seller` (optional): Filter by seller ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Eco-Friendly Water Bottle",
      "description": "Sustainable stainless steel water bottle",
      "category": "Home & Garden",
      "pricing": {
        "basePrice": 29.99,
        "currency": "USD",
        "discount": 10
      },
      "sustainability": {
        "ecoFriendly": true,
        "certifications": [...],
        "materials": [...]
      },
      "reviews": {
        "averageRating": 4.5,
        "totalReviews": 25
      },
      "currentPrice": 26.99,
      "sustainabilityScore": 85
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 100,
    "limit": 20
  }
}
```

### Get Product by ID
```http
GET /products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Eco-Friendly Water Bottle",
    "description": "Detailed product description...",
    "seller": {
      "_id": "seller_id",
      "name": "EcoStore",
      "email": "contact@ecostore.com"
    },
    "sustainability": {...},
    "reviews": {...},
    "specifications": {...}
  }
}
```

### Create Product
```http
POST /products
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "category": "Home & Garden",
  "pricing": {
    "basePrice": 29.99,
    "currency": "USD"
  },
  "inventory": {
    "quantity": 100
  },
  "sustainability": {
    "ecoFriendly": true,
    "materials": [
      {
        "name": "Recycled Plastic",
        "percentage": 80,
        "sustainable": true,
        "recyclable": true,
        "biodegradable": false
      }
    ]
  }
}
```

### Update Product
```http
PUT /products/:id
Authorization: Bearer <token>
```

### Delete Product
```http
DELETE /products/:id
Authorization: Bearer <token>
```

### Get Trending Products
```http
GET /products/trending
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 10, max: 50)
- `category` (optional): Filter by category

### Get Eco-Friendly Products
```http
GET /products/eco-friendly
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 20, max: 100)
- `category` (optional): Filter by category
- `minScore` (optional): Minimum sustainability score (default: 70)

### Get Search Suggestions
```http
GET /products/search-suggestions
```

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `limit` (optional): Number of suggestions (default: 5, max: 10)

### Add Product Review
```http
POST /products/:id/reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "title": "Great product!",
  "comment": "Really love this eco-friendly product.",
  "images": ["image_url_1", "image_url_2"]
}
```

### Get Product Analytics
```http
GET /products/:id/analytics
Authorization: Bearer <token>
```

## Cart Endpoints

### Get Cart
```http
GET /cart
Authorization: Bearer <token>
```

### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "notes": "Optional notes"
}
```

### Update Cart Item
```http
PUT /cart/items/:productId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove Item from Cart
```http
DELETE /cart/items/:productId
Authorization: Bearer <token>
```

### Save Item for Later
```http
POST /cart/items/:productId/save-for-later
Authorization: Bearer <token>
```

### Move Item to Cart
```http
POST /cart/items/:productId/move-to-cart
Authorization: Bearer <token>
```

### Apply Coupon
```http
POST /cart/coupons
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "SAVE10",
  "discount": 10,
  "type": "percentage"
}
```

### Remove Coupon
```http
DELETE /cart/coupons/:code
Authorization: Bearer <token>
```

### Update Shipping
```http
PUT /cart/shipping
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "method": "standard",
  "cost": 5.99,
  "estimatedDays": 3
}
```

### Get Cart Summary
```http
GET /cart/summary
Authorization: Bearer <token>
```

### Clear Cart
```http
DELETE /cart
Authorization: Bearer <token>
```

## Order Endpoints

### Create Order
```http
POST /orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "paymentMethod": "credit_card",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "notes": {
    "customer": "Please deliver after 5 PM",
    "internal": "Handle with care"
  }
}
```

### Get User Orders
```http
GET /orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status
- `sortBy` (optional): Sort field (createdAt, pricing.total, status)
- `sortOrder` (optional): Sort order (asc, desc)

### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <token>
```

### Update Order Status
```http
PUT /orders/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Order shipped via UPS"
}
```

### Cancel Order
```http
POST /orders/:id/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

### Add Order Review
```http
POST /orders/:id/reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "customer",
  "rating": 5,
  "comment": "Great service and fast delivery!"
}
```

### Request Refund
```http
POST /orders/:id/refund
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Product damaged during shipping",
  "amount": 29.99,
  "notes": "Please process refund to original payment method"
}
```

### Get Order Timeline
```http
GET /orders/:id/timeline
Authorization: Bearer <token>
```

### Get Order Analytics
```http
GET /orders/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Analytics type (sales, customer)
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

## AI Recommendations

### Get Product Recommendations
```http
GET /recommendations
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 10, max: 50)
- `category` (optional): Filter by category
- `maxPrice` (optional): Maximum price filter
- `minSustainabilityScore` (optional): Minimum sustainability score
- `includeTrending` (optional): Include trending products (default: true)
- `includePersonalized` (optional): Include personalized recommendations (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Recommended Product",
      "recommendationReason": "Matches your interests",
      "matchScore": 0.85,
      "sustainabilityScore": 90,
      "currentPrice": 39.99
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Data Models

### Product Categories
- Food & Beverages
- Clothing & Accessories
- Home & Garden
- Beauty & Personal Care
- Electronics
- Books & Media
- Sports & Outdoors
- Toys & Games
- Health & Wellness
- Office Supplies
- Automotive
- Other

### Order Statuses
- pending
- confirmed
- processing
- shipped
- delivered
- cancelled
- returned

### Payment Methods
- credit_card
- debit_card
- paypal
- stripe
- bank_transfer
- crypto
- wallet

### Shipping Methods
- standard
- express
- overnight
- pickup

## Rate Limiting
- 100 requests per minute per IP for public endpoints
- 1000 requests per minute per authenticated user
- 10 requests per minute for AI recommendations

## Webhooks
The API supports webhooks for order status updates and payment confirmations. Configure webhook URLs in your account settings.

## SDKs and Libraries
- JavaScript/TypeScript: `@veridax/marketplace-sdk`
- Python: `veridax-marketplace`
- PHP: `veridax/marketplace-php`

## Support
For API support and questions:
- Email: api-support@veridax.com
- Documentation: https://docs.veridax.com/marketplace
- Status Page: https://status.veridax.com

