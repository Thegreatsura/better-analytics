export default function Sandbox() {
	const shouldThrow = false;

	if (shouldThrow) {
		throw new Error("This is a test error");
	}

	return <div>Sandbox</div>;
}
