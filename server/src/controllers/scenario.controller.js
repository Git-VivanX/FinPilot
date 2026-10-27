
import Scenario from "../models/Scenario.js";
import {
    calculateScenario,
    compareMultipleScenarios,
} from "../services/finance.service.js";
import { explainScenario } from "../services/ai.service.js";

export const createScenario = async (req, res) => {
    try {
        const {
            name,
            savings,
            monthlyIncome,
            monthlyExpenses,
            goalCost,
            months,
            purchaseMonth,
            monthlyAdjustment,
        } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Scenario name is required.",
            });
        }

        const result = calculateScenario({
            savings,
            monthlyIncome,
            monthlyExpenses,
            goalCost,
            months,
            purchaseMonth,
            monthlyAdjustment,
        });

        const scenario = await Scenario.create({
            name: name.trim(),
            savings,
            monthlyIncome,
            monthlyExpenses,
            goalCost,
            months,
            purchaseMonth: purchaseMonth ?? months,
            monthlyAdjustment: monthlyAdjustment ?? 0,
        });

        let explanation = "";

        try {
            explanation = await explainScenario({
                inputs: {
                    name: name.trim(),
                    savings,
                    monthlyIncome,
                    monthlyExpenses,
                    goalCost,
                    months,
                    purchaseMonth: purchaseMonth ?? months,
                    monthlyAdjustment: monthlyAdjustment ?? 0,
                },
                result,
            });
        } catch (aiError) {
            console.error("Gemini explanation failed:", aiError.message);

            explanation =
                "AI insights are temporarily unavailable. Your financial simulation was calculated successfully.";
        }

        return res.status(201).json({
            success: true,
            message: "Scenario created successfully.",
            scenario,
            result,
            explanation,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error instanceof TypeError ||
            error instanceof RangeError
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create scenario error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to create scenario.",
        });
    }
};

export const compareWhatIfScenarios = async (req, res) => {
    try {
        const { baseline, alternatives } = req.body;

        if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) {
            return res.status(400).json({
                success: false,
                message: "A valid baseline scenario is required.",
            });
        }

        if (!Array.isArray(alternatives)) {
            return res.status(400).json({
                success: false,
                message: "Alternatives must be an array.",
            });
        }

        const comparison = compareMultipleScenarios(
            baseline,
            alternatives
        );

        return res.status(200).json({
            success: true,
            message: "What-if scenarios compared successfully.",
            comparison,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error instanceof TypeError ||
            error instanceof RangeError
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("What-if comparison error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to compare what-if scenarios.",
        });
    }
};
