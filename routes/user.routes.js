import registerController from "../controllers/user.controller.js";
import { Router } from "express";

const userRouter = Router();

userRouter.route("/register").post(registerController);

export default userRouter;
