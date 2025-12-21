const express = require("express");
const { registerUser, loginUser, registerDealer, loginDealer } = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/dealer/register", registerDealer);
router.post("/dealer/login", loginDealer);

module.exports = router;
