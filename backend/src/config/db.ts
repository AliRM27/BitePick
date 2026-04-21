import mongoose from "mongoose";

import { env } from "./env";

const connectDatabase = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

export { connectDatabase, disconnectDatabase };
