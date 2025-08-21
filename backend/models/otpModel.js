import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (600 seconds)
  },
  userData: {
    type: Object,
    required: true // Store registration data
  }
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP; 