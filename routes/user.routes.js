import {
  registerController,
  loginController,
  logoutController,
  refreshAccessTokenController,
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

export default userRouter;
