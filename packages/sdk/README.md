# Better Analytics SDK

A TypeScript SDK for reporting errors to Better Analytics from both client-side and server-side applications.

## Installation

```bash
npm install @better-analytics/sdk
```

## Usage

### Client-Side Setup

```typescript
import { BetterAnalyticsSDK } from '@better-analytics/sdk';

const analytics = new BetterAnalyticsSDK({
  apiUrl: 'http://localhost:3000',
  clientId: 'your-client-id',
  environment: 'production',
  debug: false,
  autoCapture: true, // Automatically capture unhandled errors
});
```

### Server-Side Setup

```typescript
import { BetterAnalyticsSDK } from '@better-analytics/sdk';

const analytics = new BetterAnalyticsSDK({
  apiUrl: 'http://localhost:3000',
  clientId: 'your-client-id',
  environment: 'production',
  debug: false,
  autoCapture: true, // Automatically capture uncaught exceptions
  serverName: 'api-server-01',
  serviceName: 'user-service',
  serviceVersion: '1.2.3',
});
```

### Manual Error Reporting

```typescript
// Client-side error
await analytics.captureError({
  error_type: 'client',
  severity: 'high',
  error_name: 'ValidationError',
  message: 'Invalid user input',
  user_id: 'user123',
  custom_data: JSON.stringify({ field: 'email' }),
  tags: ['validation', 'user-input'],
});

// Server-side error
await analytics.captureError({
  error_type: 'server',
  severity: 'critical',
  error_name: 'DatabaseError',
  message: 'Connection timeout',
  endpoint: '/api/users',
  http_method: 'POST',
  http_status_code: 500,
  response_time_ms: 5000,
});
```

### Exception Handling

```typescript
// Generic exception handling (works on both client and server)
try {
  throw new Error('Something went wrong');
} catch (error) {
  await analytics.captureException(error, {
    user_id: 'user123',
    severity: 'high',
  });
}
```

### Server-Side HTTP Error Handling

```typescript
// Express.js middleware example
app.use((err, req, res, next) => {
  analytics.captureHttpError(err, req, res, {
    tags: ['express-error'],
    custom_data: JSON.stringify({ route: req.route?.path }),
  });
  
  res.status(500).json({ error: 'Internal server error' });
});

// Manual HTTP error reporting
await analytics.captureHttpError(error, req, res, {
  severity: 'high',
  tags: ['payment-error'],
});
```

### Context Management

```typescript
// Set user context (works on both client and server)
analytics.setUser('user123');

// Set additional context
analytics.setContext({
  user_id: 'user123',
  environment: 'production',
  service_name: 'frontend',
  service_version: '1.0.0',
});

// Check runtime environment
if (analytics.isServerSide()) {
  console.log('Running on server');
} else {
  console.log('Running on client');
}
```

### Configuration Options

```typescript
interface SDKConfig {
  apiUrl: string;              // Your API endpoint
  clientId: string;            // Your client ID
  environment?: string;        // 'development' | 'staging' | 'production'
  debug?: boolean;            // Enable debug logging
  autoCapture?: boolean;      // Auto-capture unhandled errors
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Retry delay in ms (default: 1000)
  
  // Server-specific options
  serverName?: string;        // Server hostname (auto-detected)
  serviceName?: string;       // Service name
  serviceVersion?: string;    // Service version
  isServer?: boolean;         // Force server/client mode (auto-detected)
}
```

## Features

### Universal (Client & Server)
- **Auto-detection**: Automatically detects runtime environment
- **Auto-capture**: Captures unhandled errors and promise rejections
- **Retry logic**: Automatically retries failed requests with exponential backoff
- **Context management**: Set user and context data for all errors
- **TypeScript support**: Full TypeScript definitions included

### Client-Side Specific
- **Browser detection**: Automatically detects browser, OS, device info
- **Page context**: Captures URL, title, referrer, viewport size
- **DOM events**: Captures unhandled errors and promise rejections
- **Session tracking**: Generates client-side session IDs

### Server-Side Specific
- **Process monitoring**: Captures uncaught exceptions and unhandled rejections
- **HTTP context**: Rich HTTP request/response context capture
- **Performance metrics**: Memory usage, Node.js version, process ID
- **Server environment**: Hostname, service info, environment variables
- **Express.js integration**: Easy middleware integration

## Environment Detection

The SDK automatically detects whether it's running in a browser or Node.js environment:

```typescript
// Auto-detection based on global objects
const analytics = new BetterAnalyticsSDK({
  apiUrl: 'http://localhost:3000',
  clientId: 'your-client-id',
  // isServer is auto-detected, but can be overridden
});

// Manual override
const analytics = new BetterAnalyticsSDK({
  apiUrl: 'http://localhost:3000',
  clientId: 'your-client-id',
  isServer: true, // Force server mode
});
```

## Error Types

The SDK supports different error types for better categorization:

- `client`: Browser/frontend errors
- `server`: Backend/API errors  
- `network`: Network connectivity issues
- `database`: Database-related errors
- `validation`: Input validation errors
- `auth`: Authentication/authorization errors
- `business`: Business logic errors
- `unknown`: Uncategorized errors 