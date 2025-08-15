import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { createUser, findUserByEmail, Role } from "@bmad-aigrowise/db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      password: z.string().min(6),
      role: z.enum(["CLIENT", "ADMIN"]).optional()
    }))
    .mutation(async ({ input }) => {
      const existingUser = await findUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      const user = await createUser({
        email: input.email,
        password: hashedPassword,
        role: input.role ? Role[input.role] : Role.CLIENT,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return null;
    }
    
    return {
      id: (ctx.session.user as any).id,
      email: ctx.session.user.email,
      role: (ctx.session.user as any).role,
    };
  }),
});