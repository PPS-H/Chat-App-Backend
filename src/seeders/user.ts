import { faker } from "@faker-js/faker";
import { User } from "../models/user.js";
export const createUsers = async (num: number) => {
  try {
    const usersPromise = [];

    for (let index = 0; index < num; index++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: "password",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });
      usersPromise.push(tempUser);
    }
    await Promise.all(usersPromise);
    console.log("Users created", num);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
