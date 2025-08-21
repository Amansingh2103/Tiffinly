import React, { useContext, useState } from 'react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';

const FoodItem = ({ image, name, price, desc, id }) => {
  console.log( "iddddd",id);
  const [itemCount, setItemCount] = useState(0);
  const { cartItems, addToCart, removeFromCart, url, currency } = useContext(StoreContext);
  const navigate = useNavigate();


  console.log( "cartItems",cartItems);
  
  const handleSubscribe = () => {
    // Navigate to the subscription page with just the food details needed for calculation
    navigate('/subscribe', { 
      state: { 
        name, 
        price,
        currency
      } 
    });
  };
  
  const handleFoodMenu = () => {
    // Navigate to the monthly menu page
    navigate('/food-menu', {
      state: {
        name,
        price,
        currency
      }
    });
  };


    return (
        <div className='food-item'>
            <div className='food-item-img-container'>
                <img className='food-item-image' src={url+"/images/"+image} alt="" />
                {!cartItems || !cartItems[id]
                ? <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="" />
                : <div className="food-item-counter">
                    <img src={assets.remove_icon_red} onClick={()=>removeFromCart(id)} alt="" />
                    <p>{cartItems[id]}</p>
                    <img src={assets.add_icon_green} onClick={()=>addToCart(id)} alt="" />
                  </div>
                }
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p> <img src={assets.rating_starts} alt="" />
                </div>
                <p className="food-item-desc">{desc}</p>
                <p className="food-item-price">{currency}{price}</p>

{/* 
                <button 
                    className="food-menu-button" 
                    onClick={handleFoodMenu}
                    style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '8px 15px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: '10px',
                        width: '100%',
                        transition: 'all 0.3s ease',
                        marginBottom: '8px'
                    }}
                    >
                    Food Menu
                    </button>



                <button 
                className="subscribe-button" 
                onClick={handleSubscribe}
                style={{
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '10px',
                    width: '100%',
                    transition: 'all 0.3s ease'
                }}
                >
                Subscribe Menu
                </button> */}
            </div>
        </div>
    )
}

export default FoodItem
