# Better Analytics SDK

A simple, intuitive SDK for error tracking and logging with separate client and server modules.

## Installation

```bash
npm install @better-analytics/sdk
```

## Quick Start

### Client-Side Error Tracking

For React, Next.js, or any client-side JavaScript:

```typescript
import { createErrorTracker } from '@better-analytics/sdk/client';

const errorTracker = createErrorTracker({
    apiUrl: 'https://api.your-domain.com',
    clientId: 'your-client-id',
    accessToken: 'your-access-token', // optional
    environment: 'production',
    debug: false,
    autoCapture: true, // Automatically capture unhandled errors
});

// Track errors manually
try {
    // Your code here
} catch (error) {
    await errorTracker.captureException(error, { userId: '123', feature: 'checkout' });
}

// Track custom messages
await errorTracker.track('Payment failed', { amount: 100, currency: 'USD' });

// Set user context
errorTracker.setUser('user-123');

// Add global tags
errorTracker.addTags(['frontend', 'critical']);
```

### Server-Side Logging

For Node.js, Express, or any server-side JavaScript:

```typescript
import { createLogger } from '@better-analytics/sdk/server';

const logger = createLogger({
    apiUrl: 'https://api.your-domain.com',
    clientId: 'your-client-id',
    accessToken: 'your-access-token', // optional
    environment: 'production',
    serviceName: 'api-server',
    serviceVersion: '1.0.0',
    debug: false,
    minLevel: 'info', // Only log info and above
});

// Structured logging
await logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
await logger.warn('High memory usage', { memoryUsage: 85 });
await logger.error('Database connection failed', { database: 'users', timeout: 5000 });

// Log errors with stack traces
try {
    // Your code here
} catch (error) {
    await logger.error(error, { operation: 'user-creation' });
}

// Set context
logger.setUser('user-123');
logger.setRequestId('req-456');
logger.addTags(['database', 'critical']);
```

## API Reference

### Client-Side Error Tracker

#### `createErrorTracker(config)`

Creates a new error tracker instance.

**Config Options:**
- `apiUrl` (required): Your API endpoint
- `clientId` (required): Your client identifier
- `accessToken` (optional): API access token
- `environment` (optional): Environment name (default: 'production')
- `debug` (optional): Enable debug logging (default: false)
- `autoCapture` (optional): Auto-capture unhandled errors (default: false)
- `userId` (optional): Initial user ID

**Methods:**
- `track(message, customData?)`: Track a custom error message
- `captureException(error, customData?)`: Capture an Error object with stack trace
- `setUser(userId)`: Set the current user ID
- `addTags(tags)`: Add global tags to all errors

### Server-Side Logger

#### `createLogger(config)`

Creates a new logger instance.

**Config Options:**
- `apiUrl` (required): Your API endpoint
- `clientId` (required): Your client identifier
- `accessToken` (optional): API access token
- `environment` (optional): Environment name (default: 'production')
- `serviceName` (optional): Service name (default: 'unknown-service')
- `serviceVersion` (optional): Service version (default: '1.0.0')
- `debug` (optional): Enable debug logging (default: false)
- `minLevel` (optional): Minimum log level (default: 'info')

**Methods:**
- `debug(message, context?)`: Log debug message
- `info(message, context?)`: Log info message
- `warn(message, context?)`: Log warning message
- `error(messageOrError, context?)`: Log error message or Error object
- `setUser(userId)`: Set the current user ID
- `setRequestId(requestId)`: Set the current request ID
- `addTags(tags)`: Add global tags to all logs

## Migration from v1

If you're upgrading from the old `BetterAnalyticsSDK`:

### Before
```typescript
import { BetterAnalyticsSDK } from '@better-analytics/sdk';

const sdk = new BetterAnalyticsSDK({
    apiUrl: 'https://api.your-domain.com',
    clientId: 'your-client-id',
    // ... many other options
});
```

### After
```typescript
// For client-side error tracking
import { createErrorTracker } from '@better-analytics/sdk/client';

const errorTracker = createErrorTracker({
    apiUrl: 'https://api.your-domain.com',
    clientId: 'your-client-id',
});

// For server-side logging
import { createLogger } from '@better-analytics/sdk/server';

const logger = createLogger({
    apiUrl: 'https://api.your-domain.com',
    clientId: 'your-client-id',
    serviceName: 'my-service',
});
```

## Why This Approach?

1. **Separation of Concerns**: Client-side error tracking and server-side logging are different use cases
2. **Smaller Bundle Size**: Only import what you need
3. **Better TypeScript Support**: More focused and accurate types
4. **Easier Configuration**: Fewer options, more intuitive defaults
5. **Clearer API**: Method names that make sense for each context

## Examples

### Next.js App Router

```typescript
// app/lib/analytics.ts
'use client';

import { createErrorTracker } from '@better-analytics/sdk/client';

export const errorTracker = createErrorTracker({
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    environment: process.env.NODE_ENV,
    autoCapture: true,
});
```

### Express.js Server

```typescript
// server/logger.ts
import { createLogger } from '@better-analytics/sdk/server';

export const logger = createLogger({
    apiUrl: process.env.API_URL!,
    clientId: process.env.CLIENT_ID!,
    serviceName: 'api-server',
    environment: process.env.NODE_ENV,
});

// Middleware
app.use((req, res, next) => {
    logger.setRequestId(req.id);
    logger.setUser(req.user?.id);
    next();
});
``` 