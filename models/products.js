const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    title: { type: String, required: true },
    newPrice: { type: String, required: true },
    oldPrice: String,
    discount: String,
    brand: String,
    img: String
});

module.exports = mongoose.model('Product', productSchema);
