import mongoose from 'mongoose';

// Check if the model already exists to prevent recompilation
const DeliveryDetails = mongoose.models.DeliveryDetails || mongoose.model('DeliveryDetails', new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest users
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

export default DeliveryDetails; 