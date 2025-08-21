import express from 'express';
import { 
  createDeliveryDetails, 
  getDeliveryDetails, 
  updateDeliveryDetails, 
  deleteDeliveryDetails,
  getUserDeliveryDetails,
  setDefaultDeliveryDetails
} from '../controllers/deliveryDetailsController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create delivery details (works for both logged in and guest users)
router.post('/', optionalAuth, createDeliveryDetails);

// Get delivery details by ID
router.get('/:id', getDeliveryDetails);

// Get all delivery details for a user (requires authentication)
router.get('/user/all', verifyToken, getUserDeliveryDetails);

// Update delivery details
router.put('/:id', verifyToken, updateDeliveryDetails);

// Delete delivery details
router.delete('/:id', verifyToken, deleteDeliveryDetails);

// Set a delivery address as default
router.put('/:id/set-default', verifyToken, setDefaultDeliveryDetails);

export default router; 