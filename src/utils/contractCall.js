const { ethers } = require("ethers");

const presaleAddress = "0x335fFa5EA3bC32E55cEBA343618Ab2a4256f3f9a";
const rpcUrl = "https://bsc-dataseed.bnbchain.org";

const presaleAbi = [
  {
    inputs: [],
    name: "getTokenPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalTokensSold",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentRoundIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRounds",
    outputs: [{ internalType: "uint256", name: "_rounds", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalUsdAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLatestPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getRoundDetais",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "rate", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "soldToken", type: "uint256" },
        ],
        internalType: "struct Presale.Round",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
  try {
    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("Connected to BSC network\n");

    // Create contract instance
    const presaleContract = new ethers.Contract(
      presaleAddress,
      presaleAbi,
      provider
    );

    // Call contract functions
    console.log("=== Presale Contract Data ===\n");

    // Get owner
    const owner = await presaleContract.owner();
    console.log("Contract Owner:", owner);

    // Get token price
    const tokenPrice = await presaleContract.getTokenPrice();
    console.log("Token Price (raw):", tokenPrice.toString());
    console.log("Token Price (formatted):", ethers.formatUnits(tokenPrice, 18));

    // Get total tokens sold
    const totalSold = await presaleContract.totalTokensSold();
    console.log("Total Tokens Sold:", ethers.formatUnits(totalSold, 18));

    // Get current round index
    const currentRound = await presaleContract.getCurrentRoundIndex();
    console.log("Current Round Index:", currentRound.toString());

    // Get total rounds
    const totalRounds = await presaleContract.totalRounds();
    console.log("Total Rounds:", totalRounds.toString());

    // Get total USD amount raised
    const totalUsd = await presaleContract.totalUsdAmount();
    console.log("Total USD Amount:", ethers.formatUnits(totalUsd, 18));

    // Get BNB price from chainlink
    const bnbPrice = await presaleContract.getLatestPrice();
    console.log("BNB/USD Price:", ethers.formatUnits(bnbPrice, 8));

    // Get start time
    const startTime = await presaleContract.startTime();
    const startDate = new Date(Number(startTime) * 1000);
    console.log("Start Time:", startDate.toLocaleString());

    // Get current round details
    console.log("\n=== Current Round Details ===\n");
    const roundDetails = await presaleContract.getRoundDetais(currentRound);
    console.log("Rate:", roundDetails.rate.toString());
    console.log(
      "End Time:",
      new Date(Number(roundDetails.endTime) * 1000).toLocaleString()
    );
    console.log("Sold Token:", ethers.formatUnits(roundDetails.soldToken, 18));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();

