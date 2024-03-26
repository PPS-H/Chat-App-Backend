import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../utils/features.js";

declare global {
  namespace Express {
    interface Request {
      user: string; // Define the 'user' property
    }
  }
}

export const isAuthenticated = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatAppToken } = req.cookies;
    if (!chatAppToken) return next(new ErrorHandler("Please Login first", 500));

    const decoded: JwtPayload = (await jwt.verify(
      chatAppToken,
      process.env.JWT_SECRET_KEY!
    )) as JwtPayload;
    const id = decoded._id;
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("Please Login first", 500));
    req.user = user._id.toString();
    next();
  }
);
