import asyncHandler from "../utils/asyncHandler.js";

const registerController = asyncHandler(async (req, res) => {
  return res.status(200).json({
    message: "ok",
  });
});

export default registerController;
