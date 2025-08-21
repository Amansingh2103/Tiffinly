import Razorpay from "razorpay";
import crypto from "crypto";
import subscriptionModel from "../models/subscriptionModel.js";

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: "rzp_test_T7U7gGUDl7RQ8c",
  key_secret: "DO6GbpzxAAdSyaez3IYXFAmr"
});

// Create a payment order for subscription
const createSubscriptionPayment = async (req, res) => {
  try {
    console.log("Received subscription payment request:", req.body);
    
    // Extract userId from authenticated user or use guest info
    let userId;
    
    if (req.user) {
      userId = req.user.id || req.user._id.toString();
    }
    
    // Get subscription details from request
    const {
      mealPlan,
      frequency,
      quantity,
      startDate,
      totalDays,
      totalItems,
      pricePerMeal,
      subtotal,
      discount,
      totalAmount,
      userDetails // Get the user details passed from frontend
    } = req.body;
    
    // Validate required fields
    if (!mealPlan || !frequency || !quantity || !startDate || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required subscription details"
      });
    }
    
    // Validate userDetails are provided
    if (!userDetails || !userDetails.name || !userDetails.email || !userDetails.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required user details"
      });
    }
    
    // Create subscription data object
    const subscriptionData = {
      mealPlan,
      frequency,
      quantity,
      startDate,
      totalDays,
      totalItems,
      pricePerMeal,
      subtotal,
      discount,
      totalAmount,
      active: false, // Will be activated after payment
      paymentStatus: 'pending'
    };
    
    // Add user information - either as userId for registered users or as userDetails
    if (userId) {
      subscriptionData.userId = userId;
    }
    
    // Always store the user details for consistency
    subscriptionData.userDetails = userDetails;
    
    // Create a subscription record
    const newSubscription = new subscriptionModel(subscriptionData);
    
    await newSubscription.save();
    
    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // Amount in smallest currency unit (paise)
      currency: "INR",
      receipt: newSubscription._id.toString()
    };
    
    console.log("Creating Razorpay order:", options);
    
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
      subscriptionId: newSubscription._id
    });
    
  } catch (error) {
    console.error("Error creating subscription payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating subscription payment"
    });
  }
};

// Verify payment for subscription
const verifySubscriptionPayment = async (req, res) => {
  try {
    console.log("Received subscription payment verification request:", req.body);
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      subscriptionId 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details"
      });
    }
    
    // Generate signature and verify
    const generatedSignature = crypto
      .createHmac("sha256", "DO6GbpzxAAdSyaez3IYXFAmr")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
      
    console.log("Generated signature:", generatedSignature);
    console.log("Received signature:", razorpay_signature);
    
    if (generatedSignature !== razorpay_signature) {
      console.error("Payment verification failed");
      await subscriptionModel.findByIdAndUpdate(subscriptionId, { 
        paymentStatus: 'failed' 
      });
      
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }
    
    // Update subscription status to active
    await subscriptionModel.findByIdAndUpdate(subscriptionId, {
      active: true,
      paymentStatus: 'completed',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
    
    res.json({
      success: true,
      message: "Payment verified and subscription activated"
    });
    
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error verifying subscription payment"
    });
  }
};

// Get subscriptions for the current user
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id.toString();
    
    const subscriptions = await subscriptionModel.find({ userId, active: true })
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching subscriptions"
    });
  }
};

// Get a specific subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await subscriptionModel.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }
    
    // If user is not admin, verify they own this subscription
    if (!req.user.isAdmin && subscription.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this subscription"
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching subscription"
    });
  }
};

export { 
  createSubscriptionPayment, 
  verifySubscriptionPayment,
  getUserSubscriptions,
  getSubscriptionById
}; 