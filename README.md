# Better Analytics

Real-time error tracking and logging for web applications. Track client-side errors and server-side logs with automatic translation.

## Quick Start

### 1. Get Your API Keys

1. Visit [Better Analytics Dashboard](https://analytics.customhack.dev)
2. Create a project and copy your **Client ID** and **Access Token**

### 2. Install

```bash
npm install @better-analytics/sdk
```

### 3. Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.analytics.customhack.dev
NEXT_PUBLIC_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_ACCESS_TOKEN=your-access-token-here
```

## Client-Side Error Tracking

For React/Next.js applications to track user-facing errors:

```typescript
// lib/analytics.ts
import { createErrorTracker } from "@better-analytics/sdk";

export const analytics = createErrorTracker({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  autoCapture: true, // Auto-capture unhandled errors
});
```

### Simple Error Boundary

```typescript
// app/error.tsx
"use client";

import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    analytics.captureException(error);
  }, [error]);

  return (
    <div className="p-4">
      <h2>Something went wrong!</h2>
      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
```

### Manual Error Tracking

```typescript
// Track custom errors
analytics.track("Payment failed", { userId: "123" });

// Capture exceptions
try {
  riskyOperation();
} catch (error) {
  analytics.captureException(error, { context: "checkout" });
}
```

## Server-Side Logging

For Node.js/API routes to track server errors and logs:

```typescript
// lib/logger.ts
import { createLogger } from "@better-analytics/sdk";

export const logger = createLogger({
  apiUrl: process.env.API_URL || "",
  clientId: process.env.CLIENT_ID || "",
  accessToken: process.env.ACCESS_TOKEN || "",
});
```

### API Route Example

```typescript
// app/api/users/route.ts
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const user = await createUser(data);
    logger.info("User created", { userId: user.id });
    return Response.json(user);
  } catch (error) {
    logger.error("User creation failed", { error, data });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Log Levels

```typescript
logger.info("User logged in", { userId: "123" });
logger.warn("Rate limit approached", { ip: "1.2.3.4" });
logger.error("Database connection failed", { error });
```

## Translation

Translate error messages automatically:

```typescript
// Single string
const translated = await analytics.localize("Error occurred", "es");

// Entire object
const content = {
  title: "Error",
  message: "Something went wrong"
};
const translated = await analytics.localizeObject(content, "fr");
```

## Features

- **Client-side error tracking** - Capture React errors, unhandled exceptions
- **Server-side logging** - Track API errors, database issues, performance
- **Auto-translation** - Error messages in 50+ languages
- **Real-time dashboard** - Live monitoring and alerts
- **Smart caching** - Reduce API calls, improve performance

## Pricing

- **Free**: 1,000 errors/month
- **Pro**: $9/month - 10,000 errors/month
- **Enterprise**: Custom pricing

## Support

- Email: support@customhack.dev
- Docs: [docs.analytics.customhack.dev](https://docs.analytics.customhack.dev)
- Issues: [GitHub Issues](https://github.com/customhack/better-analytics/issues)
