import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingoDotDev = new LingoDotDevEngine({
    apiKey: process.env.LINGO_API_KEY || '',
});

export async function t(key: string, language = 'en'): Promise<string> {
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
    return result;
}

export default lingoDotDev;