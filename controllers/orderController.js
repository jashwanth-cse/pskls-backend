const Order = require("../models/orders");
const Cart = require("../models/cart");

const placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const newOrder = await Order.create({
      user: req.user.id,
      products: cart.products
    });

    cart.products = [];
    await cart.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
