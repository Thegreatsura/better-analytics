import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingoDotDev = new LingoDotDevEngine({
    apiKey: process.env.LINGODOTDEV_API_KEY || '',
});

export async function POST(request: NextRequest) {
    try {
        const { key, language = 'en' } = await request.json();

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const result = await lingoDotDev.localizeText(key, {
            sourceLocale: 'en',
            targetLocale: language,
            fast: true,
            reference: {
                [key]: {
                    [language]: key
                }
            }
        });

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Localization error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
