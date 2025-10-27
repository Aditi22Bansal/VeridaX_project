const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Hardhat Network...");
  
  // Get the default signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy the contract
  console.log("Deploying Crowdfunding contract...");
  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();
  
  await crowdfunding.waitForDeployment();
  const address = await crowdfunding.getAddress();
  
  console.log("✅ Crowdfunding contract deployed to:", address);
  console.log("📝 Contract ABI saved to backend/contracts/Crowdfunding.json");
  
  // Create some test campaigns
  console.log("Creating test campaigns...");
  
  const now = Math.floor(Date.now() / 1000);
  const oneWeekFromNow = now + (7 * 24 * 60 * 60);
  const twoWeeksFromNow = now + (14 * 24 * 60 * 60);
  
  // Create test campaign 1
  const tx1 = await crowdfunding.createCampaign(
    "Save the Ocean",
    "Help us clean up plastic waste from our oceans and protect marine life.",
    ethers.parseEther("10"), // 10 ETH goal
    oneWeekFromNow
  );
  await tx1.wait();
  console.log("✅ Test campaign 1 created");
  
  // Create test campaign 2
  const tx2 = await crowdfunding.createCampaign(
    "Plant Trees for Climate",
    "Plant 1000 trees to combat climate change and restore forests.",
    ethers.parseEther("5"), // 5 ETH goal
    twoWeeksFromNow
  );
  await tx2.wait();
  console.log("✅ Test campaign 2 created");
  
  // Create test campaign 3
  const tx3 = await crowdfunding.createCampaign(
    "Education for All",
    "Provide educational resources and scholarships for underprivileged children.",
    ethers.parseEther("15"), // 15 ETH goal
    twoWeeksFromNow
  );
  await tx3.wait();
  console.log("✅ Test campaign 3 created");
  
  console.log("\n🎉 Blockchain setup complete!");
  console.log("📋 Next steps:");
  console.log("1. Start the backend server: cd ../backend && npm start");
  console.log("2. Start the frontend: cd ../frontend && npm start");
  console.log("3. Visit http://localhost:3000/blockchain to see the dashboard");
  console.log("\n🔗 Contract Address:", address);
  console.log("🌐 Network URL: http://localhost:8545");
  console.log("⛓️  Chain ID: 1337");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



