const express = require("express");
const router = express.Router();

const Order = require("../models/orders");
const Cart = require("../models/cart");
const authMiddleware = require("../middlewares/authMiddleWare");
const { getSignedUrl } = require("../utils/gcs");

// Helper to process a single order's images
const processOrderImages = async (order) => {
  if (!order) return null;
  const orderObj = order.toObject ? order.toObject() : order;

  if (orderObj.products && orderObj.products.length > 0) {
    orderObj.products = await Promise.all(
      orderObj.products.map(async (item) => {
        if (item.product && item.product.img) {
          try {
            item.product.img = await getSignedUrl(item.product.img);
          } catch (err) {
            console.error(`Error signing URL for order item ${item.product._id}:`, err.message);
          }
        }
        return item;
      })
    );
  }
  return orderObj;
};

// Helper for array of orders
const processOrdersArray = async (orders) => {
  return Promise.all(orders.map(order => processOrderImages(order)));
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("products.product");

    const processedOrders = await processOrdersArray(orders);
    res.status(200).json({ orders: processedOrders });
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

    const processedOrder = await processOrderImages(updatedOrder);

    res.status(201).json({ order: processedOrder });
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

    const processedOrder = await processOrderImages(order);
    res.status(200).json({ order: processedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:orderId/increase/:productId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    const item = order.products.find(p => p.product.toString() === req.params.productId);
    item.quantity += 1;
    await order.save();
    const updated = await Order.findById(order._id).populate("products.product");
    const processed = await processOrderImages(updated);
    res.json({ order: processed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:orderId/decrease/:productId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    const index = order.products.findIndex(p => p.product.toString() === req.params.productId);
    if (order.products[index].quantity > 1) {
      order.products[index].quantity -= 1;
    }
    await order.save();
    const updated = await Order.findById(order._id).populate("products.product");
    const processed = await processOrderImages(updated);
    res.json({ order: processed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:orderId/place", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    order.orderStatus = "placed";
    await order.save();

    const updated = await Order.findById(order._id)
      .populate("products.product");

    const processed = await processOrderImages(updated);

    res.json({ order: processed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
