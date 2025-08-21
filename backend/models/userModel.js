import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    subcribed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    cartData: { type: Object, default: {} },
    lastFreeDishDate: { type: Date, default: null }, // Track last free dish order
}, { timestamps: true, minimize: false })

// TEMPORARILY DISABLE THIS HOOK to test if it's causing issues
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Fix the model registration to avoid duplicate model error
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

