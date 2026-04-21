import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(128),
  }),
});

export { registerSchema };
