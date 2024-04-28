import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const userSubcriptionsController = asyncHandler(async (req, res) => {
  const { subscriber, channel } = req.body;
  if (!(subscriber && channel)) {
    throw new ApiError(400, "subscriber and channel data is missing");
  }
  const subscribedUser = await Subscription.findOne({ subscriber });

  if (subscribedUser) {
    throw new ApiError(400, "User already subscribed");
  }

  const subscribed = await Subscription.create({ subscriber, channel });
  if (subscribed) {
    return res
      .status(201)
      .json(new ApiResponse(201, subscribed, "User subscribed successfully"));
  }
});

export { userSubcriptionsController };
