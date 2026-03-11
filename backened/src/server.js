// Entry file of Server
import { app } from "./app.js";
import { PORT } from "./constants.js";
import dotenv from "dotenv";
import { connectMongoDB } from "./config/db.js";

dotenv.config({
    path:"./.env" 
})

await connectMongoDB();

// Start scheduled jobs (cron)
await import("./utils/cron/emailSend.cron.js");

app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port: ${PORT}`);
})