import { createEnv } from "@better-analytics/env";
import { z } from "zod";

const env = createEnv({
	schema: {
		RESEND_API_KEY: z.string(),
	},
});

export default env;
