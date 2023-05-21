// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const { items } = require("../src/items.json")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {

  const [deployer] = await ethers.getSigners();

  const contract = await hre.ethers.getContractFactory("Dappazon");
  const dappazon = await contract.deploy();
  await dappazon.deployed();

  items.forEach(async (item) => {
    const transaction = await dappazon.connect(deployer).list(
      item.id,
      item.name,
      item.category,
      item.image,
      tokens(item.price),
      item.rating,
      item.stock,
    );

    await transaction.wait();
    console.log(`Listed ${item.id} ${item.name}..`)
  })

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
