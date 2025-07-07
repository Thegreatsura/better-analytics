# Better Analytics SDK

The Better Analytics SDK provides comprehensive error tracking and localization for your web applications. Get real-time insights into your application's health with beautiful dashboards and automatic error translation.

## Quick Start

### 1. Sign Up & Get Your API Keys

1. Visit [Better Analytics Dashboard](https://analytics.customhack.dev)
2. Create your account and verify your email
3. Create a new project in your dashboard
4. Copy your **Client ID** and **Access Token** from the project settings

### 2. Installation

```bash
npm install @better-analytics/sdk
# or
yarn add @better-analytics/sdk
# or
bun add @better-analytics/sdk
```

### 3. Basic Setup

Create an analytics instance in your app:

```typescript
// lib/analytics.ts
import { init } from "@better-analytics/sdk";

export const analytics = init({
  apiUrl: "https://api.analytics.customhack.dev",
  clientId: "your-client-id-here",
  accessToken: "your-access-token-here", // Optional but recommended
});
```

The `init` function automatically detects:
- **Environment**: `development` or `production` based on `NODE_ENV`
- **Debug mode**: Enabled in development, disabled in production
- **Auto-capture**: Automatically enabled for unhandled errors

### 4. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://api.analytics.customhack.dev
NEXT_PUBLIC_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_ACCESS_TOKEN=your-access-token-here
```

Then update your analytics setup:

```typescript
// lib/analytics.ts
import { init } from "@better-analytics/sdk";

export const analytics = init({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
});
```

### Advanced Configuration

If you need more control, you can still use the full configuration:

```typescript
// lib/analytics.ts
import { createErrorTracker } from "@better-analytics/sdk";

export const analytics = createErrorTracker({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  environment: "production", // Force specific environment
  debug: false, // Force disable debug mode
  autoCapture: false, // Disable automatic error capture
});
```

## Features

### 🚨 Automatic Error Tracking
- Captures unhandled JavaScript errors
- Tracks unhandled promise rejections
- Rich context including browser, OS, and device info
- Real-time error reporting

### 🌍 Multi-Language Support
- Automatic error message translation
- Translate entire UI objects at once
- Cached translations for performance
- Support for 50+ languages

### 📊 Real-Time Dashboard
- Live error monitoring
- Error trends and analytics
- Geographic distribution
- Browser and device insights

## Global Error Handling

### Next.js Error Boundary

Create a global error handler with automatic translation:

```typescript
// app/error.tsx
"use client";

import { analytics } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
}

export default function GlobalError({ error }: ErrorProps) {
  const [content, setContent] = useState({
    title: "Something went wrong",
    message: "We're working to fix this issue. Please try again later.",
    errorLabel: "Error:",
    retryButton: "Try Again",
  });
  const router = useRouter();
  const hasTranslated = useRef(false);

  useEffect(() => {
    // Track the error
    analytics.captureException(error);

    // Translate all content at once
    if (!hasTranslated.current) {
      hasTranslated.current = true;
      
      const translateContent = async () => {
        try {
          const translated = await analytics.localizeObject({
            title: "Something went wrong",
            message: "We're working to fix this issue. Please try again later.",
            errorLabel: "Error:",
            retryButton: "Try Again",
          });

          setContent(translated);
        } catch (translationError) {
          console.warn("Translation failed, using default text:", translationError);
        }
      };

      translateContent();
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {content.title}
        </h1>
        
        <p className="text-gray-700 mb-4">
          {content.message}
        </p>

        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm text-gray-600">
            {content.errorLabel} {error.message}
          </p>
        </div>

        <button
          onClick={() => router.refresh()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {content.retryButton}
        </button>
      </div>
    </div>
  );
}
```

## Server-Side Logging

For server-side applications, use the logger for structured logging:

```typescript
// lib/logger.ts
import { initLogger } from "@better-analytics/sdk";

export const logger = initLogger({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  serviceName: "my-app-backend",
});

// Usage
await logger.info("User logged in", { userId: "123" });
await logger.error("Payment failed", { orderId: "456", amount: 100 });
```

The `initLogger` function automatically detects:
- **Environment**: `development` or `production` based on `NODE_ENV`
- **Debug mode**: Enabled in development, disabled in production
- **Log level**: `debug` in development, `info` in production
- **Service version**: Defaults to `1.0.0`

### Advanced Logger Configuration

```typescript
import { createLogger } from "@better-analytics/sdk";

export const logger = createLogger({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  environment: "production",
  serviceName: "my-service",
  serviceVersion: "2.1.0",
  debug: false,
  minLevel: "warn", // Only log warnings and errors
});
```

## API Reference

### Error Tracking

```typescript
// Track a custom error
await analytics.track("User authentication failed", {
  userId: "user123",
  action: "login",
  customData: { loginMethod: "email" }
});

// Capture an exception
try {
  // Your code here
} catch (error) {
  await analytics.captureException(error, {
    context: "payment-processing",
    userId: "user123"
  });
}

// Set user context
analytics.setUser("user123");

// Add global tags
analytics.addTags(["production", "checkout-flow"]);
```

### Localization

```typescript
// Translate a single string
const translated = await analytics.localize("Hello world", "es");
// Returns: "Hola mundo"

// Translate an entire object
const content = {
  greeting: "Hello",
  farewell: "Goodbye",
  message: "Welcome to our platform",
};

const translated = await analytics.localizeObject(content, "es");
// Returns: { greeting: "Hola", farewell: "Adiós", message: "Bienvenido a nuestra plataforma" }
```

## Configuration Options

```typescript
interface ErrorTrackerConfig {
  apiUrl: string;           // Better Analytics API URL
  clientId: string;         // Your project's client ID
  accessToken?: string;     // Your access token (recommended)
  environment?: string;     // Environment (development, production, etc.)
  debug?: boolean;         // Enable debug logging
  autoCapture?: boolean;   // Auto-capture unhandled errors
  userId?: string;         // Set initial user ID
}
```

## Best Practices

### 1. Environment-Specific Configuration
```typescript
const analytics = createErrorTracker({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === "development",
  autoCapture: true,
});
```

### 2. Error Context
Always provide context when tracking errors:
```typescript
analytics.captureException(error, {
  component: "CheckoutForm",
  userId: user.id,
  step: "payment-processing",
  metadata: { orderId: "12345" }
});
```

### 3. User Identification
Set user context for better error tracking:
```typescript
// When user logs in
analytics.setUser(user.id);

// Add relevant tags
analytics.addTags([user.plan, user.region]);
```

### 4. Translation Caching
Translations are automatically cached for 5 minutes to improve performance and reduce API calls.

## Support

- 📧 Email: support@customhack.dev
- 📖 Documentation: [docs.analytics.customhack.dev](https://docs.analytics.customhack.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/customhack/better-analytics/issues)

## Pricing

- **Free Tier**: 1,000 errors/month
- **Pro**: $9/month - 10,000 errors/month
- **Enterprise**: Custom pricing for high-volume applications

[View full pricing details](https://analytics.customhack.dev/pricing) 