interface SiteConfig {
	name: string;
	title: string;
	description: string;
}

export const siteConfig: Readonly<SiteConfig> = {
	name: "Better Analytics",
	title: "Better Analytics - AI-Powered Personalized Analytics",
	description: "Better Analytics",
} as const;
