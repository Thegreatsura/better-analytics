"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import env from "@/env";

// Configure OpenRouter client
const openrouterClient = openai({
	apiKey: env.OPENROUTER_API_KEY,
	baseURL: env.OPENROUTER_BASE_URL,
});

// Input validation schema
const chatInputSchema = z.object({
	message: z.string().min(1).max(1000),
	conversationHistory: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			}),
		)
		.optional(),
});

export async function generateAIResponse(
	input: z.infer<typeof chatInputSchema>,
) {
	try {
		// Validate input
		const validatedInput = chatInputSchema.parse(input);

		if (!OPENROUTER_API_KEY) {
			throw new Error("OpenRouter API key is not configured");
		}

		// Build the conversation context
		const messages = [
			{
				role: "system" as const,
				content: `You are a helpful AI assistant for Better Analytics, an advanced error tracking and performance monitoring platform. 

Your role is to help users understand their analytics data, identify patterns in errors, analyze performance metrics, and provide actionable insights.

Key capabilities you should focus on:
- Error analysis and pattern identification
- Performance monitoring insights
- User behavior analytics
- Optimization recommendations
- Data visualization explanations

When users ask questions:
1. Provide specific, actionable insights
2. Use bullet points for clarity
3. Include relevant metrics when possible
4. Suggest next steps or follow-up questions
5. Keep responses concise but informative

If you don't have access to real data, provide helpful examples and guide users on what to look for in their actual analytics dashboard.`,
			},
			// Add conversation history if provided
			...(validatedInput.conversationHistory || []),
			{
				role: "user" as const,
				content: validatedInput.message,
			},
		];

		// Generate response using OpenRouter
		const result = await generateText({
			model: openrouterClient("openai/gpt-4o-mini"),
			messages,
			maxTokens: 1000,
			temperature: 0.7,
		});

		return {
			success: true,
			response: result.text,
			usage: result.usage,
		};
	} catch (error) {
		console.error("AI generation error:", error);

		// Return a helpful fallback response
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
			response:
				"I apologize, but I'm having trouble processing your request right now. Please try again later, or contact support if the issue persists.",
		};
	}
}

// Alternative action for streaming responses (if needed later)
export async function generateAIStreamResponse(
	input: z.infer<typeof chatInputSchema>,
) {
	try {
		const validatedInput = chatInputSchema.parse(input);

		if (!OPENROUTER_API_KEY) {
			throw new Error("OpenRouter API key is not configured");
		}

		// This would be used with streamText for real-time streaming
		// For now, we'll use the regular generateText
		return await generateAIResponse(input);
	} catch (error) {
		console.error("AI streaming error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
			response: "I'm having trouble processing your request right now.",
		};
	}
}
