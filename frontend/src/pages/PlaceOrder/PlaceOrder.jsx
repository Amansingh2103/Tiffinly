import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const PlaceOrder = () => {
    const [payment, setPayment] = useState("cod");
    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: ""
    });

    const { getTotalCartAmount, token, food_list, cartItems, url, setCartItems, currency, deliveryCharge } = useContext(StoreContext);
    const navigate = useNavigate();

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const getOrderData = () => {
        let orderItems = [];
        food_list.forEach((item) => {
            if (cartItems[item._id] > 0) {
                orderItems.push({ ...item, quantity: cartItems[item._id] });
            }
        });

        return {
            address: data,
            items: orderItems,
            amount: getTotalCartAmount() + deliveryCharge,
        };
    };

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
    
    const handleRazorpayPayment = async () => {
        let orderData = getOrderData();
    
        try {
            const isScriptLoaded = await loadRazorpay();
            if (!isScriptLoaded) {
                toast.error("Failed to load Razorpay. Please try again.");
                return;
            }
    
            let response = await axios.post(`${url}/api/order/place`, orderData, { headers: { token } });
    
            if (response.data.success) {
                const { order_id, key_id, amount, currency, orderId } = response.data;
    
                const options = {
                    key: key_id,
                    amount: amount,
                    currency: currency,
                    name: "Your Business Name",
                    description: "Food Order Payment",
                    order_id: order_id,
                    handler: async function (response) {
                        const verifyResponse = await axios.post(`${url}/api/order/verifyPayment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId
                        });
    
                        if (verifyResponse.data.success) {
                            toast.success("Payment Successful!");
                            navigate("/myorders");
                            setCartItems({});
                        } else {
                            toast.error("Payment verification failed");
                        }
                    },
                    prefill: {
                        name: `${data.firstName} ${data.lastName}`,
                        email: data.email,
                        contact: data.phone,
                    },
                    theme: {
                        color: "#3399cc"
                    }
                };
    
                const rzp1 = new window.Razorpay(options);
                rzp1.open();
            } else {
                toast.error("Something went wrong");
            }
        } catch (error) {
            toast.error("Payment failed. Try again.");
        }
    };
    

    const placeOrder = async (e) => {
        e.preventDefault();

        let orderData = getOrderData();
        
        // Check if order data is valid
        if (!orderData.items.length) {
            toast.error("Your cart is empty");
            return;
        }

        console.log("Token being sent:", token); // Debug token
        
        if (payment === "razorpay") {
            try {
                console.log("Sending order data for Razorpay:", orderData);
                let response = await axios.post(
                    `${url}/api/order/place`, 
                    orderData, 
                    { 
                        headers: { 
                            token // Use only this format consistently
                        } 
                    }
                );
                
                // Handle Razorpay logic here with response data
                if (response.data.success) {
                    handleRazorpayWithData(response.data);
                } else {
                    toast.error(response.data.message || "Failed to create payment");
                }
            } catch (error) {
                console.error("Razorpay order creation error:", error);
                toast.error("Payment initialization failed. Please try again.");
            }
        } else {
            try {
                console.log("Sending COD order data:", orderData);
                let response = await axios.post(
                    `${url}/api/order/placecod`, 
                    orderData, 
                    { 
                        headers: { 
                            token // Use only this format consistently
                        } 
                    }
                );

                if (response.data.success) {
                    toast.success(response.data.message || "Order placed successfully!");
                    setCartItems({});
                    
                    // Small timeout to allow state updates to propagate
                    setTimeout(() => {
                        navigate("/myorders");
                    }, 500);
                } else {
                    toast.error(response.data.message || "Failed to place order");
                }
            } catch (error) {
                console.error("Order placement error:", error);
                toast.error(error.response?.data?.message || "Order placement failed. Please try again.");
            }
        }
    };

    // New function to handle Razorpay after getting data from backend
    const handleRazorpayWithData = async (paymentData) => {
        const { order_id, key_id, amount, currency, orderId } = paymentData;
        
        // Load Razorpay script dynamically
        const razorpayLoaded = await loadRazorpay();
        
        if (!razorpayLoaded) {
            toast.error("Could not load payment system. Please try again later.");
            return;
        }
        
        const options = {
            key: key_id,
            amount: amount,
            currency: currency,
            name: "Your Restaurant Name",
            description: "Food Order Payment",
            order_id: order_id,
            handler: async function (response) {
                try {
                    const verifyResponse = await axios.post(
                        `${url}/api/order/verifyPayment`, 
                        {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId
                        },
                        {
                            headers: { token }
                        }
                    );
        
                    if (verifyResponse.data.success) {
                        toast.success("Payment Successful!");
                        navigate("/myorders");
                        setCartItems({});
                    } else {
                        toast.error("Payment verification failed");
                    }
                } catch (error) {
                    console.error("Payment verification error:", error);
                    toast.error("Payment verification failed. Please contact support.");
                }
            },
            prefill: {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                contact: data.phone,
            },
            theme: {
                color: "#3399cc"
            }
        };

        try {
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Razorpay initialization error:", error);
            toast.error("Online payment unavailable. Would you like to try Cash on Delivery?");
            
            // Ask user if they want to switch to COD
            const switchToCOD = window.confirm("Would you like to place an order with Cash on Delivery instead?");
            if (switchToCOD) {
                setPayment("cod");
                // Trigger order placement with COD
                try {
                    console.log("Falling back to COD order data:", orderData);
                    let response = await axios.post(
                        `${url}/api/order/placecod`, 
                        orderData,
                        { headers: { token } }
                    );
                    
                    if (response.data.success) {
                        toast.success(response.data.message || "Order placed successfully!");
                        setCartItems({});
                        
                        // Small timeout to allow state updates to propagate
                        setTimeout(() => {
                            navigate("/myorders");
                        }, 500);
                    } else {
                        toast.error(response.data.message || "Failed to place order");
                    }
                } catch (codError) {
                    console.error("COD fallback error:", codError);
                    toast.error("Order placement failed. Please try again.");
                }
            }
        }
    };

    useEffect(() => {
        if (!token) {
            toast.error("To place an order, sign in first");
            navigate('/cart');
        } else if (getTotalCartAmount() === 0) {
            navigate('/cart');
        }
    }, [token, navigate]);

    useEffect(() => {
        // Preload Razorpay script when component mounts
        if (payment === "razorpay") {
            loadRazorpay().then(success => {
                console.log("Razorpay preload:", success ? "success" : "failed");
            });
        }
    }, [payment]);

    return (
        <form onSubmit={placeOrder} className='place-order'>
            <div className="place-order-left">
                <p className='title'>Delivery Information</p>
                <div className="multi-field">
                    <input type="text" name='firstName' onChange={onChangeHandler} value={data.firstName} placeholder='First name' required />
                    <input type="text" name='lastName' onChange={onChangeHandler} value={data.lastName} placeholder='Last name' required />
                </div>
                <input type="email" name='email' onChange={onChangeHandler} value={data.email} placeholder='Email address' required />
                <input type="text" name='street' onChange={onChangeHandler} value={data.street} placeholder='Street' required />
                <div className="multi-field">
                    <input type="text" name='city' onChange={onChangeHandler} value={data.city} placeholder='City' required />
                    <input type="text" name='state' onChange={onChangeHandler} value={data.state} placeholder='State' required />
                </div>
                <div className="multi-field">
                    <input type="text" name='zipcode' onChange={onChangeHandler} value={data.zipcode} placeholder='Zip code' required />
                    <input type="text" name='country' onChange={onChangeHandler} value={data.country} placeholder='Country' required />
                </div>
                <input type="text" name='phone' onChange={onChangeHandler} value={data.phone} placeholder='Phone' required />
            </div>
            <div className="place-order-right">
                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
                        <hr />
                        <div className="cart-total-details"><p>Delivery Fee</p><p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p></div>
                        <hr />
                        <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}</b></div>
                    </div>
                </div>
                <div className="payment">
                    <h2>Payment Method</h2>
                    <div onClick={() => setPayment("cod")} className="payment-option">
                        <img src={payment === "cod" ? assets.checked : assets.un_checked} alt="" />
                        <p>COD (Cash on Delivery)</p>
                    </div>
                    <div onClick={() => setPayment("razorpay")} className="payment-option">
                        <img src={payment === "razorpay" ? assets.checked : assets.un_checked} alt="" />
                        <p>Razorpay (Online Payment)</p>
                    </div>
                </div>
                <button className='place-order-submit' type='submit'>{payment === "cod" ? "Place Order" : "Proceed To Payment"}</button>
            </div>
        </form>
    );
};

export default PlaceOrder;
