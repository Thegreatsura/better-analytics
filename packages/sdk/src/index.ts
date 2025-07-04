export { BetterAnalyticsSDK } from './sdk';
export type {
    ErrorData,
    SDKConfig,
    SDKResponse,
    ServerErrorContext,
    RequestContext,
    ResponseContext
} from './types';
import { BetterAnalyticsSDK } from './sdk';
import type { SDKConfig } from './types';

/**
 * Convenience function to create and initialize the SDK
 */
export async function createSDK(config: SDKConfig): Promise<BetterAnalyticsSDK> {
    return new BetterAnalyticsSDK(config);
} 