import express from "express";
import {
  addGroupMember,
  createNewGroupChat,
  deleteChat,
  getAllChats,
  getAllMessages,
  getChatDetails,
  leaveGroup,
  removeGroupMember,
  renameChat,
  sendAttachments,
} from "../controllers/chat.js";
import {
  addNewMemberValidator,
  newGroupValidator,
  removeMemberValidator,
  renameChatValidator,
  validateHandler,
} from "../lib/validator.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { attachmentsUpload } from "../middlewares/multer.js";

const app = express.Router();

app.use(isAuthenticated);
app.post(
  "/group/new",
  newGroupValidator(),
  validateHandler,
  createNewGroupChat
);
app.get("/all", getAllChats);
app.post(
  "/group/addmember",
  addNewMemberValidator(),
  validateHandler,
  addGroupMember
);
app.put(
  "/group/remove",
  removeMemberValidator(),
  validateHandler,
  removeGroupMember
);
app.delete("/group/leave/:id", leaveGroup);

app.post("/attachments", attachmentsUpload.array("files", 10), sendAttachments);

app
  .route("/:id")
  .get(getChatDetails)
  .put(renameChatValidator(), validateHandler, renameChat)
  .delete(deleteChat);

app.get("/messages/:id", getAllMessages);

export default app;
