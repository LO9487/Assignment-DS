import mongoose from 'mongoose';

let isConnected = false; // Variable to track the connection status

export const connectToDB = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("Missing MongoDB URL");
  }

  if (isConnected) {
    console.log('MongoDB connection already established');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.log(error);
    throw new Error('Failed to connect to MongoDB');
  }
};
