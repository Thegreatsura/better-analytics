import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	async rewrites() {
		return [
			{
				source: "/dashboard",
				destination: "http://localhost:3000/dashboard",
			},
		];
	},
};

export default nextConfig;
