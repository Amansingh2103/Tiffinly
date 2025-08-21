import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SubscribeItem.css'

const SubscribeItem = () => {
  const navigate = useNavigate();
  const [activePortion, setActivePortion] = useState('Lunch');

  // Function to check if current time is within lunch hours (6 AM to 12 PM)
  const isLunchTime = () => {
  const currentHour = new Date().getHours();
  return currentHour >= 9 && currentHour < 15;
};
  // Function to check if current time is within dinner hours (3 PM to 7 PM)
  const isDinnerTime = () => {
  const currentHour = new Date().getHours();
  return currentHour >= 15 && currentHour < 23;
};
  // Auto-switch portion based on current time
  useEffect(() => {
    if (isLunchTime()) {
      setActivePortion('Lunch');
    } else if (isDinnerTime()) {
      setActivePortion('Dinner');
    }
  }, []);

  // For Pure Veg item
  const handleSubscribePureVeg = () => {
    if (isLunchTime() || isDinnerTime()) {
      navigate('/subscribe', { 
        state: { 
          name: 'Pure Veg', 
          price: 199,
          currency: '₹',
          portion: activePortion
        } 
      });
    }
  };
  
  const handleFoodMenuPureVeg = () => {
    if (isLunchTime() || isDinnerTime()) {
      navigate('/food-menu', {
        state: {
          name: 'Pure Veg',
          price: 199,
          currency: '₹',
          portion: activePortion
        }
      });
    }
  };
  
  // For Non Veg item
  const handleSubscribeNonVeg = () => {
    if (isLunchTime() || isDinnerTime()) {
      navigate('/subscribe', { 
        state: { 
          name: 'Non Veg', 
          price: 299,
          currency: '₹',
          portion: activePortion
        } 
      });
    }
  };
  
  const handleFoodMenuNonVeg = () => {
    if (isLunchTime() || isDinnerTime()) {
      navigate('/food-menu', {
        state: {
          name: 'Non Veg',
          price: 299,
          currency: '₹',
          portion: activePortion
        }
      });
    }
  };

  return (
    <div className="subscribe-container">
      <h2 className="subscribe-title">Subscribe Item</h2>
      
      {/* Portion Selection Buttons */}
      <div className='portion-selector'>
        <button 
          className={activePortion === 'Lunch' ? 'active' : ''}
          onClick={() => setActivePortion('Lunch')}
        >
          Lunch
        </button>
        <button 
          className={activePortion === 'Dinner' ? 'active' : ''}
          onClick={() => setActivePortion('Dinner')}
        >
          Dinner
        </button>
      </div>
{activePortion === 'Lunch' && !isLunchTime() && (
  <div className="time-restriction-message">
    Lunch menu is only available between 9 AM and 3 PM. Store is currently closed.
  </div>
)}

{activePortion === 'Dinner' && !isDinnerTime() && (
  <div className="time-restriction-message">
    Dinner menu is only available between 3 PM and 11 PM. Store is currently closed.
  </div>
)}

      <div className="subscribe-products">
        <div className={`product-card ${(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner') ? 'disabled' : ''}`}>
          <img src="https://imgstaticcontent.lbb.in/lbbnew/wp-content/uploads/sites/2/2017/03/02201701/OmPureVeg1.jpg" alt="Pure Veg" className="product-image" />
          <h3 className="product-title">Pure Veg</h3>
          <p className="product-price">₹199<span>/Plate</span></p>
          <div className="button-group">
            <button 
              className="btn food-btn" 
              onClick={handleFoodMenuPureVeg}
              disabled={(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner')}
            >
              Food Menu
            </button>
            <button 
              className="btn subscribe-btn" 
              onClick={handleSubscribePureVeg}
              disabled={(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner')}
            >
              Subscribe Now
            </button>
          </div>
        </div>
        <div className={`product-card ${(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner') ? 'disabled' : ''}`}>
          <img src="https://haribhavanam.com/cdn/shop/files/Non_Veg_Meals_f345b3a7-46c8-43bb-84f9-009b2b0c5cbd.webp?v=1733221735" alt="Non Veg" className="product-image" />
          <h3 className="product-title">Non Veg</h3>
          <p className="product-price">₹299<span>/Plate</span></p>
          <div className="button-group">
            <button 
              className="btn food-btn" 
              onClick={handleFoodMenuNonVeg}
              disabled={(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner')}
            >
              Food Menu
            </button>
            <button 
              className="btn subscribe-btn" 
              onClick={handleSubscribeNonVeg}
              disabled={(!isLunchTime() && activePortion === 'Lunch') || (!isDinnerTime() && activePortion === 'Dinner')}
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscribeItem