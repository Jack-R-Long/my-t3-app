import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET || "changeme"

export function signJwt(data: object) {
    return jwt.sign(data, SECRET)
}

// Passing in a generic type so we can specify the type that will be output
export function verifyJwt<T>(token: string) {
    return jwt.verify(token, SECRET) as T
}