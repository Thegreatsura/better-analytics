
import { auth } from "@better-analytics/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { SignButton } from "./_components/sign-button";

export default async function HomePage() {
	const session = await auth.api.getSession({
		headers: await headers()
	})

	return (
		<div>
			{session ? (
				<div>
					<p>Welcome {session.user.name}!</p>
					{/* <form action={async () => {
						"use server";
						await auth.signOut();
					}}>
						<button type="submit">Sign Out</button>
					</form> */}
				</div>
			) : (
				<div>
					<p>You are not logged in</p>
					<Suspense fallback={<div className="h-10" />}>
						<SignButton session={session} />
					</Suspense>

				</div>
			)}
		</div>
	);
}