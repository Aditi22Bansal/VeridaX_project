import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  HeartIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { volunteerService } from "../services/volunteerService";
import toast from "react-hot-toast";

const VolunteerApplicationModal = ({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    motivation: "",
    availableHours: 5,
    startDate: "",
    skills: [],
    hasExperience: false,
    experienceDescription: "",
  });

  const [errors, setErrors] = useState({});

  const skillOptions = [
    "Teaching",
    "Marketing",
    "Web Design",
    "Photography",
    "Event Planning",
    "Social Media",
    "Writing",
    "Project Management",
    "Data Analysis",
    "Fundraising",
    "Leadership",
    "Communication",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.motivation.trim()) {
      newErrors.motivation = "Please tell us why you want to volunteer";
    } else if (formData.motivation.trim().length < 20) {
      newErrors.motivation = "Please provide at least 20 characters";
    }

    if (formData.availableHours < 1 || formData.availableHours > 40) {
      newErrors.availableHours = "Hours per week must be between 1 and 40";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Please select when you can start";
    }

    if (formData.hasExperience && !formData.experienceDescription.trim()) {
      newErrors.experienceDescription = "Please describe your experience";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        motivation: formData.motivation,
        availability: {
          hoursPerWeek: formData.availableHours,
          startDate: formData.startDate,
        },
        experience: {
          relevantExperience: formData.hasExperience
            ? formData.experienceDescription
            : "",
          skills: formData.skills.map((skill) => ({
            skill,
            level: "intermediate", // Default level
          })),
        },
      };

      console.log(
        "Submitting application data:",
        JSON.stringify(applicationData, null, 2),
      );
      console.log("Form data:", JSON.stringify(formData, null, 2));

      // Try campaign-specific endpoint first
      try {
        await volunteerService.applyToCampaign(campaign._id, applicationData);
      } catch (error) {
        // Fallback to volunteer opportunities endpoint
        await volunteerService.applyForOpportunity(
          campaign._id,
          applicationData,
        );
      }

      toast.success("Application submitted successfully!");
      onSuccess?.();
      onClose();

      // Reset form
      setFormData({
        motivation: "",
        availableHours: 5,
        startDate: "",
        skills: [],
        hasExperience: false,
        experienceDescription: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (!campaign) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <HeartIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Join Campaign
                    </h2>
                    <p className="text-sm text-gray-600">{campaign.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Campaign Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>Category: {campaign.category}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="w-4 h-4 mr-1" />
                      <span>{campaign.volunteers?.length || 0} volunteers</span>
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div>
                  <label
                    htmlFor="motivation"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Why do you want to volunteer for this campaign? *
                  </label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us about your interest in this cause and what you hope to contribute..."
                    className={`input-field ${errors.motivation ? "border-red-300" : ""}`}
                    required
                  />
                  {errors.motivation && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.motivation}
                    </p>
                  )}
                </div>

                {/* Availability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="availableHours"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Hours per week *
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        id="availableHours"
                        name="availableHours"
                        value={formData.availableHours}
                        onChange={handleInputChange}
                        min="1"
                        max="40"
                        className={`input-field pl-9 ${errors.availableHours ? "border-red-300" : ""}`}
                        required
                      />
                    </div>
                    {errors.availableHours && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.availableHours}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Available from *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={getTodayDate()}
                      className={`input-field ${errors.startDate ? "border-red-300" : ""}`}
                      required
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Skills (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select any skills that might be useful for this campaign
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skillOptions.map((skill) => (
                      <label
                        key={skill}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                          formData.skills.includes(skill)
                            ? "bg-primary-50 border-primary-200 text-primary-800"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="hasExperience"
                      name="hasExperience"
                      checked={formData.hasExperience}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="hasExperience"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      I have relevant experience in this field
                    </label>
                  </div>

                  {formData.hasExperience && (
                    <div>
                      <label
                        htmlFor="experienceDescription"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Describe your experience *
                      </label>
                      <textarea
                        id="experienceDescription"
                        name="experienceDescription"
                        value={formData.experienceDescription}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Please describe your relevant experience..."
                        className={`input-field ${errors.experienceDescription ? "border-red-300" : ""}`}
                      />
                      {errors.experienceDescription && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.experienceDescription}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        What happens next?
                      </h4>
                      <p className="text-blue-800 text-sm">
                        Your application will be reviewed by the campaign
                        organizer. You'll receive a notification once your
                        application is approved, and you can start volunteering!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <HeartIcon className="w-4 h-4 mr-2" />
                        Join Campaign
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VolunteerApplicationModal;
