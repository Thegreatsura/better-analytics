import { autumnHandler } from "autumn-js/next";
import { auth } from "@better-analytics/auth";

export const { GET, POST } = autumnHandler({
    identify: async (request) => {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        console.log(session);

        return {
            customerId: session?.user.id,
            customerData: {
                name: session?.user.name,
                email: session?.user.email,
            },
        };
    },
});