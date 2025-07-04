import { Elysia } from "elysia";

const app = new Elysia()
    .get("/", () => "Hello World")

export default {
    port: 3000,
    fetch: app.fetch,
}