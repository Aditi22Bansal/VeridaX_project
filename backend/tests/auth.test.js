const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication System', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/veridax_test');
    }
  });

  afterAll(async () => {
    // Clean up test database
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Validation error');
    });

    it('should not register user with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Validation error');
    });

    it('should not register duplicate user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should lock account after multiple failed attempts', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword'
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(400);
      }

      // 6th attempt should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.message).toContain('Account is locked');
    });
  });

  describe('Profile Management', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create and login a user
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      });
      await user.save();
      userId = user._id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('john@example.com');
      expect(response.body.name).toBe('John Doe');
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'John Updated',
        bio: 'This is my bio',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.bio).toBe(updateData.bio);
      expect(response.body.user.phone).toBe(updateData.phone);
    });

    it('should add skill to user profile', async () => {
      const skillData = {
        name: 'JavaScript',
        level: 'intermediate',
        category: 'Technology'
      };

      const response = await request(app)
        .post('/api/auth/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData)
        .expect(200);

      expect(response.body.message).toBe('Skill added successfully');
      expect(response.body.skills).toHaveLength(1);
      expect(response.body.skills[0].name).toBe(skillData.name);
    });

    it('should remove skill from user profile', async () => {
      // First add a skill
      const skillData = {
        name: 'JavaScript',
        level: 'intermediate',
        category: 'Technology'
      };

      await request(app)
        .post('/api/auth/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData);

      // Then remove it
      const response = await request(app)
        .delete('/api/auth/skills/JavaScript')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Skill removed successfully');
      expect(response.body.skills).toHaveLength(0);
    });
  });

  describe('Password Management', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login a user
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'Password123',
        newPassword: 'NewPassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should not change password with invalid current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should send forgot password email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200);

      expect(response.body.message).toContain('password reset instructions');
    });

    it('should reset password with valid token', async () => {
      // First get a reset token
      const user = await User.findOne({ email: 'john@example.com' });
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'NewPassword123' })
        .expect(200);

      expect(response.body.message).toBe('Password reset successfully');
    });
  });

  describe('Email Verification', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login a user
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should send email verification', async () => {
      const response = await request(app)
        .post('/api/auth/send-email-verification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Verification email sent');
    });

    it('should verify email with valid token', async () => {
      // First get a verification token
      const user = await User.findOne({ email: 'john@example.com' });
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
    });
  });

  describe('Statistics Management', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login a user
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should update user statistics', async () => {
      const statsData = {
        statType: 'totalVolunteerHours',
        value: 10
      };

      const response = await request(app)
        .post('/api/auth/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(statsData)
        .expect(200);

      expect(response.body.message).toBe('Stats updated successfully');
      expect(response.body.stats.totalVolunteerHours).toBe(10);
    });

    it('should not update invalid stat type', async () => {
      const statsData = {
        statType: 'invalidStat',
        value: 10
      };

      const response = await request(app)
        .post('/api/auth/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(statsData)
        .expect(400);

      expect(response.body.message).toContain('Invalid stat type');
    });
  });
});

