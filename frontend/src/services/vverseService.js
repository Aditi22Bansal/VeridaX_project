import api from './api';

export const vverseService = {
  // Get all campaigns for VVerse
  getCampaigns: async (params = {}) => {
    try {
      const response = await api.get('/campaigns', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get campaign details
  getCampaign: async (campaignId) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  // Get user's rooms
  getRooms: async () => {
    try {
      const response = await api.get('/vverse/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get recommended rooms
  getRecommendedRooms: async (params = {}) => {
    try {
      const response = await api.get('/vverse/rooms/recommended', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new room
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/vverse/rooms', roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get room details
  getRoom: async (roomId) => {
    try {
      const response = await api.get(`/vverse/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Join a room
  joinRoom: async (roomId) => {
    try {
      const response = await api.post(`/vverse/rooms/${roomId}/join`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Leave a room
  leaveRoom: async (roomId) => {
    try {
      const response = await api.post(`/vverse/rooms/${roomId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get room messages
  getRoomMessages: async (roomId) => {
    try {
      const response = await api.get(`/vverse/rooms/${roomId}/messages`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Send message to room
  sendMessage: async (roomId, messageData) => {
    try {
      const response = await api.post(`/vverse/rooms/${roomId}/messages`, messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/vverse/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
