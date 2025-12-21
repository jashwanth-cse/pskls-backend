const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        storeName: { type: String, required: true },
        gstn: { type: String, required: true },
        location: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, default: "dealer" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Dealer", dealerSchema);
