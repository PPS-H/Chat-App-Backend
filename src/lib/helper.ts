import { userSocketIds } from "../app.js";
import { MembersType } from "../types/types.js";

export const getOtherMembers = (members: Array<MembersType>, id: string) => {
  return members.filter((member) => member._id.toString() !== id);
};
export const getSockets = (users: string[]) =>
  users.map((user) => userSocketIds.get(user._id.toString()));
