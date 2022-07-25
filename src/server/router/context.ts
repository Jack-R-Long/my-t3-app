// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { verify } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";

import { authOptions as nextAuthOptions } from "../../pages/api/auth/[...nextauth]";
import { verifyJwt } from "../../utils/jwt";
import { prisma } from "../db/client";

interface CtxUser {
  id: string,
  email: string,
  name: string,
  iat: string,
  exp: number
}

function getUserFromRequest(req: NextApiRequest) {
  const token = req.cookies.token

  if (token) {
    try {
      const verified = verifyJwt<CtxUser>(token)
      return verified
    } catch (e) {
      return null
    }
  }
  return null
}

export function createContext(
  { req, res, }: { req: NextApiRequest, res: NextApiResponse }) {

  const user = getUserFromRequest(req)

  return {
    req,
    res,
    prisma,
    user
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>();
