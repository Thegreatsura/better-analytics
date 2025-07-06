import { Environment } from "@/components/environment";

export default async function Home() {
	return (
		<section className="flex flex-col gap-4 text-center">
			<Environment />
		</section>
	);
}
