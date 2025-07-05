"use client";

import { IconContext } from "@phosphor-icons/react";

interface IconProviderProps {
	readonly children: React.ReactNode;
}

export function IconProvider({ children }: IconProviderProps) {
	return (
		<IconContext.Provider
			value={{
				color: "currentColor",
				size: 24,
				weight: "duotone",
				mirrored: false,
			}}
		>
			{children}
		</IconContext.Provider>
	);
}
