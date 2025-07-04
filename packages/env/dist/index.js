"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnv = createEnv;
exports.envValue = envValue;
require("dotenv/config");
const zod_1 = require("zod");
function createEnv({ schema, values, }) {
    const zodSchema = zod_1.z.object(schema);
    const parsed = zodSchema.safeParse({ ...values, ...process.env });
    if (!parsed.success) {
        const missingVars = Object.keys(parsed.error.format()).filter((key) => key !== '_errors');
        console.error(`❌ [${process.title}] Missing environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }
    return new Proxy(parsed.data, {
        get(target, prop) {
            if (typeof prop !== 'string')
                return undefined;
            return Reflect.get(target, prop);
        },
    });
}
function envValue(dev, prod) {
    return process.env.NODE_ENV === 'development' ? dev : prod;
}
