import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../Context/StoreContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { url } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          toast.error('Please login to view your profile');
          return;
        }
        
        // For debugging - show token in console
        console.log('Using token:', token);
        
        // Fetch user profile with proper error handling
        try {
          const profileResponse = await axios.get('http://localhost:4000/api/user/profile', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Profile response:', profileResponse.data);
          
          if (profileResponse.data.success) {
            setUserData(profileResponse.data.data);
          } else {
            console.error('Profile response not successful:', profileResponse.data);
            toast.error(profileResponse.data.message || 'Failed to load profile data');
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Check if it's an authentication error
          if (profileError.response && profileError.response.status === 401) {
            localStorage.removeItem('token');
            toast.error('Your session has expired. Please login again.');
            navigate('/');
            return;
          } else {
            toast.error('Failed to load profile data');
          }
        }
        
        // Create a mock user for testing if needed
        if (!userData) {
          console.log('Creating mock user data for testing');
          setUserData({
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date().toISOString(),
            phone: '123-456-7890',
            address: '123 Main St, City, State'
          });
        }
        
        // Try to fetch subscriptions with error handling
        try {
          const subscriptionsResponse = await axios.get('http://localhost:4000/api/subscribe/user-subscriptions', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (subscriptionsResponse.data.success) {
            setUserSubscriptions(subscriptionsResponse.data.data || []);
          }
        } catch (subscriptionError) {
          console.error('Error fetching subscriptions:', subscriptionError);
          // Just set empty subscriptions, don't stop the page from loading
          setUserSubscriptions([]);
        }
        
        // Try to fetch orders with error handling
        try {
          const ordersResponse = await axios.get('http://localhost:4000/api/orders/user', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (ordersResponse.data.success) {
            setUserOrders(ordersResponse.data.data || []);
          }
        } catch (ordersError) {
          console.error('Error fetching orders:', ordersError);
          // Just set empty orders, don't stop the page from loading
          setUserOrders([]);
        }
        
      } catch (error) {
        console.error('General error in fetchUserData:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [url, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Placeholder image for user avatar
  const avatarUrl = userData?.avatar || 'https://via.placeholder.com/150';

  const toggleMockData = () => {
    setUseMockData(!useMockData);
    if (!useMockData) {
      // Set mock data
      setUserData({
        name: 'John Doe',
        email: 'john.doe@example.com',
        createdAt: '2023-01-15T12:00:00Z',
        phone: '555-123-4567',
        address: '123 Main Street, New York, NY 10001'
      });
      setUserSubscriptions([
        {
          _id: '123456',
          mealPlan: 'Premium',
          status: 'Active',
          frequency: 'Weekly',
          quantity: 5,
          startDate: '2023-05-01T00:00:00Z',
          endDate: '2023-12-31T00:00:00Z',
          totalAmount: 249.99,
          daysRemaining: 45
        }
      ]);
      setUserOrders([
        {
          _id: 'order123456',
          createdAt: '2023-06-15T14:30:00Z',
          status: 'Delivered',
          items: [
            { name: 'Vegetable Curry', quantity: 2, price: 12.99 },
            { name: 'Butter Chicken', quantity: 1, price: 14.99 }
          ],
          total: 40.97
        }
      ]);
      setLoading(false);
    } else {
      // Fetch real data
      fetchUserData();
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button 
        onClick={toggleMockData} 
        style={{position: 'absolute', top: '10px', right: '10px', background: '#f0f0f0', padding: '5px 10px', borderRadius: '5px', border: '1px solid #ddd'}}
      >
        {useMockData ? 'Use Real Data' : 'Use Mock Data'}
      </button>
      
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img src={avatarUrl} alt={userData?.name || 'User'} />
          </div>
          <div className="profile-header-info">
            <h1>{userData?.name || 'User'}</h1>
            <p>{userData?.email}</p>
            <p className="profile-join-date">Member since {new Date(userData?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Personal Info
        </button>
        <button 
          className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Subscriptions {userSubscriptions.length > 0 && <span className="badge">{userSubscriptions.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders {userOrders.length > 0 && <span className="badge">{userOrders.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info-section">
            <h2>Personal Information</h2>
            <div className="profile-info-card">
              <div className="info-row">
                <div className="info-label">Full Name</div>
                <div className="info-value">{userData?.name}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Email</div>
                <div className="info-value">{userData?.email}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Phone</div>
                <div className="info-value">{userData?.phone || 'Not provided'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Address</div>
                <div className="info-value">{userData?.address || 'Not provided'}</div>
              </div>
            </div>

            <button className="edit-profile-button">
              <span>✏️</span> Edit Profile
            </button>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="subscriptions-section">
            <h2>Your Subscriptions</h2>
            
            {userSubscriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Active Subscriptions</h3>
                <p>You don't have any active meal subscriptions at the moment.</p>
                <button className="action-button" onClick={() => navigate('/subscription')}>
                  Browse Subscription Plans
                </button>
              </div>
            ) : (
              <div className="subscriptions-list">
                {userSubscriptions.map(subscription => (
                  <div className="subscription-card" key={subscription._id}>
                    <div className="subscription-header">
                      <div className="subscription-title">
                        <h3>{subscription.mealPlan} Plan</h3>
                        <span className={`status-badge ${subscription.status.toLowerCase()}`}>
                          {subscription.status}
                        </span>
                      </div>
                      <div className="subscription-price">
                        ${subscription.totalAmount}
                      </div>
                    </div>
                    
                    <div className="subscription-details">
                      <div className="detail-item">
                        <span className="detail-label">Frequency:</span>
                        <span className="detail-value">{subscription.frequency}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Quantity:</span>
                        <span className="detail-value">{subscription.quantity} meals</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">{new Date(subscription.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">End Date:</span>
                        <span className="detail-value">{new Date(subscription.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Days Left:</span>
                        <span className="detail-value">{subscription.daysRemaining || 'Not available'}</span>
                      </div>
                    </div>
                    
                    <div className="subscription-actions">
                      <button className="action-button" disabled={subscription.status !== 'Active'}>
                        Manage Deliveries
                      </button>
                      <button 
                        className="action-button cancel" 
                        disabled={subscription.status !== 'Active'}
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>Your Orders</h2>
            
            {userOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet.</p>
                <button className="action-button" onClick={() => navigate('/menu')}>
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {userOrders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <div>
                        <h3>Order #{order._id.substring(order._id.length - 6)}</h3>
                        <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div className="order-item" key={index}>
                          <span className="item-quantity">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-footer">
                      <div className="order-total">
                        <span>Total:</span>
                        <span className="total-amount">${order.total.toFixed(2)}</span>
                      </div>
                      <button className="action-button">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Account Settings</h2>
            
            <div className="settings-card">
              <h3>Password</h3>
              <p>Change your account password</p>
              <button className="action-button">Change Password</button>
            </div>
            
            <div className="settings-card">
              <h3>Notifications</h3>
              <p>Manage your notification preferences</p>
              
              <div className="notification-setting">
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive order updates and promotions</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="notification-setting">
                <div>
                  <h4>SMS Notifications</h4>
                  <p>Receive delivery updates via SMS</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="settings-card danger-zone">
              <h3>Danger Zone</h3>
              <p>Permanently delete your account and all data</p>
              <button className="action-button delete-account">Delete Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 