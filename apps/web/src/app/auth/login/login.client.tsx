"use client";

import { authClient } from "@better-analytics/auth/client";
import { toast } from "sonner";

import { Button } from "@better-analytics/ui/components/button";
import { Github } from "@better-analytics/ui/icons";

export function LoginClient() {
	async function login() {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: "/dashboard",
			fetchOptions: {
				onError: (context) => {
					toast.error(context.error.message);
				},
				onSuccess: () => {
					toast.success("Redirecting...");
				},
			},
		});
	}

	return (
		<Button variant="outline" className="w-full" onClick={login}>
			<Github className="mr-2 size-4" />
			Continue with GitHub
		</Button>
	);
}
