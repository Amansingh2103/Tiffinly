import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Subscriptions.css';
import { useNavigate, Link } from 'react-router-dom';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [users, setUsers] = useState({});
  const [deliveryDetails, setDeliveryDetails] = useState({});
  const [showModal, setShowModal] = useState(false);
  const apiBaseUrl = 'http://localhost:4000';
  const navigate = useNavigate();
  const [formTab, setFormTab] = useState('subscription');
  const [formMode, setFormMode] = useState('create');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get admin token - try multiple possible storage keys
      const token = localStorage.getItem('adminToken') || 
                   localStorage.getItem('token');
      
      // Log token status for debugging                 
      console.log("Using token:", token ? "Token exists" : "No token found");
      
      // Make the API request with token
      const response = await axios.get(`${apiBaseUrl}/api/subscribe`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Subscription response:', response.data);
      
      if (response.data.success) {
        const subscriptionData = response.data.data || [];
        console.log(`Fetched ${subscriptionData.length} subscriptions`);
        
        // Log the first subscription data structure to see what fields are available
        if (subscriptionData.length > 0) {
          console.log("Example subscription data structure:", JSON.stringify(subscriptionData[0], null, 2));
        }
        
        // Check for user details in subscriptions
        let hasUserDetails = false;
        let hasGuestInfo = false;
        
        subscriptionData.forEach(sub => {
          if (sub.userDetails) hasUserDetails = true;
          if (sub.guestInfo) hasGuestInfo = true;
        });
        
        console.log(`Subscriptions with userDetails: ${hasUserDetails}, with guestInfo: ${hasGuestInfo}`);
        
        setSubscriptions(subscriptionData);
        
        // Extract unique user IDs from subscriptions
        const userIds = [...new Set(subscriptionData
          .filter(sub => sub.userId) // Only include subs with userId
          .map(sub => typeof sub.userId === 'object' ? sub.userId._id : sub.userId))];
          
        console.log(`Found ${userIds.length} unique users in subscriptions`);
        
        if (userIds.length > 0) {
          await fetchUserDetails(userIds);
        }
        
        // Extract unique delivery detail IDs from subscriptions
        const deliveryIds = subscriptionData
          .filter(sub => sub.deliveryDetailsId)
          .map(sub => typeof sub.deliveryDetailsId === 'object' ? 
               sub.deliveryDetailsId._id : sub.deliveryDetailsId);
        
        if (deliveryIds.length > 0) {
          await fetchDeliveryDetails(deliveryIds);
        }
      } else {
        console.error('API returned success:false', response.data);
        setError(response.data.message || "Failed to fetch subscriptions");
        toast.error('Failed to load subscriptions: ' + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError(error.response?.data?.message || error.message || "An error occurred");
      toast.error('Error: ' + (error.response?.data?.message || error.message || "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  };
  
  // Add refresh button handler
  const handleRefresh = () => {
    fetchSubscriptions();
  };

  const fetchUserDetails = async (userIds) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        console.warn("No token available for user details fetch");
        return;
      }
      
      const userDetails = {};
      
      // Fetch each user individually to handle potential errors with specific users
      for (const userId of userIds) {
        try {
          const response = await axios.get(`${apiBaseUrl}/api/user/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            userDetails[userId] = response.data.data;
          }
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
        }
      }
      
      setUsers(userDetails);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchDeliveryDetails = async (deliveryIds) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const deliveryData = {};
      
      // Fetch each delivery detail individually
      for (const deliveryId of deliveryIds) {
        try {
          const response = await axios.get(`${apiBaseUrl}/api/delivery/${deliveryId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            deliveryData[deliveryId] = response.data.data;
          }
        } catch (err) {
          console.error(`Error fetching delivery details ${deliveryId}:`, err);
        }
      }
      
      setDeliveryDetails(deliveryData);
    } catch (error) {
      console.error('Error fetching delivery details:', error);
    }
  };

  // Simplified and more reliable getUserName function
  const getUserName = (userId) => {
    // Return name if we have user data, otherwise return the ID
    return users[userId]?.name || userId;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    
    try {
      await axios.delete(`${apiBaseUrl}/api/subscribe/${id}`);
      toast.success('Subscription deleted successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const handleEdit = (subscription) => {
    setEditingId(subscription._id);
    setFormTab('subscription'); // Default to subscription tab
    
    // Get comprehensive user info from our helper function
    const userInfo = getUserInfo(subscription);
    
    console.log("Editing subscription:", subscription);
    console.log("User info for form:", userInfo);
    
    // Create a clean object with only relevant user fields
    const userFormData = {
      name: userInfo.name || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      address: userInfo.address || ''
    };
    
    // Preserve original data information
    const sourceData = {
      source: userInfo.source,
      userId: subscription.userId,
      hasUserDetails: !!subscription.userDetails,
      hasGuestInfo: !!subscription.guestInfo
    };
    
    // Create the complete form data
    setFormData({
      ...subscription,
      userInfo: userFormData,
      sourceData: sourceData
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting edited subscription data:", formData);
      
      // Extract userInfo and sourceData from form data before sending
      const { userInfo, sourceData, ...subscriptionData } = formData;
      
      // Determine whether to update userDetails or guestInfo
      let dataToSend = { ...subscriptionData };
      
      // If we have user info, always store it in userDetails (our new consistent approach)
      if (userInfo) {
        dataToSend.userDetails = userInfo;
        
        // For backward compatibility, maintain guestInfo if it existed before
        if (sourceData && sourceData.hasGuestInfo) {
          dataToSend.guestInfo = userInfo;
        }
      }
      
      console.log("Sending updated subscription data:", dataToSend);
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await axios.put(
        `${apiBaseUrl}/api/subscribe/${editingId}`, 
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Subscription updated successfully');
        fetchSubscriptions();
        setEditingId(null);
        setFormData({});
      } else {
        console.error('API returned success:false', response.data);
        toast.error('Failed to update subscription: ' + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      
      // More detailed error reporting
      if (error.response) {
        console.error('Server error response:', error.response.data);
        toast.error(`Failed to update: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        toast.error('No response from server. Check your connection.');
      } else {
        toast.error('Failed to update subscription: ' + error.message);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Cancelled': return 'status-cancelled';
      case 'Completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'payment-completed';
      case 'failed': return 'payment-failed';
      default: return 'payment-pending';
    }
  };

  // Add function to navigate to user profile
  const handleViewUserProfile = (userId) => {
    if (!userId) return;
    
    toast.info("Navigating to user profile is not implemented yet.");
    // You can implement navigation to user profile page when it's available
    // navigate(`/admin/users/${userId}`);
  };

  // Update the getUserInfo function to prioritize the userDetails field
  const getUserInfo = (subscription) => {
    // First priority: userDetails field directly from subscription
    if (subscription.userDetails && (subscription.userDetails.name || subscription.userDetails.email || subscription.userDetails.phone)) {
      return {
        name: subscription.userDetails.name || 'Unnamed',
        email: subscription.userDetails.email || '',
        phone: subscription.userDetails.phone || '',
        address: subscription.userDetails.address || '',
        source: 'subscription_details'
      };
    }
    
    // Second priority: for backward compatibility - check guestInfo for older records
    if (subscription.guestInfo && (subscription.guestInfo.name || subscription.guestInfo.email || subscription.guestInfo.phone)) {
      return {
        name: subscription.guestInfo.name || 'Guest User',
        email: subscription.guestInfo.email || '',
        phone: subscription.guestInfo.phone || '',
        address: subscription.guestInfo.address || '',
        source: 'guest_info'
      };
    }
    
    // Third priority: user data from users collection if userId exists
    if (subscription.userId && users[subscription.userId]) {
      return {
        name: users[subscription.userId].name || 'Registered User',
        email: users[subscription.userId].email || '',
        phone: users[subscription.userId].phone || '',
        address: users[subscription.userId].address || '',
        userId: subscription.userId,
        source: 'user_database'
      };
    }
    
    // Fallback: just return userId if available or indicate unknown
    if (subscription.userId) {
      return {
        name: `User ID: ${subscription.userId}`,
        email: '',
        source: 'user_id_only'
      };
    }
    
    // Last resort: unknown user
    return {
      name: 'Unknown User',
      email: 'No user information available',
      source: 'unknown'
    };
  };

  // Update the renderUserDetails function to handle populated data
  const renderUserDetails = (subscription) => {
    // First check if we have populated userId data
    if (subscription.userId && typeof subscription.userId === 'object') {
      const user = subscription.userId;
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {user.name}
            <span className="subscription-badge">Registered User</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {user.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {user.phone || 'Not provided'}
          </div>
          {user._id && (
            <div className="detail-item">
              <strong>User ID:</strong> {user._id}
            </div>
          )}
          <div className="source-info">Data from user account</div>
        </>
      );
    }
    
    // Next check if we have the user in our state
    else if (subscription.userId && users[subscription.userId]) {
      const user = users[subscription.userId];
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {user.name}
            <span className="subscription-badge">Registered User</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {user.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {user.phone || 'Not provided'}
          </div>
          {user._id && (
            <div className="detail-item">
              <strong>User ID:</strong> {user._id}
            </div>
          )}
          <div className="source-info">Data from user database</div>
        </>
      );
    }
    
    // Check for userDetails in the subscription
    else if (subscription.userDetails && subscription.userDetails.name) {
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {subscription.userDetails.name}
            <span className="subscription-badge">Subscription Form</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {subscription.userDetails.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {subscription.userDetails.phone || 'Not provided'}
          </div>
          {subscription.userId && (
            <div className="detail-item">
              <strong>User ID:</strong> {subscription.userId}
            </div>
          )}
          <div className="source-info">Data from subscription details</div>
        </>
      );
    }
    
    // Check for legacy guestInfo
    else if (subscription.guestInfo && subscription.guestInfo.name) {
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {subscription.guestInfo.name}
            <span className="guest-badge">Guest</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {subscription.guestInfo.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {subscription.guestInfo.phone || 'Not provided'}
          </div>
          <div className="source-info">Data from guest checkout</div>
        </>
      );
    }
    
    // Just have a user ID but no details
    else if (subscription.userId) {
      return (
        <div className="user-missing">
          <p>User ID: {subscription.userId}</p>
          <button 
            className="btn-fetch-user"
            onClick={() => fetchUserById(subscription.userId)}
          >
            Fetch User Details
          </button>
        </div>
      );
    }
    
    // No user information at all
    else {
      return (
        <div className="user-missing">
          <p>No user information available</p>
        </div>
      );
    }
  };

  // Update the renderDeliveryDetails function to handle populated data
  const renderDeliveryDetails = (subscription) => {
    // First check if we have populated deliveryDetailsId data
    if (subscription.deliveryDetailsId && typeof subscription.deliveryDetailsId === 'object') {
      const delivery = subscription.deliveryDetailsId;
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {delivery.name}
            {delivery.isDefault && <span className="default-badge">Default</span>}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {delivery.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {delivery.phone}
          </div>
          <div className="detail-item">
            <strong>Address:</strong> {delivery.address}
          </div>
          <div className="detail-item">
            <strong>Guest:</strong> {delivery.isGuest ? 'Yes' : 'No'}
          </div>
          <div className="source-info">Data from delivery details record</div>
        </>
      );
    }
    
    // Next check if we have the delivery details in our state
    else if (subscription.deliveryDetailsId && deliveryDetails[subscription.deliveryDetailsId]) {
      const delivery = deliveryDetails[subscription.deliveryDetailsId];
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {delivery.name}
            {delivery.isDefault && <span className="default-badge">Default</span>}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {delivery.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {delivery.phone}
          </div>
          <div className="detail-item">
            <strong>Address:</strong> {delivery.address}
          </div>
          <div className="detail-item">
            <strong>Guest:</strong> {delivery.isGuest ? 'Yes' : 'No'}
          </div>
          <div className="source-info">Data from delivery details record</div>
        </>
      );
    }
    
    // Check if we have userDetails with address in the subscription
    else if (subscription.userDetails && subscription.userDetails.address) {
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {subscription.userDetails.name}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {subscription.userDetails.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {subscription.userDetails.phone || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Address:</strong> {subscription.userDetails.address}
          </div>
          <div className="source-info">Data from subscription user details</div>
        </>
      );
    }
    
    // Check for legacy guestInfo with address
    else if (subscription.guestInfo && subscription.guestInfo.address) {
      return (
        <>
          <div className="detail-item">
            <strong>Name:</strong> {subscription.guestInfo.name}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {subscription.guestInfo.email}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {subscription.guestInfo.phone || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Address:</strong> {subscription.guestInfo.address}
          </div>
          <div className="source-info">Data from guest information</div>
        </>
      );
    }
    
    // No delivery information available
    else {
      return (
        <div className="delivery-missing">
          <p>No delivery information associated with this subscription.</p>
          {subscription.deliveryDetailsId && (
            <button 
              className="btn-fetch-delivery"
              onClick={() => fetchDeliveryDetails([subscription.deliveryDetailsId])}
            >
              Fetch Delivery Details
            </button>
          )}
        </div>
      );
    }
  };

  // Filter subscriptions based on status
  const filteredSubscriptions = filterStatus === 'all' 
    ? subscriptions 
    : subscriptions.filter(sub => sub.status?.toLowerCase() === filterStatus.toLowerCase());

  // Function to fetch a single user by ID
  const fetchUserById = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication required to fetch user data");
        return;
      }
      
      const response = await axios.get(`${apiBaseUrl}/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUsers(prev => ({
          ...prev,
          [userId]: response.data.data
        }));
        toast.success("User data fetched successfully");
      } else {
        toast.error(response.data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      toast.error(error.response?.data?.message || "Error fetching user data");
    }
  };

  // Function to fetch a single delivery details by ID
  const fetchDeliveryById = async (deliveryId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await axios.get(`${apiBaseUrl}/api/delivery/${deliveryId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDeliveryDetails(prev => ({
          ...prev,
          [deliveryId]: response.data.data
        }));
        toast.success("Delivery details fetched successfully");
      } else {
        toast.error(response.data.message || "Failed to fetch delivery details");
      }
    } catch (error) {
      console.error('Error fetching delivery details by ID:', error);
      toast.error(error.response?.data?.message || "Error fetching delivery details");
    }
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  return (
    <div className="subscriptions-container">
      <div className="page-header">
        <h1>Subscription Management</h1>
        <div className="header-actions">
          <div className="filter-container">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button 
            className="btn-add" 
            onClick={() => {
              setFormData({});
              setFormMode('create');
              setFormTab('subscription');
              setShowModal(true);
            }}
          >
            Add New Subscription
          </button>
          <button 
            className="btn-refresh" 
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading subscriptions...</div>
      ) : (
        <>
          {filteredSubscriptions.length === 0 ? (
            <div className="no-data">
              No subscriptions found. {filterStatus !== 'all' && 'Try changing the filter.'}
            </div>
          ) : (
            <div className="table-container">
              <table className="subscriptions-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Frequency</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map(subscription => (
                    <React.Fragment key={subscription._id}>
                      <tr className={expandedId === subscription._id ? 'expanded' : ''}>
                        <td>
                          {subscription.userId ? (
                            <Link to={`/users/${typeof subscription.userId === 'object' ? subscription.userId._id : subscription.userId}`}>
                              {typeof subscription.userId === 'object' 
                                ? subscription.userId.name 
                                : users[subscription.userId]?.name || subscription.userId}
                            </Link>
                          ) : subscription.guestInfo ? (
                            <div>
                              <div><strong>Name:</strong> {subscription.guestInfo.name}</div>
                              <div><strong>Email:</strong> {subscription.guestInfo.email}</div>
                            </div>
                          ) : (
                            "No user information"
                          )}
                        </td>
                        <td>{subscription.mealPlan}</td>
                        <td>{subscription.frequency}</td>
                        <td>{formatDate(subscription.startDate)}</td>
                        <td>
                          {/* <span className={`status-badge ${getStatusClass(subscription.status || 'Active')}`}>
                            {subscription.status || 'Active'}
                          </span> */}
                          <span className={`status-badge ${getStatusClass('Active')}`}>
                             Active
                          </span>
                        </td>
                        <td>₹{subscription.totalAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-details" 
                              onClick={() => toggleExpand(subscription._id)}
                            >
                              {expandedId === subscription._id ? 'Hide' : 'View'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === subscription._id && (
                        <tr className="details-row">
                          <td colSpan="8">
                            <div className="subscription-details">
                              <div className="detail-section">
                                <h4>Subscription Information</h4>
                                <div className="detail-item">
                                  <strong>Subscription ID:</strong> {subscription._id}
                                </div>
                                <div className="detail-item">
                                  <strong>Created:</strong> {formatDate(subscription.createdAt)}
                                </div>
                                <div className="detail-item">
                                  <strong>Quantity:</strong> {subscription.quantity}
                                </div>
                                <div className="detail-item">
                                  <strong>Total Days:</strong> {subscription.totalDays}
                                </div>
                                <div className="detail-item">
                                  <strong>Total Items:</strong> {subscription.totalItems}
                                </div>
                                <div className="detail-item">
                                  <strong>Price Per Meal:</strong> ₹{subscription.pricePerMeal.toFixed(2)}
                                </div>
                                <div className="detail-item">
                                  <strong>Subtotal:</strong> ₹{subscription.subtotal.toFixed(2)}
                                </div>
                                <div className="detail-item">
                                  <strong>Discount:</strong> ₹{subscription.discount.toFixed(2)}
                                </div>
                                <div className="detail-item">
                                  <strong>End Date:</strong> {formatDate(new Date(new Date(subscription.startDate).getTime() + subscription.totalDays * 24 * 60 * 60 * 1000))}
                                </div>
                              </div>
                              
                              <div className="detail-section">
                                <h4>User Information</h4>
                                {renderUserDetails(subscription)}
                              </div>
                              
                              <div className="detail-section">
                                <h4>Delivery Information</h4>
                                {renderDeliveryDetails(subscription)}
                              </div>
                              
                              {/* <div className="detail-actions">
                                <button 
                                  className="btn-edit" 
                                  onClick={() => handleEdit(subscription)}
                                >
                                  Edit Subscription
                                </button>
                                <button 
                                  className="btn-cancel" 
                                  onClick={() => handleCancel()}
                                  disabled={subscription.status === 'Cancelled' || subscription.status === 'Completed'}
                                >
                                  Cancel Subscription
                                </button>
                              </div> */}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Add CSS for the new delivery details section */}
      <style>
        {`
          .detail-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .detail-section h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          
          .detail-item {
            margin-bottom: 8px;
            line-height: 1.5;
          }
          
          .default-badge {
            display: inline-block;
            background-color: #4caf50;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
          }
          
          .guest-badge {
            display: inline-block;
            background-color: #ff9800;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
          }
          
          .subscription-badge {
            display: inline-block;
            background-color: #2196f3;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
          }
          
          .source-info {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          
          .detail-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
          }
          
          .btn-fetch-delivery,
          .btn-fetch-user {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }
          
          .btn-fetch-delivery:hover,
          .btn-fetch-user:hover {
            background-color: #e0e0e0;
          }
          
          .delivery-missing,
          .user-missing {
            color: #999;
            font-style: italic;
          }
        `}
      </style>
    </div>
  );
};

export default Subscriptions; 