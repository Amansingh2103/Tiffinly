import DeliveryDetails from '../models/deliveryDetailsModel.js';

// Create new delivery details
export const createDeliveryDetails = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if user is logged in - fix the user ID extraction
    let userId = null;
    let isGuest = true;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // If there's a token in the request, the user might be logged in
      try {
        // The verifyToken middleware should have already set req.user if token is valid
        if (req.user) {
          userId = req.user._id || req.user.id;
          isGuest = false;
          console.log('User is logged in with ID:', userId);
        }
      } catch (error) {
        console.error('Error extracting user ID from token:', error);
        // Continue as guest if token validation fails
      }
    }
    
    console.log('Creating delivery details with userId:', userId, 'isGuest:', isGuest);
    
    // Create new delivery details
    const deliveryDetails = new DeliveryDetails({
      userId,
      name,
      email,
      phone,
      address,
      isGuest
    });
    
    // If this is the first address for the user, make it default
    if (userId) {
      const existingAddresses = await DeliveryDetails.find({ userId });
      if (existingAddresses.length === 0) {
        deliveryDetails.isDefault = true;
      }
    }
    
    await deliveryDetails.save();
    
    res.status(201).json({
      success: true,
      message: 'Delivery details saved successfully',
      data: deliveryDetails
    });
  } catch (error) {
    console.error('Error creating delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save delivery details',
      error: error.message
    });
  }
};

// Get delivery details by ID
export const getDeliveryDetails = async (req, res) => {
  try {
    const deliveryDetails = await DeliveryDetails.findById(req.params.id);
    
    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Delivery details not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deliveryDetails
    });
  } catch (error) {
    console.error('Error getting delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery details',
      error: error.message
    });
  }
};

// Get all delivery details for a user
export const getUserDeliveryDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const deliveryDetails = await DeliveryDetails.find({ 
      userId,
      isGuest: false
    }).sort({ isDefault: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: deliveryDetails
    });
  } catch (error) {
    console.error('Error fetching user delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user delivery details',
      error: error.message
    });
  }
};

// Update delivery details
export const updateDeliveryDetails = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const deliveryDetailsId = req.params.id;
    
    // Find the delivery details
    const deliveryDetails = await DeliveryDetails.findById(deliveryDetailsId);
    
    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Delivery details not found'
      });
    }
    
    // Check if user owns these delivery details
    if (deliveryDetails.userId && deliveryDetails.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update these delivery details'
      });
    }
    
    // Update fields
    if (name) deliveryDetails.name = name;
    if (email) deliveryDetails.email = email;
    if (phone) deliveryDetails.phone = phone;
    if (address) deliveryDetails.address = address;
    
    await deliveryDetails.save();
    
    res.status(200).json({
      success: true,
      message: 'Delivery details updated successfully',
      data: deliveryDetails
    });
  } catch (error) {
    console.error('Error updating delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery details',
      error: error.message
    });
  }
};

// Delete delivery details
export const deleteDeliveryDetails = async (req, res) => {
  try {
    const deliveryDetailsId = req.params.id;
    
    // Find the delivery details
    const deliveryDetails = await DeliveryDetails.findById(deliveryDetailsId);
    
    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Delivery details not found'
      });
    }
    
    // Check if user owns these delivery details
    if (deliveryDetails.userId && deliveryDetails.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete these delivery details'
      });
    }
    
    // If this was the default address, set another one as default
    if (deliveryDetails.isDefault && deliveryDetails.userId) {
      const nextAddress = await DeliveryDetails.findOne({ 
        userId: deliveryDetails.userId,
        _id: { $ne: deliveryDetailsId }
      });
      
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
    
    await DeliveryDetails.findByIdAndDelete(deliveryDetailsId);
    
    res.status(200).json({
      success: true,
      message: 'Delivery details deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delivery details',
      error: error.message
    });
  }
};

// Set a delivery address as default
export const setDefaultDeliveryDetails = async (req, res) => {
  try {
    const deliveryDetailsId = req.params.id;
    const userId = req.user.id;
    
    // Find the delivery details
    const deliveryDetails = await DeliveryDetails.findById(deliveryDetailsId);
    
    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Delivery details not found'
      });
    }
    
    // Check if user owns these delivery details
    if (deliveryDetails.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update these delivery details'
      });
    }
    
    // Remove default status from all other addresses
    await DeliveryDetails.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } }
    );
    
    // Set this address as default
    deliveryDetails.isDefault = true;
    await deliveryDetails.save();
    
    res.status(200).json({
      success: true,
      message: 'Default delivery address updated successfully',
      data: deliveryDetails
    });
  } catch (error) {
    console.error('Error setting default delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default delivery details',
      error: error.message
    });
  }
}; 