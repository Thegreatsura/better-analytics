import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	images: {
		remotePatterns: [],
	},
};

export default nextConfig;
