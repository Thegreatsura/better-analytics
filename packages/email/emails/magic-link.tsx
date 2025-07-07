import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface EmailProps {
	url: string;
}

export default function MagicLinkEmail({
	url = "https://better-analytics.vercel.app",
}: EmailProps) {
	const previewText = `Login to Better Analytics`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="py-10 font-sans">
					<Container>
						<Heading>Login to Your Account</Heading>

						<Text>
							Click the link below to securely log in to your{" "}
							<strong>Better Analytics</strong> account.
						</Text>

						<Section>
							<Link href={url}>Log In to Better Analytics</Link>
						</Section>

						<Text>
							This login link will expire in 24 hours for security reasons.
						</Text>

						<Hr />

						<Text className="text-xs">
							If you didn't request this login link, you can safely ignore this
							email. Someone may have entered your email address by mistake.
						</Text>

						<Text className="text-xs">
							If you have any concerns about your account security, please
							contact us at{" "}
							<Link href="mailto:security@better-analytics.com">
								security@better-analytics.com
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
