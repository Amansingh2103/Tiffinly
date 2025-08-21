import mongoose from "mongoose";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import DeliveryDetails from "../models/deliveryDetailsModel.js";

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: "rzp_test_T7U7gGUDl7RQ8c",
  key_secret: "DO6GbpzxAAdSyaez3IYXFAmr"
});

// Create a new subscription
const createSubscription = async (req, res) => {
  try {
    console.log("Subscription request received:", req.body);
    console.log("User data:", req.user);
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'Active'
    });
    
    if (existingSubscription) {
      console.log("User already has active subscription:", existingSubscription._id);
      return res.status(400).json({ 
        success: false, 
        message: "You already have an active subscription. Please wait until your current subscription ends or cancel it before creating a new one."
      });
    }
    
    // Map the frequency value to match the enum in model
    let formattedFrequency = req.body.frequency;
    
    // Map the frontend values to the enum values in the model
    if (req.body.frequency === 'Monday to Friday') {
      formattedFrequency = 'Mon-Fri';
    } else if (req.body.frequency === 'Monday to Saturday') {
      formattedFrequency = 'Mon-Sat';
    }
    
    console.log("Formatted frequency:", formattedFrequency);
    
    // Add the authenticated user's ID to the subscription and update frequency
    const subscriptionData = {
      ...req.body,
      frequency: formattedFrequency,
      userId: req.user._id // Use the authenticated user's ID
    };
    
    console.log("Final subscription data:", subscriptionData);
    
    // Create the new subscription
    const subscription = await Subscription.create(subscriptionData);
    console.log("Subscription created successfully:", subscription._id);
    
    // Update the user's subscription status
    const updateResult = await User.findByIdAndUpdate(req.user._id, {
      subcribed: true // Note: using the field name as it exists in your model
    }, { new: true });
    
    console.log("User subscription status updated:", updateResult.subcribed);
    
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Subscription creation error details:", error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      }).join(', ');
      
      console.error("Validation errors:", validationErrors);
      return res.status(400).json({ 
        success: false, 
        message: `Validation error: ${validationErrors}`
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    // No need to explicitly get the User model again
    const subscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate('deliveryDetailsId');
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('deliveryDetailsId');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting subscription by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a subscription by ID
const updateSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID" });
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a subscription by ID
const deleteSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID" });
    }

    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get subscriptions for a specific user
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }
    
    const subscriptions = await Subscription.find({ userId });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active subscriptions for a specific user
const getActiveUserSubscriptions = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }
    
    const subscriptions = await Subscription.find({ 
      userId, 
      status: 'Active' 
    });
    
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a subscription
const cancelSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID" });
    }
    
    // Find the subscription
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    
    // Check if user owns this subscription or is admin
    const isOwner = subscription.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to cancel this subscription" 
      });
    }
    
    // Update status to Cancelled
    subscription.status = 'Cancelled';
    await subscription.save();
    
    // Update user's subscription status if this was their only active subscription
    const activeSubscriptionsCount = await Subscription.countDocuments({
      userId: subscription.userId,
      status: 'Active'
    });
    
    if (activeSubscriptionsCount === 0) {
      await User.findByIdAndUpdate(subscription.userId, {
        subcribed: false
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: subscription,
      message: "Subscription has been cancelled" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a subscription as complete
const completeSubscription = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Subscription ID" });
    }
    
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    
    // Only admins should be able to mark subscriptions complete
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only administrators can mark subscriptions as complete"
      });
    }
    
    // Update status to Completed
    subscription.status = 'Completed';
    await subscription.save();
    
    // Update user's subscription status if this was their only active subscription
    const activeSubscriptionsCount = await Subscription.countDocuments({
      userId: subscription.userId,
      status: 'Active'
    });
    
    if (activeSubscriptionsCount === 0) {
      await User.findByIdAndUpdate(subscription.userId, {
        subcribed: false
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription,
      message: "Subscription has been marked as completed"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a payment order for subscription
const createSubscriptionPayment = async (req, res) => {
  try {
    console.log("Received subscription payment request:", req.body);
    
    // Handle both logged-in and guest users
    let userId = null;
    if (req.user) {
      userId = req.user.id || req.user._id.toString();
      console.log("Creating subscription for logged-in user:", userId);
    } else {
      console.log("Creating subscription for guest user");
      
      // Validate guest info
      if (!req.body.guestInfo || !req.body.guestInfo.email || !req.body.guestInfo.name) {
        return res.status(400).json({
          success: false,
          message: "Guest user information is required"
        });
      }
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
      guestInfo,
      deliveryDetailsId
    } = req.body;
    
    // Validate required fields
    if (!mealPlan || !frequency || !quantity || !startDate || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required subscription details"
      });
    }
    
    // Extract the delivery details ID
    if (deliveryDetailsId) {
      const deliveryDetails = await DeliveryDetails.findById(deliveryDetailsId);
      if (!deliveryDetails) {
        return res.status(404).json({
          success: false,
          message: 'Delivery details not found'
        });
      }
    }
    
    // Create a subscription record (pending payment)
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
      active: false,
      paymentStatus: 'pending',
      deliveryDetailsId: deliveryDetailsId || null
    };
    
    // Add userId or guestInfo based on authentication status
    if (userId) {
      subscriptionData.userId = userId;
    } else if (guestInfo) {
      subscriptionData.guestInfo = guestInfo;
    }
    
    const newSubscription = new Subscription(subscriptionData);
    
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
      await Subscription.findByIdAndUpdate(subscriptionId, { 
        paymentStatus: 'failed' 
      });
      
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }
    
    // Update subscription status to active
    await Subscription.findByIdAndUpdate(subscriptionId, {
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

// Single export for all functions
export {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getUserSubscriptions,
  getActiveUserSubscriptions,
  cancelSubscription,
  completeSubscription,
  createSubscriptionPayment,
  verifySubscriptionPayment
};
