
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `FinPilot API is running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Failed to start FinPilot:", error.message);
        process.exit(1);
    }
}

startServer();
