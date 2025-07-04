import {
	createClient as createClickHouseClient,
	type ClickHouseClient,
	type ClickHouseClientConfigOptions,
	type QueryParams,
	type ResultSet,
} from "@clickhouse/client";

async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 500,
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const res = await operation();
			if (attempt > 0) {
				console.info("Retry operation succeeded", { attempt });
			}
			return res;
		} catch (error: unknown) {
			const normalizedError =
				error instanceof Error ? error : new Error(String(error));
			lastError = normalizedError;

			if (
				normalizedError.message.includes("Connect") ||
				normalizedError.message.includes("socket hang up") ||
				normalizedError.message.includes("Timeout error")
			) {
				const delay = baseDelay * 2 ** attempt;
				console.warn(
					`Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
					{
						error: normalizedError.message,
					},
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}

			throw error;
		}
	}

	throw lastError;
}

export function createClient(
	options: ClickHouseClientConfigOptions,
): ClickHouseClient {
	const clickhouseClient = createClickHouseClient(options);

	return new Proxy(clickhouseClient, {
		get(target, property, receiver) {
			const value = Reflect.get(target, property, receiver);

			if (property === "insert") {
				return (...args: [any]): Promise<any> =>
					withRetry(() => (value as any).apply(target, args));
			}

			if (property === "query") {
				return <T>(params: QueryParams): Promise<ResultSet<T>> => {
					if (params.query_params) {
						console.warn(
							"query_params is not supported yet, use query binding",
						);
					}

					return withRetry(() =>
						(value as ClickHouseClient["query"]).apply(target, [
							{ ...params, format: params.format ?? "JSON" },
						]),
					);
				};
			}

			return value;
		},
	});
}
