const PaymentEvent = require("../models/PaymentEvent");

const BASELINE_FAILURE_RATE = 5;
const DEGRADATION_THRESHOLD = 20;

const detectDegradation = async ({ provider, method, windowMinutes = 10 }) => {
  const now = new Date();

  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const events = await PaymentEvent.find({
    provider,
    method,
    occurredAt: {
      $gte: windowStart,
      $lte: now,
    },
    eventType: {
      $in: ["payment.authorized", "payment.captured", "payment.failed"],
    },
  });

  const paymentMap = new Map();

  for (const event of events) {
    if (!paymentMap.has(event.paymentId)) {
      paymentMap.set(event.paymentId, []);
    }

    paymentMap.get(event.paymentId).push(event);
  }

  const totalPayments = paymentMap.size;

  let failedPayments = 0;
  let successfulPayments = 0;

  for (const paymentEvents of paymentMap.values()) {
    const hasCaptured = paymentEvents.some(
      (event) => event.eventType === "payment.captured",
    );

    const hasAuthorized = paymentEvents.some(
      (event) => event.eventType === "payment.authorized",
    );

    const hasFailed = paymentEvents.some(
      (event) => event.eventType === "payment.failed",
    );

    if (hasCaptured || hasAuthorized) {
      successfulPayments++;
    } else if (hasFailed) {
      failedPayments++;
    }
  }

  const failureRate =
    totalPayments === 0 ? 0 : (failedPayments / totalPayments) * 100;

  const degradationIncrease = failureRate - BASELINE_FAILURE_RATE;

  const degradationDetected =
    totalPayments > 0 && degradationIncrease >= DEGRADATION_THRESHOLD;

  return {
    provider,
    method,
    windowMinutes,
    totalPayments,
    successfulPayments,
    failedPayments,
    successRate: Number(
      (totalPayments === 0
        ? 0
        : (successfulPayments / totalPayments) * 100
      ).toFixed(2),
    ),
    failureRate: Number(failureRate.toFixed(2)),
    baselineFailureRate: BASELINE_FAILURE_RATE,
    degradationIncrease: Number(degradationIncrease.toFixed(2)),
    degradationDetected,
  };
};

module.exports = {
  detectDegradation,
};
