import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Gmail, Outlook } from "@better-analytics/ui/icons";
import { Button } from "@better-analytics/ui/components/button";

export function EmailShortcuts() {
	const gmailURL = "https://mail.google.com/mail/u/0/#inbox";
	const outlookURL = "https://outlook.live.com/mail/0/";

	return (
		<div className="flex flex-row gap-2">
			<Button
				className="flex flex-row items-center gap-2 text-muted-foreground backdrop-blur"
				variant="outline"
				asChild
			>
				<Link href={gmailURL} target="_blank">
					<Gmail className="size-3.5" /> Gmail
					<ExternalLink className="size-3 opacity-50" />
				</Link>
			</Button>

			<Button
				className="flex flex-row items-center gap-2 text-muted-foreground backdrop-blur"
				variant="outline"
				asChild
			>
				<Link href={outlookURL} target="_blank">
					<Outlook className="size-3.5" /> Outlook
					<ExternalLink className="size-3 opacity-50" />
				</Link>
			</Button>
		</div>
	);
}
