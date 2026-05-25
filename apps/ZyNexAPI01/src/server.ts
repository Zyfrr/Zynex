import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.ZYNEX_API_PORT, () => {
  console.log(`ZyNexAPI01 listening on http://localhost:${env.ZYNEX_API_PORT}/ZyNexAPI01`);
});
