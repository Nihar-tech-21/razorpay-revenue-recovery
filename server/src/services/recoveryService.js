const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const Incident = require("../models/Incident");
const RecoveryAttempt = require("../models/RecoveryAttempt");

const MAX_RETRY_ATTEMPTS = 2;

const getEligiblePayments = async ({
  incidentId,
  provider,
  method,
  limit = 50,
}) => {
  const incident = await Incident.findOne({ incidentId });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const failedEvents = await PaymentEvent.find({
    provider,
    method,
    eventType: "payment.failed",
  })
    .sort({ occurredAt: -1 })
    .limit(limit);

  const eligiblePayments = [];
  const processedPaymentIds = new Set();

  for (const event of failedEvents) {
    const paymentId = event.paymentId;

    // Avoid processing the same payment multiple times
    // if it has more than one failed event.
    if (processedPaymentIds.has(paymentId)) {
      continue;
    }

    processedPaymentIds.add(paymentId);

    // --------------------------------------------------
    // STEP 1: Get the actual Payment
    // --------------------------------------------------

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      continue;
    }

    // The payment must still be failed.
    if (payment.status !== "failed") {
      continue;
    }

    // Respect the payment's overall retry count.
    if (payment.retryCount >= MAX_RETRY_ATTEMPTS) {
      continue;
    }

    // --------------------------------------------------
    // STEP 2: Check whether this payment already recovered
    // --------------------------------------------------

    const paymentEvents = await PaymentEvent.find({
      paymentId,
    });

    const alreadyRecovered = paymentEvents.some(
      (paymentEvent) =>
        paymentEvent.eventType === "payment.captured" ||
        paymentEvent.eventType === "payment.authorized",
    );

    if (alreadyRecovered) {
      continue;
    }

    // --------------------------------------------------
    // STEP 3: Check recovery attempts for this incident
    // --------------------------------------------------

    const previousAttempts = await RecoveryAttempt.countDocuments({
      incidentId,
      paymentId,
    });

    if (previousAttempts >= MAX_RETRY_ATTEMPTS) {
      continue;
    }

    eligiblePayments.push({
      paymentId: payment.paymentId,
      provider: payment.provider,
      method: payment.method,
      amount: payment.amount,
      retryCount: payment.retryCount,
      recoveryAttempts: previousAttempts,
      nextAttemptNumber: previousAttempts + 1,
      failedAt: event.occurredAt,
      failureReason: event.failure?.reason || null,
      failureSource: event.failure?.source || null,
      failureStep: event.failure?.step || null,
    });
  }

  return {
    incidentId,
    provider,
    method,
    eligiblePayments,
    count: eligiblePayments.length,
  };
};

const simulateRecovery = async ({
  incidentId,
  provider,
  method,
  limit = 50,
}) => {
  // --------------------------------------------------
  // STEP 1: Verify the incident
  // --------------------------------------------------

  const incident = await Incident.findOne({ incidentId });

  if (!incident) {
    throw new Error("Incident not found");
  }

  // Recovery must NEVER run while the incident is paused.
  if (incident.status !== "recovery_active") {
    throw new Error(
      `Recovery cannot run while incident status is "${incident.status}". Incident must be recovery_active.`,
    );
  }

  // --------------------------------------------------
  // STEP 2: Find eligible payments
  // --------------------------------------------------

  const eligibility = await getEligiblePayments({
    incidentId,
    provider,
    method,
    limit,
  });

  let attempted = 0;
  let recovered = 0;
  let failed = 0;
  let revenueRecovered = 0;

  const attempts = [];

  // --------------------------------------------------
  // STEP 3: Simulate recovery
  // --------------------------------------------------

  for (const payment of eligibility.eligiblePayments) {
    attempted++;

    /*
     * Simulation only.
     *
     * We are NOT calling a real payment provider.
     *
     * For the buildathon demo, eligible payments are
     * considered successfully recovered.
     */

    const recoverySucceeded = true;

    const status = recoverySucceeded ? "recovered" : "failed";

    if (recoverySucceeded) {
      recovered++;
      revenueRecovered += payment.amount;
    } else {
      failed++;
    }

    // --------------------------------------------------
    // STEP 4: Record the recovery attempt
    // --------------------------------------------------

    const recoveryAttempt = await RecoveryAttempt.create({
      incidentId,
      paymentId: payment.paymentId,
      provider,
      method,
      attemptNumber: payment.nextAttemptNumber,
      amount: payment.amount,
      status,
      message: recoverySucceeded
        ? "Payment successfully recovered in simulation."
        : "Recovery attempt failed in simulation.",
    });

    // --------------------------------------------------
    // STEP 5: Update the actual Payment
    // --------------------------------------------------

    if (recoverySucceeded) {
      const actualPayment = await Payment.findOne({
        paymentId: payment.paymentId,
      });

      if (actualPayment) {
        actualPayment.status = "captured";
        actualPayment.retryCount += 1;

        await actualPayment.save();

        // --------------------------------------------------
        // STEP 6: Record the successful payment event
        // --------------------------------------------------

        await PaymentEvent.create({
          eventId: `evt-recovery-${Date.now()}-${payment.paymentId}`,
          paymentId: payment.paymentId,
          eventType: "payment.captured",
          eventCategory: "success",
          amount: actualPayment.amount,
          method: actualPayment.method,
          provider: actualPayment.provider,
          occurredAt: new Date(),
        });
      }
    }

    attempts.push({
      paymentId: recoveryAttempt.paymentId,
      amount: recoveryAttempt.amount,
      attemptNumber: recoveryAttempt.attemptNumber,
      status: recoveryAttempt.status,
      message: recoveryAttempt.message,
      attemptedAt: recoveryAttempt.attemptedAt,
    });
  }

  return {
    incidentId,
    provider,
    method,
    attempted,
    recovered,
    failed,
    revenueRecovered: Number(revenueRecovered.toFixed(2)),
    attempts,
  };
};

module.exports = {
  getEligiblePayments,
  simulateRecovery,
};
