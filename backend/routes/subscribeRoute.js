import express from "express";
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getUserSubscriptions,
  getActiveUserSubscriptions,
  cancelSubscription,
  completeSubscription,
  createSubscriptionPayment,
  verifySubscriptionPayment
} from "../controllers/subscribeController.js";
import { verifyToken, optionalAuth } from "../middleware/authMiddleware.js";
import DeliveryDetails from '../models/deliveryDetailsModel.js';
import Subscription from '../models/subscriptionModel.js';

const router = express.Router();

// Routes that require authentication
router.get("/", getAllSubscriptions);
router.get("/:id", verifyToken, getSubscriptionById);
router.put("/:id", verifyToken, updateSubscription);
router.delete("/:id", verifyToken, deleteSubscription);
router.get("/user/:userId", verifyToken, getUserSubscriptions);
router.get("/user/:userId/active", verifyToken, getActiveUserSubscriptions);
router.put("/:id/cancel", verifyToken, cancelSubscription);
router.put("/:id/complete", verifyToken, completeSubscription);

// Routes that allow guest users
router.post("/", optionalAuth, createSubscription);
router.post("/create-payment", optionalAuth, createSubscriptionPayment);
router.post("/verify-payment", optionalAuth, verifySubscriptionPayment);

export default router;
