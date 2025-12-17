/*const http = require('http');
const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === '/') {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ message: "Hello World" }))
    }
    else if(req.method==='GET'&& req.url==='/about'){
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ message: "About Page" }))
    }
    else{
        res.writeHead(404, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ message: "Page Not Found" }))
    }

})
server.listen(3000, () => {
    console.log("Server is running on port 3000")
})*/
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const productRouter = require('./routes/product');
const app = express();
const cors = require("cors")
const connectDB = require('./config/db');
const authRoutes = require("./routes/auth");
const authMiddleware = require('./middlewares/authMiddleWare');
const User = require("./models/users");

const PORT = process.env.PORT || 3000;

connectDB();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
})
app.get("/", (req, res) => {
    res.json({ message: "Express Response" });
});

// About route
app.get("/about", (req, res) => {
    res.json({ message: "About Express, Actually Express is a Superfast Express" });
});

// Get all products

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use("/products", productRouter);
app.use("/api/auth", authRoutes);

app.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ msg: "Profile", userData: user });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});
const cartRouter = require('./routes/cart');
app.use("/cart", cartRouter);
const orderRouter=require("./routes/order")
app.use("/order", orderRouter);

