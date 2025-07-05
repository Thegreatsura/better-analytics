import "dotenv/config";

import { z } from "zod";

import type { InferZodSchema, SchemaValues, Simplify } from "./types";

type ZodSchemaMap = Record<string, z.ZodType>;

interface EnvProps<T extends ZodSchemaMap> {
	readonly schema: T;
	readonly values?: SchemaValues<T>;
}

export function createEnv<T extends ZodSchemaMap>({
	schema,
	values,
}: EnvProps<T>): Simplify<InferZodSchema<T>> {
	const zodSchema = z.object(schema);
	const isBrowser = typeof window !== "undefined";

	if (isBrowser) {
		return new Proxy({} as InferZodSchema<T>, {
			get: () => undefined,
		});
	}

	const mergedEnv = { ...values, ...process.env };
	const parsed = zodSchema.safeParse(mergedEnv);

	if (!parsed.success) {
		const missingVars = Object.keys(parsed.error.format())
			.filter((key) => key !== "_errors")
			.join(", ");

		console.error(
			`❌ [${process.title}] Missing environment variables: ${missingVars}`,
		);
		process.exit(1);
	}

	return new Proxy(parsed.data as InferZodSchema<T>, {
		get: (target, prop) =>
			typeof prop === "string" ? Reflect.get(target, prop) : undefined,
	});
}

export function envValue<T, U>(dev: T, prod: U): T | U {
	return process.env.NODE_ENV === "development" ? dev : prod;
}
