import React, { useContext, useState, useEffect } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../Context/StoreContext'

const FoodDisplay = ({category}) => {
  const {food_list} = useContext(StoreContext);
  const [portion, setPortion] = useState('Lunch');

  // Function to check if current time is within lunch hours (6 AM to 12 PM)
  const isLunchTime = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 12;
  };

  // Function to check if current time is within dinner hours (3 PM to 7 PM)
  const isDinnerTime = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 15 && currentHour < 19;
  };

  // Auto-switch portion based on current time
  useEffect(() => {
    if (isLunchTime()) {
      setPortion('Lunch');
    } else if (isDinnerTime()) {
      setPortion('Dinner');
    }
  }, []);

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      
      {/* Portion Selection Buttons */}
      <div className='portion-selector'>
        <button 
          className={portion === 'Lunch' ? 'active' : ''}
          onClick={() => setPortion('Lunch')}
        >
          Lunch
        </button>
        <button 
          className={portion === 'Dinner' ? 'active' : ''}
          onClick={() => setPortion('Dinner')}
        >
          Dinner
        </button>
      </div>

      {/* Conditional Time-Based Message */}
      {portion === 'Lunch' && !isLunchTime() && (
        <div className="time-restriction-message">
          Lunch menu is only available between 6 AM and 12 PM. Store is currently closed.
        </div>
      )}

      {portion === 'Dinner' && !isDinnerTime() && (
        <div className="time-restriction-message">
          Dinner menu is only available between 3 PM and 7 PM. Store is currently closed.
        </div>
      )}

      <div className='food-display-list'>
        {food_list.map((item) => {
          // Check category conditions
          const categoryMatch = category === "All" || category === item.category;
          
          // Determine if the item should be disabled
          const isDisabled = 
            (portion === 'Lunch' && !isLunchTime()) || 
            (portion === 'Dinner' && !isDinnerTime());

          if (categoryMatch) {
            return (
              <div 
                key={item._id} 
                className={`food-item-wrapper ${isDisabled ? 'disabled' : ''}`}
              >
                <FoodItem 
                  image={item.image} 
                  name={item.name} 
                  desc={item.description} 
                  price={item.price} 
                  id={item._id}
                />
                {isDisabled && (
                  <div className="overlay-message">
                    {portion === 'Lunch' 
                      ? 'Lunch menu is only available between 6 AM and 12 PM'
                      : 'Dinner menu is only available between 3 PM and 7 PM'}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  )
}

export default FoodDisplay