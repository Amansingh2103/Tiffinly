import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from headers - check both formats
    const token = req.headers.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
    console.log("Token received:", token);
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log("Invalid token value:", token);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No valid token provided.' 
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified, decoded:", decoded);
    
    // Find the user
    const user = await userModel.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or invalid token.' 
      });
    }
    
    // Add user to request object
    req.user = user;
    req.user.id = user._id.toString();  // Ensure id is a string
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed: ' + error.message 
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    // Check for token in different formats
    const token = req.headers.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
    // If no token, continue as guest
    if (!token || token === 'null' || token === 'undefined') {
      req.user = null;
      return next();
    }
    
    // Try to verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user
      const user = await userModel.findById(decoded.id).select('-password');
      
      if (user) {
        // Add user to request object
        req.user = user;
        req.user.id = user._id.toString();  // Ensure id is a string
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token invalid, but continue as guest
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue as guest in case of errors
    req.user = null;
    next();
  }
};

export { authMiddleware };
export default authMiddleware;