const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: String
}, { timestamps: true });

// Ensure one rating per user per product
ratingSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
