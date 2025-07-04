import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@better-analytics/auth";

export const { POST, GET } = toNextJsHandler(auth);
