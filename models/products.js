const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    newPrice: { type: String, required: true },
    oldPrice: String,
    discount: String,
    brand: String,
    category: String,
    img: String,
    description: { type: String, maxlength: 5000 },
    netWeight: String,
    productFeatures: String,
    directionToUse: String
});

module.exports = mongoose.model('Product', productSchema);
