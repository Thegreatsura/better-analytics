import { Environment } from "@/components/environment";
import { PageClient } from "./page.client";

export default async function Home() {
	return (
		<section className="flex flex-col gap-4 text-center">
			<Environment />

			<PageClient />
		</section>
	);
}
