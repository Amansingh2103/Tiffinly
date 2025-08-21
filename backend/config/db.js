import mongoose from "mongoose";

let url = "mongodb+srv://varad:varad6862@cluster0.0suvvd6.mongodb.net/avi"

export const connectDB = async () => {
  await mongoose
    .connect('mongodb+srv://Aman2103:Aman2103@cluster0.8gpy25h.mongodb.net/tiffin_service')
    .then(() => console.log("DB Connected"));
};

// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.
