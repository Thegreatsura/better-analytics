import { z } from 'zod'

export type LoginSchema = z.infer<typeof LoginSchema>

export const LoginSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address.',
  }),
})

export const LoginActionSchema = LoginSchema.extend({
  callbackURL: z.string().optional(),
})
