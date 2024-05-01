import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = await user.generateAccessToken();
  console.log("accesstoken", accessToken);
  const refreshToken = await user.generateRefreshToken();
  console.log("refreshtoken", refreshToken);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const registerController = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validating data
  // check for existince of user
  // check for files
  // upload files to cloud
  // create user
  // exclude sensitive info from response
  // check for user creation
  // return resposne

  try {
    const { username, fullName, password, email } = req.body;
    if (
      [fullName, password, email, username].some((field) => field?.trim === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req.files.avatar[0].path;
    const coverImageLocalPath = req.files.coverImage[0].path;

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
      throw new ApiError(404, "Avatar is required");
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "something went wrong creating user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    throw new ApiError(400, error.message || "something went wrong");
  }
});

const loginController = asyncHandler(async (req, res) => {
  //data
  //email and password
  //find user
  // check password
  // acces token and refreh token
  //send cookie

  try {
    const { email, password } = req.body;
    if (!email && !password) {
      throw new ApiError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User does not exits");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(404, "User credentials are not valid");
    }
    const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(
      user._id
    );
    console.log("accesstoken", accessToken);
    console.log("refresh token", refreshToken);
    const options = {
      httpOnly: true,
      secure: true,
    };

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { loggedInUser, refreshToken, accessToken },
          "User logged in successful"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "something went wrong");
  }
});

const logoutController = asyncHandler(async (req, res) => {
  try {
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log("req.user", req.user);
    const user = await User.findByIdAndUpdate(req.user._id, {
      $set: {
        refreshToken: undefined,
      },
    });
    console.log("user---->", user);
    if (user) {
      res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
    }
  } catch (error) {
    throw new ApiError(400, error.message || "something went wrong");
  }
});

const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = await jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(401, "Unauthorized requesst");
    }
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "Does not exits");
    }
    const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(
      decodedToken?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Unauthorized request");
  }
});

const changePasswordController = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Passwor is not correct");
    }
    user.password = newPassword;
    await user.save();
    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Passsword updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched successfully"));
});

const updateAccoutDetailsController = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User updated successfully"));
});

const updateUserAvatarController = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar not Provided");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, user.avatar, "User avatar updated"));
});

const updateUserCoverImageController = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage is Required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user.coverImage,
        "User coverImage updated successfully"
      )
    );
});

const getUserChannelProfileDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subcribedTo",
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$subcribers",
        },
        channelsSubscribed: {
          $size: "$subcribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        channelsSubscribed: 1,
        subscribers: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exits");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel data fetched successfully")
    );
});

const userWatchHistoryController = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "User history fetched successfully"
      )
    );
});

export {
  registerController,
  loginController,
  logoutController,
  refreshAccessTokenController,
  changePasswordController,
  getCurrentUserController,
  updateAccoutDetailsController,
  updateUserAvatarController,
  updateUserCoverImageController,
  getUserChannelProfileDetails,
  userWatchHistoryController,
};
