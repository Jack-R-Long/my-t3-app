import { createRouter } from "./context";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { TRPCError } from "@trpc/server"
import { createUserSchema, requestOTPSchema } from "../../schema/user.schema";
import { sendLoginEmail } from "../../utils/mailer";
import { baseUrl, url } from "../constants"
import { encode } from "../../utils/base64";

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
  })
  .mutation("requestOTP", {
    input: requestOTPSchema,
    async resolve({ input, ctx }) {
      const { email, redirect } = input

      const user = await ctx.prisma.user.findUnique({
        where: {
          email,
        }
      })

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        })
      }

      const token = await ctx.prisma.loginToken.create({
        data: {
          redirect,
          user: {
            connect: {
              id: user.id,
            }
          }
        }
      })

      await sendLoginEmail({
        token: encode(`${token.id}:${user.email}`),
        url: baseUrl,
        email: user.email,
      })
      // send email to user


      return true;
    }

  })

