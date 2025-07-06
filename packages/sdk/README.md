# Better Analytics SDK

JavaScript/TypeScript SDK for Better Analytics error tracking and logging.

## Installation

```bash
npm install @better-analytics/sdk
```

## Usage

### Initialize the Error Tracker

```typescript
import { createErrorTracker } from '@better-analytics/sdk';

const analytics = createErrorTracker({
  apiUrl: 'https://your-api-url.com',
  clientId: 'your-client-id',
  accessToken: 'your-access-token',
  environment: 'production', // or 'development'
  debug: false,
  autoCapture: true, // Automatically capture unhandled errors
  userId: 'user-123' // Optional user ID
});
```

### Track Custom Errors

```typescript
// Track a simple error message
await analytics.track('Something went wrong', {
  customField: 'value',
  userId: 'user-123'
});

// Capture JavaScript exceptions with full stack traces
try {
  // Some code that might throw
  throw new Error('This is a test error');
} catch (error) {
  await analytics.captureException(error, {
    context: 'user-action',
    additionalData: { userId: 'user-123' }
  });
}
```

### Auto-Capture

When `autoCapture` is enabled, the SDK automatically captures:
- Unhandled JavaScript errors
- Unhandled promise rejections
- Complete stack traces
- Browser and device information
- User session context

### API Field Mappings

The SDK automatically maps fields to match the API schema:

| SDK Field | API Field | Description |
|-----------|-----------|-------------|
| `stack` | `stack_trace` | Error stack trace |
| `message` | `message` | Error message |
| `customData.browserName` | `browser_name` | Browser name |
| `customData.osName` | `os_name` | Operating system |
| `customData.userId` | `user_id` | User identifier |
| `customData.sessionId` | `session_id` | Session identifier |
| `customData.environment` | `environment` | Environment (prod/dev) |

### Configuration Options

```typescript
interface ErrorTrackerConfig {
  apiUrl: string;           // Required: API endpoint URL
  clientId: string;         // Required: Your client ID
  accessToken?: string;     // Optional: Authentication token
  environment?: string;     // Optional: Environment name
  debug?: boolean;          // Optional: Enable debug logging
  autoCapture?: boolean;    // Optional: Auto-capture errors
  userId?: string;          // Optional: User identifier
}
```

### Methods

#### `track(message, customData?)`
Track a custom error message with optional context data.

#### `captureException(error, customData?)`
Capture a JavaScript Error object with full stack trace and context.

#### `setUser(userId)`
Set the user ID for subsequent error reports.

#### `addTags(tags)`
Add global tags to all error reports.

## Stack Trace Support

The SDK now properly sends stack traces to the API. When you use `captureException()`, the full stack trace will be available in the dashboard for debugging.

```typescript
try {
  // Code that might fail
  await riskyOperation();
} catch (error) {
  // This will include the full stack trace
  await analytics.captureException(error, {
    operation: 'riskyOperation',
    context: { userId: 'user-123' }
  });
}
```

## Troubleshooting

### Stack Traces Not Showing
- Ensure you're using `captureException()` instead of `track()` for Error objects
- Check that your API endpoint is correctly configured
- Verify that the error actually has a stack trace (`error.stack`)

### Authentication Issues
- Ensure your `accessToken` is valid
- Check that your `clientId` matches your account

### Network Issues
- Verify the `apiUrl` is correct and accessible
- Check browser network tab for failed requests
- Enable `debug: true` to see SDK logs 