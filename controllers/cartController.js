const Cart = require("../models/cart");
const Product = require("../models/products");

const getCart = async (req, res) => {
    const cart = await Cart.findOne({ user: req.userData.id })
        .populate("products.product");

    if (!cart) {
        return res.status(200).json({ message: "Cart not found", cart: [] });
    }

    res.status(200).json({ cart });
};

const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.userData.id });

    if (!cart) {
        // create a cart and add
        const newCart = await Cart.create({ user: req.userData.id, products: [{ product: productId, quantity }] });
        return res.status(200).json({ message: "Cart created", cart: newCart });
    }
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    cart.products.push({ product: productId, quantity });
    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
}


module.exports = { getCart, addToCart };