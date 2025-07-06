import { Suspense } from "react";
import { ErrorsConsole } from "../components/errors-console";

export default function ErrorsPage() {
	return (
		<div className="flex h-full flex-col space-y-6">
			<Suspense>
				<ErrorsConsole />
			</Suspense>
		</div>
	);
}
