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
        console.log("Running in browser context - using fallback values");
        return new Proxy({}, {
            get: () => undefined,
        });
    }
    const envSubset = Object.keys(schema).reduce((acc, key) => {
        if (process.env[key] !== undefined) {
            acc[key] = process.env[key];
        }
        return acc;
    }, {});
    const parsed = zodSchema.safeParse({ ...values, ...envSubset });
    if (!parsed.success) {
        const missingVars = Object.keys(parsed.error.format()).filter((key) => key !== "_errors");
        const errorMessage = `❌ [${process.title}] Missing environment variables: ${missingVars.join(", ")}`;
        console.error(errorMessage);
        process.exit(1);
    }
    return new Proxy(parsed.data, {
        get: (target, prop) => Reflect.get(target, prop),
    });
}
function envValue(dev, prod) {
    return process.env.NODE_ENV === "development" ? dev : prod;
}
