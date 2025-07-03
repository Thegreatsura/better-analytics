import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "tailark.com",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/app/:path*",
				destination: "https://app.databuddy.cc/:path*",
				permanent: false,
			},
			{
				source: "/demo",
				destination: "https://app.databuddy.cc/demo/OXmNQsViBT-FOS_wZCTHc",
				permanent: false,
			},
		];
	},
	async headers() {
		return [
			{
				source: "/fonts/:path*",
				headers: [
					{
						key: "Content-Type",
						value: "application/octet-stream",
					},
				],
			},
		];
	},
};

export default nextConfig;
