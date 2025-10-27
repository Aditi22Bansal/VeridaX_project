import api from './api';

export const campaignService = {
  // Get all campaigns
  getCampaigns: async (params = {}) => {
    try {
      const response = await api.get('/campaigns', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single campaign
  getCampaign: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create campaign (admin only)
  createCampaign: async (campaignData) => {
    try {
      const response = await api.post('/campaigns', campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update campaign (admin only)
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await api.put(`/campaigns/${id}`, campaignData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete campaign (admin only)
  deleteCampaign: async (id) => {
    try {
      const response = await api.delete(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's campaigns (admin only)
  getMyCampaigns: async () => {
    try {
      const response = await api.get('/campaigns/my-campaigns');
      return response.data;
    } catch (error) {
      console.error('getMyCampaigns error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // Register as volunteer
  registerVolunteer: async (campaignId) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/volunteer`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Make donation
  makeDonation: async (campaignId, amount) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/donate`, { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get campaign volunteers (admin only)
  getCampaignVolunteers: async (campaignId) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/volunteers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get dashboard stats (calculated from campaigns)
  getDashboardStats: async () => {
    try {
      const [campaignsResponse, myCampaignsResponse] = await Promise.all([
        api.get('/campaigns'),
        api.get('/campaigns/my-campaigns').catch(() => ({ data: { data: { campaigns: [] } } }))
      ]);

      const allCampaigns = campaignsResponse.data.data.campaigns || [];
      const myCampaigns = myCampaignsResponse.data.data.campaigns || [];

      // Calculate stats
      const totalCampaigns = myCampaigns.length;
      const activeCampaigns = myCampaigns.filter(c => c.status === 'active').length;

      // Calculate total volunteers across all campaigns
      const totalVolunteers = allCampaigns.reduce((sum, campaign) => sum + (campaign.volunteers?.length || 0), 0);

      // Calculate total raised across all campaigns
      const totalRaised = allCampaigns.reduce((sum, campaign) => sum + (campaign.raisedAmount || 0), 0);

      return {
        success: true,
        data: {
          totalCampaigns,
          totalVolunteers,
          totalRaised,
          activeCampaigns
        }
      };
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
