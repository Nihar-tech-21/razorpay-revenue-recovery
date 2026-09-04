const PaymentEvent = require("../models/PaymentEvent");

const getProviderHealth = async ({ provider, method, windowMinutes = 10 }) => {
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

  // --------------------------------------------------
  // Group events by payment
  // --------------------------------------------------

  const paymentMap = new Map();

  for (const event of events) {
    if (!paymentMap.has(event.paymentId)) {
      paymentMap.set(event.paymentId, []);
    }

    paymentMap.get(event.paymentId).push(event);
  }

  let successfulPayments = 0;
  let failedPayments = 0;

  // --------------------------------------------------
  // Determine final state of each payment
  // --------------------------------------------------

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

  const totalPayments = successfulPayments + failedPayments;

  // --------------------------------------------------
  // No data
  // --------------------------------------------------

  if (totalPayments === 0) {
    return {
      provider,
      method,
      windowMinutes,
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      successRate: null,
      status: "insufficient_data",
    };
  }

  // --------------------------------------------------
  // Calculate health
  // --------------------------------------------------

  const successRate = (successfulPayments / totalPayments) * 100;

  let status;

  if (successRate < 70) {
    status = "degraded";
  } else if (successRate < 90) {
    status = "recovering";
  } else {
    status = "healthy";
  }

  return {
    provider,
    method,
    windowMinutes,
    totalPayments,
    successfulPayments,
    failedPayments,
    successRate: Number(successRate.toFixed(2)),
    status,
  };
};

module.exports = {
  getProviderHealth,
};
