import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const MyOrders = () => {
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const {url, token, currency} = useContext(StoreContext);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log("Fetching orders with token:", token);
      
      const response = await axios.post(
        `${url}/api/order/userorders`, 
        {}, 
        {
          headers: { token }
        }
      );
      
      console.log("Orders response:", response.data);
      
      if (response.data.success) {
        setData(response.data.data);
        if (response.data.data.length === 0) {
          console.log("No orders found for user");
        }
      } else {
        toast.error("Failed to fetch orders");
        console.error("Failed to fetch orders:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error loading your orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      console.log("No token available, can't fetch orders");
      setLoading(false);
    }
  }, [token, url]); // Add url as dependency

  // Add manual refresh button
  const refreshOrders = () => {
    fetchOrders();
    toast.info("Refreshing orders...");
  };

  return (
    <div className='my-orders'>
      <div className="my-orders-header">
        <h2>My Orders</h2>
        <button className="refresh-btn" onClick={refreshOrders}>Refresh Orders</button>
      </div>
      
      {loading ? (
        <p>Loading your orders...</p>
      ) : data.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="container">
          {data.map((order, index) => {
            return (
              <div key={order._id || index} className='my-orders-order'>
                <img src={assets.parcel_icon} alt="" />
                <p>{order.items.map((item, index) => {
                  if (index === order.items.length-1) {
                    return item.name + " x " + item.quantity
                  }
                  else {
                    return item.name + " x " + item.quantity + ", "
                  }
                })}</p>
                <p>{currency}{order.amount}.00</p>
                <p>Items: {order.items.length}</p>
                <p><span>&#x25cf;</span> <b>{order.status || "Processing"}</b></p>
                <p>Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                <button onClick={fetchOrders}>Track Order</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyOrders
