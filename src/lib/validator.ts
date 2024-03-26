import { NextFunction, Request, Response } from "express";
import { body, check, param, query, validationResult } from "express-validator";
import ErrorHandler from "../utils/ErrorHandler.js";

export const validateHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result
      .array()
      .map((err) => err.msg)
      .join(", ");
    return next(new ErrorHandler(errors, 500));
  }
  return next();
};

export const registrationValidator = () => [
  body("name", "Please enter the name of the user").notEmpty(),
  body("username", "Please enter unique username").notEmpty(),
  body("password", "Please enter password").notEmpty(),
  body("email")
    .notEmpty()
    .withMessage("Please enter user email")
    .isEmail()
    .withMessage("Please enter an valid email"),
  check("avatar", "Please upload user avatar"),
];

export const loginValidator = () => [
  body("username", "Please enter unique username").notEmpty(),
  body("password", "Please enter password").notEmpty(),
];

export const newGroupValidator = () => [
  body("name", "Please enter group name").notEmpty(),
  body("member")
    .notEmpty()
    .withMessage("Please enter group members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be in between 2-100"),
];

export const addNewMemberValidator = () => [
  body("chatId", "Please enter chatId").notEmpty(),
  body("members").notEmpty().withMessage("Please enter group members"),
];

export const removeMemberValidator = () => [
  body("chatId", "Please enter chatId").notEmpty(),
  body("userId", "Please enter userId").notEmpty(),
];

// export const leaveGroupValidator = () => [
//   param("id", "Please enter group ID").notEmpty(),
// ];

// export const sendAttachmentsValidator = () => [
//   param("chatId", "Please enter chatId").notEmpty(),
// ];

export const renameChatValidator = () => [
  param("id", "Please enter group ID").notEmpty(),
  body("name", "Please enter Group name").notEmpty(),
];

export const searchUserValidator = () => [
  query("name", "Please enter user name").notEmpty(),
];
