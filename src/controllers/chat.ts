import { NextFunction, Request, Response } from "express";
import { getOtherMembers } from "../lib/helper.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import {
  AddGroupMemberRequest,
  ChatResponse,
  File,
  GroupChatRequest,
  RemoveGroupMemberRequest,
} from "../types/types.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch, deleteAttachments, emitEvent } from "../utils/features.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events.js";
import { Message } from "../models/message.js";

export const createNewGroupChat = TryCatch(
  async (
    req: Request<{}, {}, GroupChatRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, members } = req.body;

    // if (members.length < 2)
    //   return next(
    //     new ErrorHandler("Group should contains atleast 3 memebers", 500)
    //   );

    const groupMembers = [req.user, ...members];

    await Chat.create({
      name,
      groupChat: true,
      creator: req.user,
      members: groupMembers,
    });

    res.status(201).json({
      success: true,
      message: "Chat created Successfully",
    });
  }
);

export const getAllChats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const chats = await Chat.find({ members: req.user }).populate(
      "members",
      "name avatar"
    );

    // console.log(chats);
    console.log(req.user);

    const transformedChats = chats?.map(
      ({ _id, name, groupChat, creator, members }) => {
        return {
          _id,
          name,
          groupChat,
          creator,
          avatar: getOtherMembers(members, req.user),
          members: members.reduce((prev, curr) => {
            if (curr._id.toString() !== req.user.toString()) {
              prev.push(curr._id.toString());
            }
            return prev;
          }, []),
        };
      }
    );

    res.status(200).json({
      success: true,
      chats: transformedChats,
    });
  }
);

export const addGroupMember = TryCatch(
  async (
    req: Request<{}, {}, AddGroupMemberRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { chatId, members } = req.body;
    // if (!chatId)
    //   return next(new ErrorHandler("Please provide the required data", 500));

    const chat = await Chat.findById(chatId);
    if (!chat) return next(new ErrorHandler("Chat Group not found", 404));

    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 500));

    if (chat.creator.toString() !== req.user.toString())
      return next(new ErrorHandler("You are not allowed to add members", 403));

    if (chat.members.length >= 100)
      return next(
        new ErrorHandler("Maximum limit of group members exceeded", 500)
      );

    if (members.length) {
      const newMembersArray = members.map((member) =>
        User.findById(member, "name")
      );
      const newMembers = await Promise.all(newMembersArray);

      const filteredMembers = newMembers.filter(
        (member) => !chat.members.includes(member!.toString())
      );

      const allUsersName = filteredMembers.map((i) => i?.name).join(",");

      chat.members = filteredMembers.map((i) => i!._id.toString());

      await chat.save();

      emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUsersName} has been added in the group`
      );

      emitEvent(req, REFETCH_CHATS, chat.members);

      res.status(200).json({
        success: true,
        message: "Member added successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Please select any member to add in the group",
      });
    }
  }
);

export const removeGroupMember = TryCatch(
  async (
    req: Request<{}, {}, RemoveGroupMemberRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, chatId } = req.body;
    // if (!chatId || !userId)
    //   return next(new ErrorHandler("Please provide the required data", 500));

    const [chat, user] = await Promise.all([
      Chat.findById(chatId),
      User.findById(userId),
    ]);
    if (!chat) return next(new ErrorHandler("Chat Group not found", 404));

    if (!user) return next(new ErrorHandler("User not found", 404));

    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 500));

    if (chat.creator.toString() !== req.user.toString())
      return next(
        new ErrorHandler("You are not allowed to remove members", 403)
      );

    if (chat.members.length <= 3)
      return next(new ErrorHandler("Group must have at least 3 members", 400));

    const remainingMembers = chat.members.filter(
      (member) => member.toString() != userId
    );

    if (remainingMembers.length !== chat.members.length) {
      if (chat.creator.toString() === user?._id.toString()) {
        let index = Math.floor(Math.random() * remainingMembers.length);
        chat.creator = remainingMembers[index];
      }

      chat.members = remainingMembers;
      await chat.save();

      emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.name} is removed from the group`
      );
      emitEvent(req, REFETCH_CHATS, chat.members);

      res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } else {
      return next(new ErrorHandler("Member is not in the group", 400));
    }
  }
);

export const leaveGroup = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const [user, chat] = await Promise.all([
      User.findById(req.user),
      Chat.findById(id),
    ]);

    if (!user) return next(new ErrorHandler("User not found", 500));
    if (!chat) return next(new ErrorHandler("Chat not found", 500));

    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat ", 500));

    const remainingMembers = chat.members.filter(
      (member) => member.toString() !== req.user
    );
    if (remainingMembers.length !== chat.members.length) {
      if (chat.creator.toString() === req.user) {
        let index = Math.floor(Math.random() * remainingMembers.length);
        chat.creator = remainingMembers[index];
      }
      chat.members = remainingMembers;
      await chat.save();

      emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.name} left the group conversation`
      );
      emitEvent(req, REFETCH_CHATS, chat.members);

      res.status(200).json({
        success: true,
        message: "Member removed from the group",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Member is not in the group",
      });
    }
  }
);

export const sendAttachments = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.body;

    // if (!chatId)
    //   return next(new ErrorHandler("Pleas provide required fields data", 500));

    const [chat, user] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user, "name"),
    ]);

    if (!chat) return next(new ErrorHandler("Chat not found", 500));

    const files = req.files || [];

    if (!files.length)
      return next(new ErrorHandler("Please upload any file", 500));

    // upload files on cloudinary
    const attachments: File[] = [{ public_id: "dummy", url: "dummy" }];

    const messageForDB = {
      chat: chatId,
      sender: req.user,
      content: "",
      attachments,
    };
    const messageForRealTime = {
      ...messageForDB,
      sender: {
        id: req.user,
        name: user?.name,
      },
    };

    await Message.create(messageForDB);

    emitEvent(req, NEW_ATTACHMENT, chat.members, "");
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, "");

    res.status(200).json({
      success: true,
      message: "Attchment uploaded successfully",
    });
  }
);

export const getChatDetails = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { populate } = req.query;
    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("Chat not found", 500));
    let response: any = chat;
    if (populate) {
      response = await Chat.findById(id)
        .populate("members", "name avatar")
        .lean();
      response = response.members.map(({ _id, name, avatar }: any) => {
        return {
          _id,
          name,
          avatar: avatar.url,
        };
      });

      console.log(response);
    }

    res.status(200).json({
      success: true,
      chat: response,
    });
  }
);

export const renameChat = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) return next(new ErrorHandler("CHat not found", 500));
    if (chat.groupChat && chat.creator.toString() !== req.user) {
      return next(
        new ErrorHandler("You are not allowed to rename this chat group", 500)
      );
    }
    if (!chat.groupChat && !chat.members.includes(req.user)) {
      return next(
        new ErrorHandler("You are not allowed to rename this chat", 500)
      );
    }
    if (!name)
      return next(
        new ErrorHandler("Please provide the new name of the chat", 500)
      );

    chat.name = name;
    await chat.save();

    res.status(200).json({
      success: true,
      message: "Chat name changed successfully",
    });
  }
);

export const deleteChat = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const chat = await Chat.findById(id);

    if (!chat) return next(new ErrorHandler("Chat not found", 500));

    if (chat.groupChat && chat.creator.toString() !== req.user) {
      return next(
        new ErrorHandler("You are not allowed to rename this chat group", 500)
      );
    }
    if (!chat.groupChat && !chat.members.includes(req.user)) {
      return next(
        new ErrorHandler("You are not allowed to rename this chat", 500)
      );
    }

    // Delete messages related to chat and attachments as well from the cloudinary
    const messages = await Message.find({
      chat: id,
      attachments: { $ne: [] },
    });

    let attachments: string[] = [];
    messages.forEach((message) =>
      message.attachments.forEach((i) => attachments.push(i.public_id))
    );

    await Promise.all([
      Message.deleteMany({ chat: id }),
      deleteAttachments(attachments),
      Chat.findByIdAndDelete(id),
    ]);

    emitEvent(req, REFETCH_CHATS, chat.members);

    res.status(200).json({
      success: true,
      message: "Messages deleted successfully",
    });

    console.log(attachments);
  }
);

export const getAllMessages = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { page = 1 } = req.query;

    const chat = await Chat.findById(id);

    if (!chat) return next(new ErrorHandler("Chat not found", 500));
    const results_per_page = 20;
    const skip = (Number(page) - 1) * results_per_page;

    const [messages, total] = await Promise.all([
      Message.find({ chat: id })
        .limit(results_per_page)
        .skip(skip)
        .sort({ createdAt: -1 })
        .populate("sender", "name")
        .lean(),
      Message.countDocuments({ chat: id }),
    ]);

    const totalPages = Math.ceil(total / results_per_page);

    res.status(200).json({
      success: true,
      messages,
      totalPages,
    });

    // let response = messages.map(
    //   ({ _id, chat, sender, content, attachments }) => {
    //     return {
    //       _id,
    //       chat,
    //       sender: { name: sender.name },
    //       content,
    //       attachments: attachments.map((i) => i.url),
    //     };
    //   }
    // );

    // console.log(response);
  }
);

// {
//   "username":"parminder",
//   "password":"1245784578"
// }

// {
//   "username":"Jaunita_Wyman89",
//   "password":"password"
// }
