import Link from "next/link";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@better-analytics/ui/avatar";
import { Card, CardContent, CardHeader } from "@better-analytics/ui/card";
import { ArrowUpRight } from "lucide-react";

export interface Testimonial {
	avatar: string;
	name: string;
	role: string;
	quote: string;
	authorUrl?: string;
	postUrl?: string;
}

export function TestimonialCard({
	avatar,
	name,
	role,
	quote,
	authorUrl,
	postUrl,
}: Testimonial) {
	return (
		<Card className="group relative flex h-full min-w-80 flex-col justify-between overflow-hidden bg-border/20">
			<CardHeader className="text-sm opacity-40 transition-all group-hover:opacity-100">
				<span className="inline-flex max-w-[calc(100%-0.5rem)] items-center">
					{quote}
					{postUrl && (
						<Link
							href={postUrl}
							className="ml-1 w-fit text-brand opacity-0 hover:text-brand/80 group-hover:opacity-100"
							rel="noopener noreferrer"
							target="_blank"
						>
							<ArrowUpRight className="size-4" />
						</Link>
					)}
				</span>
			</CardHeader>

			<CardContent className="w-fit">
				<Author name={name} role={role} avatar={avatar} authorUrl={authorUrl} />
			</CardContent>
		</Card>
	);
}

function Author({ name, role, avatar, authorUrl }: Partial<Testimonial>) {
	const fallback = name?.at(0)?.toUpperCase();

	const content = (
		<div className="flex w-fit select-none flex-row items-center gap-2 opacity-60 transition-all group-hover:opacity-100">
			<Avatar className="size-9">
				<AvatarImage
					alt={name}
					src={avatar}
					loading="lazy"
					width="120"
					height="120"
				/>
				<AvatarFallback>{fallback}</AvatarFallback>
			</Avatar>

			<div className="flex flex-col">
				<figcaption className="font-medium text-sm">{name}</figcaption>
				<p className="font-medium text-muted-foreground text-xs">{role}</p>
			</div>
		</div>
	);

	return authorUrl ? (
		<Link href={authorUrl} rel="noopener noreferrer" target="_blank">
			{content}
		</Link>
	) : (
		<>{content}</>
	);
}
