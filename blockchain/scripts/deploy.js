const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Crowdfunding contract...");

  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();

  await crowdfunding.waitForDeployment();

  const address = await crowdfunding.getAddress();
  console.log("Crowdfunding contract deployed to:", address);

  // Save contract address to .env file
  const fs = require('fs');
  const envContent = `CONTRACT_ADDRESS=${address}\nNETWORK_URL=http://localhost:8545\nCHAIN_ID=1337`;
  fs.writeFileSync('.env', envContent);
  
  console.log("Contract address saved to .env file");
  console.log("You can now interact with the contract at:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

