import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/dbConnection.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import subcriptionRouter from "./routes/subscription.routes.js";

dotenv.config();
const PORT = process.env.PORT || 8001;

const app = express();

app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscribers", subcriptionRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting database ", err);
  });
