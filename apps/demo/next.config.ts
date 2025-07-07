import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	async redirects() {
		return [
			{
				source: "/dashboard",
				destination: "http://localhost:3000/dashboard",
				statusCode: 302,
			},
		];
	},
};

export default nextConfig;
