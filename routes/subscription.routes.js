import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { userSubcriptionsController } from "../controllers/subscribers.controller.js";

const subcriptionRouter = Router();

subcriptionRouter
  .route("/subscriptions")
  .post(verifyJwt, userSubcriptionsController);

export default subcriptionRouter;
