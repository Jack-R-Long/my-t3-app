import { createRouter } from "./context";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { TRPCError } from "@trpc/server"
import { createUserSchema, requestOTPSchema, verifyOtpSchema } from "../../schema/user.schema";
import { sendLoginEmail } from "../../utils/mailer";
import { baseUrl, url } from "../constants"
import { decode, encode } from "../../utils/base64";
import path, { resolve } from "path";
import { verify } from "crypto";
import { signJwt } from "../../utils/jwt";
import { serialize } from 'cookie'

export const userRouter = createRouter()
  // hanlders
  // query = GET (kind of)
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
  // mutation is a POST
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


      return true
    },

  })
  .query('verifyOTP', {
    input: verifyOtpSchema,
    async resolve({ input, ctx }) {

      const [id, email] = decode(input.hash).split(':')

      // find token by id
      const token = await ctx.prisma.loginToken.findFirst({
        where: {
          id,
          user: {
            email
          }
        },
        // get the user as well
        include: {
          user: true,
        }
      })

      if (!token) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a valid OTP"
        })
      }

      const jwt = signJwt({
        email: token.user.email,
        id: token.user.id
      })

      ctx.res?.setHeader('Set-Cookie', serialize('token', jwt, { path: '/' }))

      return {
        redirect: token.redirect
      }

    }

  })
  // .query('me', {
  //   resolve(ctx) {
  //     ctx.user
  //   }
  // })

