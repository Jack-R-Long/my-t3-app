import { createRouter } from "./context";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { trpc } from "../../utils/trpc";
import { TRPCError } from "@trpc/server"
import { createUserSchema } from "../../schema/user.schema";

export const userRouter = createRouter()
  .query("hello", {
    input: z
      .object({
        text: z.string().nullish(),
      })
      .nullish(),
    resolve({ input }) {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    },
  })
  .mutation('register-user', {
    input: createUserSchema,
    async resolve({ ctx, input }) {
      const { email, name } = input; //destructuring lol
      // account for duplicate emails
      try {
        const user = ctx.prisma.user.create(
          {
            data: {
              name,
              email
            }
          })

        return user
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'User already exists with email',
            })
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong"
        })
      }
    },
  })
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.user.findMany();
    },
  });
