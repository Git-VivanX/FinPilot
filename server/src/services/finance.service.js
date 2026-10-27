
const MAX_AMOUNT = 1_000_000_000;
const MAX_MONTHS = 120;
const MAX_SCENARIOS = 6;

function validateMoney(value, field) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > MAX_AMOUNT
    ) {
        throw new Error(`${field} must be a valid non-negative number`);
    }

    return value;
}

function validateMonths(months) {
    if (
        !Number.isInteger(months) ||
        months < 1 ||
        months > MAX_MONTHS
    ) {
        throw new Error("Months must be an integer between 1 and 120");
    }
}

function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateScenario(input) {
    if (!input || typeof input !== "object") {
        throw new Error("Scenario input is required");
    }

    const savings = validateMoney(input.savings, "Savings");
    const income = validateMoney(input.monthlyIncome, "Income");
    const expenses = validateMoney(input.monthlyExpenses, "Expenses");
    const goalCost = validateMoney(input.goalCost, "Goal cost");

    validateMonths(input.months);

    const adjustment = input.monthlyAdjustment ?? 0;

    if (
        typeof adjustment !== "number" ||
        !Number.isFinite(adjustment) ||
        Math.abs(adjustment) > MAX_AMOUNT
    ) {
        throw new Error("Monthly adjustment must be a valid number");
    }

    const purchaseMonth = input.purchaseMonth ?? input.months;

    if (
        !Number.isInteger(purchaseMonth) ||
        purchaseMonth < 1 ||
        purchaseMonth > input.months
    ) {
        throw new Error("Invalid purchase month");
    }

    const monthlySurplus = income - expenses + adjustment;

    let balance = savings;
    const projection = [];

    for (let month = 1; month <= input.months; month++) {
        balance += monthlySurplus;

        if (month === purchaseMonth) {
            balance -= goalCost;
        }

        balance = roundMoney(balance);

        projection.push({
            month,
            balance,
        });
    }

    const finalBalance = projection.at(-1).balance;

    const minimumBalance = Math.min(
        savings,
        ...projection.map((point) => point.balance)
    );

    return {
        monthlySurplus,
        finalBalance,
        minimumBalance,
        goalCost,
        purchaseMonth,
        months: input.months,
        staysNonNegative: minimumBalance >= 0,
        projection,
    };
}

export function compareScenarios(baselineInput, alternativeInput) {
    const baseline = calculateScenario(baselineInput);
    const alternative = calculateScenario(alternativeInput);

    return {
        baseline,
        alternative,
        finalBalanceDifference: roundMoney(
            alternative.finalBalance - baseline.finalBalance
        ),
        minimumBalanceDifference: roundMoney(
            alternative.minimumBalance - baseline.minimumBalance
        ),
        staysNonNegative: {
            baseline: baseline.staysNonNegative,
            alternative: alternative.staysNonNegative,
        },
    };
}

export function compareMultipleScenarios(baselineInput, alternatives) {
    if (!Array.isArray(alternatives) || alternatives.length === 0) {
        throw new Error("At least one alternative scenario is required");
    }

    if (alternatives.length > MAX_SCENARIOS - 1) {
        throw new Error(
            `You can compare up to ${MAX_SCENARIOS - 1} alternatives at a time`
        );
    }

    const baseline = calculateScenario(baselineInput);

    const comparisons = alternatives.map((alternative, index) => {
        if (
            !alternative ||
            typeof alternative !== "object" ||
            Array.isArray(alternative)
        ) {
            throw new Error(`Alternative scenario ${index + 1} is invalid`);
        }

        const result = calculateScenario(alternative);

        return {
            id: index + 1,
            name:
                typeof alternative.name === "string" &&
                    alternative.name.trim()
                    ? alternative.name.trim()
                    : `Alternative ${index + 1}`,
            result,
            finalBalanceDifference: roundMoney(
                result.finalBalance - baseline.finalBalance
            ),
            minimumBalanceDifference: roundMoney(
                result.minimumBalance - baseline.minimumBalance
            ),
            staysNonNegative: result.staysNonNegative,
        };
    });

    return {
        baseline,
        alternatives: comparisons,
        summary: {
            totalScenarios: comparisons.length + 1,
            baselineStaysNonNegative: baseline.staysNonNegative,
            bestFinalBalanceAlternative: comparisons.reduce(
                (best, current) =>
                    current.result.finalBalance >
                        best.result.finalBalance
                        ? current
                        : best
            ),
        },
    };
}
