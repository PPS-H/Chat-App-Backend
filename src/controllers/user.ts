import bcrypt from "bcrypt";
import { CookieOptions, NextFunction, Request, Response, json } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import {
  UserLoginRequest,
  UserRegisterRequest,
  UserResponse,
} from "../types/types.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../utils/features.js";
import RequestModel from "../models/request.js";

const cookieOptions: CookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure: true,
};

// User Signup
export const signUp = TryCatch(
  async (
    req: Request<{}, {}, UserRegisterRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, username, password, email } = req.body;
    console.log(req.body);

    if (!name || !username || !password || !email) {
      return next(new ErrorHandler("Please provide all the user data", 500));
    }

    const isUserExists = await User.findOne({ username });
    if (isUserExists)
      return next(new ErrorHandler("Username already taken", 500));

    const user = await User.create({
      name,
      username,
      email,
      password,
      avatar: { public_id: "dd", url: "dd" },
    });

    const cookieToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: "15d",
      }
    );

    res.status(201).cookie("chatAppToken", cookieToken, cookieOptions).json({
      succcess: true,
      message: "User Created Successfully",
    });

    // const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY!, {
    //   expiresIn: "5m",
    // });

    // sendEmail(user, token);
  }
);

const sendEmail = (user: UserResponse, token: string) => {
  const url = `http://localhost:5000/user/accountVerification/${token}`;
  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: user.email,
    subject: "Account Verification",
    text: `Hi ${user.name}, Please verify your account by click on the link: ${url}`,
  };

  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

export const accountVerification = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    console.log(token);

    const decoded: JwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as JwtPayload;
    const id = decoded._id;

    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("Invalid token", 500));

    user.verified = true;
    await user.save();

    const cookieToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: "15d",
      }
    );

    res.status(201).cookie("chatAppToken", cookieToken, cookieOptions).json({
      succcess: true,
      message: "User Created Successfully",
    });
  }
);

export const loginUser = TryCatch(
  async (
    req: Request<{}, {}, UserLoginRequest>,
    res: Response,
    next: NextFunction
  ) => {
    let verifyPassword;
    const { username, password } = req.body;
    if (!username || !password)
      return next(new ErrorHandler("Please provide all the user fields", 500));
    const user = await User.findOne({ username }).select([
      "+password",
      "+verified",
    ]);

    if (user) verifyPassword = await bcrypt.compare(password, user.password);
    if (!user || !verifyPassword)
      return next(new ErrorHandler("Invalid credentials", 500));

    // if (!user.verified) {
    //   const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY!, {
    //     expiresIn: "5m",
    //   });

    //   sendEmail(user, token);

    //   res.status(200).json({
    //     message:
    //       "An Verification email has been sent. Please verify your account first.",
    //   });
    // }

    const cookieToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: "15d",
      }
    );

    res
      .status(200)
      .cookie("chatAppToken", cookieToken, cookieOptions)
      .json({
        succcess: true,
        user: {
          usernmae: user.username,
          email: user.email,
        },
      });
  }
);

export const getMyProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user;
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 500));
    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const logout = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new ErrorHandler("Something went wrong", 500));
    res.status(200).cookie("chatAppToken", "", cookieOptions).json({
      succcess: true,
      message: "Log out successfully",
    });
  }
);

export const searchUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.query;

    const chats = await Chat.find({ members: req.user, groupChat: false });

    const allMembers = chats.flatMap((chat) => chat.members);

    const users = await User.find({
      _id: { $nin: allMembers },
      name: { $regex: name as any, $options: "i" },
    });

    console.log(users);
  }
);

export const sendRequest = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 500));

    const findRequest = await RequestModel.find({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });

    if (findRequest) return next(new ErrorHandler("Request already sent", 500));

    await RequestModel.create({
      sender: req.user,
      receiver: userId,
    });

    res.status(200).json({
      success: true,
      message: "Friend request sent succesfully",
    });
  }
);

// Pending function .....
export const acceptRequest = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { requestId, accept } = req.body;

    const request = await RequestModel.findById(requestId);
    if (!request) return next(new ErrorHandler("Request not found", 500));

    if (accept) {
      request.status = "accepted";
      await request.save();
      res.status(200).json({
        success: true,
        message: "Request accepted successfully",
      });
    } else {
      request.status = "rejected";
      await request.save();
      res.status(200).json({
        success: true,
        message: "Request rejected successfully",
      });
    }
  }
);
