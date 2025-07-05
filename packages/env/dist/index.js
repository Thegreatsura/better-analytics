"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnv = createEnv;
exports.envValue = envValue;
require("dotenv/config");
const zod_1 = require("zod");
function createEnv({ schema, values, }) {
    const zodSchema = zod_1.z.object(schema);
    const isBrowser = typeof window !== "undefined";
    if (isBrowser) {
        return new Proxy({}, {
            get: () => undefined,
        });
    }
    const mergedEnv = { ...values, ...process.env };
    const parsed = zodSchema.safeParse(mergedEnv);
    if (!parsed.success) {
        const missingVars = Object.keys(parsed.error.format())
            .filter((key) => key !== "_errors")
            .join(", ");
        console.error(`❌ [${process.title}] Missing environment variables: ${missingVars}`);
        process.exit(1);
    }
    return new Proxy(parsed.data, {
        get: (target, prop) => typeof prop === "string" ? Reflect.get(target, prop) : undefined,
    });
}
function envValue(dev, prod) {
    return process.env.NODE_ENV === "development" ? dev : prod;
}
