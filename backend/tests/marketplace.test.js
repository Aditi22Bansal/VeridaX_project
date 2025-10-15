const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

describe('Marketplace API Tests', () => {
  let authToken;
  let testUser;
  let testProduct;

  beforeAll(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true
    });
    await testUser.save();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create test product
    testProduct = new Product({
      name: 'Test Eco Product',
      description: 'A sustainable test product',
      shortDescription: 'Eco-friendly test item',
      seller: testUser._id,
      category: 'Home & Garden',
      tags: ['eco-friendly', 'sustainable'],
      pricing: {
        basePrice: 29.99,
        currency: 'USD',
        discount: 10
      },
      inventory: {
        quantity: 100,
        lowStockThreshold: 10
      },
      sustainability: {
        ecoFriendly: true,
        certifications: [{
          name: 'Green Seal',
          issuer: 'Green Seal Inc.'
        }],
        materials: [{
          name: 'Recycled Plastic',
          percentage: 80,
          sustainable: true,
          recyclable: true,
          biodegradable: false
        }],
        packaging: {
          type: 'Cardboard',
          recyclable: true,
          biodegradable: true,
          minimal: true
        },
        sourcing: {
          local: true,
          fairTrade: false,
          organic: false,
          crueltyFree: true,
          vegan: true
        }
      },
      media: {
        images: [{
          url: 'https://example.com/image.jpg',
          alt: 'Test product image',
          isPrimary: true,
          order: 1
        }]
      },
      specifications: {
        dimensions: {
          length: 10,
          width: 5,
          height: 3,
          unit: 'inches'
        },
        weight: {
          value: 0.5,
          unit: 'lbs'
        },
        features: ['Eco-friendly', 'Durable', 'Lightweight']
      },
      status: 'active',
      visibility: 'public'
    });
    await testProduct.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Product Endpoints', () => {
    test('GET /api/marketplace/products - should get all products', async () => {
      const response = await request(app)
        .get('/api/marketplace/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/marketplace/products/:id - should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/marketplace/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testProduct._id.toString());
      expect(response.body.data.name).toBe('Test Eco Product');
    });

    test('GET /api/marketplace/products/trending - should get trending products', async () => {
      const response = await request(app)
        .get('/api/marketplace/products/trending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/marketplace/products/eco-friendly - should get eco-friendly products', async () => {
      const response = await request(app)
        .get('/api/marketplace/products/eco-friendly')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/marketplace/products/search-suggestions - should get search suggestions', async () => {
      const response = await request(app)
        .get('/api/marketplace/products/search-suggestions?q=eco')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/marketplace/products - should create new product', async () => {
      const productData = {
        name: 'New Test Product',
        description: 'A new test product description',
        category: 'Electronics',
        pricing: {
          basePrice: 99.99,
          currency: 'USD'
        },
        inventory: {
          quantity: 50
        },
        sustainability: {
          ecoFriendly: true
        }
      };

      const response = await request(app)
        .post('/api/marketplace/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Product');
    });

    test('PUT /api/marketplace/products/:id - should update product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        pricing: {
          basePrice: 39.99
        }
      };

      const response = await request(app)
        .put(`/api/marketplace/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Product');
    });

    test('POST /api/marketplace/products/:id/reviews - should add product review', async () => {
      const reviewData = {
        rating: 5,
        title: 'Great product!',
        comment: 'Really love this eco-friendly product.'
      };

      const response = await request(app)
        .post(`/api/marketplace/products/${testProduct._id}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/marketplace/products/:id/analytics - should get product analytics', async () => {
      const response = await request(app)
        .get(`/api/marketplace/products/${testProduct._id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.sustainability).toBeDefined();
    });
  });

  describe('Cart Endpoints', () => {
    test('GET /api/marketplace/cart - should get user cart', async () => {
      const response = await request(app)
        .get('/api/marketplace/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('POST /api/marketplace/cart/items - should add item to cart', async () => {
      const cartData = {
        productId: testProduct._id,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/marketplace/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    test('PUT /api/marketplace/cart/items/:productId - should update cart item', async () => {
      const updateData = {
        quantity: 3
      };

      const response = await request(app)
        .put(`/api/marketplace/cart/items/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('DELETE /api/marketplace/cart/items/:productId - should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/marketplace/cart/items/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /api/marketplace/cart/coupons - should apply coupon', async () => {
      const couponData = {
        code: 'SAVE10',
        discount: 10,
        type: 'percentage'
      };

      const response = await request(app)
        .post('/api/marketplace/cart/coupons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(couponData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/marketplace/cart/summary - should get cart summary', async () => {
      const response = await request(app)
        .get('/api/marketplace/cart/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('itemCount');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('Order Endpoints', () => {
    test('POST /api/marketplace/orders - should create order', async () => {
      // First add item to cart
      await request(app)
        .post('/api/marketplace/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 1
        });

      const orderData = {
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        }
      };

      const response = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/marketplace/orders - should get user orders', async () => {
      const response = await request(app)
        .get('/api/marketplace/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/marketplace/orders/:id - should get order by ID', async () => {
      // Create an order first
      await request(app)
        .post('/api/marketplace/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 1
        });

      const orderResponse = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'credit_card',
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'Test Country'
          }
        });

      const orderId = orderResponse.body.data[0]._id;

      const response = await request(app)
        .get(`/api/marketplace/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(orderId);
    });
  });

  describe('AI Recommendations', () => {
    test('GET /api/marketplace/recommendations - should get AI recommendations', async () => {
      const response = await request(app)
        .get('/api/marketplace/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/marketplace/products/invalid-id - should return 404 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/marketplace/products/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    test('POST /api/marketplace/products - should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/marketplace/products')
        .send({
          name: 'Test Product',
          description: 'Test Description',
          category: 'Electronics',
          pricing: { basePrice: 99.99 },
          inventory: { quantity: 10 }
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/marketplace/cart/items - should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .post('/api/marketplace/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

