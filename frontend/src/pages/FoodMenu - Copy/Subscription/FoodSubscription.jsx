import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';  // Import axios

const FoodSubscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get food details from location state
  const { name, price, currency } = location.state || { name: "Meal", price: 0, currency: "$" };
  
  // State for subscription options - nothing selected by default
  const [mealTime, setMealTime] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [mealFrequency, setMealFrequency] = useState(null);
  const [mealQuantity, setMealQuantity] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  
  // Add state to track if user already has an active subscription
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loadingSubscriptionCheck, setLoadingSubscriptionCheck] = useState(true);
  
  // Calculate subscription summary
  const [summary, setSummary] = useState({
    basePrice: 0,
    totalPrice: 0,
    discount: 0,
    finalPrice: 0,
    deliveryDays: 0,
    itemsCount: 0,
  });
  
  // Add a guest user information form section
  const [showUserForm, setShowUserForm] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Add state for tracking the subscription process steps
  const [processStep, setProcessStep] = useState('initial'); // 'initial', 'enterDetails', 'proceedPayment'
  
  // Add this state for delivery details
  const [deliveryDetailsId, setDeliveryDetailsId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  
  // Check if user already has an active subscription
  useEffect(() => {
    const checkActiveSubscriptions = async () => {
      try {
        // Get the JWT token
        const token = localStorage.getItem('token');
        
        if (!token) {
          // User not logged in, they'll be prompted to login when they try to subscribe
          setLoadingSubscriptionCheck(false);
          return;
        }
        
        console.log("Checking subscription status with token:", token ? "token exists" : "no token");
        
        // First, check if the user is already marked as subscribed in their profile
        const userProfileResponse = await axios.get('http://localhost:4000/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("User profile response:", userProfileResponse.data);
        
        // If the user object shows they're already subscribed, set the flag
        if (userProfileResponse.data.success && 
            userProfileResponse.data.data && 
            userProfileResponse.data.data.subcribed === true) {
          console.log("User is marked as subscribed in profile");
          setHasActiveSubscription(true);
          setLoadingSubscriptionCheck(false);
          return;
        }
        
        // Double-check by looking for active subscriptions
        const userId = userProfileResponse.data.data._id;
        console.log("Checking active subscriptions for user:", userId);
        
        // Check for active subscriptions
        const subsResponse = await axios.get(`http://localhost:4000/api/subscribe/user/${userId}/active`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Active subscriptions response:", subsResponse.data);
        
        // If they have any active subscriptions, set the flag
        const activeSubscriptions = subsResponse.data.data || [];
        const hasActive = activeSubscriptions.length > 0;
        setHasActiveSubscription(hasActive);
        
        if (hasActive) {
          console.log("User has active subscription:", activeSubscriptions[0]);
        } else {
          console.log("User has no active subscriptions");
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        // On error, assume they might have a subscription to prevent issues
        setHasActiveSubscription(false);
      } finally {
        setLoadingSubscriptionCheck(false);
      }
    };
    
    checkActiveSubscriptions();
  }, []);
  
  // Calculate min date (tomorrow)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Update summary when options change - only calculate if all options are selected
  useEffect(() => {
    // Only calculate if all required selections are made
    if (mealTime && mealPlan && mealFrequency && mealQuantity) {
      let basePrice = price * mealQuantity;
      let days = mealFrequency === 'mon-fri' ? 20 : 24; // Assuming 4 weeks
      let discount = mealPlan === '1month' ? 0.1 : 0; // 10% discount for 1-month plan
      
      const totalPrice = basePrice * days;
      const discountAmount = totalPrice * discount;
      const finalPrice = totalPrice - discountAmount;
      
      setSummary({
        basePrice,
        totalPrice,
        discount: discountAmount,
        finalPrice,
        deliveryDays: days,
        itemsCount: days * mealQuantity,
      });
    }
  }, [price, mealPlan, mealFrequency, mealQuantity, mealTime]);
  
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add this useEffect to fetch saved addresses if user is logged in
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        setLoadingAddresses(true);
        const response = await axios.get('http://localhost:4000/api/delivery/user/all', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setSavedAddresses(response.data.data);
          
          // If there's a default address, pre-fill the form
          const defaultAddress = response.data.data.find(addr => addr.isDefault);
          if (defaultAddress) {
            setUserInfo({
              name: defaultAddress.name,
              email: defaultAddress.email,
              phone: defaultAddress.phone,
              address: defaultAddress.address
            });
            setDeliveryDetailsId(defaultAddress._id);
          }
        }
      } catch (error) {
        console.error('Error fetching saved addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    
    fetchSavedAddresses();
  }, []);
  
  // Handle subscription submission
  const handleSubscribe = async () => {
    // Double check if user already has a subscription
    if (hasActiveSubscription) {
      alert('You already have an active subscription. Please manage your existing subscription before creating a new one.');
      return;
    }
    
    if (!startDate) {
      alert('Please select a start date');
      return;
    }
    
    if (!mealTime || !mealPlan || !mealFrequency || !mealQuantity) {
      alert('Please complete all required selections');
      return;
    }
    
    // Always show the user form first, regardless of login status
    setShowUserForm(true);
    setProcessStep('enterDetails');
    
    // If user is logged in, try to pre-fill the form with their information
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userProfileResponse = await axios.get('http://localhost:4000/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (userProfileResponse.data.success && userProfileResponse.data.data) {
          const userData = userProfileResponse.data.data;
          setUserInfo({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || ''
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Continue with empty form if profile fetch fails
      }
    }
  };
  
  // Modify handleProceedToPayment to ensure token is sent
  const handleProceedToPayment = async () => {
    // Validate user info
    if (!userInfo.name || !userInfo.email || !userInfo.phone || !userInfo.address) {
      alert('Please fill in all your contact information');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Save delivery details to database
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Make sure to include the token if it exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Sending request with token:', token);
      } else {
        console.log('No token found, proceeding as guest');
      }
      
      // If we have a deliveryDetailsId, update it, otherwise create new
      let deliveryResponse;
      
      if (deliveryDetailsId) {
        deliveryResponse = await axios.put(
          `http://localhost:4000/api/delivery/${deliveryDetailsId}`,
          userInfo,
          { headers }
        );
      } else {
        deliveryResponse = await axios.post(
          'http://localhost:4000/api/delivery',
          userInfo,
          { headers }
        );
        
        // Save the new ID
        if (deliveryResponse.data.success) {
          setDeliveryDetailsId(deliveryResponse.data.data._id);
        }
      }
      
      if (!deliveryResponse.data.success) {
        throw new Error(deliveryResponse.data.message || 'Failed to save delivery details');
      }
      
      console.log('Delivery details saved:', deliveryResponse.data);
      
      // Proceed to payment processing
      setProcessStep('proceedPayment');
      processPayment(deliveryResponse.data.data._id);
    } catch (error) {
      console.error('Error saving delivery details:', error);
      alert('Failed to save delivery details. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Modify processPayment to include deliveryDetailsId
  const processPayment = async (deliveryId) => {
    try {
      setIsLoading(true);
      
      // Format the data according to the backend schema
      const subscriptionData = {
        mealPlan: '1 Month',
        frequency: mealFrequency === 'mon-fri' ? 'Mon-Fri' : 'Mon-Sat',
        quantity: mealQuantity,
        startDate: new Date(startDate).toISOString(),
        totalDays: summary.deliveryDays,
        totalItems: summary.itemsCount,
        pricePerMeal: price,
        subtotal: summary.totalPrice,
        discount: summary.discount,
        totalAmount: summary.finalPrice,
        // Use guestInfo to match the backend model schema
        guestInfo: userInfo,
        // Add the delivery details ID
        deliveryDetailsId: deliveryId
      };
      
      console.log("Creating subscription with data:", subscriptionData);
      
      // First, initiate a Razorpay order
      const response = await axios.post('http://localhost:4000/api/subscribe/create-payment', 
        subscriptionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
          }
        }
      );
      
      console.log("Payment initialization response:", response.data);
      
      if (response.data.success) {
        // Load Razorpay script
        await loadRazorpay();
        
        // Initialize Razorpay payment
        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "Meal Subscription",
          description: `${mealFrequency === 'mon-fri' ? 'Mon-Fri' : 'Mon-Sat'} ${mealQuantity} meals per day`,
          order_id: response.data.order_id,
          handler: async function(paymentResponse) {
            try {
              // Verify payment
              const verifyResponse = await axios.post('http://localhost:4000/api/subscribe/verify-payment', {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                subscriptionId: response.data.subscriptionId
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
                }
              });
              
              if (verifyResponse.data.success) {
                alert('Subscription created successfully!');
                navigate('/'); // Navigate to profile or subscription management page
              } else {
                alert('Payment verification failed: ' + verifyResponse.data.message);
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              alert('Error verifying payment. Please contact support.');
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            name: "Subscriber",
            email: "subscriber@example.com",
            contact: "",
          },
          theme: {
            color: "#6b46c1"
          },
          modal: {
            ondismiss: function() {
              setIsLoading(false);
              alert('Payment cancelled. Your subscription was not created.');
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        
      } else {
        alert('Failed to initialize payment: ' + response.data.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      
      // Get more specific error message
      if (error.response) {
        console.error('Server error data:', error.response.data);
        console.error('Server error status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          alert('Subscription failed: ' + error.response.data.message);
        } else {
          alert(`Server error (${error.response.status}). Please try again later.`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from server. Please check your internet connection and try again.');
      } else {
        console.error('Request setup error:', error.message);
        alert('Failed to create subscription: ' + error.message);
      }
      setIsLoading(false);
    }
  };

  // Add function to load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  };

  // Card component for options
  const OptionCard = ({ title, icon, children, description }) => (
    <div style={{
      marginBottom: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      border: '1px solid #f0f0f0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          backgroundColor: '#f8f4ff',
          borderRadius: '50%',
          color: '#6b46c1',
          fontSize: '20px'
        }}>
          {icon}
        </div>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          margin: 0
        }}>{title}</h2>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {children}
      </div>
      
      {description && (
        <div style={{
          marginTop: '16px',
          padding: '14px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#666',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <div style={{ marginTop: '2px' }}>
            ☕
          </div>
          <div>{description}</div>
        </div>
      )}
    </div>
  );

  // Option button component
  const OptionButton = ({ selected, onClick, children, icon }) => (
    <button 
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: selected ? '#6b46c1' : '#e2e8f0',
        backgroundColor: selected ? '#f8f4ff' : '#ffffff',
        color: selected ? '#6b46c1' : '#4a5568',
        cursor: 'pointer',
        fontWeight: selected ? 'bold' : 'normal',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: selected ? '0 2px 8px rgba(107, 70, 193, 0.2)' : 'none'
      }}
    >
      <span>{icon}</span>
      {children}
    </button>
  );

  // Add a function to select a saved address
  const selectSavedAddress = (address) => {
    setUserInfo({
      name: address.name,
      email: address.email,
      phone: address.phone,
      address: address.address
    });
    setDeliveryDetailsId(address._id);
    setShowSavedAddresses(false);
  };

  // Add a function to save the current address as a new one
  const saveNewAddress = async () => {
    // Validate user info
    if (!userInfo.name || !userInfo.email || !userInfo.phone || !userInfo.address) {
      alert('Please fill in all fields to save this address');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in to save addresses');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:4000/api/delivery',
        userInfo,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        alert('Address saved successfully!');
        setDeliveryDetailsId(response.data.data._id);
        
        // Refresh the saved addresses list
        const addressesResponse = await axios.get('http://localhost:4000/api/delivery/user/all', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (addressesResponse.data.success) {
          setSavedAddresses(addressesResponse.data.data);
        }
      } else {
        alert('Failed to save address: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '30px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#f9fafc',
      minHeight: '100vh',
    }}>
      <h1 style={{
        fontSize: '32px',
        color: '#333',
        marginBottom: '40px',
        textAlign: 'center',
        fontWeight: '700'
      }}>
        <span style={{ marginRight: '12px', fontSize: '28px' }}>🍽️</span>
        Subscribe to {name}
      </h1>
      
      {hasActiveSubscription && !loadingSubscriptionCheck && (
        <div style={{
          width: '100%',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          padding: '15px 20px',
          marginBottom: '30px',
          border: '1px solid #f5c6cb',
          position: 'sticky',
          top: '10px',
          zIndex: 100,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            You already have an active subscription. New subscriptions are not allowed until your current one ends.
          </div>
        </div>
      )}
      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Left Section - Options */}
        <div style={{
          flex: '1',
          minWidth: '350px',
        }}>
          {/* Meal Time Section */}
          <OptionCard 
            title="Meal Time" 
            icon="⏰"
            description="Order Lunch a day prior before 8 pm & Dinner same day before 12 afternoon. Place separate orders for lunch and dinner."
          >
            <OptionButton 
              selected={mealTime === 'lunch'}
              onClick={() => setMealTime('lunch')}
              icon="☀️"
            >
              Lunch
            </OptionButton>
            
            <OptionButton 
              selected={mealTime === 'dinner'}
              onClick={() => setMealTime('dinner')}
              icon="🌙"
            >
              Dinner
            </OptionButton>
          </OptionCard>
          
          {/* Meal Plan Section */}
          <OptionCard 
            title="Meal Plan" 
            icon="📅"
          >
            <OptionButton 
              selected={mealPlan === '1month'}
              onClick={() => setMealPlan('1month')}
              icon="🏷️"
            >
              1 Month (10% off)
            </OptionButton>
          </OptionCard>
          
          {/* Meal Frequency Section */}
          <OptionCard 
            title="Meal Frequency" 
            icon="🚚"
          >
            <OptionButton 
              selected={mealFrequency === 'mon-fri'}
              onClick={() => setMealFrequency('mon-fri')}
              icon="📆"
            >
              Monday to Friday
            </OptionButton>
            
            <OptionButton 
              selected={mealFrequency === 'mon-sat'}
              onClick={() => setMealFrequency('mon-sat')}
              icon="📆"
            >
              Monday to Saturday
            </OptionButton>
          </OptionCard>
          
          {/* Meal Quantity Section */}
          <OptionCard 
            title="Meal Quantity" 
            icon="📦"
            description="To order more than 3 meals, increase the quantity in final cart."
          >
            <OptionButton 
              selected={mealQuantity === 1}
              onClick={() => setMealQuantity(1)}
              icon="👤"
            >
              1
            </OptionButton>
            
            <OptionButton 
              selected={mealQuantity === 2}
              onClick={() => setMealQuantity(2)}
              icon="👥"
            >
              2
            </OptionButton>
            
            <OptionButton 
              selected={mealQuantity === 3}
              onClick={() => setMealQuantity(3)}
              icon="👥"
            >
              3
            </OptionButton>
          </OptionCard>
          
          {/* Start Date Section */}
          <OptionCard 
            title="Order Start Date" 
            icon="📅"
          >
            <div style={{ width: '100%' }}>
              <input 
                type="date" 
                min={getTomorrowDate()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={hasActiveSubscription || loadingSubscriptionCheck}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  width: '100%',
                  fontSize: '16px',
                  color: '#4a5568',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </OptionCard>
        </div>
        
        {/* Right Section - Summary */}
        <div style={{
          flex: '1',
          minWidth: '350px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: '20px',
            height: 'fit-content',
            border: '1px solid #f0f0f0',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>✅</span>
              Subscription Summary
            </h2>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #edf2f7'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px',
                borderBottom: '1px solid #edf2f7',
                paddingBottom: '10px'
              }}>
                {mealTime ? mealTime.charAt(0).toUpperCase() + mealTime.slice(1) : 'Meal'} Details
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>📅</span>
                    <span>Meal Plan:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{mealPlan ? '1 Month' : '-'}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>🚚</span>
                    <span>Frequency:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>
                    {mealFrequency ? (mealFrequency === 'mon-fri' ? 'Monday to Friday' : 'Monday to Saturday') : '-'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>👥</span>
                    <span>Quantity:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{mealQuantity ? `${mealQuantity} meal(s) per day` : '-'}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>📅</span>
                    <span>Start Date:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{startDate || '-'}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>⏰</span>
                    <span>Total Days:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{summary.deliveryDays || '-'}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>📦</span>
                    <span>Total Items:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{summary.itemsCount || '-'}</span>
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #edf2f7'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>💰</span>
                    <span>Price per meal:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{currency}{price.toFixed(2)}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <span>💰</span>
                    <span>Subtotal:</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>{currency}{summary.totalPrice.toFixed(2)}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#6b46c1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏷️</span>
                    <span>Discount (10%):</span>
                  </div>
                  <span style={{ fontWeight: '500' }}>-{currency}{summary.discount.toFixed(2)}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  padding: '16px 0 0',
                  borderTop: '1px dashed #e2e8f0',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  <span>Total:</span>
                  <span style={{ color: '#6b46c1' }}>{currency}{summary.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Show message if user already has a subscription */}
            {loadingSubscriptionCheck ? (
              <div style={{ 
                textAlign: 'center', 
                margin: '20px 0', 
                padding: '15px',
                backgroundColor: '#e9ecef',
                borderRadius: '8px',
                color: '#495057' 
              }}>
                <div style={{ display: 'inline-block', marginRight: '10px' }}>⏳</div>
                Checking subscription status...
              </div>
            ) : hasActiveSubscription ? (
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#FFF3CD', 
                color: '#856404', 
                borderRadius: '8px',
                margin: '20px 0',
                border: '1px solid #ffeeba',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>You already have an active subscription!</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                    Please wait until your current subscription ends or cancel it before creating a new one.
                    <a href="/profile" style={{ 
                      marginLeft: '8px', 
                      color: '#856404', 
                      fontWeight: 'bold',
                      textDecoration: 'underline' 
                    }}>
                      Manage Subscriptions
                    </a>
                  </p>
                </div>
              </div>
            ) : null}
            
            {/* Show form if in 'enterDetails' step (for both logged in and not logged in users) */}
            {showUserForm && processStep === 'enterDetails' && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #edf2f7'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '20px',
                  borderBottom: '1px solid #edf2f7',
                  paddingBottom: '10px'
                }}>Delivery Details</h3>
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  Please provide your delivery details to continue with the subscription
                </p>
                
                {/* Show saved addresses section if user is logged in */}
                {localStorage.getItem('token') && (
                  <div style={{ marginBottom: '20px' }}>
                    <button
                      onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#555'
                      }}
                    >
                      <span>📋</span>
                      {showSavedAddresses ? 'Hide Saved Addresses' : 'Select from Saved Addresses'}
                      <span style={{ marginLeft: '5px' }}>
                        {showSavedAddresses ? '▲' : '▼'}
                      </span>
                    </button>
                    
                    {showSavedAddresses && (
                      <div style={{
                        marginTop: '15px',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {loadingAddresses ? (
                          <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                            Loading saved addresses...
                          </div>
                        ) : savedAddresses.length === 0 ? (
                          <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                            No saved addresses found
                          </div>
                        ) : (
                          savedAddresses.map(address => (
                            <div 
                              key={address._id}
                              onClick={() => selectSavedAddress(address)}
                              style={{
                                padding: '12px 15px',
                                borderBottom: '1px solid #eee',
                                cursor: 'pointer',
                                backgroundColor: deliveryDetailsId === address._id ? '#f0f7ff' : 'white',
                                transition: 'background-color 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                                  {address.name} {address.isDefault && (
                                    <span style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#6b46c1', 
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      marginLeft: '8px'
                                    }}>
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '13px', color: '#666' }}>{address.phone}</div>
                                <div style={{ fontSize: '13px', color: '#666' }}>{address.address}</div>
                              </div>
                              <div style={{ 
                                color: deliveryDetailsId === address._id ? '#6b46c1' : '#aaa',
                                fontSize: '20px'
                              }}>
                                {deliveryDetailsId === address._id ? '✓' : ''}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userInfo.name}
                    onChange={handleUserInfoChange}
                    placeholder="Enter your full name"
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      width: '100%',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleUserInfoChange}
                    placeholder="Enter your email address"
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      width: '100%',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userInfo.phone}
                    onChange={handleUserInfoChange}
                    placeholder="Enter your phone number"
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      width: '100%',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Delivery Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={userInfo.address}
                    onChange={handleUserInfoChange}
                    placeholder="Enter your full delivery address"
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      width: '100%',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {/* Add a save address button for logged in users */}
                {localStorage.getItem('token') && !deliveryDetailsId && (
                  <div style={{ marginBottom: '20px' }}>
                    <button
                      onClick={saveNewAddress}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#555'
                      }}
                    >
                      <span>💾</span>
                      Save this address for future orders
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={hasActiveSubscription 
                ? () => navigate('/profile') 
                : showUserForm && processStep === 'enterDetails' 
                  ? handleProceedToPayment 
                  : handleSubscribe}
              disabled={isLoading || loadingSubscriptionCheck}
              style={{
                backgroundColor: hasActiveSubscription 
                  ? '#dc3545' // Red for already subscribed
                  : isLoading || loadingSubscriptionCheck 
                    ? '#9c82d1' // Light purple for loading
                    : showUserForm && processStep === 'enterDetails'
                      ? '#38a169' // Green for proceed to payment
                      : '#6b46c1', // Purple for subscribe now
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: hasActiveSubscription ? '1px solid #c82333' : 'none',
                width: '100%',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoading || loadingSubscriptionCheck ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: hasActiveSubscription 
                  ? '0 4px 8px rgba(220, 53, 69, 0.2)' 
                  : showUserForm && processStep === 'enterDetails'
                    ? '0 4px 12px rgba(56, 161, 105, 0.2)'
                    : '0 4px 12px rgba(107, 70, 193, 0.2)',
              }}
            >
              {isLoading ? 'Processing...' : (
                hasActiveSubscription ? (
                  <>
                    <span style={{ fontSize: '18px' }}>🔄</span>
                    Manage Your Subscription
                  </>
                ) : loadingSubscriptionCheck ? (
                  <>
                    <span>⏳</span>
                    Checking Status...
                  </>
                ) : showUserForm && processStep === 'enterDetails' ? (
                  <>
                    <span>💳</span>
                    Proceed to Payment
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    Subscribe Now
                  </>
                )
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodSubscription;