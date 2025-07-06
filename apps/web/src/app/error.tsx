"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSound from "use-sound";

interface ErrorProps {
	error: Error & { digest?: string };
}

export default function GlobalError({ error }: ErrorProps) {
	const [play] = useSound("/bsod.mp3", { volume: 0.25 });
	const [progress, setProgress] = useState(0);
	const router = useRouter();

	useEffect(() => {
		play();

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
				<h1 className="text-9xl">{":("}</h1>

				<p className="text-2xl">
					This website ran into a problem and needs to restart. We&apos;re just
					collecting some error info, and then we&apos;ll restart for you.
				</p>

				<p className="text-xl">{progress}% complete</p>

				<div className="space-y-8 text-sm">
					<p>
						For more information about this issue and possible fixes, visit
						<Link
							href="https://www.customhack.dev"
							className="ml-1 hover:underline"
						>
							https://www.customhack.dev
						</Link>
					</p>

					<div className="space-y-4">
						<p>If you contact support, give them this info:</p>

						<p>Error: {error.message}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
