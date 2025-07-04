"use client";

import { authClient } from "@better-analytics/auth/client";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { Button } from "@better-analytics/ui/components/button";

export default function Login() {
	async function onSubmit() {
		const { error } = await authClient.signIn.social({
			provider: "github",
		});

		if (error) {
			return toast.error(error.message);
		}

		toast.success("Redirecting to dashboard...");

		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<div className="flex flex-col gap-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="font-bold text-2xl">Login to your account</h1>
								<p className="text-balance text-muted-foreground text-sm">
									Enter your email below to login to your account
								</p>
							</div>
							<div className="grid gap-6">
								<Button variant="outline" className="w-full" onClick={onSubmit}>
									Login with GitHub
								</Button>
							</div>
							<div className="text-center text-sm">
								Don&apos;t have an account?{" "}
								<a href="/auth/signup" className="underline underline-offset-4">
									Sign up
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
