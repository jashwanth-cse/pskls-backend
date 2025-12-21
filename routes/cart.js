const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Product = require("../models/products");
const authMiddleware = require("../middlewares/authMiddleWare");
const { getSignedUrl } = require("../utils/gcs");

// Helper to process cart images
const processCartImages = async (cart) => {
  if (!cart) return null;
  const cartObj = cart.toObject ? cart.toObject() : cart;

  if (cartObj.products && cartObj.products.length > 0) {
    cartObj.products = await Promise.all(
      cartObj.products.map(async (item) => {
        if (item.product && item.product.img) {
          try {
            item.product.img = await getSignedUrl(item.product.img);
          } catch (err) {
            console.error(`Error signing URL for cart item ${item.product._id}:`, err.message);
          }
        }
        return item;
      })
    );
  }
  return cartObj;
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("products.product");
    if (!cart) {
      return res.status(200).json({ cart: { products: [] } });
    }
    const processedCart = await processCartImages(cart);
    res.status(200).json({ cart: processedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        products: [{ product: productId, quantity: quantity || 1 }]
      });
      // Re-fetch to populate if needed, or just return basic info. 
      // Usually frontend re-fetches or adds manually. 
      // For consistency, let's populate and sign.
      const newCart = await Cart.findById(cart._id).populate("products.product");
      const processedCart = await processCartImages(newCart);
      return res.status(201).json({ message: "Cart created", cart: processedCart });
    }

    const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
    if (productIndex > -1) {
      cart.products[productIndex].quantity += quantity || 1;
    } else {
      cart.products.push({ product: productId, quantity: quantity || 1 });
    }

    await cart.save();

    // Populate to sign URLs
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate("products.product");
    const processedCart = await processCartImages(updatedCart);

    res.status(200).json({ message: "Product added to cart", cart: processedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.products = cart.products.filter(p => p.product.toString() !== req.params.productId);
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user.id }).populate("products.product");
    const processedCart = await processCartImages(updatedCart);
    res.status(200).json({ cart: processedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:productId", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.products.findIndex(
      item => item.product.toString() === req.params.productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (cart.products[itemIndex].quantity > 1) {
      cart.products[itemIndex].quantity -= 1;
    } else {
      cart.products.splice(itemIndex, 1);
    }
-
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user.id })
      .populate("products.product");
    const processedCart = await processCartImages(updatedCart);

    res.status(200).json({ cart: processedCart });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;