import { generateAIResponse } from '../../dashboard/ai/actions';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Convert messages to the format expected by the server action
        const conversationHistory = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        }));

        const lastMessage = messages[messages.length - 1];

        const result = await generateAIResponse({
            message: lastMessage.content,
            conversationHistory,
        });

        if (!result.success) {
            return new Response(result.response, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        // Return the stream response
        return new Response(result.response, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response('Internal Server Error', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
} 