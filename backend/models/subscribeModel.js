import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Make optional since guest users don't have userId
  },
  mealPlan: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  pricePerMeal: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  
  // User details for both registered and guest users
  userDetails: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Legacy guest info field for backward compatibility
  guestInfo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Payment-related fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  orderId: {
    type: String
  },
  deliveryDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryDetails',
    required: false
  },
}, { 
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for end date
subscriptionSchema.virtual('endDate').get(function() {
  const endDate = new Date(this.startDate);
  endDate.setDate(endDate.getDate() + this.totalDays);
  return endDate;
});

// Static method to find active subscriptions for a user
subscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    userId: userId,
    status: "Active"
  });
};

// Instance method to calculate remaining days
subscriptionSchema.methods.calculateRemainingDays = function() {
  const today = new Date();
  const endDate = this.endDate;
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const subscriptionModel = mongoose.model("Subscription", subscriptionSchema);

export default subscriptionModel;
