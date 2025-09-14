import express from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
  userProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
  resendVerificationMail,
} from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.get("/verify/:token", verifyUser);

router.post("/login", loginUser);
router.post("/dashboard", isLoggedIn, userProfile);
router.post("/forgotpassword", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/resend-verification", resendVerificationMail);

router.post("/logout", isLoggedIn, logoutUser);

export default router;
