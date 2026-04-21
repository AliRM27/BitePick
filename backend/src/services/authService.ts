import bcrypt from "bcryptjs";

import { signToken } from "../lib/jwt";
import { User } from "../models/User";

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

const registerUser = async ({ name, email, password }: RegisterUserInput) => {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
  });

  return { user, token };
};

export { registerUser };
