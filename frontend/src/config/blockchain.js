// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  NETWORK_URL: process.env.REACT_APP_NETWORK_URL || 'http://localhost:8545',
  CHAIN_ID: process.env.REACT_APP_CHAIN_ID || '1337',
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'
};

export default BLOCKCHAIN_CONFIG;





