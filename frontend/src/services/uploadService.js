import api from './api';

export const uploadService = {
  // Upload image to backend
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // Normalize backend response to a common shape
      const data = response.data?.data || response.data || {};
      return {
        imageURL: data.url, // for legacy callers expecting imageURL
        url: data.url,
        filename: data.filename,
        originalName: data.originalName,
        size: data.size,
        success: response.data?.success ?? true
      };
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
