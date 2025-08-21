import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import Razorpay from "razorpay";
import crypto from "crypto";
//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'http://localhost:5173';

const razorpay = new Razorpay({
    key_id: "rzp_test_T7U7gGUDl7RQ8c",
    key_secret: "DO6GbpzxAAdSyaez3IYXFAmr"
});



// Placing User Order
const placeOrder = async (req, res) => {
    try {
        console.log("Received Order Request:", req.body);
        console.log("Auth user info:", req.user); // Debug auth user info

        // Extract userId - handle different possible formats
        const userId = req.user?.id || req.user?._id || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found" });
        }
        
        const { items, amount, address } = req.body;
        
        if (!items || !amount || !address) {
            return res.status(400).json({ success: false, message: "Invalid order details" });
        }

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
        });

        await newOrder.save();
        // No need to clear cart yet as payment is pending
        
        const options = {
            amount: Number(amount) * 100, // Amount in paise
            currency: "INR",
            receipt: newOrder._id.toString()
        };

        console.log("Creating Razorpay Order:", options);

        const razorpayOrder = await razorpay.orders.create(options);
        if (!razorpayOrder) {
            throw new Error("Razorpay order creation failed");
        }

        console.log("Razorpay Order Created:", razorpayOrder);

        res.json({
            success: true,
            order_id: razorpayOrder.id,
            key_id: "rzp_test_T7U7gGUDl7RQ8c",
            amount: options.amount,
            currency: options.currency,
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Error placing order:", error.message);
        res.status(500).json({ success: false, message: error.message || "Error placing order" });
    }
};

// Verifying Payment
const verifyPayment = async (req, res) => {


    
    try {
        console.log("Received Payment Verification Request:", req.body);

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return res.status(400).json({ success: false, message: "Invalid payment details" });
        }

        const generated_signature = crypto
            .createHmac("sha256", "DO6GbpzxAAdSyaez3IYXFAmr")
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        console.log("Generated Signature:", generated_signature);
        console.log("Received Signature:", razorpay_signature);

        if (generated_signature !== razorpay_signature) {
            console.error("Payment verification failed");
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        await orderModel.findByIdAndUpdate(orderId, { payment: true });

        res.json({ success: true, message: "Payment verified" });

    } catch (error) {
        console.error("Error verifying payment:", error.message);
        res.status(500).json({ success: false, message: "Error verifying payment" });
    }
};


// Placing User Order for Frontend using stripe
const placeOrderCod = async (req, res) => {
    try {
        // Log detailed information for debugging
        console.log("Received order data:", req.body);
        console.log("Auth user info:", req.user);
        
        // Extract userId - handle different possible formats
        const userId = req.user?.id || req.user?._id || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found" });
        }
        
        // Check for other required fields
        if (!req.body.items || !req.body.amount || !req.body.address) {
            return res.status(400).json({ success: false, message: "Missing required order details" });
        }
        
        const newOrder = new orderModel({
            userId: userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.error("Error in placeOrderCod:", error);
        res.status(500).json({ success: false, message: error.message || "Error placing order" });
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        console.log("Fetching orders for user:", req.user.id);
        
        // Make sure we're using the right userId format
        const userId = req.user.id || req.user._id || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: "User ID not found" 
            });
        }
        
        // Fetch orders and sort by creation date (newest first)
        const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
        console.log(`Found ${orders.length} orders for user ${userId}`);
        
        res.json({ 
            success: true, 
            data: orders 
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching orders" 
        });
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }

}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }

}

export { placeOrder, listOrders, userOrders,verifyPayment, updateStatus, verifyOrder, placeOrderCod }