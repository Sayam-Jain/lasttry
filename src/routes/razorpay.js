const express = require('express');
const router = express.Router();
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Store these in your .env file
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order route
router.post("/create-order", async (req, res) => {
    const { amount } = req.body; // amount in paise (INR)

    try {
        const options = {
            amount: amount, // amount in the smallest currency unit (e.g., 1000 paise for ₹10)
            currency: "INR",
            receipt: "order_rcptid_11",
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong." });
    }
});

module.exports = router
