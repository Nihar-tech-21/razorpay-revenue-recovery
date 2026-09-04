const PaymentEvent = require("../models/PaymentEvent");

const BASELINE_FAILURE_RATE = 5;

const calculateRevenueAtRisk = async ({
  provider,
  method,
  windowMinutes = 10,
}) => {
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

  let totalPayments = 0;
  let failedPayments = 0;
  let failedRevenue = 0;
  let totalVolume = 0;

  for (const paymentEvents of paymentMap.values()) {
    totalPayments++;

    const capturedEvent = paymentEvents.find(
      (event) => event.eventType === "payment.captured",
    );

    const authorizedEvent = paymentEvents.find(
      (event) => event.eventType === "payment.authorized",
    );

    const failedEvent = paymentEvents.find(
      (event) => event.eventType === "payment.failed",
    );

    /*
     * Count each payment's value only once.
     * Prefer the most successful/latest payment state.
     */
    if (capturedEvent) {
      totalVolume += capturedEvent.amount;
    } else if (authorizedEvent) {
      totalVolume += authorizedEvent.amount;
    } else if (failedEvent) {
      totalVolume += failedEvent.amount;
    }

    if (!capturedEvent && !authorizedEvent && failedEvent) {
      failedPayments++;
      failedRevenue += failedEvent.amount;
    }
  }

  const expectedFailureCount = totalPayments * (BASELINE_FAILURE_RATE / 100);

  const excessFailureCount = Math.max(0, failedPayments - expectedFailureCount);

  const averageFailedAmount =
    failedPayments === 0 ? 0 : failedRevenue / failedPayments;

  const revenueAtRisk = excessFailureCount * averageFailedAmount;

  return {
    provider,
    method,
    windowMinutes,

    totalPayments,

    totalVolume: Number(totalVolume.toFixed(2)),

    failedPayments,

    failedRevenue: Number(failedRevenue.toFixed(2)),

    baselineFailureRate: BASELINE_FAILURE_RATE,

    expectedFailureCount: Number(expectedFailureCount.toFixed(2)),

    excessFailureCount: Number(excessFailureCount.toFixed(2)),

    averageFailedAmount: Number(averageFailedAmount.toFixed(2)),

    revenueAtRisk: Number(revenueAtRisk.toFixed(2)),
  };
};

module.exports = {
  calculateRevenueAtRisk,
};
