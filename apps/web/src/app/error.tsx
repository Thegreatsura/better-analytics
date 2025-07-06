"use client";

import { analytics } from "@/lib/analytics";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";

interface ErrorProps {
	error: Error & { digest?: string };
}

export default function GlobalError({ error }: ErrorProps) {
	const [play] = useSound("/bsod.mp3", { volume: 0.25 });
	const [progress, setProgress] = useState(0);
	const [content, setContent] = useState({
		sadFace: ":(",
		mainMessage: "This website ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.",
		percentComplete: "% complete",
		moreInfoText: "For more information about this issue and possible fixes, visit",
		supportContactText: "If you contact support, give them this info:",
		errorLabel: "Error:",
		errorMessage: error.message,
	});
	const router = useRouter();
	const hasTranslated = useRef(false);

	useEffect(() => {
		play();

		// Translate all content at once - but only once
		if (!hasTranslated.current) {
			hasTranslated.current = true;

			const translateContent = async () => {
				try {
					const translated = await analytics.localizeObject({
						sadFace: ":(",
						mainMessage: "This website ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.",
						percentComplete: "% complete",
						moreInfoText: "For more information about this issue and possible fixes, visit",
						supportContactText: "If you contact support, give them this info:",
						errorLabel: "Error:",
						errorMessage: error.message,
					});

					setContent(translated);
				} catch (translationError) {
					console.warn("Translation failed, using default text:", translationError);
				}
			};

			translateContent();
		}

		const delay = 1000;
		const rate = Math.floor(Math.random() * 100) + 150;
		const timeoutId = setTimeout(() => {
			const interval = setInterval(() => {
				setProgress((prev) => {
					if (prev < 100) {
						return Math.min(prev + Math.round(Math.random() * 2), 100);
					}

					clearInterval(interval);
					router.push("/");
					return prev;
				});
			}, rate);

			return () => clearInterval(interval);
		}, delay);

		return () => clearTimeout(timeoutId);
	}, [play, router]);

	return (
		<div className="absolute z-[900] flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#047cd4]">
			<div className="flex max-w-2xl select-none flex-col space-y-10">
				<h1 className="text-9xl">{content.sadFace}</h1>

				<p className="text-2xl">
					{content.mainMessage}
				</p>

				<p className="text-xl">{progress}{content.percentComplete}</p>

				<div className="space-y-8 text-sm">
					<p>
						{content.moreInfoText}
						<Link
							href="https://www.customhack.dev"
							className="ml-1 hover:underline"
						>
							https://www.customhack.dev
						</Link>
					</p>

					<div className="space-y-4">
						<p>{content.supportContactText}</p>

						<p>{content.errorLabel} {content.errorMessage}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
