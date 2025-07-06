export interface LocalizationConfig {
    apiUrl: string;
    defaultLanguage?: string;
    enableCache?: boolean;
    cacheTimeout?: number;
    fallbackToKey?: boolean;
}

export interface LocalizationOptions {
    sourceLocale?: string;
    targetLocale?: string;
    fast?: boolean;
    context?: Record<string, any>;
}

class LocalizationEngine {
    private config: Required<LocalizationConfig>;
    private cache: Map<string, { value: string; timestamp: number }> = new Map();

    constructor(config: LocalizationConfig) {
        this.config = {
            apiUrl: config.apiUrl,
            defaultLanguage: config.defaultLanguage || 'en',
            enableCache: config.enableCache ?? true,
            cacheTimeout: config.cacheTimeout || 5 * 60 * 1000, // 5 minutes
            fallbackToKey: config.fallbackToKey ?? true,
        };
    }

    private getCacheKey(key: string, targetLocale: string): string {
        return `${key}:${targetLocale}`;
    }

    private getCachedTranslation(key: string, targetLocale: string): string | null {
        if (!this.config.enableCache) return null;

        const cacheKey = this.getCacheKey(key, targetLocale);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return cached.value;
        }

        // Clean up expired cache entry
        if (cached) {
            this.cache.delete(cacheKey);
        }

        return null;
    }

    private setCachedTranslation(key: string, targetLocale: string, value: string): void {
        if (!this.config.enableCache) return;

        const cacheKey = this.getCacheKey(key, targetLocale);
        this.cache.set(cacheKey, { value, timestamp: Date.now() });
    }

    private detectLanguage(): string {
        if (typeof navigator !== 'undefined') {
            return navigator.language.split('-')[0] || this.config.defaultLanguage;
        }
        return this.config.defaultLanguage;
    }

    async translate(key: string, options: LocalizationOptions = {}): Promise<string> {
        const targetLocale = options.targetLocale || this.detectLanguage();
        const sourceLocale = options.sourceLocale || this.config.defaultLanguage;

        // Return key as-is if source and target are the same
        if (sourceLocale === targetLocale) {
            return key;
        }

        // Check cache first
        const cached = this.getCachedTranslation(key, targetLocale);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/localization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    language: targetLocale,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const result = data.result || key;

            // Cache the result
            this.setCachedTranslation(key, targetLocale, result);
            return result;
        } catch (error) {
            console.warn('Translation failed:', { key, targetLocale, error });

            // Return fallback
            return this.config.fallbackToKey ? key : `[${key}]`;
        }
    }

    async translateMultiple(keys: string[], options: LocalizationOptions = {}): Promise<Record<string, string>> {
        const results: Record<string, string> = {};

        // Process translations in parallel
        const translations = await Promise.allSettled(
            keys.map(key => this.translate(key, options))
        );

        keys.forEach((key, index) => {
            const result = translations[index];
            if (result && result.status === 'fulfilled') {
                results[key] = result.value;
            } else {
                results[key] = key;
            }
        });

        return results;
    }

    async localizeObject<T extends Record<string, string>>(
        obj: T,
        options: LocalizationOptions = {}
    ): Promise<T> {
        const keys = Object.keys(obj);
        const values = Object.values(obj);

        // Translate all values in parallel
        const translations = await Promise.allSettled(
            values.map(value => this.translate(value, options))
        );

        const result = {} as T;
        keys.forEach((key, index) => {
            const translation = translations[index];
            if (translation && translation.status === 'fulfilled') {
                result[key as keyof T] = translation.value as T[keyof T];
            } else {
                result[key as keyof T] = obj[key as keyof T];
            }
        });

        return result;
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }

    // Get cache size
    getCacheSize(): number {
        return this.cache.size;
    }
}

// Export the class
export { LocalizationEngine };

// Export convenience functions that require config
export function createLocalizer(config: LocalizationConfig) {
    const localizer = new LocalizationEngine(config);

    return {
        translate: (key: string, language?: string) => localizer.translate(key, { targetLocale: language }),
        translateMultiple: (keys: string[], language?: string) => localizer.translateMultiple(keys, { targetLocale: language }),
        localizeObject: <T extends Record<string, string>>(obj: T, language?: string) => localizer.localizeObject(obj, { targetLocale: language }),
        clearCache: () => localizer.clearCache(),
        getCacheSize: () => localizer.getCacheSize(),
    };
}