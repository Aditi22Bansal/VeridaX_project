import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchainService';
import toast from 'react-hot-toast';

const BlockchainCampaign = ({ campaign, onUpdate }) => {
  const [blockchainData, setBlockchainData] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, [campaign]);

  const loadBlockchainData = async () => {
    try {
      setBlockchainLoading(true);
      
      // Initialize blockchain service if not already done
      await blockchainService.initialize();
      
      // Try to get campaign data from blockchain
      if (campaign.blockchainId) {
        const result = await blockchainService.getCampaign(campaign.blockchainId);
        if (result.success) {
          setBlockchainData(result.campaign);
        }
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!donationAmount || donationAmount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    try {
      setLoading(true);
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Make donation through blockchain
      const result = await blockchainService.donate(campaign.blockchainId, donationAmount);
      
      if (result.success) {
        toast.success(`Donation of ${donationAmount} ETH successful! Transaction: ${result.transactionHash}`);
        setDonationAmount('');
        
        // Reload blockchain data
        await loadBlockchainData();
        
        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }
      } else {
        toast.error(`Donation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error making donation:', error);
      toast.error('Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Withdraw funds through blockchain
      const result = await blockchainService.withdrawFunds(campaign.blockchainId);
      
      if (result.success) {
        toast.success(`Funds withdrawn successfully! Transaction: ${result.transactionHash}`);
        
        // Reload blockchain data
        await loadBlockchainData();
        
        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }
      } else {
        toast.error(`Withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  const formatEther = (value) => {
    if (!value) return '0';
    return parseFloat(value).toFixed(4);
  };

  const getProgressPercentage = () => {
    if (!blockchainData) return 0;
    const raised = parseFloat(blockchainData.amountRaised);
    const goal = parseFloat(blockchainData.goal);
    return goal > 0 ? (raised / goal) * 100 : 0;
  };

  const isCompleted = blockchainData?.isCompleted || false;
  const isCreator = campaign.creator === campaign.currentUser; // Assuming currentUser is available

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{campaign.title}</h3>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Blockchain
          </span>
          {isCompleted && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Completed
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">{campaign.description}</p>

      {blockchainLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : blockchainData ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Raised: {formatEther(blockchainData.amountRaised)} ETH</span>
              <span>Goal: {formatEther(blockchainData.goal)} ETH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressPercentage().toFixed(1)}% funded
            </div>
          </div>

          {/* Blockchain Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Creator:</span>
              <div className="font-mono text-xs text-gray-700 truncate">
                {blockchainData.creator}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Deadline:</span>
              <div className="text-gray-700">
                {new Date(parseInt(blockchainData.deadline) * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Donation Form */}
          {!isCompleted && (
            <div className="border-t pt-4">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.001"
                />
                <button
                  onClick={handleDonate}
                  disabled={loading || !donationAmount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Donating...' : 'Donate'}
                </button>
              </div>
            </div>
          )}

          {/* Withdraw Button for Creator */}
          {isCompleted && isCreator && (
            <div className="border-t pt-4">
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Withdrawing...' : 'Withdraw Funds'}
              </button>
            </div>
          )}

          {/* Blockchain Info */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <div>Blockchain: Local Hardhat Network</div>
            <div>Contract: {process.env.REACT_APP_CONTRACT_ADDRESS}</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <p>Blockchain data not available</p>
          <button
            onClick={loadBlockchainData}
            className="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockchainCampaign;






