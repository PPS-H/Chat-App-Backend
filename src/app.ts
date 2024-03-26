import express from "express";
import { connectToDB } from "./utils/features.js";
import "dotenv/config";
import { ErrorMiddleware } from "./middlewares/error.js";
import UserRoutes from "./routes/user.js";
import ChatRoutes from "./routes/chat.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { Message } from "./models/message.js";
import { getSockets } from "./lib/helper.js";

const port = 5000;
const app = express();
//Creating server and io
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(cookieParser());

// createUsers(10)

connectToDB(process.env.MONGO_URI!);

export const userSocketIds = new Map();

app.use("/user", UserRoutes);
app.use("/chat", ChatRoutes);

io.on("connection", (socket) => {
  const tempUser = {
    _id: "demo",
    name: "dmeo",
  };

  userSocketIds.set(tempUser._id.toString(), socket.id);

  console.log("User connected", userSocketIds);

  socket.on(NEW_MESSAGE, async ({ members, chatId, message }: any) => {
    const messageForRealTime = {
      _id: uuid(),
      content: message,
      sender: tempUser,
      chat: chatId,
      createAt: new Date().toISOString(),
    };
    const messageForDB = {
      sender: tempUser._id,
      chat: chatId,
      content: message,
    };

    const userSockets = getSockets(members);

    io.to(userSockets).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(userSockets).emit(NEW_MESSAGE_ALERT, {
      chatId,
    });

    await Message.create(messageForDB);
    console.log("DATA:");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    userSocketIds.delete(tempUser._id.toString());
  });
});

app.use(ErrorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
