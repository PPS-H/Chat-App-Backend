import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";

export const ErrorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
    console.log(err);
    
  err.message ||= "Internal Server error";
  err.statusCode ||= 500;

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
