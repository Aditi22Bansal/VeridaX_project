// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Campaign {
        address creator;
        string title;
        string description;
        uint goal;
        uint amountRaised;
        bool isCompleted;
        uint deadline;
        bool exists;
    }

    struct Donation {
        address donor;
        uint amount;
        uint timestamp;
    }

    mapping(uint => Campaign) public campaigns;
    mapping(uint => Donation[]) public donations;
    mapping(address => uint[]) public userCampaigns;
    mapping(address => uint[]) public userDonations;
    
    uint public campaignCount;
    address public owner;
    
    event CampaignCreated(uint campaignId, address creator, string title, uint goal, uint deadline);
    event DonationReceived(uint campaignId, address donor, uint amount);
    event FundsWithdrawn(uint campaignId, address creator, uint amount);
    event CampaignCompleted(uint campaignId, uint amountRaised);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier campaignExists(uint _campaignId) {
        require(campaigns[_campaignId].exists, "Campaign does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createCampaign(
        string memory _title, 
        string memory _description, 
        uint _goal,
        uint _deadline
    ) public {
        require(_goal > 0, "Goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            amountRaised: 0,
            isCompleted: false,
            deadline: _deadline,
            exists: true
        });
        
        userCampaigns[msg.sender].push(campaignCount);
        
        emit CampaignCreated(campaignCount, msg.sender, _title, _goal, _deadline);
    }

    function donate(uint _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.exists, "Campaign does not exist");
        require(!campaign.isCompleted, "Campaign already completed");
        require(block.timestamp <= campaign.deadline, "Campaign deadline has passed");
        require(msg.value > 0, "Donation must be greater than 0");

        campaign.amountRaised += msg.value;
        donations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        userDonations[msg.sender].push(_campaignId);
        
        emit DonationReceived(_campaignId, msg.sender, msg.value);

        // Check if goal is reached or deadline passed
        if (campaign.amountRaised >= campaign.goal || block.timestamp >= campaign.deadline) {
            campaign.isCompleted = true;
            emit CampaignCompleted(_campaignId, campaign.amountRaised);
        }
    }

    function withdrawFunds(uint _campaignId) public campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.isCompleted, "Campaign not completed yet");
        require(campaign.amountRaised > 0, "No funds to withdraw");
        
        uint amount = campaign.amountRaised;
        campaign.amountRaised = 0;
        
        payable(campaign.creator).transfer(amount);
        emit FundsWithdrawn(_campaignId, campaign.creator, amount);
    }

    function getDonations(uint _campaignId) public view campaignExists(_campaignId) returns (Donation[] memory) {
        return donations[_campaignId];
    }

    function getCampaign(uint _campaignId) public view campaignExists(_campaignId) returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function getUserCampaigns(address _user) public view returns (uint[] memory) {
        return userCampaigns[_user];
    }

    function getUserDonations(address _user) public view returns (uint[] memory) {
        return userDonations[_user];
    }

    function getCampaignCount() public view returns (uint) {
        return campaignCount;
    }

    function isCampaignCompleted(uint _campaignId) public view campaignExists(_campaignId) returns (bool) {
        Campaign memory campaign = campaigns[_campaignId];
        return campaign.isCompleted || 
               campaign.amountRaised >= campaign.goal || 
               block.timestamp >= campaign.deadline;
    }

    // Emergency function to withdraw funds if campaign fails
    function emergencyWithdraw(uint _campaignId) public campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp > campaign.deadline, "Campaign deadline not reached");
        require(campaign.amountRaised < campaign.goal, "Goal was reached");
        require(campaign.amountRaised > 0, "No funds to withdraw");
        
        uint amount = campaign.amountRaised;
        campaign.amountRaised = 0;
        
        payable(campaign.creator).transfer(amount);
        emit FundsWithdrawn(_campaignId, campaign.creator, amount);
    }
}

