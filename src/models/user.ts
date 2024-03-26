import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import { UserResponse } from "../types/types.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: [true, "Please enter a username"],
      unique: [true, "Username is already in use"],
    },
    email: {
      type: String,
      required: [true, "Please enter a user email."],
      unique: [true, "Email is already in use."],
    },
    password: {
      type: String,
      required: [true, "Please enter user password"],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    verified: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

export const User = model<UserResponse>("User", userSchema);
