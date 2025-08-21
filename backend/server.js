import express  from "express"
import cors from 'cors'
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import subscribeRouter from "./routes/subscribeRoute.js"
import deliveryDetailsRouter from "./routes/deliveryDetailsRoute.js"
import './models/userModel.js'
import './models/subscriptionModel.js'
import './models/deliveryDetailsModel.js'

// app config
const app = express()
const port = process.env.PORT || 4000;


// middlewares
app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

// db connection
connectDB()

// Import models explicitly to ensure they're registered
import User from './models/userModel.js'
import './models/subscriptionModel.js'
import './models/deliveryDetailsModel.js'

// Add this before your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the original send
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response:`, typeof data === 'string' ? data : JSON.stringify(data));
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/subscribe", subscribeRouter)
app.use("/api/delivery", deliveryDetailsRouter)

app.get("/", (req, res) => {
    res.send("API Working")
  });

// Add this near the end of your routes configuration
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))