# Revenue Recovery

AI-powered payment failure detection and controlled revenue recovery system.

Built for the **Razorpay AI Revenue Recovery Buildathon**.

## 🚨 Problem

Payment failures do not always mean that a payment should simply be retried.

When a payment provider or payment method starts degrading, blindly retrying failed payments can:

- Increase duplicate or unnecessary payment attempts
- Waste recovery opportunities
- Put additional load on an unhealthy provider
- Recover the wrong payments at the wrong time
- Make it difficult to understand why a recovery decision was made

Revenue recovery therefore needs to combine **failure detection, revenue-risk analysis, intelligent diagnosis, and controlled execution**.

## 💡 Solution

Revenue Recovery analyzes payment events to detect systemic degradation and estimate the revenue at risk.

When an incident is detected:

1. Payment failures are analyzed.
2. Revenue at risk is calculated.
3. Failure patterns are investigated.
4. A Gemini AI agent diagnoses the incident.
5. A deterministic policy engine validates the AI recommendation.
6. Recovery is paused when the provider is unhealthy.
7. Provider health is monitored.
8. Recovery becomes active only when the provider is healthy.
9. Eligible failed payments are recovered through a controlled simulation.
10. The complete decision and recovery history is stored for auditability.

### Core Principle

> **AI provides intelligence; deterministic policy provides control.**

The AI agent never directly executes financial actions.

## 🏗️ Architecture

                    Payment Events
                         │
                         ▼
              ┌─────────────────────┐
              │   Detection Layer   │
              │                     │
              │ • Degradation       │
              │ • Revenue Risk      │
              │ • Failure Patterns  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Incident Engine   │
              │                     │
              │ • Incident creation │
              │ • Severity          │
              │ • Audit state       │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │      AI Agent       │
              │      Gemini         │
              │                     │
              │ • Provider Health   │
              │ • Failure Patterns  │
              │ • Diagnosis         │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Policy Engine     │
              │                     │
              │ • Allow             │
              │ • Block             │
              │ • Escalate          │
              └──────────┬──────────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
       Recovery Guarded     Recovery Active
                │                 │
                │                 ▼
                │       ┌─────────────────┐
                │       │ Recovery Engine │
                │       └────────┬────────┘
                │                │
                │                ▼
                │             Recovered
                │
                ▼
             Escalated


            Frontend
            React
            │
            ▼
            Node.js / Express API
            │
            ▼
            MongoDB

Three-Layer Design

The system is intentionally separated into three major layers:

1. Intelligence

The AI agent investigates the incident using provider health and failure-pattern data.

2. Control

The deterministic policy engine validates whether the recommended action is safe and allowed.

3. Execution

The recovery engine performs only policy-approved recovery actions.

## 🤖 AI Agent

The system uses a Gemini-powered AI agent to investigate payment incidents and recommend an appropriate operational action.

The agent has access to two controlled tools:

- `getProviderHealth` — checks the current health of the affected provider and payment method.
- `getFailurePatterns` — analyzes recent failure reasons and patterns.

The agent follows an investigation-first approach:

Incident
│
▼
Investigate Provider Health
│
▼
Investigate Failure Patterns
│
▼
Diagnose Incident
│
▼
Recommend Action

Possible recommendations are:

> pause_recovery
> resume_recovery
> monitor
> escalate

The AI agent does not directly execute recovery actions or financial transactions.

🛡️ Deterministic Safety Layer

AI recommendations are passed through a deterministic policy engine before any recovery action is allowed.

The policy engine evaluates factors such as:

AI confidence
Current failure rate
Baseline failure rate
Degradation increase
Provider health
Availability of payment data
Systemic degradation conditions

For example:

AI Recommendation
│
▼
┌──────────────────────┐
│ Policy Engine │
│ │
│ Confidence >= 0.7? │
│ Provider healthy? │
│ Degradation severe? │
│ Payment data valid? │
└──────────┬───────────┘
│
▼
Allowed / Blocked
│
▼
Recovery

This creates a clear separation between AI reasoning and financial control.

The AI can recommend an action, but deterministic business rules decide whether that action is allowed.

## 💰 Revenue at Risk

The system estimates revenue at risk from payment failures within a rolling time window.

The calculation:

1. Groups events by payment.
2. Identifies failed payments.
3. Compares the observed failure rate with the expected baseline.
4. Calculates the excess failed payment value.
5. Uses that excess value as the estimated revenue at risk.

The system uses a **5% baseline failure rate** for the current simulation.

This helps prioritize incidents based on their potential financial impact rather than treating every failure equally.

## 🔒 Recovery Guardrails

Recovery is intentionally conservative.

Key safeguards include:

- Recovery is paused when provider health is degraded or insufficient.
- Recovery can become active only after the provider is healthy.
- Low-confidence AI decisions are escalated instead of executed.
- Systemic degradation can block automated recovery.
- Each payment has a maximum retry limit.
- Recovery is executed only for eligible failed payments.
- Recovery actions are recorded as `RecoveryAttempt` records.
- The recovery engine currently operates as a simulation and does not charge real customers.

These controls prevent the system from blindly retrying payments during an active provider incident.

## 📋 Audit Trail

Important decisions and state changes are persisted in MongoDB.

The system maintains records for:

- Payment events
- Incidents
- AI diagnosis
- Policy decisions
- Recovery attempts
- Payment state transitions

This provides visibility into **what happened, why a decision was made, and what recovery action was taken**.

## 🧰 Tech Stack

### Frontend

- React
- React Router
- Vite
- CSS

### Backend

- Node.js
- Express.js
- REST APIs

### Database

- MongoDB
- Mongoose

### AI

- Google Gemini
- `@google/genai`

### Architecture

- MERN stack
- Service-oriented backend structure
- Deterministic policy layer
- Event-driven payment failure analysis

## 📁 Project Structure

````text
revenue-recovery/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx
│   │   │       └── Topbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Incidents.jsx
│   │   │   ├── Recovery.jsx
│   │   │   ├── Revenue.jsx
│   │   │   └── System.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── .env.example
│   └── package.json
│
└── README.md

## 🚀 Running Locally

### Prerequisites

Make sure you have:

- Node.js 20+
- MongoDB
- A Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Nihar-tech-21/razorpay-revenue-recovery.git
cd razorpay-revenue-recovery

### 2. Install backend dependencies
cd server
npm install

Create a .env file:

MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000

Start the backend:

npm run dev
### 3. Install frontend dependencies

Open another terminal:

cd client
npm install

Create a .env file:

VITE_API_URL=http://localhost:5000/api

Start the frontend:

npm run dev

The application will be available at the local Vite URL shown in the terminal.

Never commit .env files or API keys to the repository. Use the provided .env.example files as templates.

## 🎬 Demo Scenario

The project includes deterministic demo scenarios to demonstrate the complete recovery lifecycle.

A typical scenario follows:

```text
Healthy Provider
      │
      ▼
Payment Failures Increase
      │
      ▼
Degradation Detected
      │
      ▼
Incident Created
      │
      ▼
AI Diagnosis
      │
      ▼
Recovery Paused
      │
      ▼
Provider Recovers
      │
      ▼
Recovery Activated
      │
      ▼
Eligible Payments Recovered
      │
      ▼
Incident Resolved

The backend includes test-data and demo utilities for reproducing these scenarios without relying on real customer transactions.

⚠️ Simulation Disclaimer

This project is a buildathon prototype and simulation.

The recovery engine does not perform real payment retries or charge real customers.

Payment recovery is simulated by:

> Selecting eligible failed payments
> Creating a recovery attempt
> Simulating a successful recovery
> Updating the payment state
> Recording the corresponding payment event

A production implementation would require integration with actual payment providers along with appropriate authentication, idempotency, consent, reconciliation, monitoring, and compliance controls.

## 🧠 Design Philosophy

Revenue recovery should not be treated as a simple retry mechanism.

The system is designed around four principles:

1. **Detect before acting**
   Understand whether failures are isolated or systemic.

2. **Measure financial impact**
   Prioritize incidents using revenue at risk.

3. **Use AI for reasoning, not authority**
   Let the AI investigate and recommend, while deterministic policies control execution.

4. **Recover only when safe**
   Stop automated recovery during provider degradation and resume only after health is restored.

This approach aims to make revenue recovery **intelligent, controlled, explainable, and auditable**.

## 👩‍💻 Author

**Niharika Dhaka**

B.Tech Computer Science Engineering

Built as part of the **Razorpay AI Revenue Recovery Buildathon**.
````
