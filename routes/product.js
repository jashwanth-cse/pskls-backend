const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const { uploadFile, getSignedUrl } = require('../utils/gcs');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// ✅ GET ALL PRODUCTS
router.get("/", async (req, res) => {
    try {
        let query = Product.find();
        if (req.query.limit) {
            query = query.limit(parseInt(req.query.limit));
        }
        const products = await query;

        const result = await Promise.all(
            products.map(async (p) => {
                let signedUrl = p.img;
                try {
                    if (p.img) {
                        signedUrl = await getSignedUrl(p.img);
                    }
                } catch (err) {
                    console.error(`Error generating signed URL for product ${p._id}:`, err.message);
                }
                return {
                    ...p.toObject(),
                    img: signedUrl
                };
            })
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product Not Found' });
        }

        const signedUrl = await getSignedUrl(product.img);

        res.json({
            ...product.toObject(),
            img: signedUrl
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ CREATE PRODUCT
router.post("/", upload.single('img'), async (req, res) => {
    try {
        console.log("Received product data:", req.body);
        console.log("Received file:", req.file ? req.file.originalname : "No file");

        let imagePath = '';
        if (req.file) {
            imagePath = await uploadFile(req.file);
        } else if (req.body.img) {
            imagePath = req.body.img;
        }

        const product = new Product({
            title: req.body.title,
            newPrice: req.body.newPrice,
            brand: req.body.brand,
            category: req.body.category,
            img: imagePath,
            description: req.body.description,
            netWeight: req.body.netWeight,
            productFeatures: req.body.productFeatures,
            directionToUse: req.body.directionToUse
        });

        console.log("Creating product with data:", product);
        const newProduct = await product.save();
        console.log("Product created successfully:", newProduct._id);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Error creating product:", err);
        console.error("Error details:", err.message);
        if (err.errors) {
            console.error("Validation errors:", err.errors);
        }
        res.status(400).json({
            message: err.message,
            errors: err.errors || {}
        });
    }
});

// ✅ DELETE PRODUCT
router.delete("/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
