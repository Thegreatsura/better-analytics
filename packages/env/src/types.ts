import type { z } from "zod";

export type Simplify<T> = {
	[P in keyof T]: T[P];
} & {};

export type InferZodSchema<T> = {
	[K in keyof T]: T[K] extends z.ZodType ? z.infer<T[K]> : never;
};

export type SchemaValues<T extends Record<string, z.ZodType>> = {
	[K in keyof T]?: z.infer<T[K]>;
};
