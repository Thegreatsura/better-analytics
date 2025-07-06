import { Resend } from "resend";
import env from "@better-analytics/email/env";

export const resend = new Resend(env.RESEND_API_KEY);
