import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export interface File {
  public_id: string;
  url: string;
}

export interface MembersType {
  avatar: File;
  name: string;
  _id: Types.ObjectId;
}
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response<any, Record<string, any>> | any>;

export type UserResponse = {
  name: string;
  username: string;
  password: string;
  email: string;
  avatar: File;
  verified: boolean;
  createdAt: string;
  UpdatedAt: string;
};
export type ChatResponse = {
  name: string;
  groupChat: boolean;
  creator: string;
  members: Array<string>;
  createdAt: string;
  UpdatedAt: string;
};
export type MessageResponse = {
  chat: string;
  sender: boolean;
  content: string;
  attachments: Array<File>;
  createdAt: string;
  UpdatedAt: string;
};
export type RequestModel = {
  status: string;
  sender: string;
  receiver: string;
  createdAt: string;
  UpdatedAt: string;
};

export type UserRegisterRequest = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type UserLoginRequest = {
  username: string;
  password: string;
};

export type GroupChatRequest = {
  name: string;
  members: Array<string>;
};
export type AddGroupMemberRequest = {
  chatId: string;
  members: string[];
};
export type RemoveGroupMemberRequest = {
  chatId: string;
  userId: string;
};
