import mongoose from "mongoose";
import { ControllerType } from "../types/types.js";
import { NextFunction, Request, Response } from "express";

export const connectToDB = (url: string) => {
  mongoose
    .connect(url, { dbName: "ChatApp" })
    .then(() => {
      console.log("Connect to the database successfully");
    })
    .catch((error) => {
      console.log(error);
    });
};

export const TryCatch =
  (func: ControllerType) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };

export const emitEvent = (
  req: Request,
  event: string,
  users: string[],
  message?: string
) => {
  console.log("Emitting event...");
};

export const deleteAttachments = async(attachments: string[]) => {
  console.log("Deleting atachments from the cloudinary...");
};
