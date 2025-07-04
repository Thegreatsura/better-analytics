# Better Analytics SDK

A lightweight and powerful TypeScript SDK for reporting errors and logs to Better Analytics from any JavaScript environment.

## Key Features

-   **Universal**: Works seamlessly in both browser and Node.js environments.
-   **Automatic**: Captures unhandled errors, promise rejections, and console logs.
-   **Rich Context**: Gathers detailed information about the environment, user, and application state.
-   **Customizable**: Highly configurable to fit your specific needs.
-   **TypeScript-ready**: Provides strong typing for all its methods and data structures.

## Installation

```bash
npm install @better-analytics/sdk
```

## Quick Start

### Client-Side

```typescript
import { BetterAnalyticsSDK } from '@better-analytics/sdk';

export const analytics = new BetterAnalyticsSDK({
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  clientId: 'your-client-id',
  environment: process.env.NODE_ENV,
  autoCapture: true,
  autoLog: true,
  logLevel: 'warn',
});
```

### Server-Side

```typescript
import { BetterAnalyticsSDK } from '@better-analytics/sdk';

export const analytics = new BetterAnalyticsSDK({
  apiUrl: process.env.API_URL!,
  clientId: 'your-client-id',
  environment: process.env.NODE_ENV,
  autoCapture: true,
  autoLog: true,
  logLevel: 'info',
  serverName: 'api-main',
  serviceName: 'user-service',
  serviceVersion: '1.2.3',
});
```

## API Reference

### `captureError(data, [serverContext])`

Captures a custom error event.

-   `data`: An object containing the error details. The `custom_data` property can be an object, which will be automatically stringified.
-   `serverContext`: (Server-side only) Additional context from the HTTP request and response.

```typescript
analytics.captureError({
    error_name: 'PaymentFailed',
    severity: 'high',
    custom_data: { amount: 100, currency: 'USD' },
});
```

### `captureException(error, [context], [serverContext])`

Captures a JavaScript `Error` object.

-   `error`: The `Error` object to capture.
-   `context`: Additional data to associate with the error.
-   `serverContext`: (Server-side only) Additional context.

```typescript
try {
    // ...
} catch (error) {
    analytics.captureException(error as Error, {
        severity: 'critical',
        tags: ['billing'],
        custom_data: { userId: 'user-123' },
    });
}
```

### `log(message, [context])`

Sends a log message.

-   `message`: The log message.
-   `context`: Additional data to associate with the log. The `context` property can be an object, which will be automatically stringified.

```typescript
analytics.log('User signed in', {
    level: 'info',
    user_id: 'user-123',
    context: { source: 'google-oauth' },
});
```

## Configuration

The SDK can be configured with the following options:

-   `apiUrl`: Your API endpoint.
-   `clientId`: Your client ID.
-   `environment`: `'development'`, `'staging'`, or `'production'`.
-   `debug`: Enable debug logging from the SDK itself.
-   `autoCapture`: Automatically capture unhandled errors and promise rejections.
-   `autoLog`: Automatically capture `console` logs.
-   `logLevel`: The minimum level of console logs to capture (`'trace'`, `'debug'`, `'info'`, `'warn'`, `'error'`).
-   `maxRetries`: The maximum number of times to retry sending a failed event (default: `3`).
-   `retryDelay`: The base delay in milliseconds between retries (default: `1000`).
-   `serverName`, `serviceName`, `serviceVersion`: (Server-side only) Information about your server.
-   `isServer`: Force the SDK to run in server or client mode. If not provided, the environment is auto-detected.

## Error Types

The SDK supports the following error types for better categorization:

-   `client`: Browser/frontend errors
-   `server`: Backend/API errors
-   `network`: Network connectivity issues
-   `database`: Database-related errors
-   `validation`: Input validation errors
-   `auth`: Authentication/authorization errors
-   `business`: Business logic errors
-   `unknown`: Uncategorized errors 