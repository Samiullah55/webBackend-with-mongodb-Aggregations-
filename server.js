import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/dbConnection.js";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT || 8001;

const app = express();
app.use(cors());
connectDB();
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
