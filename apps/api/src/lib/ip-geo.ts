import { z } from "zod";
import { logger } from "../lib/logger";
import { createHash } from "node:crypto";

const GeoLocationSchema = z
	.object({
		ip: z.string().optional(),
		region: z.string().optional(),
		country: z.string().optional(),
		timezone: z.string().optional(),
		city: z.string().optional(),
		org: z.string().optional(),
		postal: z.string().optional(),
		loc: z.string().optional(),
	})
	.transform((data) => ({
		ip: data.ip || "",
		region: data.region,
		country: data.country,
		timezone: data.timezone,
		city: data.city,
		org: data.org,
		postal: data.postal,
		loc: data.loc,
	}));

type GeoLocation = z.infer<typeof GeoLocationSchema>;

const DEFAULT_GEO: GeoLocation = {
	ip: "",
	region: undefined,
	country: undefined,
	timezone: undefined,
	city: undefined,
	org: undefined,
	postal: undefined,
	loc: undefined,
};

const ignore = ["127.0.0.1", "::1"];

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

function urlConstructor(ip: string) {
	return `https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`;
}

async function fetchIpGeo(ip: string): Promise<GeoLocation> {
	if (!ip || ignore.includes(ip)) {
		logger.debug(`Skipping geo lookup for empty or localhost IP: ${ip}`);
		return DEFAULT_GEO;
	}

	if (!IPINFO_TOKEN) {
		logger.warn(
			new Error("IPINFO_TOKEN not configured - geo location will be unknown"),
		);
		return DEFAULT_GEO;
	}

	try {
		const url = urlConstructor(ip);
		logger.debug(`Fetching geo location for IP: ${ip.substring(0, 8)}...`);

		const response = await fetch(url, {
			signal: AbortSignal.timeout(4000),
		});

		if (!response.ok) {
			if (response.status === 404) {
				logger.debug(`IP not found in geo database: ${ip.substring(0, 8)}...`);
			} else if (response.status === 429) {
				logger.warn(
					new Error(`Rate limited by IPInfo API: ${response.status}`),
				);
			} else if (response.status === 401) {
				logger.error(new Error(`Invalid IPINFO_TOKEN: ${response.status}`));
			} else {
				logger.warn(
					new Error(
						`Failed to fetch geo location: ${response.status} for IP ${ip.substring(0, 8)}...`,
					),
				);
			}
			return DEFAULT_GEO;
		}

		const data = await response.json();
		logger.debug(`Received geo data for IP ${ip.substring(0, 8)}...:`, {
			country: (data as GeoLocation)?.country,
			region: (data as GeoLocation)?.region,
		});

		const parsed = GeoLocationSchema.safeParse(data);

		if (!parsed.success) {
			logger.warn(
				new Error(`Invalid geo location data: ${parsed.error.message}`),
			);
			return DEFAULT_GEO;
		}

		return parsed.data;
	} catch (error) {
		if (error instanceof Error && error.name === "TimeoutError") {
			logger.warn(
				new Error(`Geo location API timeout for IP ${ip.substring(0, 8)}...`),
			);
		} else {
			logger.error(
				new Error(
					`Error fetching geo location for IP ${ip.substring(0, 8)}...: ${error}`,
				),
			);
		}
		return DEFAULT_GEO;
	}
}

const cache = new Map<string, GeoLocation>();

export const getGeoLocation = async (ip: string): Promise<GeoLocation> => {
	try {
		if (cache.has(ip)) {
			return cache.get(ip) || DEFAULT_GEO;
		}
		const geo = await fetchIpGeo(ip);
		cache.set(ip, geo);
		return geo;
	} catch (error) {
		logger.warn(
			new Error(
				`Redis caching failed for geo lookup, falling back to direct call: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
		return await fetchIpGeo(ip);
	}
};

export function getClientIp(req: Request): string | undefined {
	const cfIp = req.headers.get("cf-connecting-ip");
	if (cfIp) return cfIp;

	const forwardedFor = req.headers.get("x-forwarded-for");
	if (forwardedFor) {
		const firstIp = forwardedFor.split(",")[0]?.trim();
		if (firstIp) return firstIp;
	}

	const realIp = req.headers.get("x-real-ip");
	if (realIp) return realIp;

	return undefined;
}

export async function parseIp(req: Request): Promise<GeoLocation> {
	const ip = getClientIp(req);
	return getGeoLocation(ip || "");
}

export function anonymizeIp(ip: string): string {
	if (!ip) {
		return "";
	}

	const salt = "databuddy-ip-anonymization-salt-2024";

	try {
		const hash = createHash("sha256");
		hash.update(`${ip}${salt}`);

		return hash.digest("hex").substring(0, 12);
	} catch (error) {
		logger.error(new Error(`Error anonymizing IP: ${error}`));
		return "";
	}
}

export async function getGeoData(ip: string): Promise<GeoLocation> {
	const geo = await getGeoLocation(ip);
	return {
		ip: anonymizeIp(geo.ip),
		region: geo.region,
		country: geo.country,
		timezone: geo.timezone,
		city: geo.city,
		org: geo.org,
		postal: geo.postal,
		loc: geo.loc,
	};
}

export function extractIpFromRequest(request: Request): string {
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) return cfIp;

	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		const firstIp = forwardedFor.split(",")[0]?.trim();
		if (firstIp) return firstIp;
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) return realIp;

	if (process.env.NODE_ENV === "development") {
		return "127.0.0.1";
	}

	return "";
}

export async function getGeo(
	ip: string,
): Promise<{ anonymizedIP: string; country?: string; region?: string }> {
	const geo = await getGeoLocation(ip);
	return {
		anonymizedIP: anonymizeIp(ip),
		country: geo.country,
		region: geo.region,
	};
}
