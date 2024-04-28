import {
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
} from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerController
);
userRouter.route("/login").post(loginController);

// secured Routes
userRouter.route("/logout").post(verifyJwt, logoutController);
userRouter.route("/refresh-token").post(refreshAccessTokenController);
userRouter.route("/change-password").post(verifyJwt, changePasswordController);
userRouter.route("/current-user").post(verifyJwt, getCurrentUserController);
userRouter
  .route("/update-user-details")
  .patch(verifyJwt, updateAccoutDetailsController);
userRouter
  .route("/update-user-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatarController);
userRouter
  .route("/update-user-coverimage")
  .patch(
    verifyJwt,
    upload.single("coverImage"),
    updateUserCoverImageController
  );
userRouter
  .route("/user-channel-profile-details")
  .get(verifyJwt, getUserChannelProfileDetails);

export default userRouter;
