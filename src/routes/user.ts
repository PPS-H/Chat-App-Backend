import express from "express";
import {
  accountVerification,
  getMyProfile,
  loginUser,
  logout,
  searchUser,
  signUp,
} from "../controllers/user.js";
import { upload } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  loginValidator,
  registrationValidator,
  searchUserValidator,
  validateHandler,
} from "../lib/validator.js";

const app = express.Router();

app.post(
  "/signup",
  upload.single("avatar"),
  registrationValidator(),
  validateHandler,
  signUp
);
app.post("/login", loginValidator(), validateHandler, loginUser);
app.get("/accountVerification/:token", accountVerification);
app.use(isAuthenticated);
app.get("/logout", logout);
app.get("/profile", getMyProfile);

app.get("/search", searchUserValidator(), validateHandler, searchUser);
export default app;
