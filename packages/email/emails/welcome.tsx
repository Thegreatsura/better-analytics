import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Tailwind,
	Text,
} from "@react-email/components";

interface EmailProps {
	username: string;
	url: string;
}

export default function WelcomeEmail({
	username = "armful",
	url = "https://better-analytics.vercel.app",
}: EmailProps) {
	const previewText = "Welcome to Better Analytics";

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="py-10 font-sans">
					<Container>
						<Heading>Welcome to Better Analytics!</Heading>
						<Text>Hi {username},</Text>
						<Text>
							Welcome to <strong>Better Analytics</strong>! We're excited to
							have you on board.
						</Text>
						<Text className="text-xs">
							Need help? Contact us at{" "}
							<Link href="mailto:support@better-analytics.com">
								support@better-analytics.com
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
