// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
   string public name;
   address public owner;

   constructor() {
      name = "Dappazon";
      owner = msg.sender;
   }

   modifier onlyOwner {
      require(msg.sender == owner, "Only owner of this smart contract can perform this operation. ");
      _;
   }

   struct Item {
      uint256 id;
      string name;
      string category;
      string image;
      uint256 price;
      uint256 rating;
      uint256 stock;
   }

   struct Order {
      uint256 timestamp;
      Item item;
   }

   mapping (uint256 => Item) public items;
   mapping(address => uint256) public orderCount;
   mapping(address => mapping(uint256 => Order)) public orders;

   event List(string name, uint256 price, uint256 quantity);
   event Buy(address buyer, uint256 orderId, uint256 itemId);
   event BuyOrder(address buyer, Order order);

   // List products
   function list(
      uint256 _id,
      string memory _name,
      string memory _category,
      string memory _image,
      uint256 _price,
      uint256 _rating,
      uint256 _stock
   ) public onlyOwner {
      Item memory item = Item(_id, _name, _category, _image, _price, _rating, _stock);
      items[_id] = item;
      emit List(_name, _price, _stock);
   }

   // Buy products
   function buy(uint256 _id) public payable {

      Item memory item = items[_id];

      require(msg.value >= item.price, "Please pay enough item price");
      require(item.stock > 0, "Product is out of stock");

      Order memory order = Order(block.timestamp, item);

      orderCount[msg.sender]++;
      orders[msg.sender][orderCount[msg.sender]] = order;
      items[_id].stock = item.stock - 1;

      emit Buy(msg.sender, orderCount[msg.sender], _id);
      emit BuyOrder(msg.sender, order);
   }

   // Withdraw funds for owner
   function withdraw() public onlyOwner {
      (bool success, ) = owner.call{value: address(this).balance}("");
      require(success);
   }

}
