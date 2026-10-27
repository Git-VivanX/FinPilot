import mongoose from "mongoose";

const scenarioSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        savings: {
            type: Number,
            required: true,
            min: 0,
        },

        monthlyIncome: {
            type: Number,
            required: true,
            min: 0,
        },

        monthlyExpenses: {
            type: Number,
            required: true,
            min: 0,
        },

        goalCost: {
            type: Number,
            required: true,
            min: 0,
        },

        months: {
            type: Number,
            required: true,
            min: 1,
            max: 120,
            validate: {
                validator: Number.isInteger,
                message: "Months must be a whole number.",
            },
        },

        purchaseMonth: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Purchase month must be a whole number.",
            },
        },

        monthlyAdjustment: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Scenario = mongoose.model("Scenario", scenarioSchema);

export default Scenario;
