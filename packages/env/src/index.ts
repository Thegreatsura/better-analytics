import 'dotenv/config'

import { z } from 'zod'

import { InferZodSchema, SchemaValues, Simplify } from './types'

interface EnvProps<T extends Record<string, z.ZodType>> {
  readonly schema: T
  readonly values?: SchemaValues<T>
}

export function createEnv<T extends Record<string, z.ZodType>>({
  schema,
  values,
}: EnvProps<T>): Simplify<InferZodSchema<T>> {
  const zodSchema = z.object(schema)
  const parsed = zodSchema.safeParse({ ...values, ...process.env })

  if (!parsed.success) {
    const missingVars = Object.keys(parsed.error.format()).filter(
      (key) => key !== '_errors',
    )

    console.error(
      `❌ [${process.title}] Missing environment variables: ${missingVars.join(', ')}`,
    )
    process.exit(1)
  }

  return new Proxy(parsed.data as InferZodSchema<T>, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined
      return Reflect.get(target, prop)
    },
  })
}

export function envValue<T, U>(dev: T, prod: U): T | U {
  return process.env.NODE_ENV === 'development' ? dev : prod
}
