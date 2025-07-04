import 'dotenv/config';
import { z } from 'zod';
import { InferZodSchema, SchemaValues, Simplify } from './types';
interface EnvProps<T extends Record<string, z.ZodType>> {
    readonly schema: T;
    readonly values?: SchemaValues<T>;
}
export declare function createEnv<T extends Record<string, z.ZodType>>({ schema, values, }: EnvProps<T>): Simplify<InferZodSchema<T>>;
export declare function envValue<T, U>(dev: T, prod: U): T | U;
export {};
//# sourceMappingURL=index.d.ts.map