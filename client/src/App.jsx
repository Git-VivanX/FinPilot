
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import api from "./services/api";

const formatMoney = (value) =>
    `₹${Number(value).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;

function toPayload(formData) {
    return {
        name: formData.name.trim(),
        savings: Number(formData.savings),
        monthlyIncome: Number(formData.monthlyIncome),
        monthlyExpenses: Number(formData.monthlyExpenses),
        goalCost: Number(formData.goalCost),
        months: Number(formData.months),
        purchaseMonth: Number(formData.purchaseMonth),
        monthlyAdjustment: Number(formData.monthlyAdjustment ?? 0),
    };
}

export default function App() {
    const [showDashboard, setShowDashboard] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        savings: "",
        monthlyIncome: "",
        monthlyExpenses: "",
        goalCost: "",
        months: "",
        purchaseMonth: "",
    });

    const [simulationResult, setSimulationResult] = useState(null);
    const [aiExplanation, setAiExplanation] = useState("");
    const [baselineInput, setBaselineInput] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [alternatives, setAlternatives] = useState([
        {
            name: "Buy later",
            purchaseMonth: "",
            monthlyAdjustment: 0,
        },
        {
            name: "Save extra each month",
            purchaseMonth: "",
            monthlyAdjustment: 3000,
        },
    ]);

    const [comparison, setComparison] = useState(null);
    const [comparisonError, setComparisonError] = useState("");
    const [isComparing, setIsComparing] = useState(false);

    const updateFormField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrorMessage("");
        setComparison(null);
        setComparisonError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSimulationResult(null);
        setAiExplanation("");
        setBaselineInput(null);
        setComparison(null);
        setComparisonError("");
        setErrorMessage("");
        setIsLoading(true);

        if (
            !formData.name.trim() ||
            formData.savings === "" ||
            formData.monthlyIncome === "" ||
            formData.monthlyExpenses === "" ||
            formData.goalCost === "" ||
            formData.months === "" ||
            formData.purchaseMonth === ""
        ) {
            setErrorMessage("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        if (
            !Number.isInteger(Number(formData.months)) ||
            Number(formData.months) < 1 ||
            Number(formData.months) > 120 ||
            !Number.isInteger(Number(formData.purchaseMonth)) ||
            Number(formData.purchaseMonth) < 1 ||
            Number(formData.purchaseMonth) > Number(formData.months)
        ) {
            setErrorMessage(
                "Enter a valid projection period (1–120 months) and a purchase month within that period."
            );
            setIsLoading(false);
            return;
        }

        const amountFields = [
            "savings",
            "monthlyIncome",
            "monthlyExpenses",
            "goalCost",
        ];

        const invalidAmount = amountFields.some((field) => {
            const value = Number(formData[field]);

            return (
                !Number.isFinite(value) ||
                value < 0 ||
                value > 1_000_000_000
            );
        });

        if (invalidAmount) {
            setErrorMessage(
                "Financial amounts must be valid numbers between ₹0 and ₹1,000,000,000."
            );
            setIsLoading(false);
            return;
        }

        try {
            const payload = toPayload(formData);
            const response = await api.post("/scenarios", payload);

            setSimulationResult(response.data.result);
            setAiExplanation(response.data.explanation || "");
            setBaselineInput(payload);

            setAlternatives([
                {
                    name: "Buy later",
                    purchaseMonth: String(
                        Math.min(
                            payload.months,
                            payload.purchaseMonth + 2
                        )
                    ),
                    monthlyAdjustment: 0,
                },
                {
                    name: "Save extra each month",
                    purchaseMonth: String(payload.purchaseMonth),
                    monthlyAdjustment: 3000,
                },
            ]);
        } catch (error) {
            console.error(
                "Failed to create scenario:",
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.message ||
                    "Failed to create scenario. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const updateAlternative = (index, field, value) => {
        setAlternatives((previous) =>
            previous.map((alternative, currentIndex) =>
                currentIndex === index
                    ? { ...alternative, [field]: value }
                    : alternative
            )
        );

        setComparison(null);
        setComparisonError("");
    };

    const handleCompare = async () => {
        if (!baselineInput) {
            setComparisonError(
                "Run a financial simulation before comparing alternatives."
            );
            return;
        }

        setComparison(null);
        setComparisonError("");

        const validAlternatives = alternatives.every((alternative) => {
            const month = Number(alternative.purchaseMonth);
            const adjustment = Number(alternative.monthlyAdjustment);

            return (
                alternative.name.trim() !== "" &&
                Number.isInteger(month) &&
                month >= 1 &&
                month <= baselineInput.months &&
                Number.isFinite(adjustment) &&
                Math.abs(adjustment) <= 1_000_000_000
            );
        });

        if (!validAlternatives) {
            setComparisonError(
                "Give each alternative a name, a valid purchase month, and a valid monthly savings adjustment."
            );
            return;
        }

        setIsComparing(true);

        try {
            const payload = {
                baseline: baselineInput,
                alternatives: alternatives.map((alternative) => ({
                    ...baselineInput,
                    name: alternative.name.trim(),
                    purchaseMonth: Number(alternative.purchaseMonth),
                    monthlyAdjustment: Number(
                        alternative.monthlyAdjustment
                    ),
                })),
            };

            const response = await api.post(
                "/scenarios/compare",
                payload
            );

            setComparison(response.data.comparison);
        } catch (error) {
            console.error(
                "What-if comparison failed:",
                error.response?.data || error.message
            );

            setComparisonError(
                error.response?.data?.message ||
                    "Unable to compare scenarios. Please try again."
            );
        } finally {
            setIsComparing(false);
        }
    };

    const comparisonChartData = comparison
        ? Array.from(
              { length: baselineInput.months },
              (_, index) => {
                  const month = index + 1;
                  const point = { month: `Month ${month}` };

                  const baselinePoint =
                      comparison.baseline.projection.find(
                          (item) => item.month === month
                      );

                  point.Baseline = baselinePoint?.balance ?? null;

                  comparison.alternatives.forEach((alternative) => {
                      const alternativePoint =
                          alternative.result.projection.find(
                              (item) => item.month === month
                          );

                      point[alternative.name] =
                          alternativePoint?.balance ?? null;
                  });

                  return point;
              }
          )
        : [];

    if (!showDashboard) {
        return (
            <main className="welcome">
                <span className="brand">FINPILOT / AI FINANCE</span>

                <h1>
                    Your money.
                    <br />
                    Your next move.
                </h1>

                <p>
                    Explore financial decisions, simulate future cash flow,
                    and understand the trade-offs before you commit.
                </p>

                <button onClick={() => setShowDashboard(true)}>
                    Explore FinPilot
                </button>
            </main>
        );
    }

    return (
        <main className="dashboard">
            <span className="brand">FINPILOT / AI FINANCE</span>

            <h1>Your financial future starts here.</h1>

            <p>
                Simulate a purchase, explore alternative decisions, and
                compare your possible financial futures.
            </p>

            {errorMessage && (
                <div className="error-message" role="alert">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label>
                    Scenario name
                    <input
                        type="text"
                        name="name"
                        placeholder="Save for a Laptop"
                        value={formData.name}
                        onChange={(e) =>
                            updateFormField("name", e.target.value)
                        }
                    />
                </label>

                <label>
                    Current savings (₹)
                    <input
                        type="number"
                        name="savings"
                        min="0"
                        max="1000000000"
                        placeholder="20000"
                        value={formData.savings}
                        onChange={(e) =>
                            updateFormField("savings", e.target.value)
                        }
                    />
                </label>

                <label>
                    Monthly income (₹)
                    <input
                        type="number"
                        name="monthlyIncome"
                        min="0"
                        max="1000000000"
                        placeholder="15000"
                        value={formData.monthlyIncome}
                        onChange={(e) =>
                            updateFormField(
                                "monthlyIncome",
                                e.target.value
                            )
                        }
                    />
                </label>

                <label>
                    Monthly expenses (₹)
                    <input
                        type="number"
                        name="monthlyExpenses"
                        min="0"
                        max="1000000000"
                        placeholder="10000"
                        value={formData.monthlyExpenses}
                        onChange={(e) =>
                            updateFormField(
                                "monthlyExpenses",
                                e.target.value
                            )
                        }
                    />
                </label>

                <label>
                    Goal cost (₹)
                    <input
                        type="number"
                        name="goalCost"
                        min="0"
                        max="1000000000"
                        placeholder="30000"
                        value={formData.goalCost}
                        onChange={(e) =>
                            updateFormField("goalCost", e.target.value)
                        }
                    />
                </label>

                <label>
                    Projection period (months)
                    <input
                        type="number"
                        name="months"
                        min="1"
                        max="120"
                        placeholder="6"
                        value={formData.months}
                        onChange={(e) =>
                            updateFormField("months", e.target.value)
                        }
                    />
                </label>

                <label>
                    Purchase month
                    <input
                        type="number"
                        name="purchaseMonth"
                        min="1"
                        max="120"
                        placeholder="6"
                        value={formData.purchaseMonth}
                        onChange={(e) =>
                            updateFormField(
                                "purchaseMonth",
                                e.target.value
                            )
                        }
                    />
                </label>

                <button type="submit" disabled={isLoading}>
                    {isLoading
                        ? "Simulating..."
                        : "Simulate my decision"}
                </button>
            </form>

            {simulationResult && (
                <section className="results">
                    <h2>Your Simulation Results</h2>

                    {aiExplanation && (
                        <div className="ai-explanation">
                            <h3>🤖 FinPilot AI Insights</h3>
                            <div className="ai-explanation-content">
                                <ReactMarkdown>
                                    {aiExplanation}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    <p>
                        Monthly surplus:{" "}
                        {formatMoney(simulationResult.monthlySurplus)}
                    </p>

                    <p>
                        Final projected balance:{" "}
                        {formatMoney(simulationResult.finalBalance)}
                    </p>

                    <p>
                        Minimum projected balance:{" "}
                        {formatMoney(simulationResult.minimumBalance)}
                    </p>

                    <p>
                        {simulationResult.staysNonNegative
                            ? "Your balance stays non-negative throughout the projection."
                            : "Warning: Your balance falls below zero during the projection."}
                    </p>

                    <div className="chart-container">
                        <h3>Projected Balance Over Time</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={simulationResult.projection}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#29384b"
                                />
                                <XAxis
                                    dataKey="month"
                                    stroke="#a8b3c7"
                                    tickFormatter={(month) =>
                                        `Month ${month}`
                                    }
                                />
                                <YAxis
                                    stroke="#a8b3c7"
                                    tickFormatter={formatMoney}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#111b2d",
                                        border: "1px solid #29384b",
                                        borderRadius: "10px",
                                        color: "#f8fafc",
                                    }}
                                    labelFormatter={(month) =>
                                        `Month ${month}`
                                    }
                                    formatter={(value) => [
                                        formatMoney(value),
                                        "Projected balance",
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="balance"
                                    name="Projected balance"
                                    stroke="#5eead4"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: "#5eead4" }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <h3>Month-by-month projection</h3>

                    <ul>
                        {simulationResult.projection.map((item) => (
                            <li key={item.month}>
                                Month {item.month}:{" "}
                                {formatMoney(item.balance)}
                            </li>
                        ))}
                    </ul>

                    <section className="what-if-lab">
                        <span className="brand">
                            FINPILOT / DECISION LAB
                        </span>

                        <h2>What-If Decision Lab</h2>

                        <p>
                            Change your purchase timing or monthly savings
                            to compare alternative financial futures.
                        </p>

                        <div className="what-if-baseline">
                            <h3>Baseline: {baselineInput.name}</h3>

                            <p>
                                Purchase in Month{" "}
                                {baselineInput.purchaseMonth}
                            </p>

                            <p>
                                Final balance:{" "}
                                <strong>
                                    {formatMoney(
                                        comparison?.baseline.finalBalance ??
                                            simulationResult.finalBalance
                                    )}
                                </strong>
                            </p>
                        </div>

                        <div className="what-if-alternatives">
                            {alternatives.map((alternative, index) => (
                                <div
                                    className="what-if-card"
                                    key={index}
                                >
                                    <h3>
                                        Alternative {index + 1}
                                    </h3>

                                    <label>
                                        Scenario name
                                        <input
                                            type="text"
                                            value={alternative.name}
                                            onChange={(e) =>
                                                updateAlternative(
                                                    index,
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Purchase month
                                        <input
                                            type="number"
                                            min="1"
                                            max={baselineInput.months}
                                            value={
                                                alternative.purchaseMonth
                                            }
                                            onChange={(e) =>
                                                updateAlternative(
                                                    index,
                                                    "purchaseMonth",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Extra monthly savings (₹)
                                        <input
                                            type="number"
                                            min="-1000000000"
                                            max="1000000000"
                                            value={
                                                alternative.monthlyAdjustment
                                            }
                                            onChange={(e) =>
                                                updateAlternative(
                                                    index,
                                                    "monthlyAdjustment",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <p className="what-if-hint">
                                        Positive values add to monthly
                                        savings. Negative values reduce
                                        them.
                                    </p>
                                </div>
                            ))}
                        </div>

                        {comparisonError && (
                            <div
                                className="error-message"
                                role="alert"
                            >
                                {comparisonError}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleCompare}
                            disabled={isComparing}
                        >
                            {isComparing
                                ? "Comparing scenarios..."
                                : "Compare financial futures"}
                        </button>

                        {comparison && (
                            <div className="comparison-results">
                                <h3>Comparison Results</h3>

                                <p>
                                    Compared{" "}
                                    {comparison.summary.totalScenarios}{" "}
                                    scenarios using the same baseline
                                    financial inputs.
                                </p>

                                <div className="comparison-grid">
                                    <div className="comparison-card">
                                        <h4>Baseline</h4>
                                        <p>Final balance</p>
                                        <strong>
                                            {formatMoney(
                                                comparison.baseline
                                                    .finalBalance
                                            )}
                                        </strong>
                                        <p>Minimum balance</p>
                                        <strong>
                                            {formatMoney(
                                                comparison.baseline
                                                    .minimumBalance
                                            )}
                                        </strong>
                                        <p>
                                            {comparison.baseline
                                                .staysNonNegative
                                                ? "✓ Balance stays non-negative"
                                                : "⚠ Balance falls below zero"}
                                        </p>
                                    </div>

                                    {comparison.alternatives.map(
                                        (alternative) => (
                                            <div
                                                className="comparison-card"
                                                key={alternative.id}
                                            >
                                                <h4>
                                                    {alternative.name}
                                                </h4>

                                                <p>Final balance</p>
                                                <strong>
                                                    {formatMoney(
                                                        alternative.result
                                                            .finalBalance
                                                    )}
                                                </strong>

                                                <p>Minimum balance</p>
                                                <strong>
                                                    {formatMoney(
                                                        alternative.result
                                                            .minimumBalance
                                                    )}
                                                </strong>

                                                <p>
                                                    Final balance change
                                                </p>
                                                <strong>
                                                    {alternative.finalBalanceDifference >
                                                    0
                                                        ? "+"
                                                        : ""}
                                                    {formatMoney(
                                                        alternative.finalBalanceDifference
                                                    )}
                                                </strong>

                                                <p>
                                                    {alternative.staysNonNegative
                                                        ? "✓ Balance stays non-negative"
                                                        : "⚠ Balance falls below zero"}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="chart-container">
                                    <h3>Compare Projected Balances</h3>

                                    <ResponsiveContainer
                                        width="100%"
                                        height={350}
                                    >
                                        <LineChart
                                            data={comparisonChartData}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#29384b"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#a8b3c7"
                                            />
                                            <YAxis
                                                stroke="#a8b3c7"
                                                tickFormatter={formatMoney}
                                                width={100}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "#111b2d",
                                                    border:
                                                        "1px solid #29384b",
                                                    borderRadius: "10px",
                                                    color: "#f8fafc",
                                                }}
                                                formatter={(value) =>
                                                    formatMoney(value)
                                                }
                                            />
                                            <Legend />

                                            <Line
                                                type="monotone"
                                                dataKey="Baseline"
                                                stroke="#5eead4"
                                                strokeWidth={3}
                                                dot={false}
                                            />

                                            {comparison.alternatives.map(
                                                (alternative, index) => (
                                                    <Line
                                                        key={alternative.id}
                                                        type="monotone"
                                                        dataKey={
                                                            alternative.name
                                                        }
                                                        stroke={
                                                            [
                                                                "#60a5fa",
                                                                "#fbbf24",
                                                                "#c084fc",
                                                                "#fb7185",
                                                                "#a3e635",
                                                            ][index % 5]
                                                        }
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                )
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="what-if-recommendation">
                                    <h3>Decision insight</h3>

                                    {comparison.summary
                                        .bestFinalBalanceAlternative
                                        .result.finalBalance >
                                    comparison.baseline.finalBalance ? (
                                        <p>
                                            <strong>
                                                {
                                                    comparison.summary
                                                        .bestFinalBalanceAlternative
                                                        .name
                                                }
                                            </strong>{" "}
                                            has the highest final balance
                                            among the alternatives, ending{" "}
                                            {formatMoney(
                                                comparison.summary
                                                    .bestFinalBalanceAlternative
                                                    .result.finalBalance -
                                                    comparison.baseline
                                                        .finalBalance
                                            )}{" "}
                                            above the baseline. Check its
                                            minimum balance and purchase
                                            timing before deciding.
                                        </p>
                                    ) : (
                                        <p>
                                            None of the alternatives ends
                                            with a higher balance than the
                                            baseline. Compare their minimum
                                            balances and timing to understand
                                            the trade-offs.
                                        </p>
                                    )}
                                </div>

                                <p className="what-if-disclaimer">
                                    These are projections based on the
                                    supplied assumptions, not guarantees
                                    of future financial outcomes.
                                </p>
                            </div>
                        )}
                    </section>
                </section>
            )}
        </main>
    );
}
