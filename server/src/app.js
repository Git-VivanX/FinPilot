import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import scenarioRoutes from "./routes/scenario.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/scenarios", scenarioRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FinPilot API is running!",
    });
});

export default app;
