"use client";

import { authClient } from "@better-analytics/auth/client";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@better-analytics/ui/components/button";
import { Github } from "@better-analytics/ui/icons";

export function LoginClient() {
	async function login() {
		const { error } = await authClient.signIn.social({
			provider: "github",
		});

		if (error) {
			throw new Error(error.message);
		}

		redirect("/dashboard");
	}

	async function onSubmit() {
		toast.promise(login(), {
			loading: "Logging in...",
			success: "Redirecting...",
			error: "Something went wrong",
		});
	}

	return (
		<Button variant="outline" className="w-full" onClick={onSubmit}>
			<Github className="mr-2 size-4" />
			Continue with GitHub
		</Button>
	);
}
