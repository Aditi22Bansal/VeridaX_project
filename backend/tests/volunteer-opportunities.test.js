const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const User = require('../models/User');

describe('Volunteer Opportunities API', () => {
  let authToken;
  let userId;
  let opportunityId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/veridax_test');
    }
  });

  afterAll(async () => {
    // Clean up test database
    await VolunteerOpportunity.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await VolunteerOpportunity.deleteMany({});
    await User.deleteMany({});

    // Create a test user and get auth token
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('Create Opportunity', () => {
    it('should create a new volunteer opportunity', async () => {
      const opportunityData = {
        title: 'Community Garden Volunteer',
        description: 'Help maintain and develop our community garden',
        organization: {
          name: 'Green Community Org',
          website: 'https://greencommunity.org'
        },
        category: 'Environment',
        subcategory: 'Gardening',
        skills: [
          { name: 'Gardening', level: 'beginner', required: true },
          { name: 'Teamwork', level: 'intermediate', required: false }
        ],
        location: {
          type: 'on-site',
          city: 'New York',
          country: 'USA',
          address: '123 Garden St'
        },
        schedule: {
          startDate: '2024-02-01',
          endDate: '2024-12-31',
          duration: 'long-term',
          hoursPerWeek: { min: 5, max: 10 },
          flexible: true
        },
        maxVolunteers: 10,
        requirements: {
          age: { min: 16, max: 65 },
          experience: 'some',
          backgroundCheck: false
        },
        impact: {
          description: 'Help create a sustainable community space',
          metrics: [
            { name: 'Garden beds maintained', target: 50, current: 0, unit: 'beds' }
          ],
          beneficiaries: 'community'
        },
        tags: ['environment', 'community', 'sustainability']
      };

      const response = await request(app)
        .post('/api/volunteer-opportunities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(opportunityData)
        .expect(201);

      expect(response.body.message).toBe('Volunteer opportunity created successfully');
      expect(response.body.opportunity.title).toBe(opportunityData.title);
      expect(response.body.opportunity.organization.id).toBe(userId.toString());

      opportunityId = response.body.opportunity._id;
    });

    it('should not create opportunity with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/volunteer-opportunities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('Get Opportunities', () => {
    beforeEach(async () => {
      // Create test opportunities
      const opportunities = [
        {
          title: 'Education Volunteer',
          description: 'Teach children in underserved communities',
          organization: { name: 'Education First', id: userId },
          category: 'Education',
          skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
          location: { type: 'on-site', city: 'Boston', country: 'USA' },
          schedule: { startDate: '2024-02-01', duration: 'long-term' },
          maxVolunteers: 5,
          status: 'active',
          visibility: 'public'
        },
        {
          title: 'Tech Mentor',
          description: 'Mentor students in programming',
          organization: { name: 'Tech Academy', id: userId },
          category: 'Technology',
          skills: [{ name: 'Programming', level: 'advanced', required: true }],
          location: { type: 'remote' },
          schedule: { startDate: '2024-03-01', duration: 'short-term' },
          maxVolunteers: 3,
          status: 'active',
          visibility: 'public'
        }
      ];

      for (const opp of opportunities) {
        const opportunity = new VolunteerOpportunity(opp);
        await opportunity.save();
      }
    });

    it('should get all opportunities', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter opportunities by category', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities?category=Education')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].category).toBe('Education');
    });

    it('should filter opportunities by location', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities?location=Boston')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].location.city).toBe('Boston');
    });

    it('should filter opportunities by skills', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities?skills=Teaching')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].skills[0].name).toBe('Teaching');
    });
  });

  describe('Get Opportunity by ID', () => {
    beforeEach(async () => {
      const opportunity = new VolunteerOpportunity({
        title: 'Test Opportunity',
        description: 'Test description',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 5,
        status: 'active',
        visibility: 'public'
      });
      await opportunity.save();
      opportunityId = opportunity._id;
    });

    it('should get opportunity by ID', async () => {
      const response = await request(app)
        .get(`/api/volunteer-opportunities/${opportunityId}`)
        .expect(200);

      expect(response.body.title).toBe('Test Opportunity');
      expect(response.body.stats.views).toBe(1); // Should increment view count
    });

    it('should return 404 for non-existent opportunity', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/volunteer-opportunities/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Opportunity not found');
    });
  });

  describe('Update Opportunity', () => {
    beforeEach(async () => {
      const opportunity = new VolunteerOpportunity({
        title: 'Original Title',
        description: 'Original description',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 5,
        status: 'active',
        visibility: 'public'
      });
      await opportunity.save();
      opportunityId = opportunity._id;
    });

    it('should update opportunity', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/volunteer-opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Opportunity updated successfully');
      expect(response.body.opportunity.title).toBe('Updated Title');
    });

    it('should not update opportunity by non-owner', async () => {
      // Create another user
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123'
      });
      await otherUser.save();

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123'
        });

      const otherAuthToken = otherLoginResponse.body.token;

      const response = await request(app)
        .put(`/api/volunteer-opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this opportunity');
    });
  });

  describe('Delete Opportunity', () => {
    beforeEach(async () => {
      const opportunity = new VolunteerOpportunity({
        title: 'To Be Deleted',
        description: 'This will be deleted',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 5,
        status: 'active',
        visibility: 'public'
      });
      await opportunity.save();
      opportunityId = opportunity._id;
    });

    it('should delete opportunity', async () => {
      const response = await request(app)
        .delete(`/api/volunteer-opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Opportunity deleted successfully');

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/volunteer-opportunities/${opportunityId}`)
        .expect(404);
    });
  });

  describe('Apply to Opportunity', () => {
    beforeEach(async () => {
      const opportunity = new VolunteerOpportunity({
        title: 'Test Opportunity',
        description: 'Test description',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 5,
        status: 'active',
        visibility: 'public'
      });
      await opportunity.save();
      opportunityId = opportunity._id;
    });

    it('should apply to opportunity', async () => {
      const applicationData = {
        message: 'I am interested in this opportunity',
        availability: 'Weekends',
        experience: 'I have teaching experience',
        motivation: 'I want to help the community'
      };

      const response = await request(app)
        .post(`/api/volunteer-opportunities/${opportunityId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(200);

      expect(response.body.message).toBe('Application submitted successfully');

      // Verify application was added
      const opportunity = await VolunteerOpportunity.findById(opportunityId);
      expect(opportunity.applications).toHaveLength(1);
      expect(opportunity.applications[0].volunteer.toString()).toBe(userId.toString());
    });

    it('should not apply to full opportunity', async () => {
      // Create opportunity with max volunteers reached
      const fullOpportunity = new VolunteerOpportunity({
        title: 'Full Opportunity',
        description: 'This opportunity is full',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 1,
        currentVolunteers: 1,
        status: 'active',
        visibility: 'public'
      });
      await fullOpportunity.save();

      const response = await request(app)
        .post(`/api/volunteer-opportunities/${fullOpportunity._id}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'I want to apply' })
        .expect(400);

      expect(response.body.message).toBe('Opportunity is full');
    });
  });

  describe('Get User Applications', () => {
    beforeEach(async () => {
      const opportunity = new VolunteerOpportunity({
        title: 'Test Opportunity',
        description: 'Test description',
        organization: { name: 'Test Org', id: userId },
        category: 'Education',
        skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
        location: { type: 'on-site', city: 'Test City' },
        schedule: { startDate: '2024-02-01', duration: 'long-term' },
        maxVolunteers: 5,
        status: 'active',
        visibility: 'public',
        applications: [{
          volunteer: userId,
          status: 'pending',
          message: 'I am interested'
        }]
      });
      await opportunity.save();
    });

    it('should get user applications', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/applications/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].application.status).toBe('pending');
    });
  });

  describe('Search Opportunities', () => {
    beforeEach(async () => {
      const opportunities = [
        {
          title: 'Community Garden Volunteer',
          description: 'Help maintain community gardens',
          organization: { name: 'Green Org', id: userId },
          category: 'Environment',
          skills: [{ name: 'Gardening', level: 'beginner', required: true }],
          location: { type: 'on-site', city: 'New York', country: 'USA' },
          schedule: { startDate: '2024-02-01', duration: 'long-term' },
          maxVolunteers: 10,
          status: 'active',
          visibility: 'public',
          tags: ['gardening', 'environment']
        },
        {
          title: 'Tech Teaching Assistant',
          description: 'Assist in teaching programming to kids',
          organization: { name: 'Tech Academy', id: userId },
          category: 'Technology',
          skills: [{ name: 'Programming', level: 'intermediate', required: true }],
          location: { type: 'remote' },
          schedule: { startDate: '2024-03-01', duration: 'short-term' },
          maxVolunteers: 5,
          status: 'active',
          visibility: 'public',
          tags: ['programming', 'education']
        }
      ];

      for (const opp of opportunities) {
        const opportunity = new VolunteerOpportunity(opp);
        await opportunity.save();
      }
    });

    it('should search opportunities by query', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/search?query=garden')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].title).toContain('Garden');
    });

    it('should search opportunities by category', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/search?category=Technology')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].category).toBe('Technology');
    });

    it('should search opportunities by skills', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/search?skills=Programming')
        .expect(200);

      expect(response.body.opportunities).toHaveLength(1);
      expect(response.body.opportunities[0].skills[0].name).toBe('Programming');
    });
  });

  describe('Get Trending Skills', () => {
    beforeEach(async () => {
      const opportunities = [
        {
          title: 'Opportunity 1',
          description: 'Test 1',
          organization: { name: 'Org 1', id: userId },
          category: 'Education',
          skills: [
            { name: 'Teaching', level: 'intermediate', required: true },
            { name: 'Communication', level: 'advanced', required: false }
          ],
          location: { type: 'on-site' },
          schedule: { startDate: '2024-02-01', duration: 'long-term' },
          maxVolunteers: 5,
          status: 'active',
          visibility: 'public'
        },
        {
          title: 'Opportunity 2',
          description: 'Test 2',
          organization: { name: 'Org 2', id: userId },
          category: 'Technology',
          skills: [
            { name: 'Programming', level: 'advanced', required: true },
            { name: 'Teaching', level: 'intermediate', required: false }
          ],
          location: { type: 'remote' },
          schedule: { startDate: '2024-03-01', duration: 'short-term' },
          maxVolunteers: 3,
          status: 'active',
          visibility: 'public'
        }
      ];

      for (const opp of opportunities) {
        const opportunity = new VolunteerOpportunity(opp);
        await opportunity.save();
      }
    });

    it('should get trending skills', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/trending-skills')
        .expect(200);

      expect(response.body.skills).toHaveLength(3); // Teaching, Programming, Communication
      expect(response.body.skills[0].name).toBe('Teaching'); // Most frequent
      expect(response.body.skills[0].demand).toBe(2);
    });
  });

  describe('Get Statistics', () => {
    beforeEach(async () => {
      const opportunities = [
        {
          title: 'Active Opportunity',
          description: 'Test 1',
          organization: { name: 'Org 1', id: userId },
          category: 'Education',
          skills: [{ name: 'Teaching', level: 'intermediate', required: true }],
          location: { type: 'on-site' },
          schedule: { startDate: '2024-02-01', duration: 'long-term' },
          maxVolunteers: 5,
          currentVolunteers: 2,
          status: 'active',
          visibility: 'public',
          applications: [{ volunteer: userId, status: 'pending' }],
          stats: { rating: 4.5, views: 100 }
        },
        {
          title: 'Draft Opportunity',
          description: 'Test 2',
          organization: { name: 'Org 2', id: userId },
          category: 'Technology',
          skills: [{ name: 'Programming', level: 'advanced', required: true }],
          location: { type: 'remote' },
          schedule: { startDate: '2024-03-01', duration: 'short-term' },
          maxVolunteers: 3,
          status: 'draft',
          visibility: 'public',
          stats: { rating: 0, views: 0 }
        }
      ];

      for (const opp of opportunities) {
        const opportunity = new VolunteerOpportunity(opp);
        await opportunity.save();
      }
    });

    it('should get statistics', async () => {
      const response = await request(app)
        .get('/api/volunteer-opportunities/statistics')
        .expect(200);

      expect(response.body.overall.totalOpportunities).toBe(2);
      expect(response.body.overall.activeOpportunities).toBe(1);
      expect(response.body.overall.totalApplications).toBe(1);
      expect(response.body.overall.totalVolunteers).toBe(2);
      expect(response.body.byCategory).toHaveLength(2);
    });
  });
});

