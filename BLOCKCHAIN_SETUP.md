# 🚀 Blockchain Crowdfunding Setup Guide

This guide will help you set up a complete blockchain-powered crowdfunding system using Solidity smart contracts, Hardhat, and Ethers.js.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🛠️ Setup Instructions

### 1. **Install Dependencies**

```bash
# Install blockchain dependencies
cd frontend/blockchain
npm install

# Install backend dependencies (if not already done)
cd ../../backend
npm install

# Install frontend dependencies (if not already done)
cd ../frontend
npm install
```

### 2. **Compile Smart Contracts**

```bash
cd frontend/blockchain
npm run compile
```

### 3. **Start Local Blockchain Network**

```bash
# In one terminal, start Hardhat node
cd frontend/blockchain
npm run node
```

This will start a local blockchain network on `http://localhost:8545`.

### 4. **Deploy Smart Contracts**

```bash
# In another terminal, deploy contracts
cd frontend/blockchain
npm run start-network
```

This will:
- Deploy the Crowdfunding smart contract
- Create test campaigns
- Display the contract address

### 5. **Configure Environment Variables**

Create a `.env` file in the `frontend` directory:

```env
# Blockchain Configuration
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_URL=http://localhost:8545
REACT_APP_CHAIN_ID=1337

# Backend Configuration
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 6. **Start Backend Server**

```bash
cd backend
npm start
```

### 7. **Start Frontend Application**

```bash
cd frontend
npm start
```

### 8. **Access Blockchain Dashboard**

Visit `http://localhost:3000/blockchain` to see the blockchain-powered crowdfunding dashboard.

## 🏗️ Architecture Overview

### Smart Contract Features

- **Campaign Creation**: Create crowdfunding campaigns with goals and deadlines
- **Donations**: Accept ETH donations with real-time tracking
- **Fund Withdrawal**: Campaign creators can withdraw funds when goals are reached
- **Transparency**: All transactions are recorded on the blockchain
- **Security**: Smart contract ensures funds are only released when conditions are met

### Backend Integration

- **Blockchain Service**: Interacts with smart contracts using Ethers.js
- **API Routes**: RESTful endpoints for blockchain operations
- **Database Sync**: Keeps local database in sync with blockchain data

### Frontend Features

- **Real-time Updates**: Live campaign progress and donation tracking
- **Transaction History**: View all blockchain transactions
- **User-friendly Interface**: Easy donation and campaign management
- **Blockchain Status**: Network connection and wallet information

## 🔧 Available Scripts

### Blockchain Scripts

```bash
# Compile contracts
npm run compile

# Deploy contracts
npm run deploy

# Start network with test data
npm run start-network

# Run tests
npm run test

# Start local node
npm run node
```

### Backend Scripts

```bash
# Start server
npm start

# Development mode
npm run dev
```

### Frontend Scripts

```bash
# Start development server
npm start

# Build for production
npm run build
```

## 🧪 Testing the System

### 1. **Create a Campaign**

- Navigate to the blockchain dashboard
- Click "Create Campaign" (if available)
- Fill in campaign details
- Submit the transaction

### 2. **Make a Donation**

- Select a campaign
- Enter donation amount in ETH
- Click "Donate"
- Confirm the transaction

### 3. **Withdraw Funds**

- As a campaign creator
- Wait for goal to be reached
- Click "Withdraw Funds"
- Confirm the transaction

## 🔍 Troubleshooting

### Common Issues

1. **"Contract not found" error**
   - Ensure the contract is deployed
   - Check the contract address in environment variables

2. **"Network connection failed"**
   - Make sure Hardhat node is running
   - Check the network URL configuration

3. **"Transaction failed"**
   - Check account balance
   - Verify gas settings
   - Ensure contract is properly deployed

### Debug Commands

```bash
# Check Hardhat node status
curl http://localhost:8545

# View contract deployment logs
cd frontend/blockchain
npx hardhat console --network localhost
```

## 📚 Smart Contract Details

### Contract Address
The contract will be deployed to a local address (typically `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

### Key Functions

- `createCampaign(title, description, goal, deadline)`: Create a new campaign
- `donate(campaignId)`: Donate to a campaign
- `withdrawFunds(campaignId)`: Withdraw funds when goal is reached
- `getCampaign(campaignId)`: Get campaign details
- `getDonations(campaignId)`: Get donation history

### Events

- `CampaignCreated`: Emitted when a new campaign is created
- `DonationReceived`: Emitted when a donation is made
- `FundsWithdrawn`: Emitted when funds are withdrawn

## 🚀 Production Deployment

For production deployment:

1. **Deploy to Testnet**: Use Rinkeby or Goerli testnet
2. **Update Environment**: Update contract addresses
3. **Configure MetaMask**: Set up wallet connection
4. **Security Audit**: Review smart contract code
5. **Gas Optimization**: Optimize contract for lower gas costs

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all services are running
3. Ensure proper network configuration
4. Check account balances and permissions

## 🎉 Success!

Once everything is set up, you'll have a fully functional blockchain-powered crowdfunding platform with:

- ✅ Smart contract integration
- ✅ Real-time transaction tracking
- ✅ Secure fund management
- ✅ Transparent donation history
- ✅ User-friendly interface

Happy crowdfunding! 🚀



