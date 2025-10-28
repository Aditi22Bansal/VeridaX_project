import api from "./api";

class VolunteerService {
  // Volunteer Profile Management
  async getProfile() {
    try {
      const response = await api.get("/volunteers/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put("/volunteers/profile", profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Volunteer Opportunities
  async getOpportunities(params = {}) {
    try {
      const response = await api.get("/volunteers/opportunities", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getOpportunity(id) {
    try {
      const response = await api.get(`/volunteers/opportunities/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async applyForOpportunity(opportunityId, applicationData) {
    try {
      const response = await api.post(
        `/volunteers/opportunities/${opportunityId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Apply directly to a campaign (fallback method)
  async applyToCampaign(campaignId, applicationData) {
    try {
      const response = await api.post(
        `/campaigns/${campaignId}/volunteer`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Volunteer Applications
  async getApplications(params = {}) {
    try {
      const response = await api.get("/volunteers/applications", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getApplication(id) {
    try {
      const response = await api.get(`/volunteers/applications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async withdrawApplication(id) {
    try {
      const response = await api.delete(`/volunteers/applications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Hour Logging and Impact Tracking
  async logHours(hourData) {
    try {
      // Ensure the data structure matches backend expectations
      const logData = {
        campaignId: hourData.campaignId,
        hours: hourData.hours,
        activity: hourData.activity,
        date: hourData.date || new Date().toISOString(),
      };

      const response = await api.post("/volunteers/log-hours", logData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getImpactRecords(params = {}) {
    try {
      const response = await api.get("/volunteers/impact", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // AI Recommendations
  async getRecommendations(params = {}) {
    try {
      const response = await api.get("/volunteers/recommendations", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Badges and Achievements
  async getBadges() {
    try {
      const response = await api.get("/volunteers/badges");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Trending Data (Public endpoint)
  async getTrendingData() {
    try {
      const response = await api.get("/volunteers/trending");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Helper methods for skill and interest management
  getSkillLevels() {
    return [
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
      { value: "expert", label: "Expert" },
    ];
  }

  getInterestCategories() {
    return [
      { value: "education", label: "Education" },
      { value: "healthcare", label: "Healthcare" },
      { value: "environment", label: "Environment" },
      { value: "community", label: "Community Development" },
      { value: "disaster-relief", label: "Disaster Relief" },
      { value: "other", label: "Other" },
    ];
  }

  getPriorityLevels() {
    return [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ];
  }

  getDaysOfWeek() {
    return [
      { value: "monday", label: "Monday" },
      { value: "tuesday", label: "Tuesday" },
      { value: "wednesday", label: "Wednesday" },
      { value: "thursday", label: "Thursday" },
      { value: "friday", label: "Friday" },
      { value: "saturday", label: "Saturday" },
      { value: "sunday", label: "Sunday" },
    ];
  }

  // Format helpers
  formatHours(hours) {
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  }

  formatMatchScore(score) {
    if (score >= 85) return { level: "Excellent", color: "text-green-600" };
    if (score >= 70) return { level: "Good", color: "text-blue-600" };
    if (score >= 50) return { level: "Fair", color: "text-yellow-600" };
    return { level: "Poor", color: "text-red-600" };
  }

  formatApplicationStatus(status) {
    const statusMap = {
      submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
      "under-review": {
        label: "Under Review",
        color: "bg-yellow-100 text-yellow-800",
      },
      shortlisted: {
        label: "Shortlisted",
        color: "bg-purple-100 text-purple-800",
      },
      "interview-scheduled": {
        label: "Interview Scheduled",
        color: "bg-indigo-100 text-indigo-800",
      },
      accepted: { label: "Accepted", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
    };

    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  }

  formatVerificationStatus(status) {
    const statusMap = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      verified: { label: "Verified", color: "bg-green-100 text-green-800" },
      disputed: { label: "Disputed", color: "bg-orange-100 text-orange-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
    };

    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  }

  // Time and date helpers
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  // Validation helpers
  validateProfileData(data) {
    const errors = {};

    if (data.skills) {
      data.skills.forEach((skill, index) => {
        if (!skill.name || skill.name.trim().length === 0) {
          errors[`skills.${index}.name`] = "Skill name is required";
        }
        if (!skill.level) {
          errors[`skills.${index}.level`] = "Skill level is required";
        }
      });
    }

    if (data.availability) {
      if (
        data.availability.hoursPerWeek &&
        (data.availability.hoursPerWeek < 1 ||
          data.availability.hoursPerWeek > 168)
      ) {
        errors["availability.hoursPerWeek"] =
          "Hours per week must be between 1 and 168";
      }
    }

    if (
      data.location &&
      data.location.pincode &&
      !/^\d{6}$/.test(data.location.pincode)
    ) {
      errors["location.pincode"] = "Pincode must be 6 digits";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  validateHourLog(data) {
    const errors = {};

    if (!data.campaignId) {
      errors.campaignId = "Campaign is required";
    }

    if (!data.startTime) {
      errors.startTime = "Start time is required";
    }

    if (!data.endTime) {
      errors.endTime = "End time is required";
    }

    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      if (end <= start) {
        errors.endTime = "End time must be after start time";
      }

      const diffInHours = (end - start) / (1000 * 60 * 60);
      if (diffInHours > 24) {
        errors.endTime = "Cannot log more than 24 hours in a single entry";
      }
    }

    if (!data.activity || data.activity.trim().length === 0) {
      errors.activity = "Activity description is required";
    }

    if (
      data.breakDuration &&
      (data.breakDuration < 0 || data.breakDuration > 480)
    ) {
      errors.breakDuration = "Break duration must be between 0 and 480 minutes";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Search and filter helpers
  buildSearchParams(filters) {
    const params = {};

    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (filters.type && filters.type !== "all") {
      params.type = filters.type;
    }

    if (filters.category && filters.category !== "all") {
      params.category = filters.category;
    }

    if (filters.location && filters.location.trim()) {
      params.location = filters.location.trim();
    }

    if (filters.remote) {
      params.remote = "true";
    }

    if (filters.skills && filters.skills.length > 0) {
      params.skills = filters.skills.join(",");
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.limit) {
      params.limit = filters.limit;
    }

    return params;
  }
}

export const volunteerService = new VolunteerService();
export default volunteerService;
