import { ethers } from 'ethers';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    this.networkUrl = process.env.REACT_APP_NETWORK_URL || 'http://localhost:8545';
  }

  async initialize() {
    try {
      // Initialize provider (local Hardhat network)
      this.provider = new ethers.JsonRpcProvider(this.networkUrl);
      
      // Get signer (for local development, we'll use a default account)
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.signer = this.provider.getSigner(accounts[0]);
      } else {
        // Create a wallet for local development
        const wallet = new ethers.Wallet(
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat default private key
          this.provider
        );
        this.signer = wallet;
      }

      // Initialize contract
      if (this.contractAddress) {
        const contractABI = [
          // Contract ABI will be loaded from the deployed contract
          "function createCampaign(string memory _title, string memory _description, uint256 _goal, uint256 _deadline) public",
          "function donate(uint256 _campaignId) public payable",
          "function withdrawFunds(uint256 _campaignId) public",
          "function getCampaign(uint256 _campaignId) public view returns (tuple(address creator, string title, string description, uint256 goal, uint256 amountRaised, bool isCompleted, uint256 deadline, bool exists))",
          "function getDonations(uint256 _campaignId) public view returns (tuple(address donor, uint256 amount, uint256 timestamp)[] memory)",
          "function getCampaignCount() public view returns (uint256)",
          "function getUserCampaigns(address _user) public view returns (uint256[] memory)",
          "function getUserDonations(address _user) public view returns (uint256[] memory)",
          "function isCampaignCompleted(uint256 _campaignId) public view returns (bool)",
          "event CampaignCreated(uint256 campaignId, address creator, string title, uint256 goal, uint256 deadline)",
          "event DonationReceived(uint256 campaignId, address donor, uint256 amount)",
          "event FundsWithdrawn(uint256 campaignId, address creator, uint256 amount)"
        ];
        
        this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
      }

      console.log('Blockchain service initialized');
      console.log('Network URL:', this.networkUrl);
      console.log('Contract address:', this.contractAddress);
      console.log('Signer address:', await this.signer.getAddress());
      
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  async createCampaign(title, description, goal, deadline) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const tx = await this.contract.createCampaign(title, description, goal, deadlineTimestamp);
      const receipt = await tx.wait();
      
      // Get campaign ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'CampaignCreated';
        } catch (e) {
          return false;
        }
      });
      
      let campaignId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        campaignId = parsed.args.campaignId.toString();
      }

      return {
        success: true,
        campaignId,
        transactionHash: tx.hash,
        receipt
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
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.donate(campaignId, { 
        value: ethers.parseEther(amount.toString()) 
      });
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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
        throw new Error('Contract not initialized');
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

  // Helper method to format Ether values
  formatEther(value) {
    return ethers.formatEther(value);
  }

  // Helper method to parse Ether values
  parseEther(value) {
    return ethers.parseEther(value.toString());
  }

  // Get current account address
  async getCurrentAddress() {
    try {
      if (this.signer) {
        return await this.signer.getAddress();
      }
      return null;
    } catch (error) {
      console.error('Error getting current address:', error);
      return null;
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      if (this.provider) {
        const network = await this.provider.getNetwork();
        return {
          chainId: network.chainId.toString(),
          name: network.name
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

export default new BlockchainService();



