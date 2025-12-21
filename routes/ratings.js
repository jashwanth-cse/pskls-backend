const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleWare");
const Rating = require("../models/rating");
const Product = require("../models/products");

// Get ratings for a product
router.get("/:productId/ratings", async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate productId
        if (!productId || productId === 'undefined' || productId === 'null') {
            return res.status(200).json({
                ratings: [],
                averageRating: 0,
                totalRatings: 0
            });
        }

        // Check if it's a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(200).json({
                ratings: [],
                averageRating: 0,
                totalRatings: 0
            });
        }

        const ratings = await Rating.find({ product: productId })
            .populate('user', 'name');

        const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        res.status(200).json({
            ratings,
            averageRating: avgRating.toFixed(1),
            totalRatings: ratings.length
        });
    } catch (err) {
        console.error("Error fetching ratings:", err);
        res.status(500).json({ message: err.message });
    }
});

// Add or update rating for a product
router.post("/:productId/rate", authMiddleware, async (req, res) => {
    try {
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Check if product exists
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update or create rating
        const existingRating = await Rating.findOne({
            product: req.params.productId,
            user: req.user.id
        });

        if (existingRating) {
            existingRating.rating = rating;
            if (review) existingRating.review = review;
            await existingRating.save();

            return res.status(200).json({
                message: "Rating updated successfully",
                rating: existingRating
            });
        } else {
            const newRating = await Rating.create({
                product: req.params.productId,
                user: req.user.id,
                rating,
                review
            });

            return res.status(201).json({
                message: "Rating added successfully",
                rating: newRating
            });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
