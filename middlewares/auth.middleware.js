import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "User unauthorized");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(404, "Invalid Access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid access token");
  }
});
