import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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
});

const loginController = asyncHandler(async (req, res) => {
  //data
  //email and password
  //find user
  // check password
  // acces token and refreh token
  //send cookie

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
});

const logoutController = asyncHandler(async (req, res) => {
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

export {
  registerController,
  loginController,
  logoutController,
  refreshAccessTokenController,
};
