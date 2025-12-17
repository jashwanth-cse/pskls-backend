const express = require("express");
const router = express.Router();

const Order = require("../models/orders");
const Cart = require("../models/cart");
const authMiddleware = require("../middlewares/authMiddleWare");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("products.product");

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await Order.create({
      user: req.user.id,
      products: cart.products
    });

    cart.products = [];
    await cart.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("products.product");

    res.status(201).json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    }).populate("products.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch("/:orderId/increase/:productId", authMiddleware, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
  const item = order.products.find(p => p.product.toString() === req.params.productId);
  item.quantity += 1;
  await order.save();
  const updated = await Order.findById(order._id).populate("products.product");
  res.json({ order: updated });
});

router.patch("/:orderId/decrease/:productId", authMiddleware, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
  const index = order.products.findIndex(p => p.product.toString() === req.params.productId);
  if (order.products[index].quantity > 1) {
    order.products[index].quantity -= 1;
  }
  await order.save();
  const updated = await Order.findById(order._id).populate("products.product");
  res.json({ order: updated });
});
router.patch("/:orderId/place", authMiddleware, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.user.id
  });

  order.orderStatus = "placed";
  await order.save();

  const updated = await Order.findById(order._id)
    .populate("products.product");

  res.json({ order: updated });
});

module.exports = router;
