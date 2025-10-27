import api from './api';

export const uploadService = {
  // Upload image to backend
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete image from backend
  deleteImage: async (publicId) => {
    try {
      const response = await api.delete(`/upload/image/${publicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
