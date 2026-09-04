const mongoose = require("mongoose");
require("dotenv").config();

const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const Incident = require("../models/Incident");
const RecoveryAttempt = require("../models/RecoveryAttempt");

const scenario = process.argv[2];

const validScenarios = ["healthy", "degradation", "escalation"];

if (!validScenarios.includes(scenario)) {
  console.log("\nUsage:");
  console.log("node src/services/runDemoScenario.js healthy");
  console.log("node src/services/runDemoScenario.js degradation");
  console.log("node src/services/runDemoScenario.js escalation\n");
  process.exit(1);
}

const cleanDemoData = async () => {
  await Payment.deleteMany({
    paymentId: { $regex: /^DEMO-/ },
  });

  await PaymentEvent.deleteMany({
    paymentId: { $regex: /^DEMO-/ },
  });

  await Incident.deleteMany({
    incidentId: { $regex: /^DEMO-/ },
  });

  await RecoveryAttempt.deleteMany({
    paymentId: { $regex: /^DEMO-/ },
  });

  console.log("Previous demo data cleared.");
};

const createHealthyScenario = async () => {
  const provider = "Bank-Test";
  const method = "UPI";

  const payments = [];
  const events = [];

  for (let i = 1; i <= 50; i++) {
    const paymentId = `DEMO-HEALTHY-${i}`;
    const amount = 1000 + ((i * 750) % 4001);

    const isFailed = i > 47;

    payments.push({
      paymentId,
      orderId: `DEMO-ORDER-${i}`,
      customerId: `DEMO-CUSTOMER-${i}`,
      amount,
      currency: "INR",
      method,
      provider,
      status: isFailed ? "failed" : "captured",
      retryCount: 0,
    });

    events.push({
      eventId: `DEMO-HEALTHY-EVENT-${i}`,
      paymentId,
      eventType: isFailed ? "payment.failed" : "payment.captured",
      eventCategory: isFailed ? "failure" : "success",
      amount,
      method,
      provider,
      ...(isFailed && {
        failure: {
          source: "bank",
          step: "authorization",
          reason: "temporary_failure",
          description: "Occasional payment failure.",
        },
      }),
      occurredAt: new Date(),
    });
  }

  await Payment.insertMany(payments);
  await PaymentEvent.insertMany(events);

  console.log("Healthy scenario created.");
  console.log("Payments: 50");
  console.log("Successful: 47");
  console.log("Failed: 3");
};

const createDegradationScenario = async () => {
  const provider = "Bank-Test";
  const method = "UPI";

  const payments = [];
  const events = [];

  // 40 older normal payments
  for (let i = 1; i <= 40; i++) {
    const paymentId = `DEMO-DEGRADATION-${i}`;
    const amount = 1500 + ((i * 650) % 3501);

    payments.push({
      paymentId,
      orderId: `DEMO-DEG-ORDER-${i}`,
      customerId: `DEMO-DEG-CUSTOMER-${i}`,
      amount,
      currency: "INR",
      method,
      provider,
      status: "captured",
      retryCount: 0,
    });

    events.push({
      eventId: `DEMO-DEGRADATION-EVENT-${i}`,
      paymentId,
      eventType: "payment.captured",
      eventCategory: "success",
      amount,
      method,
      provider,
      occurredAt: new Date(Date.now() - 20 * 60 * 1000),
    });
  }

  // 10 recent failed payments
  for (let i = 41; i <= 50; i++) {
    const paymentId = `DEMO-DEGRADATION-${i}`;
    const amount = 2000 + ((i * 900) % 5001);

    payments.push({
      paymentId,
      orderId: `DEMO-DEG-ORDER-${i}`,
      customerId: `DEMO-DEG-CUSTOMER-${i}`,
      amount,
      currency: "INR",
      method,
      provider,
      status: "failed",
      retryCount: 0,
    });

    events.push({
      eventId: `DEMO-DEGRADATION-EVENT-${i}`,
      paymentId,
      eventType: "payment.failed",
      eventCategory: "failure",
      amount,
      method,
      provider,
      failure: {
        source: "bank",
        step: "authorization",
        reason: "temporary_bank_failure",
        description: "Temporary bank-side failure affecting UPI payments.",
      },
      occurredAt: new Date(),
    });
  }

  await Payment.insertMany(payments);
  await PaymentEvent.insertMany(events);

  console.log("Degradation scenario created.");
  console.log("Total payments: 50");
  console.log("Older successful payments: 40");
  console.log("Recent failed payments: 10");
  console.log("Recent failure rate: 100%");
};

const createEscalationScenario = async () => {
  const provider = "Bank-Test";
  const method = "UPI";

  const failurePatterns = [
    ["bank", "timeout"],
    ["gateway", "unknown_error"],
    ["authorization", "insufficient_funds"],
    ["processing", "duplicate_request"],
    ["bank", "unknown_error"],
    ["gateway", "timeout"],
    ["authorization", "invalid_request"],
    ["processing", "unknown_error"],
    ["bank", "connection_error"],
    ["gateway", "configuration_error"],
  ];

  const payments = [];
  const events = [];

  for (let i = 1; i <= 10; i++) {
    const paymentId = `DEMO-ESCALATION-${i}`;
    const amount = 1800 + ((i * 875) % 4201);

    const [source, reason] = failurePatterns[(i - 1) % failurePatterns.length];

    payments.push({
      paymentId,
      orderId: `DEMO-ESC-ORDER-${i}`,
      customerId: `DEMO-ESC-CUSTOMER-${i}`,
      amount,
      currency: "INR",
      method,
      provider,
      status: "failed",
      retryCount: 0,
    });

    events.push({
      eventId: `DEMO-ESCALATION-EVENT-${i}`,
      paymentId,
      eventType: "payment.failed",
      eventCategory: "failure",
      amount,
      method,
      provider,
      failure: {
        source,
        step: source === "bank" ? "authorization" : source,
        reason,
        description: "Ambiguous payment failure requiring investigation.",
      },
      occurredAt: new Date(),
    });
  }

  await Payment.insertMany(payments);
  await PaymentEvent.insertMany(events);

  console.log("Escalation scenario created.");
  console.log("Total failed payments: 10");
  console.log("Failure patterns: mixed and ambiguous");
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log(`\nRunning demo scenario: ${scenario}`);

    await cleanDemoData();

    if (scenario === "healthy") {
      await createHealthyScenario();
    }

    if (scenario === "degradation") {
      await createDegradationScenario();
    }

    if (scenario === "escalation") {
      await createEscalationScenario();
    }

    console.log(`Demo scenario "${scenario}" is ready.`);
  } catch (error) {
    console.error("Demo scenario failed:", error);
  } finally {
    await mongoose.connection.close();
  }
};

run();
