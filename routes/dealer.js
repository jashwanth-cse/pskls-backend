const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleWare");
const Dealer = require("../models/dealers");

// Get dealer profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const dealer = await Dealer.findById(req.user.id).select('-password');
        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        res.status(200).json({ dealer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
