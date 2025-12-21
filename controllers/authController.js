const User = require("../models/users.js");
const Dealer = require("../models/dealers.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body; // Allow role in body (optional but good for testing)

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user' // Default to user if not provided
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "User creation failed",
            error: err.message
        });
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });

        // Strict Role Checking Logic
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If trying to login as Admin
        if (role === 'admin') {
            if (user.role !== 'admin') {
                return res.status(403).json({ message: "Invalid admin credentials" });
            }
        }

        // If trying to login as User
        else if (role === 'user') {
            if (user.role !== 'user') {
                // Silently fail if an admin/other role tries to login as user
                return res.status(404).json({ message: "User not found" });
            }
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const SECRET_KEY = process.env.JWT_SECRET;
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            role: user.role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "Login failed",
            error: err.message
        });
    }
};

const registerDealer = async (req, res) => {
    try {
        const { name, mobile, email, storeName, gstn, location, password } = req.body;

        // Basic Validations
        if (!name || !mobile || !email || !storeName || !gstn || !location || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (mobile.length !== 10) {
            return res.status(400).json({ message: "Mobile number must be 10 digits" });
        }

        if (gstn.length < 15 || gstn.length > 17) {
            return res.status(400).json({ message: "GSTN must be between 15 and 17 characters" });
        }

        const existingDealer = await Dealer.findOne({ email });
        if (existingDealer) {
            return res.status(400).json({ message: "Dealer with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newDealer = await Dealer.create({
            name,
            mobile,
            email,
            storeName,
            gstn,
            location,
            password: hashedPassword,
            role: 'dealer'
        });

        res.status(201).json({
            message: "Dealer registered successfully",
            dealer: {
                id: newDealer._id,
                name: newDealer.name,
                email: newDealer.email,
                storeName: newDealer.storeName,
                role: newDealer.role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "Dealer registration failed",
            error: err.message
        });
    }
};

const loginDealer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const dealer = await Dealer.findOne({ email });
        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        const isMatch = await bcrypt.compare(password, dealer.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const SECRET_KEY = process.env.JWT_SECRET;
        const token = jwt.sign(
            { id: dealer._id, email: dealer.email, role: dealer.role },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Dealer Login successful",
            token,
            role: dealer.role,
            dealer: {
                id: dealer._id,
                name: dealer.name,
                email: dealer.email,
                storeName: dealer.storeName,
                role: dealer.role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "Dealer Login failed",
            error: err.message
        });
    }
};

module.exports = { registerUser, loginUser, registerDealer, loginDealer };
