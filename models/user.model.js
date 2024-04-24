import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, "email must be unique"],
    },
    password: {
      type: String,
      required: true,
      min: [8, "password must be greater than or equal to 8 character"],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
