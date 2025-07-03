import { createSafeActionClient } from "next-safe-action";

const action = createSafeActionClient({
	handleServerError(error: Error) {
		console.error("Action error:", error.message);

		return error.message || "Something went wrong";
	},
});

export default action;
