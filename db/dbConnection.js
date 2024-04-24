import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

dotenv.config();

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      "Database connected Host: ",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.error("Error connecting to database ", error);
    process.exit(1);
  }
};
