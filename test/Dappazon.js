const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const GwaiToEth = (gwa) => {
  return gwa / 1 ** 18;
}

const Product = {
  id: 1,
  name: "Macbook M1 Pro",
  category: "Laptops",
  image: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202301?wid=452&hei=420&fmt=jpeg&qlt=95&.v=1671304673229",
  price: tokens(5),
  rating: 5,
  stock: 10
}

describe("Dappazon", () => {

  let Dappazon, Contract;
  let deployer, buyer;

  beforeEach(async () => {
    Contract = await ethers.getContractFactory('Dappazon');
    Dappazon = await Contract.deploy();
    accounts = await ethers.getSigners();
    [deployer, buyer] = accounts;
  });

  describe("Deployment", () => {

    it("Sets the owner", async () => {
      expect(await Dappazon.owner()).to.equal(deployer.address)
    });
    
  });

  describe("Listing products", () => {

    beforeEach(async () => {
      const transaction = await Dappazon.connect(deployer).list(...Object.values(Product));
      await transaction.wait();
    })

    it("Add new product/item", async () => {
      const item = await Dappazon.items(1);
      expect(item.id).to.equal(1);
      expect(item.name).to.equal(Product.name);
      expect(item.category).to.equal(Product.category);
      expect(item.price).to.equal(Product.price);
      expect(item.rating).to.equal(Product.rating);
      expect(item.stock).to.equal(Product.stock);
    });

    it("Should emit the event", async () => {
      await expect(Dappazon.list(...Object.values(Product)))
      .to.emit(Dappazon, "List")
      .withArgs(Product.name, Product.price, Product.stock);
    });

  });

  describe("Buying product", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await Dappazon.connect(deployer).list(...Object.values(Product));
      await transaction.wait();

      transaction = await Dappazon.connect(buyer).buy(Product.id, { value: Product.price });
    })

    it("Update the contract balance", async () => {
      const result = await ethers.provider.getBalance(Dappazon.address)
      expect(result).to.equal(Product.price);
    });

    it("Update buyer's order count", async () => {
      const result = await Dappazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    });

    it("Should have one order", async () => {
      const orderCount = await Dappazon.orderCount(buyer.address);
      const order = await Dappazon.orders(buyer.address, orderCount);
      const orderItem = order.item
      expect(order.timestamp).to.be.greaterThan(1512918335)
      expect(orderItem.name).to.equal(Product.name);
      expect(orderItem.price).to.equal(Product.price);
      expect(orderItem.rating).to.equal(Product.rating);
    });

    it("Should emit Buy event", async () => {
      expect(await Dappazon.buy(Product.id, { value: Product.price })).to.emit(Dappazon, "Buy")     
      expect(await Dappazon.buy(Product.id, { value: Product.price })).to.emit(Dappazon, "BuyOrder")     
    });

  });

  describe("Withdrawing", () => {

    let transaction, balanceBefore;

    beforeEach(async () => {
      transaction = await Dappazon.connect(deployer).list(...Object.values(Product));
      await transaction.wait();

      transaction = await Dappazon.connect(buyer).buy(Product.id, { value: Product.price });
      balanceBefore = await ethers.provider.getBalance(deployer.address);
    });

    it("Owner should withdraw contract balance", async () => {
      transaction = await Dappazon.connect(deployer).withdraw();
      await transaction.wait();
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(GwaiToEth(balanceAfter - balanceBefore)).to.be.lessThan(GwaiToEth(Product.price));
    });

  });

})
