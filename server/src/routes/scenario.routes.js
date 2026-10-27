
import express from "express";
import {
    createScenario,
    compareWhatIfScenarios,
} from "../controllers/scenario.controller.js";

const router = express.Router();

router.post("/", createScenario);
router.post("/compare", compareWhatIfScenarios);

export default router;
