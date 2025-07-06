import { Suspense } from "react";
import { ErrorsAnalytics } from "../components/errors-analytics";

export default function ErrorsPage() {
	return (
		<div className="flex h-full flex-col space-y-6">
			<Suspense>
				<ErrorsAnalytics />
			</Suspense>
		</div>
	);
}
