const hre = require("hardhat");

async function main() {
  console.log("Deploying FoodSupplyChain contract...");

  const FoodSupplyChain = await hre.ethers.getContractFactory("FoodSupplyChain");
  const foodSupplyChain = await FoodSupplyChain.deploy();

  await foodSupplyChain.waitForDeployment();

  const address = await foodSupplyChain.getAddress();
  console.log("FoodSupplyChain deployed to:", address);

  console.log("\nSave this address to integrate with your frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
