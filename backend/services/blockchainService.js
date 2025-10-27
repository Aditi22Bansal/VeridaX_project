const { ethers } = require('ethers');
const CrowdfundingABI = require('../contracts/Crowdfunding.json');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.NETWORK_URL || 'http://localhost:8545');
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contract = null;
    this.wallet = null;
  }

  async initialize() {
    try {
      // Check if contract address is provided
      if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Blockchain service disabled - no contract address provided');
        return;
      }

      // Create a wallet for contract interactions
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
      
      // Initialize contract
      this.contract = new ethers.Contract(this.contractAddress, CrowdfundingABI.abi, this.wallet);
      
      console.log('Blockchain service initialized');
      console.log('Contract address:', this.contractAddress);
      console.log('Wallet address:', this.wallet.address);
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // Don't throw error, just log it and continue without blockchain features
      console.log('Continuing without blockchain features...');
    }
  }

  async createCampaign(title, description, goal, deadline) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const tx = await this.contract.createCampaign(title, description, goal, deadline);
      const receipt = await tx.wait();
      
      // Get the campaign ID from the event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'CampaignCreated';
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        return {
          success: true,
          campaignId: parsed.args.campaignId.toString(),
          transactionHash: tx.hash
        };
      }
      
      return {
        success: true,
        campaignId: null,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async donate(campaignId, amount) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const tx = await this.contract.donate(campaignId, { value: ethers.parseEther(amount.toString()) });
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error donating:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async withdrawFunds(campaignId) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const tx = await this.contract.withdrawFunds(campaignId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCampaign(campaignId) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const campaign = await this.contract.getCampaign(campaignId);
      return {
        success: true,
        campaign: {
          creator: campaign.creator,
          title: campaign.title,
          description: campaign.description,
          goal: ethers.formatEther(campaign.goal),
          amountRaised: ethers.formatEther(campaign.amountRaised),
          isCompleted: campaign.isCompleted,
          deadline: campaign.deadline.toString(),
          exists: campaign.exists
        }
      };
    } catch (error) {
      console.error('Error getting campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDonations(campaignId) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const donations = await this.contract.getDonations(campaignId);
      const formattedDonations = donations.map(donation => ({
        donor: donation.donor,
        amount: ethers.formatEther(donation.amount),
        timestamp: donation.timestamp.toString()
      }));
      
      return {
        success: true,
        donations: formattedDonations
      };
    } catch (error) {
      console.error('Error getting donations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCampaignCount() {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const count = await this.contract.getCampaignCount();
      return {
        success: true,
        count: count.toString()
      };
    } catch (error) {
      console.error('Error getting campaign count:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async isCampaignCompleted(campaignId) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const isCompleted = await this.contract.isCampaignCompleted(campaignId);
      return {
        success: true,
        isCompleted
      };
    } catch (error) {
      console.error('Error checking campaign completion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserCampaigns(userAddress) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const campaigns = await this.contract.getUserCampaigns(userAddress);
      return {
        success: true,
        campaigns: campaigns.map(id => id.toString())
      };
    } catch (error) {
      console.error('Error getting user campaigns:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserDonations(userAddress) {
    try {
      if (!this.contract) {
        return {
          success: false,
          error: 'Blockchain service not available'
        };
      }

      const donations = await this.contract.getUserDonations(userAddress);
      return {
        success: true,
        donations: donations.map(id => id.toString())
      };
    } catch (error) {
      console.error('Error getting user donations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService();

