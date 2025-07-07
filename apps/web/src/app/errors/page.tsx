"use client";

import { analytics } from "@/lib/analytics";
import { Button } from "@better-analytics/ui/components/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@better-analytics/ui/components/card";
import { Separator } from "@better-analytics/ui/components/separator";
import { Input } from "@better-analytics/ui/components/input";
import { toast } from "sonner";
import {
    triggerServerActionError,
    triggerHttpError,
    triggerExceptionError,
    logUserInteraction,
    logPerformanceMetrics,
    logBusinessEvent,
    logDebugInfo,
    logWarning,
    generateMultipleRandomErrors
} from "./actions";
import { useState, useEffect, useRef } from "react";
import React from "react";

// Enhanced error generation with comprehensive metadata
export default function ErrorsPage() {
    const [userInput, setUserInput] = useState("");
    const [componentState, setComponentState] = useState({
        clickCount: 0,
        formData: {} as Record<string, any>,
        interactionHistory: [] as string[],
        performanceMetrics: {} as Record<string, any>,
    });
    const startTimeRef = useRef(Date.now());
    const interactionTimeRef = useRef<number[]>([]);

    // Collect performance metrics on component mount
    useEffect(() => {
        const collectPerformanceMetrics = () => {
            if (typeof window !== 'undefined' && 'performance' in window) {
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const memory = (performance as any).memory;

                setComponentState(prev => ({
                    ...prev,
                    performanceMetrics: {
                        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
                        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
                        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
                        memoryUsed: memory?.usedJSHeapSize || 0,
                        memoryTotal: memory?.totalJSHeapSize || 0,
                        memoryLimit: memory?.jsHeapSizeLimit || 0,
                        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                        connectionDownlink: (navigator as any).connection?.downlink || 0,
                        connectionRtt: (navigator as any).connection?.rtt || 0,
                        deviceMemory: (navigator as any).deviceMemory || 0,
                        hardwareConcurrency: navigator.hardwareConcurrency || 0,
                        screenResolution: `${screen.width}x${screen.height}`,
                        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                        colorDepth: screen.colorDepth,
                        pixelRatio: window.devicePixelRatio,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        language: navigator.language,
                        platform: navigator.platform,
                        cookieEnabled: navigator.cookieEnabled,
                        onlineStatus: navigator.onLine,
                        batteryLevel: (navigator as any).battery?.level || 0,
                        batteryCharging: (navigator as any).battery?.charging || false,
                    }
                }));
            }
        };

        collectPerformanceMetrics();

        // Collect battery info if available
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setComponentState(prev => ({
                    ...prev,
                    performanceMetrics: {
                        ...prev.performanceMetrics,
                        batteryLevel: battery.level,
                        batteryCharging: battery.charging,
                        batteryChargingTime: battery.chargingTime,
                        batteryDischargingTime: battery.dischargingTime,
                    }
                }));
            });
        }
    }, []);

    // Track user interactions
    const trackInteraction = (action: string, additionalData?: Record<string, any>) => {
        const now = Date.now();
        interactionTimeRef.current.push(now);

        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), action], // Keep last 10 interactions
            clickCount: prev.clickCount + 1,
        }));

        // Log interaction with rich context
        analytics.track(`User interaction: ${action}`, {
            interactionContext: {
                action,
                timestamp: now,
                timeSinceLoad: now - startTimeRef.current,
                sequenceNumber: componentState.clickCount + 1,
                interactionHistory: componentState.interactionHistory,
                timeBetweenInteractions: interactionTimeRef.current.slice(-2).reduce((acc, curr, idx, arr) =>
                    idx > 0 ? curr - arr[idx - 1] : 0, 0),
                pageVisibilityState: document.visibilityState,
                scrollPosition: {
                    x: window.scrollX,
                    y: window.scrollY,
                    maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
                },
                mousePosition: additionalData?.mousePosition || { x: 0, y: 0 },
                keyboardModifiers: additionalData?.keyboardModifiers || {},
                focusedElement: document.activeElement?.tagName || 'unknown',
                ...additionalData,
            },
            performanceSnapshot: componentState.performanceMetrics,
            componentState: {
                userInput,
                clickCount: componentState.clickCount,
                formData: componentState.formData,
            },
        });
    };

    const handleBulkErrorGeneration = async (event?: React.MouseEvent) => {
        trackInteraction('bulk-error-generation', {
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
        });

        try {
            toast.info("Generating 15 random errors with varied severities...");
            const result = await generateMultipleRandomErrors(15);

            if (result.success) {
                toast.success(`Successfully generated ${result.summary.successful} errors with dynamic severities and types!`);
            } else {
                toast.error("Failed to generate bulk errors");
            }
        } catch (error) {
            toast.error("Error during bulk generation");
        }
    };

    const handleClientError = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'client-error-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        // Create enhanced error with comprehensive context
        const error = new Error("Enhanced client-side error with comprehensive metadata");

        // Add custom properties to error
        (error as any).errorCode = 'CLIENT_ERROR_001';
        (error as any).errorCategory = 'user-interaction';
        (error as any).severity = 'high';
        (error as any).reproducible = true;
        (error as any).userAgent = navigator.userAgent;
        (error as any).timestamp = new Date().toISOString();

        // Capture comprehensive context
        const errorContext = {
            // User context
            userInteraction: {
                action: 'button-click',
                element: 'client-error-button',
                clickCount: componentState.clickCount + 1,
                interactionHistory: componentState.interactionHistory,
                timeSinceLoad: now - startTimeRef.current,
                mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
                keyboardModifiers: {
                    ctrlKey: event?.ctrlKey,
                    altKey: event?.altKey,
                    shiftKey: event?.shiftKey,
                    metaKey: event?.metaKey,
                },
            },

            // Browser context
            browserContext: {
                url: window.location.href,
                referrer: document.referrer,
                title: document.title,
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                javaEnabled: navigator.javaEnabled?.() || false,
            },

            // Device context
            deviceContext: {
                screenResolution: `${screen.width}x${screen.height}`,
                availableScreenSize: `${screen.availWidth}x${screen.availHeight}`,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                orientation: screen.orientation?.type || 'unknown',
                deviceMemory: (navigator as any).deviceMemory || 0,
                hardwareConcurrency: navigator.hardwareConcurrency || 0,
                maxTouchPoints: navigator.maxTouchPoints || 0,
            },

            // Network context
            networkContext: {
                connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                connectionDownlink: (navigator as any).connection?.downlink || 0,
                connectionRtt: (navigator as any).connection?.rtt || 0,
                connectionSaveData: (navigator as any).connection?.saveData || false,
            },

            // Performance context
            performanceContext: {
                ...componentState.performanceMetrics,
                currentMemoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
                documentReadyState: document.readyState,
                loadEventEnd: performance.timing?.loadEventEnd || 0,
                domContentLoadedEventEnd: performance.timing?.domContentLoadedEventEnd || 0,
                resourceCount: performance.getEntriesByType('resource').length,
                navigationCount: performance.getEntriesByType('navigation').length,
            },

            // DOM context
            domContext: {
                activeElement: document.activeElement?.tagName || 'unknown',
                visibilityState: document.visibilityState,
                scrollPosition: {
                    x: window.scrollX,
                    y: window.scrollY,
                    maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
                },
                documentHeight: document.documentElement.scrollHeight,
                documentWidth: document.documentElement.scrollWidth,
                elementsCount: document.querySelectorAll('*').length,
                formsCount: document.forms.length,
                imagesCount: document.images.length,
                linksCount: document.links.length,
            },

            // Application context
            applicationContext: {
                componentState: {
                    userInput,
                    clickCount: componentState.clickCount,
                    formData: componentState.formData,
                    interactionHistory: componentState.interactionHistory,
                },
                reactVersion: React.version,
                environment: process.env.NODE_ENV,
                buildTimestamp: process.env.BUILD_TIMESTAMP || 'unknown',
                commitHash: process.env.COMMIT_HASH || 'unknown',
            },

            // Timing context
            timingContext: {
                errorTimestamp: Date.now(),
                timeSinceLoad: Date.now() - startTimeRef.current,
                timeSinceLastInteraction: interactionTimeRef.current.length > 0 ?
                    Date.now() - interactionTimeRef.current[interactionTimeRef.current.length - 1] : 0,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timeZoneOffset: new Date().getTimezoneOffset(),
            },

            // Feature detection
            featureDetection: {
                serviceWorker: 'serviceWorker' in navigator,
                webGL: !!window.WebGLRenderingContext,
                webGL2: !!window.WebGL2RenderingContext,
                webAssembly: typeof WebAssembly !== 'undefined',
                localStorage: typeof Storage !== 'undefined',
                sessionStorage: typeof Storage !== 'undefined',
                indexedDB: typeof indexedDB !== 'undefined',
                webRTC: !!(navigator as any).getUserMedia || !!(navigator as any).webkitGetUserMedia || !!(navigator as any).mozGetUserMedia,
                geolocation: 'geolocation' in navigator,
                notifications: 'Notification' in window,
                vibration: 'vibrate' in navigator,
                battery: 'getBattery' in navigator,
                gamepad: 'getGamepads' in navigator,
                mediaDevices: 'mediaDevices' in navigator,
                speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
                speechSynthesis: 'speechSynthesis' in window,
                webWorkers: typeof Worker !== 'undefined',
                sharedWorkers: typeof SharedWorker !== 'undefined',
                broadcastChannel: typeof BroadcastChannel !== 'undefined',
                intersectionObserver: typeof IntersectionObserver !== 'undefined',
                mutationObserver: typeof MutationObserver !== 'undefined',
                resizeObserver: typeof ResizeObserver !== 'undefined',
                performanceObserver: typeof PerformanceObserver !== 'undefined',
            },
        };

        analytics.captureException(error, errorContext);
        throw error;
    };

    const handleUnhandledRejection = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'unhandled-rejection-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        // Create a promise that rejects with comprehensive context
        const rejectionContext = {
            type: 'unhandled-promise-rejection',
            triggeredBy: 'user-action',
            componentState: componentState,
            asyncOperationContext: {
                operationType: 'simulated-async-operation',
                expectedDuration: 1000,
                actualDuration: 0,
                retryCount: 0,
                timeoutDuration: 5000,
            },
            networkState: {
                onLine: navigator.onLine,
                connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                estimatedBandwidth: (navigator as any).connection?.downlink || 0,
            },
            memoryPressure: {
                usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
                totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
                jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
                memoryPressureLevel: (performance as any).memory?.usedJSHeapSize > ((performance as any).memory?.jsHeapSizeLimit * 0.8) ? 'high' : 'normal',
            },
        };

        Promise.reject(new Error("Enhanced unhandled promise rejection with detailed context")).catch(() => {
            // This will be caught by the global unhandled rejection handler
            // Don't log here as the auto-capture will handle it
        });
    };

    const handleServerActionError = async (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'server-action-error-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await triggerServerActionError();
        if (result && result.success === false) {
            toast.error(result.message);
        }
    };

    const handleHttpError = async (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'http-error-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await triggerHttpError();
        if (result && result.success === false) {
            toast.error(result.message);
        }
    };

    const handleExceptionError = async (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'exception-error-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await triggerExceptionError();
        if (result && result.success === false) {
            toast.error(result.message);
        }
    };

    const handleCustomMessage = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'custom-message-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        analytics.track("Enhanced custom error message with rich metadata", {
            messageType: 'custom-business-logic-error',
            severity: 'medium',
            category: 'user-interaction',
            context: {
                userInput,
                componentState,
                businessLogic: {
                    operation: 'custom-message-generation',
                    expectedBehavior: 'log-custom-message',
                    actualBehavior: 'log-custom-message',
                    businessRules: ['user-must-be-authenticated', 'rate-limiting-applies'],
                    validationResults: {
                        inputValid: userInput.length > 0,
                        contextValid: true,
                        permissionsValid: true,
                    },
                },
                userJourney: {
                    currentStep: 'error-testing',
                    previousSteps: componentState.interactionHistory,
                    nextExpectedStep: 'view-results',
                    journeyDuration: Date.now() - startTimeRef.current,
                },
            },
        });
        toast.success("Tracked enhanced custom error message");
    };

    const handleComplexError = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'complex-error-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        // Simulate complex business operation with multiple data points
        const transactionData = {
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: 99.99,
            currency: 'USD',
            merchantId: 'merchant_12345',
            customerId: 'customer_67890',
            paymentMethod: 'credit_card',
            cardLast4: '1234',
            cardBrand: 'visa',
            processingTime: Math.random() * 1000 + 500,
            riskScore: Math.random() * 100,
            fraudChecks: {
                addressVerification: 'pass',
                cvvVerification: 'pass',
                velocityCheck: 'pass',
                blacklistCheck: 'pass',
                deviceFingerprint: 'trusted',
            },
            metadata: {
                userAgent: navigator.userAgent,
                ipAddress: '192.168.1.1', // Would be actual IP in real scenario
                geolocation: {
                    country: 'US',
                    region: 'CA',
                    city: 'San Francisco',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                deviceInfo: {
                    type: 'desktop',
                    os: navigator.platform,
                    browser: navigator.userAgent.split(' ')[0],
                    screenResolution: `${screen.width}x${screen.height}`,
                    language: navigator.language,
                },
                sessionInfo: {
                    sessionId: 'session_' + Math.random().toString(36).substr(2, 9),
                    sessionDuration: Date.now() - startTimeRef.current,
                    pageViews: 1,
                    interactions: componentState.clickCount,
                },
            },
        };

        analytics.track("Complex payment processing error with comprehensive transaction data", {
            errorType: 'payment-processing-error',
            severity: 'high',
            category: 'financial-transaction',
            transactionData,
            diagnostics: {
                systemHealth: {
                    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
                    networkLatency: (navigator as any).connection?.rtt || 0,
                    connectionQuality: (navigator as any).connection?.effectiveType || 'unknown',
                    batteryLevel: componentState.performanceMetrics.batteryLevel || 1,
                },
                errorPropagation: {
                    originatingComponent: 'ErrorsPage',
                    errorBoundary: 'none',
                    stackDepth: new Error().stack?.split('\n').length || 0,
                },
                contextualFactors: {
                    timeOfDay: new Date().getHours(),
                    dayOfWeek: new Date().getDay(),
                    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    browserTabsCount: 'unknown', // Would require permission
                    windowFocused: document.hasFocus(),
                },
            },
        });
        toast.success("Tracked complex error with comprehensive transaction data");
    };

    const handleNaturalException = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'natural-exception-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        try {
            // Simulate complex validation with multiple failure points
            const userData = {
                email: userInput || "invalid-email",
                age: -5,
                preferences: {
                    notifications: true,
                    theme: 'dark',
                    language: navigator.language,
                },
                profile: {
                    firstName: '',
                    lastName: '',
                    phoneNumber: '123-456-7890',
                    address: {
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'US',
                    },
                },
            };

            const validationErrors = [];
            const validationContext = {
                validationStartTime: Date.now(),
                validationRules: [],
                fieldValidations: {} as Record<string, any>,
                businessRules: {} as Record<string, any>,
            };

            // Email validation
            if (!userData.email.includes("@")) {
                validationErrors.push({
                    field: 'email',
                    value: userData.email,
                    rule: 'email-format',
                    message: 'Invalid email format',
                    severity: 'error',
                });
                validationContext.fieldValidations.email = {
                    valid: false,
                    rules: ['required', 'email-format'],
                    failedRules: ['email-format'],
                };
            }

            // Age validation
            if (userData.age < 0) {
                validationErrors.push({
                    field: 'age',
                    value: userData.age,
                    rule: 'age-positive',
                    message: 'Age cannot be negative',
                    severity: 'error',
                });
                validationContext.fieldValidations.age = {
                    valid: false,
                    rules: ['required', 'positive-number', 'age-range'],
                    failedRules: ['positive-number'],
                };
            }

            // Profile validation
            if (!userData.profile.firstName.trim()) {
                validationErrors.push({
                    field: 'profile.firstName',
                    value: userData.profile.firstName,
                    rule: 'required',
                    message: 'First name is required',
                    severity: 'error',
                });
            }

            if (validationErrors.length > 0) {
                const validationError = new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
                (validationError as any).validationErrors = validationErrors;
                (validationError as any).userData = userData;
                (validationError as any).validationContext = validationContext;

                throw validationError;
            }

        } catch (error: any) {
            const enhancedContext = {
                errorType: 'validation-error',
                field: 'multiple',
                operation: 'user-registration',
                userId: 'anonymous',
                formData: {
                    userInput,
                    componentState,
                },
                validationDetails: (error as any).validationErrors || [],
                userInteractionContext: {
                    interactionHistory: componentState.interactionHistory,
                    clickCount: componentState.clickCount,
                    timeSinceLoad: Date.now() - startTimeRef.current,
                    inputLength: userInput.length,
                    inputValid: userInput.includes('@'),
                },
                systemContext: {
                    availableMemory: (performance as any).memory?.jsHeapSizeLimit - (performance as any).memory?.usedJSHeapSize || 0,
                    currentLoad: (performance as any).memory?.usedJSHeapSize / (performance as any).memory?.jsHeapSizeLimit || 0,
                    networkConditions: {
                        online: navigator.onLine,
                        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                        estimatedBandwidth: (navigator as any).connection?.downlink || 0,
                    },
                },
                debugInfo: {
                    stackTrace: error.stack,
                    errorName: error.name,
                    errorMessage: error.message,
                    componentStack: 'ErrorsPage > handleNaturalException',
                    reactVersion: React.version,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                },
            };

            analytics.captureException(error as Error, enhancedContext);
            toast.success("Captured enhanced exception with comprehensive validation context");
        }
    };

    const handleSetUser = (event?: React.MouseEvent) => {
        // Update interaction state without logging
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'set-user-trigger'],
            clickCount: prev.clickCount + 1,
        }));

        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        analytics.setUser(userId);

        // Log user context setting with metadata
        analytics.track("User context established", {
            userManagement: {
                userId,
                action: 'set-user-context',
                previousUserId: 'anonymous',
                sessionId: 'session_' + Math.random().toString(36).substr(2, 9),
                authenticationMethod: 'simulated',
                userAgent: navigator.userAgent,
                deviceFingerprint: {
                    screen: `${screen.width}x${screen.height}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    platform: navigator.platform,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: (navigator as any).deviceMemory || 0,
                },
                privacySettings: {
                    trackingConsent: true,
                    analyticsConsent: true,
                    advertisingConsent: false,
                    functionalConsent: true,
                },
            },
        });

        toast.success(`Set user ID to ${userId}`);
    };

    const handleAddTags = (event?: React.MouseEvent) => {
        trackInteraction('add-tags-trigger', {
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
        });

        const newTags = ["test", "frontend", "critical", "enhanced-logging", `session-${Date.now()}`];
        analytics.addTags(newTags);

        // Log tag addition with context
        analytics.track("Tags added to global context", {
            tagManagement: {
                addedTags: newTags,
                totalTagsAfter: newTags.length, // Would be actual count in real implementation
                tagCategories: {
                    environment: ['test', 'frontend'],
                    severity: ['critical'],
                    feature: ['enhanced-logging'],
                    session: [`session-${Date.now()}`],
                },
                tagPurpose: 'error-categorization-and-filtering',
                automaticTags: {
                    browser: navigator.userAgent.split(' ')[0],
                    platform: navigator.platform,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            },
        });

        toast.success(`Added enhanced tags: ${newTags.join(', ')}`);
    };

    // New enhanced logging test cases
    const handlePerformanceIssue = (event?: React.MouseEvent) => {
        trackInteraction('performance-issue-trigger', {
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
        });

        // Simulate performance issue
        const startTime = performance.now();
        const heavyOperation = () => {
            // Simulate heavy computation
            let result = 0;
            for (let i = 0; i < 1000000; i++) {
                result += Math.random();
            }
            return result;
        };

        const result = heavyOperation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        analytics.track("Performance issue detected", {
            performanceIssue: {
                operationType: 'heavy-computation',
                duration,
                expectedDuration: 10,
                performanceRatio: duration / 10,
                severity: duration > 100 ? 'high' : duration > 50 ? 'medium' : 'low',
                result,
                memoryBefore: (performance as any).memory?.usedJSHeapSize || 0,
                memoryAfter: (performance as any).memory?.usedJSHeapSize || 0,
                cpuIntensive: true,
                blockingOperation: true,
            },
            systemMetrics: {
                ...componentState.performanceMetrics,
                currentTimestamp: Date.now(),
                performanceNow: performance.now(),
                userTiming: performance.getEntriesByType('measure').length,
                resourceTiming: performance.getEntriesByType('resource').length,
                navigationTiming: performance.getEntriesByType('navigation').length,
            },
        });

        toast.success(`Performance issue logged (${duration.toFixed(2)}ms)`);
    };

    const handleNetworkError = async (event?: React.MouseEvent) => {
        trackInteraction('network-error-trigger', {
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
        });

        // Simulate network request failure
        const requestStart = performance.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Attempt to fetch from a non-existent endpoint
            const response = await fetch('/api/non-existent-endpoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                },
                body: JSON.stringify({
                    testData: userInput,
                    timestamp: Date.now(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            const requestEnd = performance.now();
            const requestDuration = requestEnd - requestStart;

            analytics.captureException(error as Error, {
                networkError: {
                    requestId,
                    url: '/api/non-existent-endpoint',
                    method: 'POST',
                    duration: requestDuration,
                    expectedDuration: 1000,
                    timeoutDuration: 5000,
                    retryCount: 0,
                    httpStatus: 404,
                    responseHeaders: {},
                    requestHeaders: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': requestId,
                    },
                    requestBody: {
                        testData: userInput,
                        timestamp: Date.now(),
                    },
                },
                networkConditions: {
                    online: navigator.onLine,
                    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                    downlink: (navigator as any).connection?.downlink || 0,
                    rtt: (navigator as any).connection?.rtt || 0,
                    saveData: (navigator as any).connection?.saveData || false,
                },
                browserNetworkStack: {
                    userAgent: navigator.userAgent,
                    cookieEnabled: navigator.cookieEnabled,
                    doNotTrack: navigator.doNotTrack,
                    maxTouchPoints: navigator.maxTouchPoints,
                },
            });

            toast.success("Network error captured with comprehensive context");
        }
    };

    const handleFormError = (event?: React.MouseEvent) => {
        trackInteraction('form-error-trigger', {
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
        });

        // Simulate form submission error
        const formData = {
            userInput,
            email: userInput.includes('@') ? userInput : 'invalid-email',
            preferences: {
                notifications: true,
                theme: 'dark',
                language: navigator.language,
            },
            metadata: {
                formId: 'error-test-form',
                submissionAttempt: componentState.clickCount + 1,
                timeSinceLoad: Date.now() - startTimeRef.current,
                interactionHistory: componentState.interactionHistory,
            },
        };

        const formError = new Error("Form submission failed with validation errors");
        (formError as any).formData = formData;
        (formError as any).validationErrors = [
            {
                field: 'email',
                message: 'Invalid email format',
                value: formData.email,
                rule: 'email-validation',
            },
        ];

        analytics.captureException(formError, {
            formSubmission: {
                formId: 'error-test-form',
                submissionAttempt: componentState.clickCount + 1,
                formData,
                validationErrors: (formError as any).validationErrors,
                submissionMethod: 'button-click',
                formState: 'invalid',
                userInteraction: {
                    focusedField: 'userInput',
                    fieldInteractions: {
                        userInput: {
                            focused: true,
                            modified: userInput.length > 0,
                            validationState: userInput.includes('@') ? 'valid' : 'invalid',
                        },
                    },
                },
            },
            formContext: {
                formElements: document.forms.length,
                inputElements: document.querySelectorAll('input').length,
                buttonElements: document.querySelectorAll('button').length,
                formValidationAPI: 'checkValidity' in HTMLFormElement.prototype,
                constraintValidationAPI: 'validity' in HTMLInputElement.prototype,
            },
        });

        toast.success("Form error captured with comprehensive validation context");
    };

    // ============================================================================
    // LOGGING HANDLERS (server-side logging to logs table)
    // ============================================================================

    const handleLogInteraction = async (event?: React.MouseEvent) => {
        // Update interaction state
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'log-interaction'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await logUserInteraction('log-interaction-button-click', {
            userInput,
            componentState,
            mousePosition: event ? { x: event.clientX, y: event.clientY } : undefined,
            sessionMetrics: {
                timeSinceLoad: now - startTimeRef.current,
                interactionCount: componentState.clickCount + 1,
                interactionHistory: componentState.interactionHistory,
            },
            browserContext: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                onLine: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled,
            },
        });

        if (result.success) {
            toast.success("User interaction logged to logs table");
        } else {
            toast.error("Failed to log interaction");
        }
    };

    const handleLogPerformance = async (event?: React.MouseEvent) => {
        // Update interaction state
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'log-performance'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await logPerformanceMetrics({
            sessionDuration: now - startTimeRef.current,
            interactionCount: componentState.clickCount + 1,
            performanceMetrics: componentState.performanceMetrics,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            memoryTotal: (performance as any).memory?.totalJSHeapSize || 0,
            connectionType: (navigator as any).connection?.effectiveType || 'unknown',
            connectionDownlink: (navigator as any).connection?.downlink || 0,
            connectionRtt: (navigator as any).connection?.rtt || 0,
            resourceCount: performance.getEntriesByType('resource').length,
            navigationCount: performance.getEntriesByType('navigation').length,
            userTiming: performance.getEntriesByType('measure').length,
            currentTimestamp: now,
            performanceNow: performance.now(),
        });

        if (result.success) {
            toast.success("Performance metrics logged to logs table");
        } else {
            toast.error("Failed to log performance metrics");
        }
    };

    const handleLogBusiness = async (event?: React.MouseEvent) => {
        // Update interaction state
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'log-business'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await logBusinessEvent('user-engagement-test', {
            eventTimestamp: now,
            userInput,
            sessionMetrics: {
                sessionDuration: now - startTimeRef.current,
                totalInteractions: componentState.clickCount + 1,
                interactionTypes: componentState.interactionHistory,
                lastInteractionTime: interactionTimeRef.current[interactionTimeRef.current.length - 1] || now,
            },
            businessContext: {
                featureTested: 'error-tracking-system',
                testType: 'business-event-logging',
                userJourney: 'testing-phase',
                expectedOutcome: 'successful-log-entry',
                businessValue: 'system-monitoring',
            },
            userBehavior: {
                inputProvided: userInput.length > 0,
                inputValid: userInput.includes('@'),
                engagementLevel: componentState.clickCount > 5 ? 'high' : componentState.clickCount > 2 ? 'medium' : 'low',
                timeSpentOnPage: now - startTimeRef.current,
            },
        });

        if (result.success) {
            toast.success("Business event logged to logs table");
        } else {
            toast.error("Failed to log business event");
        }
    };

    const handleLogDebug = async (event?: React.MouseEvent) => {
        // Update interaction state
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'log-debug'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await logDebugInfo('Debug information for error tracking system', {
            debugTimestamp: now,
            componentState: {
                userInput,
                clickCount: componentState.clickCount + 1,
                interactionHistory: componentState.interactionHistory,
                performanceMetrics: componentState.performanceMetrics,
            },
            systemState: {
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
                memoryLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
                memoryPressure: ((performance as any).memory?.usedJSHeapSize || 0) / ((performance as any).memory?.jsHeapSizeLimit || 1),
                networkStatus: navigator.onLine,
                connectionQuality: (navigator as any).connection?.effectiveType || 'unknown',
                batteryLevel: componentState.performanceMetrics.batteryLevel || 1,
                deviceInfo: {
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: (navigator as any).deviceMemory || 0,
                    maxTouchPoints: navigator.maxTouchPoints,
                },
            },
            debugContext: {
                debugLevel: 'verbose',
                debugCategory: 'user-interaction-tracking',
                debugSource: 'errors-page-component',
                relatedComponents: ['analytics', 'error-tracker', 'logger'],
                debugPurpose: 'system-health-monitoring',
            },
            technicalDetails: {
                reactVersion: React.version,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
            },
        });

        if (result.success) {
            toast.success("Debug information logged to logs table");
        } else {
            toast.error("Failed to log debug information");
        }
    };

    const handleLogWarning = async (event?: React.MouseEvent) => {
        // Update interaction state
        const now = Date.now();
        interactionTimeRef.current.push(now);
        setComponentState(prev => ({
            ...prev,
            interactionHistory: [...prev.interactionHistory.slice(-9), 'log-warning'],
            clickCount: prev.clickCount + 1,
        }));

        const result = await logWarning('High interaction rate detected on error testing page', {
            warningTimestamp: now,
            warningLevel: 'medium',
            warningCategory: 'user-behavior',
            warningSource: 'error-testing-page',

            triggerConditions: {
                interactionCount: componentState.clickCount + 1,
                sessionDuration: now - startTimeRef.current,
                interactionRate: (componentState.clickCount + 1) / ((now - startTimeRef.current) / 1000 / 60), // interactions per minute
                thresholdExceeded: componentState.clickCount > 10,
            },

            userContext: {
                userInput,
                inputValid: userInput.includes('@'),
                interactionHistory: componentState.interactionHistory,
                lastInteractionTime: interactionTimeRef.current[interactionTimeRef.current.length - 1] || now,
            },

            systemContext: {
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
                memoryPressure: ((performance as any).memory?.usedJSHeapSize || 0) / ((performance as any).memory?.jsHeapSizeLimit || 1),
                networkLatency: (navigator as any).connection?.rtt || 0,
                connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                batteryLevel: componentState.performanceMetrics.batteryLevel || 1,
            },

            recommendedActions: [
                'Monitor user behavior patterns',
                'Check for automated testing or bot activity',
                'Review system performance during high interaction periods',
                'Consider implementing rate limiting if necessary',
            ],

            businessImpact: {
                severity: 'low',
                userExperienceImpact: 'minimal',
                systemPerformanceImpact: 'none',
                requiresImmedateAttention: false,
            },
        });

        if (result.success) {
            toast.success("Warning logged to logs table");
        } else {
            toast.error("Failed to log warning");
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Enhanced Error Tracker Testing
                </h1>
                <p className="text-muted-foreground mt-1">
                    Test comprehensive error tracking with rich metadata, performance metrics, and detailed context.
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Current Session Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Interactions:</span>
                            <span className="ml-2 font-mono">{componentState.clickCount}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Session Time:</span>
                            <span className="ml-2 font-mono">{Math.round((Date.now() - startTimeRef.current) / 1000)}s</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Memory:</span>
                            <span className="ml-2 font-mono">{Math.round((componentState.performanceMetrics.memoryUsed || 0) / 1024 / 1024)}MB</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Connection:</span>
                            <span className="ml-2 font-mono">{componentState.performanceMetrics.connectionType || 'unknown'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Test Input</CardTitle>
                        <CardDescription>
                            Enter test data to be included in error context
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={userInput}
                            onChange={(e) => {
                                setUserInput(e.target.value);
                                setComponentState(prev => ({
                                    ...prev,
                                    formData: { ...prev.formData, userInput: e.target.value }
                                }));
                            }}
                            placeholder="Enter test data (e.g., email@example.com)"
                            className="max-w-md"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Enhanced Client-Side Errors</CardTitle>
                        <CardDescription>
                            Trigger errors with comprehensive browser context, performance metrics, and user interaction data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Enhanced Error with Full Context</p>
                            <Button variant="destructive" onClick={handleClientError}>
                                Throw Enhanced Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Promise Rejection with Metadata</p>
                            <Button variant="destructive" onClick={handleUnhandledRejection}>
                                Reject with Context
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Performance Issue Detection</p>
                            <Button variant="destructive" onClick={handlePerformanceIssue}>
                                Trigger Performance Issue
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enhanced Custom Tracking</CardTitle>
                        <CardDescription>
                            Track events with rich business context, user journey data, and system metrics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Rich Custom Message</p>
                            <Button onClick={handleCustomMessage}>
                                Track Enhanced Message
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Complex Business Data</p>
                            <Button onClick={handleComplexError}>
                                Track Complex Transaction
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Enhanced Exception Capture</p>
                            <Button onClick={handleNaturalException}>
                                Capture with Full Context
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Network & Form Errors</CardTitle>
                        <CardDescription>
                            Test network failures and form validation with comprehensive request/response context.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Network Request Failure</p>
                            <Button variant="destructive" onClick={handleNetworkError}>
                                Trigger Network Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Form Validation Error</p>
                            <Button variant="destructive" onClick={handleFormError}>
                                Trigger Form Error
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enhanced Server Actions</CardTitle>
                        <CardDescription>
                            Server-side errors with comprehensive request context and system metrics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Generate Multiple Random Errors</p>
                            <Button variant="destructive" onClick={handleBulkErrorGeneration}>
                                Generate 15 Dynamic Errors
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Server Action Error</p>
                            <Button variant="destructive" onClick={handleServerActionError}>
                                Trigger Server Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>HTTP Error with Context</p>
                            <Button variant="destructive" onClick={handleHttpError}>
                                Trigger HTTP Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Exception with Stack Trace</p>
                            <Button variant="destructive" onClick={handleExceptionError}>
                                Trigger Exception
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enhanced SDK Configuration</CardTitle>
                        <CardDescription>
                            Configure tracking with comprehensive user and session context.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Set User with Context</p>
                            <Button onClick={handleSetUser}>
                                Set Enhanced User
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Add Contextual Tags</p>
                            <Button onClick={handleAddTags}>
                                Add Enhanced Tags
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📊 Logging (Goes to Logs Table)</CardTitle>
                        <CardDescription>
                            Test server-side logging functionality that sends data to the logs table for application monitoring.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Log User Interaction</p>
                            <Button variant="outline" onClick={handleLogInteraction}>
                                Log Interaction
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Log Performance Metrics</p>
                            <Button variant="outline" onClick={handleLogPerformance}>
                                Log Performance
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Log Business Event</p>
                            <Button variant="outline" onClick={handleLogBusiness}>
                                Log Business Event
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Log Debug Information</p>
                            <Button variant="outline" onClick={handleLogDebug}>
                                Log Debug Info
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Log Warning Message</p>
                            <Button variant="outline" onClick={handleLogWarning}>
                                Log Warning
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🚨 Error Tracking Examples (→ Errors Table)</CardTitle>
                        <CardDescription>
                            Client-side error tracking that sends data to the errors table for debugging and monitoring.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Enhanced Custom Error Messages</h4>
                                <code className="block bg-muted p-2 rounded text-sm">
                                    analytics.track("Payment failed", {`{
  errorType: 'payment-processing',
  transactionId: 'txn_123',
  amount: 100,
  currency: 'USD',
  userContext: { userId: '123', sessionId: 'sess_456' },
  systemMetrics: { memoryUsage: 45.2, networkLatency: 120 },
  businessContext: { merchantId: 'merchant_789', riskScore: 25 }
}`});
                                </code>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Comprehensive Exception Capture</h4>
                                <code className="block bg-muted p-2 rounded text-sm">
                                    analytics.captureException(error, {`{
  errorContext: { component: 'PaymentForm', operation: 'processPayment' },
  userInteraction: { clickCount: 3, formData: {...}, timeSinceLoad: 15000 },
  systemContext: { availableMemory: 512, networkConditions: {...} },
  businessContext: { transactionData: {...}, validationResults: {...} }
}`});
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📊 Logging Examples (→ Logs Table)</CardTitle>
                        <CardDescription>
                            Server-side logging that sends data to the logs table for application monitoring and analytics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Business Event Logging</h4>
                                <code className="block bg-muted p-2 rounded text-sm">
                                    logger.info("User completed checkout", {`{
  eventType: 'business-logic',
  userId: '123',
  transactionId: 'txn_456',
  amount: 99.99,
  paymentMethod: 'credit_card',
  sessionMetrics: { duration: 180000, pageViews: 5 }
}`});
                                </code>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Performance Metrics Logging</h4>
                                <code className="block bg-muted p-2 rounded text-sm">
                                    logger.info("Performance metrics", {`{
  metricsType: 'performance',
  responseTime: 250,
  memoryUsage: 45.2,
  cpuUsage: 12.5,
  connectionType: '4g',
  userCount: 1250
}`});
                                </code>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Debug Information Logging</h4>
                                <code className="block bg-muted p-2 rounded text-sm">
                                    logger.debug("Cache hit rate analysis", {`{
  debugType: 'debug-info',
  cacheHitRate: 0.85,
  cacheMisses: 150,
  cacheSize: '2.5MB',
  systemHealth: 'optimal'
}`});
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>🔍 Key Differences: Error Tracking vs Logging</CardTitle>
                    <CardDescription>
                        Understanding when to use error tracking versus logging for optimal monitoring.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium mb-3 text-red-600 dark:text-red-400">🚨 Error Tracking (Errors Table)</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• <strong>Purpose:</strong> Track failures, exceptions, and problems</li>
                                <li>• <strong>When:</strong> Something goes wrong or breaks</li>
                                <li>• <strong>Data:</strong> Stack traces, error context, debugging info</li>
                                <li>• <strong>Endpoint:</strong> <code>/ingest</code></li>
                                <li>• <strong>Client-side:</strong> <code>analytics.track()</code>, <code>analytics.captureException()</code></li>
                                <li>• <strong>Examples:</strong> Payment failures, validation errors, API timeouts</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">📊 Logging (Logs Table)</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• <strong>Purpose:</strong> Monitor application flow and business events</li>
                                <li>• <strong>When:</strong> Normal operations, metrics, user actions</li>
                                <li>• <strong>Data:</strong> Performance metrics, user interactions, business events</li>
                                <li>• <strong>Endpoint:</strong> <code>/log</code></li>
                                <li>• <strong>Server-side:</strong> <code>logger.info()</code>, <code>logger.debug()</code>, <code>logger.warn()</code></li>
                                <li>• <strong>Examples:</strong> User logins, performance metrics, feature usage</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 