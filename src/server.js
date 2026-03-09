//Entery  file of Serverimport {app} from "./app.js";
import { PORT } from "./constants.js";
import dotenv from "dotenv";
import { connectMongoDB } from "./config/db.js";
import {app} from "./app.js"

dotenv.config({
    path:"./.env" 
})

await connectMongoDB();


app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port: ${PORT}`);
})