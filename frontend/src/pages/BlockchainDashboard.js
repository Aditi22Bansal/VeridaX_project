import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchainService';
import BlockchainCampaign from '../components/BlockchainCampaign';
import toast from 'react-hot-toast';

const BlockchainDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockchainInitialized, setBlockchainInitialized] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    initializeBlockchain();
  }, []);

  const initializeBlockchain = async () => {
    try {
      setLoading(true);
      
      // Initialize blockchain service
      const initialized = await blockchainService.initialize();
      
      if (initialized) {
        setBlockchainInitialized(true);
        
        // Get network info
        const network = await blockchainService.getNetworkInfo();
        setNetworkInfo(network);
        
        // Get current address
        const address = await blockchainService.getCurrentAddress();
        setCurrentAddress(address);
        
        // Load campaigns
        await loadCampaigns();
        
        toast.success('Blockchain connection established!');
      } else {
        toast.error('Failed to connect to blockchain');
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      toast.error('Failed to initialize blockchain service');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      // Get campaign count
      const countResult = await blockchainService.getCampaignCount();
      
      if (countResult.success) {
        const count = parseInt(countResult.count);
        const campaignPromises = [];
        
        // Load each campaign
        for (let i = 1; i <= count; i++) {
          campaignPromises.push(loadCampaign(i));
        }
        
        const campaignResults = await Promise.all(campaignPromises);
        const validCampaigns = campaignResults.filter(result => result.success);
        
        setCampaigns(validCampaigns.map(result => result.campaign));
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const loadCampaign = async (campaignId) => {
    try {
      const result = await blockchainService.getCampaign(campaignId);
      if (result.success) {
        return {
          success: true,
          campaign: {
            ...result.campaign,
            blockchainId: campaignId,
            id: campaignId
          }
        };
      }
      return { success: false };
    } catch (error) {
      console.error(`Error loading campaign ${campaignId}:`, error);
      return { success: false };
    }
  };

  const handleCampaignUpdate = () => {
    loadCampaigns();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing blockchain connection...</p>
        </div>
      </div>
    );
  }

  if (!blockchainInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Blockchain Connection Failed</h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to the local blockchain network.
          </p>
          <button
            onClick={initializeBlockchain}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blockchain Crowdfunding</h1>
              <p className="text-gray-600">Decentralized campaigns powered by smart contracts</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Network: {networkInfo?.name || 'Unknown'}</div>
              <div className="text-sm text-gray-500">Chain ID: {networkInfo?.chainId || 'Unknown'}</div>
              <div className="text-sm text-gray-500 font-mono">
                {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'No address'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {campaigns.filter(c => c.isCompleted).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {campaigns.filter(c => !c.isCompleted).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <BlockchainCampaign
              key={campaign.id}
              campaign={campaign}
              onUpdate={handleCampaignUpdate}
            />
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-500">
              No blockchain campaigns are available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainDashboard;






