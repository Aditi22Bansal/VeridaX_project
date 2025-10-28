import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { campaignService } from "../../services/campaignService";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";

const MyCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [donorsModal, setDonorsModal] = useState({
    open: false,
    donors: [],
    title: "",
  });
  const [volunteersModal, setVolunteersModal] = useState({
    open: false,
    volunteers: [],
    title: "",
    campaignId: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await campaignService.getMyCampaigns();

      if (response.success) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Don't show error toast for authentication issues
      if (error.message && !error.message.includes("Access denied")) {
        toast.error("Failed to load campaigns");
      }
      setCampaigns([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        await campaignService.deleteCampaign(campaignId);
        toast.success("Campaign deleted successfully");
        fetchCampaigns(); // Refresh the list
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign");
      }
    }
  };

  const handleEditCampaign = (campaignId) => {
    navigate(`/admin/edit-campaign/${campaignId}`);
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const openDonors = async (campaign) => {
    try {
      const res = await campaignService.getCampaignDonors(campaign._id);
      if (res.success) {
        setDonorsModal({
          open: true,
          donors: res.data.donors || [],
          title: campaign.title,
        });
      }
    } catch (e) {
      toast.error(e.message || "Failed to load donors");
    }
  };

  const openVolunteers = async (campaign) => {
    try {
      const res = await campaignService.getCampaignVolunteers(campaign._id);
      console.log("Volunteer data received:", res.data.volunteers);
      console.log("Sample volunteer structure:", res.data.volunteers[0]);
      if (res.success) {
        setVolunteersModal({
          open: true,
          volunteers: res.data.volunteers || [],
          title: campaign.title,
          campaignId: campaign._id,
        });
      }
    } catch (e) {
      console.error("Error loading volunteers:", e);
      toast.error(e.message || "Failed to load volunteers");
    }
  };

  const handleVolunteerAction = async (volunteerId, action) => {
    try {
      // You'll need to implement this API endpoint
      const response = await campaignService.updateVolunteerStatus(
        volunteersModal.campaignId,
        volunteerId,
        action,
      );

      if (response.success) {
        toast.success(`Volunteer ${action}d successfully`);
        // Refresh the volunteers list
        const campaign = campaigns.find(
          (c) => c._id === volunteersModal.campaignId,
        );
        openVolunteers(campaign);
      }
    } catch (error) {
      toast.error(`Failed to ${action} volunteer: ${error.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading your campaigns..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
              <p className="mt-2 text-gray-600">
                Manage and track all your campaigns
              </p>
            </div>
            <Link
              to="/admin/create-campaign"
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Campaign
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="card overflow-hidden">
                <div className="relative">
                  <img
                    src={campaign.imageURL}
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {campaign.type === "crowdfunding" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (campaign.raisedAmount / campaign.goalAmount) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>
                          {formatCurrency(campaign.raisedAmount)} raised
                        </span>
                        <span>Goal: {formatCurrency(campaign.goalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      {campaign.volunteerCount ??
                        campaign.volunteers?.length ??
                        0}{" "}
                      volunteers
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {campaign.category}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCampaign(campaign._id)}
                      className="flex-1 btn-outline py-2 text-sm"
                    >
                      <EyeIcon className="w-4 h-4 mr-1 inline" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditCampaign(campaign._id)}
                      className="flex-1 btn-secondary py-2 text-sm"
                    >
                      <PencilIcon className="w-4 h-4 mr-1 inline" />
                      Edit
                    </button>
                    {campaign.type === "crowdfunding" && (
                      <button
                        onClick={() => openDonors(campaign)}
                        className="flex-1 btn-primary py-2 text-sm"
                      >
                        <UserGroupIcon className="w-4 h-4 mr-1 inline" />
                        Donors
                      </button>
                    )}
                    {campaign.type === "volunteering" && (
                      <button
                        onClick={() => openVolunteers(campaign)}
                        className="flex-1 btn-primary py-2 text-sm"
                      >
                        <UserGroupIcon className="w-4 h-4 mr-1 inline" />
                        Volunteers
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {donorsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Donors — {donorsModal.title}
              </h2>
              <button
                onClick={() =>
                  setDonorsModal({ open: false, donors: [], title: "" })
                }
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y">
              {donorsModal.donors.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  No donations yet.
                </div>
              )}
              {donorsModal.donors.map((d, idx) => (
                <details key={idx} className="group py-3">
                  <summary className="list-none cursor-pointer flex items-center justify-between">
                    <div className="font-medium">
                      {d.isAnonymous ? "Anonymous" : d.donor?.name || "Donor"}
                    </div>
                    <div className="font-semibold text-primary-700 underline">
                      {formatCurrency(d.totalAmount)}
                    </div>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {d.donations.map((dn, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between text-sm text-gray-700"
                      >
                        <div className="text-gray-500">
                          {new Date(dn.createdAt).toLocaleString()}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(dn.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() =>
                  setDonorsModal({ open: false, donors: [], title: "" })
                }
                className="btn-secondary px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {volunteersModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Volunteer Applications — {volunteersModal.title}
              </h2>
              <button
                onClick={() =>
                  setVolunteersModal({
                    open: false,
                    volunteers: [],
                    title: "",
                    campaignId: null,
                  })
                }
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y">
              {volunteersModal.volunteers.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  No volunteer applications yet.
                </div>
              )}
              {volunteersModal.volunteers.map((volunteer) => (
                <div key={volunteer._id} className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-primary-600 font-semibold text-lg">
                          {volunteer.volunteerId?.name?.charAt(0) || "V"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {volunteer.volunteerId?.name || "Volunteer"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {volunteer.volunteerId?.email || "No email"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Applied on{" "}
                          {new Date(
                            volunteer.registeredAt || volunteer.createdAt,
                          ).toLocaleDateString()}
                        </p>
                        {volunteer.availability?.hoursPerWeek && (
                          <p className="text-xs text-gray-500">
                            Available {volunteer.availability.hoursPerWeek}{" "}
                            hours/week
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          volunteer.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : volunteer.status === "under-review"
                              ? "bg-blue-100 text-blue-800"
                              : volunteer.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {volunteer.status === "registered"
                          ? "Pending Review"
                          : volunteer.status?.replace("-", " ") || "Registered"}
                      </span>
                    </div>
                  </div>

                  {/* Show motivation if available, otherwise show a placeholder */}
                  <div className="mb-3 bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Motivation
                    </h4>
                    <p className="text-sm text-gray-700">
                      {volunteer.motivation ||
                        volunteer.notes ||
                        "No motivation provided (legacy application)"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Skills section - handle both new and legacy data */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {volunteer.experience?.skills &&
                        volunteer.experience.skills.length > 0 ? (
                          volunteer.experience.skills.map((skillObj, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              title={
                                typeof skillObj === "object"
                                  ? `${skillObj.skill} (${skillObj.level || "intermediate"})`
                                  : skillObj
                              }
                            >
                              {typeof skillObj === "object"
                                ? skillObj.skill
                                : skillObj}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            No skills specified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Availability section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Availability
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {volunteer.availability?.hoursPerWeek ? (
                          <p>
                            {volunteer.availability.hoursPerWeek} hours per week
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Hours per week not specified
                          </p>
                        )}
                        {volunteer.availability?.startDate ? (
                          <p>
                            Available from{" "}
                            {new Date(
                              volunteer.availability.startDate,
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Start date not specified
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {volunteer.experience?.relevantExperience && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Relevant Experience
                      </h4>
                      <p className="text-sm text-gray-700">
                        {volunteer.experience.relevantExperience}
                      </p>
                    </div>
                  )}

                  {volunteer.notes &&
                    volunteer.notes !== volunteer.motivation && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Admin Notes
                        </h4>
                        <p className="text-sm text-gray-600 italic">
                          {volunteer.notes}
                        </p>
                      </div>
                    )}

                  {/* Application type indicator for debugging */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <span>
                          Total volunteer hours:{" "}
                          {volunteer.volunteeringRecord?.totalHours || 0}
                        </span>
                        {!volunteer.motivation &&
                          !volunteer.availability &&
                          !volunteer.experience && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              Legacy Application
                            </span>
                          )}
                      </div>
                      <div className="flex space-x-2">
                        {volunteer.status === "registered" && (
                          <>
                            <button
                              onClick={() =>
                                handleVolunteerAction(volunteer._id, "approve")
                              }
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleVolunteerAction(volunteer._id, "reject")
                              }
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() =>
                  setVolunteersModal({
                    open: false,
                    volunteers: [],
                    title: "",
                    campaignId: null,
                  })
                }
                className="btn-secondary px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyCampaigns;
