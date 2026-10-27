# FinPilot — AI-Powered Financial Decision Simulator

FinPilot is a full-stack financial planning and decision simulation web application that helps users explore the potential impact of major purchases and savings decisions before committing to them.

It combines deterministic financial calculations with AI-generated explanations to make financial trade-offs easier to understand.

## Features

- **Financial Simulation:** Project your balance over a selected time horizon using savings, income, expenses, and a planned purchase.
- **What-If Decision Lab:** Compare a baseline scenario with alternative decisions, including delaying a purchase or increasing monthly savings.
- **Cash-Flow Projection:** Visualize projected balances month by month.
- **Affordability Analysis:** Identify negative projected balances and compare minimum and final balances.
- **AI-Powered Insights:** Receive practical explanations of financial projections and trade-offs using the Gemini API.
- **Scenario Comparison:** Compare final balances and other financial outcomes across multiple alternatives.

## Technology Stack

**Frontend**
- React
- Vite
- Recharts
- Axios
- React Markdown

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Google Gemini API

## Project Structure

```text
FinPilot/
├── client/       # React frontend
├── server/       # Express backend
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB database
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Git-VivanX/FinPilot.git
cd FinPilot
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://127.0.0.1:5173
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
JWT_SECRET=your_jwt_secret
```

Replace the example values with your own configuration. Keep secrets private and never commit your `.env` file.

Start the backend:

```bash
npm run dev
```

The backend API runs on port 5000 by default.

### 3. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

> The frontend API base URL is currently configured for local development. Update it to your deployed backend URL when deploying the application.

## Testing

Run the backend finance-engine tests:

```bash
cd server
npm test
```

The current test suite covers purchase projections, unaffordable purchases, financial-plan comparisons, and invalid input handling.

## How It Works

1. The user supplies financial inputs and a planned purchase.
2. The backend's deterministic finance engine calculates monthly projections and affordability indicators.
3. The scenario can be compared against alternative decisions.
4. The Gemini API explains the calculated results and trade-offs using the supplied simulation data.

Financial calculations are performed by the application rather than delegated to the AI model.

## Limitations

- Projections depend on the assumptions and values supplied by the user.
- Actual financial outcomes may differ from simulated outcomes.
- AI-generated explanations may occasionally be unavailable or require verification.
- FinPilot is an educational decision-support tool, not a guarantee of future financial performance or professional financial advice.

## Author

**Git-VivanX**

GitHub: https://github.com/Git-VivanX
https://drive.google.com/file/d/129s8Xp_X5sk_w6L7Ow2jiVHv6MXgT3tH/view?usp=drive_link
