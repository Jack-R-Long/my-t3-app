// Zod validation for the front and back to grab
import z from 'zod'

export const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
})

export const createUserOutputSchema = z.object({
    name: z.string(),
    email: z.string().email(),
})

export const requestOTPSchema = z.object({
    email: z.string().email(),
})

export type CreateUserInput = z.TypeOf<typeof createUserSchema>
export type RequestOTP = z.TypeOf<typeof requestOTPSchema>