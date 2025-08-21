import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FoodMenu.css';

const FoodMenu = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { name, price, currency } = location.state || {};
    const [selectedDays, setSelectedDays] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Get the current date
    const currentDate = new Date();
    
    // Monthly menu data
    const monthlyMenu = [
      { date: "20-03-2025", day: "Thursday", items: ["Tawa Paratha (3)", "Garlic Vegetable Soup (1)", "Bhindi Masala (1)", "Drumstick Dal fry (1)"] },
      { date: "21-03-2025", day: "Friday", items: ["Chapati (3)", "Beetroot cucumber Raita (1)", "Dal Makhani (1)", "Subz Diwani (1)"] },
      { date: "22-03-2025", day: "Saturday", items: ["Chapati (3)", "Mini salad (Koshimbir salad) (1)", "Moong dal fry (1)", "Patta Gobi Matar (1)"] },
      { date: "23-03-2025", day: "Sunday", items: ["Puri (4)", "Aloo Sabzi (1)", "Chana Masala (1)", "Rice Kheer (1)"] },
      { date: "24-03-2025", day: "Monday", items: ["Chapati (3)", "Cucumber Raita (1)", "Dal Fry (1)", "Jaipuri Aloo Matar Gravy (1)"] },
      { date: "25-03-2025", day: "Tuesday", items: ["Tawa Paratha (3)", "Mini Green Salad (1)", "Kadhi Pakoda (1)", "Veg Lababdar (1)"] },
      { date: "26-03-2025", day: "Wednesday", items: ["Chapati (3)", "Mini Peanut Salad (1)", "Dal Lehsuni Tadka (1)", "Palak Paneer (1)"] },
      { date: "27-03-2025", day: "Thursday", items: ["Missi Roti (3)", "Carrot Raita (1)", "Rajma Masala (1)", "Gobi Mutter (1)"] },
      { date: "28-03-2025", day: "Friday", items: ["Chapati (3)", "Boondi Raita (1)", "Paneer Butter Masala (1)", "Chole (1)"] },
      { date: "29-03-2025", day: "Saturday", items: ["Chapati (3)", "Sprout Salad (1)", "Mix Dal Fry (1)", "Aloo Baingan Masala (1)"] },
      { date: "30-03-2025", day: "Sunday", items: ["Puri (4)", "Aloo Dum (1)", "Chana Dal (1)", "Suji Halwa (1)"] },
      { date: "31-03-2025", day: "Monday", items: ["Tandoori Roti (3)", "Lauki Raita (1)", "Dal Tadka (1)", "Methi Malai Mutter (1)"] },
      { date: "01-04-2025", day: "Tuesday", items: ["Tawa Paratha (3)", "Onion Tomato Raita (1)", "Dal Palak (1)", "Kadhai Paneer (1)"] },
      { date: "02-04-2025", day: "Wednesday", items: ["Chapati (3)", "Cabbage Salad (1)", "Dal Maharani (1)", "Aloo Gobi Masala (1)"] },
      { date: "03-04-2025", day: "Thursday", items: ["Missi Roti (3)", "Tomato Raita (1)", "Chole Masala (1)", "Lauki Chana Dal (1)"] },
      { date: "04-04-2025", day: "Friday", items: ["Chapati (3)", "Corn Salad (1)", "Dal Fry (1)", "Baingan Bharta (1)"] },
      { date: "05-04-2025", day: "Saturday", items: ["Tandoori Roti (3)", "Mini Salad (1)", "Rajma Masala (1)", "Aloo Methi (1)"] },
      { date: "06-04-2025", day: "Sunday", items: ["Puri (4)", "Aloo Chole (1)", "Dal Tadka (1)", "Gulab Jamun (1)"] },
      { date: "07-04-2025", day: "Monday", items: ["Chapati (3)", "Beetroot Raita (1)", "Mix Dal (1)", "Gajar Matar (1)"] },
      { date: "08-04-2025", day: "Tuesday", items: ["Tawa Paratha (3)", "Cucumber Salad (1)", "Kadhi Chawal (1)", "Paneer Bhurji (1)"] },
      { date: "09-04-2025", day: "Wednesday", items: ["Chapati (3)", "Mini Peanut Salad (1)", "Dal Kolhapuri (1)", "Aloo Shimla Gravy (1)"] },
      { date: "10-04-2025", day: "Thursday", items: ["Missi Roti (3)", "Carrot Raita (1)", "Rajma Masala (1)", "Gobi Mutter (1)"] },
      { date: "11-04-2025", day: "Friday", items: ["Chapati (3)", "Boondi Raita (1)", "Paneer Butter Masala (1)", "Chole (1)"] },
      { date: "26-04-2025", day: "Saturday", items: ["Chapati (3)", "Mini Slice Salad (1)", "Aloo Shimla Gravy (1)", "Dal Kolhapuri (1)"] }
    ];
    
    
    const toggleDaySelection = (date) => {
      if (selectedDays.includes(date)) {
        setSelectedDays(selectedDays.filter(day => day !== date));
      } else {
        setSelectedDays([...selectedDays, date]);
      }
    };
    
    const handleProceed = () => {
      // Navigate to checkout or another page with the selected days
      navigate('/checkout', {
        state: {
          selectedDays,
          price,
          currency,
          name
        }
      });
    };
    
    // Check if a date is in the past
    const isPastDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-');
      const itemDate = new Date(`${year}-${month}-${day}`);
      return itemDate < currentDate;
    };
  

  return (
    <div className="food-menu-container">
      <div className="food-menu-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Plans
        </button>
        <div className="header-content">
          <h1 className="menu-title">{name || "LIGHT BITE (LUNCH)"} Monthly Menu</h1>
          <p className="menu-subtitle">Select your preferred days below</p>
          <div className="price-badge">
            {currency}{price} per day
          </div>
        </div>
      </div>

      <div className="food-menu-days">
        {monthlyMenu.map((menuItem, index) => (
          <div 
            key={index} 
            className={`menu-card ${isPastDate(menuItem.date) ? 'past-date' : ''} ${selectedDays.includes(menuItem.date) ? 'selected' : ''}`}
          >
            {isPastDate(menuItem.date) && <div className="past-overlay">Expired</div>}
            
            <div className="card-header">
            <div className="date-info">
                <span className="date-day">{menuItem.day}</span>
                {(() => {
                    const [day, month, year] = menuItem.date.split("-");
                    const formattedDate = new Date(`${year}-${month}-${day}`);

                    return (
                    <>
                        <span className="date-number">{formattedDate.getDate()}</span>
                        <span className="date-month">
                        {formattedDate.toLocaleString("default", { month: "short" })}
                        </span>
                    </>
                    );
                })()}
                </div>

              
              {!isPastDate(menuItem.date) && (
                <label className="custom-checkbox">
                  <input 
                    type="checkbox"
                    checked={selectedDays.includes(menuItem.date)}
                    onChange={() => toggleDaySelection(menuItem.date)}
                  />
                  <span className="checkmark"></span>
                </label>
              )}
            </div>

            <div className="menu-items">
              <h4 className="items-title">Today's Menu:</h4>
              <ul>
                {menuItem.items.map((item, i) => (
                  <li key={i} className="menu-item">
                    <span className="item-icon">🍴</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {selectedDays.length > 0 && (
        <div className="selection-summary">
          <div className="summary-content">
            <div className="summary-text">
              <span className="selected-count">{selectedDays.length}</span>
              days selected
              <span className="total-price">
                Total: {currency}{(price * selectedDays.length).toFixed(2)}
              </span>
            </div>
            <button className="proceed-button" onClick={handleProceed}>
              Continue to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodMenu;