import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: [8, "title must be 8 or greater"],
    },
    description: {
      type: String,
      required: true,
      min: [20, "description must be greater or equal to 20 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

export const product = mongoose.model("Product", todosSchema);
