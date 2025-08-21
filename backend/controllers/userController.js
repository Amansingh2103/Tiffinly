import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import User from "../models/userModel.js";
import OTP from '../models/otpModel.js';
import { sendOTPEmail } from '../utils/emailConfig.js';

//create token
const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
}

//login user
const loginUser = async (req,res) => {
    const {email, password} = req.body;
    try{
        // Add debug logs
        console.log(`Attempting login for email: ${email}`);
        
        const user = await User.findOne({email})

        if(!user){
            console.log(`No user found with email: ${email}`);
            return res.json({success:false,message: "User does not exist"})
        }

        console.log(`User found: ${user._id}, comparing passwords`);
        const isMatch = await bcrypt.compare(password, user.password)
        console.log(`Password match result: ${isMatch}`);

        if(!isMatch){
            return res.json({success:false,message: "Invalid credentials"})
        }

        const token = createToken(user._id)
        res.json({success:true,token})
    } catch (error) {
        console.log("Login error:", error);
        res.json({success:false,message:"Error"})
    }
}

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for registration
export const sendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store the OTP and user data
    await OTP.findOneAndDelete({ email }); // Remove any existing OTP
    
    await OTP.create({
      email,
      otp,
      userData: { name, email, password }
    });
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email'
      });
    } else {
      // If using the mock emailer, always return success and log the OTP
      console.log('----------------------------------------');
      console.log(`🔑 TEST OTP FOR ${email}: ${otp}`);
      console.log('----------------------------------------');
      
      return res.status(200).json({
        success: true,
        message: 'OTP sent to console (nodemailer not installed). Check server logs for OTP.'
      });
    }
  } catch (error) {
    console.error('Error in sendRegistrationOTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP and create user
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or not found. Please request a new OTP.'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // OTP is valid, create the user
    const { name, password } = otpRecord.userData;
    
    // Since we disabled the pre-save hook, hash the password here
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });
    
    // Delete the OTP record
    await OTP.findByIdAndDelete(otpRecord._id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error in verifyOTPAndRegister:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Find user by ID (for admin use)
export const findUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user by ID without returning the password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all users (for admin use)
export const getAllUsers = async (req, res) => {
  try {
    // Find all users, excluding password fields for security
    const users = await User.find().select('-password');
    
    return res.status(200).json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Add a backward compatibility function for registerUser
const registerUser = async (req, res) => {
  try {
    // For backward compatibility, redirect to OTP flow
    return res.status(400).json({
      success: false,
      message: "Direct registration is deprecated. Please use the OTP verification flow by calling /send-otp endpoint."
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update the export statement
export { loginUser, registerUser };

// Get user profile (requires authentication)
export const getUserProfile = async (req, res) => {
  try {
    // req.user comes from the auth middleware
    const userId = req.user._id;
    
    // Find the user by ID, excluding password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};