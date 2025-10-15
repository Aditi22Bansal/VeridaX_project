import { api } from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
        }
        return response.data;
    },

    async register(userData) {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('auth_token');
    },

    async fetchCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    },

    getCurrentUser() {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        return this.fetchCurrentUser();
    },

    async updateProfile(profileData) {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    },

    // Enhanced authentication methods
    async sendEmailVerification() {
        const response = await api.post('/auth/send-email-verification');
        return response.data;
    },

    async verifyEmail(token) {
        const response = await api.get(`/auth/verify-email/${token}`);
        return response.data;
    },

    async forgotPassword(email) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(token, password) {
        const response = await api.post(`/auth/reset-password/${token}`, { password });
        return response.data;
    },

    async changePassword(currentPassword, newPassword) {
        const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    async addSkill(skillData) {
        const response = await api.post('/auth/skills', skillData);
        return response.data;
    },

    async removeSkill(skillName) {
        const response = await api.delete(`/auth/skills/${skillName}`);
        return response.data;
    },

    async updateStats(statType, value) {
        const response = await api.post('/auth/stats', { statType, value });
        return response.data;
    },

    // Token management
    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(token) {
        localStorage.setItem('auth_token', token);
    },

    removeToken() {
        localStorage.removeItem('auth_token');
    },

    isTokenValid() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }
};