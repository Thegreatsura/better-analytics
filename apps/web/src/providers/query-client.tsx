"use client";

import type * as React from "react";

import { QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query";

interface QueryClientProviderProps {
	readonly children: React.ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
	const queryClient = getQueryClient();

	return (
		<ReactQueryClientProvider client={queryClient}>
			{children}
		</ReactQueryClientProvider>
	);
}
