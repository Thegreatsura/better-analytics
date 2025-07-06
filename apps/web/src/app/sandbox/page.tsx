export default function Sandbox() {
	const shouldThrow = true;

	if (shouldThrow) {
		throw new Error("Hello from Customhack");
	}

	return <div>Sandbox</div>;
}
