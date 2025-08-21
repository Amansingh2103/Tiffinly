import React, { useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const LoginPopup = ({ setShowLogin }) => {
    const { setToken, url, loadCartData } = useContext(StoreContext)
    const [currState, setCurrState] = useState("Sign Up");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerifying, setIsOtpVerifying] = useState(false);
    const [otpValue, setOtpValue] = useState('');

    const [data, setData] = useState({
        name: "",
        email: "",
        password: ""
    })

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData(data => ({ ...data, [name]: value }))
    }

    const sendOTP = async (e) => {
        e.preventDefault();
        
        if (!data.email || !data.name || !data.password) {
            toast.error("Please fill all required fields");
            return;
        }
        
        try {
            setIsOtpVerifying(true);
            const response = await axios.post(`${url}/api/user/send-otp`, {
                name: data.name,
                email: data.email,
                password: data.password
            });
            
            if (response.data.success) {
                setIsOtpSent(true);
                toast.success("OTP sent to your email");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
            console.error("Error sending OTP:", error);
        } finally {
            setIsOtpVerifying(false);
        }
    }

    const verifyOTP = async (e) => {
        e.preventDefault();
        
        if (!otpValue) {
            toast.error("Please enter OTP");
            return;
        }
        
        try {
            setIsOtpVerifying(true);
            const response = await axios.post(`${url}/api/user/verify-otp`, {
                email: data.email,
                otp: otpValue
            });
            
            if (response.data.success) {
                toast.success("Registration successful!");
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                loadCartData({token: response.data.token});
                setShowLogin(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to verify OTP");
            console.error("Error verifying OTP:", error);
        } finally {
            setIsOtpVerifying(false);
        }
    }

    const onLogin = async (e) => {
        e.preventDefault()

        if (currState === "Sign Up") {
            // For sign up, we'll send OTP first
            await sendOTP(e);
            return;
        }

        // For login, proceed as usual
        try {
            const response = await axios.post(`${url}/api/user/login`, data);
            if (response.data.success) {
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                loadCartData({token: response.data.token});
                setShowLogin(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
            console.error("Login error:", error);
        }
    }

    // Render OTP verification form
    const renderOTPVerification = () => (
        <div className="login-popup-container">
            <div className="login-popup-title">
                <h2>Verify Email</h2> 
                <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
            </div>
            
            <p className="otp-message">Please enter the 6-digit code sent to {data.email}</p>
            
            <form onSubmit={verifyOTP}>
                <div className="otp-input-container">
                    <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        maxLength="6"
                        required
                    />
                </div>
                
                <button disabled={isOtpVerifying}>
                    {isOtpVerifying ? "Verifying..." : "Verify OTP"}
                </button>
                
                <p className="resend-otp">
                    Didn't receive the code? <span onClick={sendOTP}>Resend OTP</span>
                </p>
                
                <p>
                    <span onClick={() => {
                        setIsOtpSent(false);
                        setCurrState("Login");
                    }}>
                        Back to Login
                    </span>
                </p>
            </form>
        </div>
    );

    // Render login or signup form
    const renderAuthForm = () => (
        <form onSubmit={onLogin} className="login-popup-container">
            <div className="login-popup-title">
                <h2>{currState}</h2> 
                <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
            </div>
            <div className="login-popup-inputs">
                {currState === "Sign Up" ? <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required /> : <></>}
                <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
                <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
            </div>
            <button disabled={isOtpVerifying}>
                {isOtpVerifying ? "Processing..." : (currState === "Login" ? "Login" : "Request OTP")}
            </button>
            <div className="login-popup-condition">
                <input type="checkbox" name="" id="" required/>
                <p>By continuing, I agree to the terms of use & privacy policy.</p>
            </div>
            {currState === "Login"
                ? <p>Create a new account? <span onClick={() => setCurrState('Sign Up')}>Click here</span></p>
                : <p>Already have an account? <span onClick={() => setCurrState('Login')}>Login here</span></p>
            }
        </form>
    );

    return (
        <div className='login-popup'>
            {isOtpSent && currState === "Sign Up" ? renderOTPVerification() : renderAuthForm()}
        </div>
    )
}

export default LoginPopup
