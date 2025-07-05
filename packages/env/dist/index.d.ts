import "dotenv/config";
import { z } from "zod";
import type { InferZodSchema, SchemaValues, Simplify } from "./types";
type ZodSchemaMap = Record<string, z.ZodType>;
interface EnvProps<T extends ZodSchemaMap> {
    readonly schema: T;
    readonly values?: SchemaValues<T>;
}
export declare function createEnv<T extends ZodSchemaMap>({ schema, values, }: EnvProps<T>): Simplify<InferZodSchema<T>>;
export declare function envValue<T, U>(dev: T, prod: U): T | U;
export {};
//# sourceMappingURL=index.d.ts.map