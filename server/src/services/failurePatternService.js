const PaymentEvent = require("../models/PaymentEvent");

const getFailurePatterns = async ({ provider, method, windowMinutes = 10 }) => {
  const now = new Date();

  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const failures = await PaymentEvent.find({
    provider,
    method,
    eventType: "payment.failed",
    occurredAt: {
      $gte: windowStart,
      $lte: now,
    },
  });

  const reasonCounts = {};
  const sourceCounts = {};
  const stepCounts = {};

  for (const event of failures) {
    const reason = event.failure?.reason || "unknown";

    const source = event.failure?.source || "unknown";

    const step = event.failure?.step || "unknown";

    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;

    sourceCounts[source] = (sourceCounts[source] || 0) + 1;

    stepCounts[step] = (stepCounts[step] || 0) + 1;
  }

  return {
    provider,
    method,
    totalFailures: failures.length,
    reasons: reasonCounts,
    sources: sourceCounts,
    steps: stepCounts,
  };
};

module.exports = {
  getFailurePatterns,
};
