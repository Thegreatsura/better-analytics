import authEnv from "@better-analytics/auth/env";

export default function Landing() {
	return (
		<div className="container flex h-svh w-full items-center justify-center">
			{authEnv.BETTER_AUTH_URL}
		</div>
	);
}
