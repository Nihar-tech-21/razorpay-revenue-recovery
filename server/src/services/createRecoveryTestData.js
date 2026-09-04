const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const RecoveryAttempt = require("../models/RecoveryAttempt");

require("dotenv").config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const provider = "Bank-Test";
    const method = "UPI";

    // --------------------------------------------------
    // CLEAR ALL OLD TEST RECOVERY DATA
    // --------------------------------------------------

    await PaymentEvent.deleteMany({
      provider,
      method,
      paymentId: { $regex: /^TEST-PAYMENT-/ },
    });

    await RecoveryAttempt.deleteMany({
      provider,
      method,
      paymentId: { $regex: /^TEST-PAYMENT-/ },
    });

    await Payment.deleteMany({
      provider,
      method,
      paymentId: { $regex: /^TEST-PAYMENT-/ },
    });

    console.log("Old recovery test data cleared.");

    // --------------------------------------------------
    // CREATE FRESH FAILED PAYMENTS
    // --------------------------------------------------

    const payments = [];
    const events = [];

    for (let i = 1; i <= 10; i++) {
      const paymentId = `TEST-PAYMENT-${i}`;

      payments.push({
        paymentId,
        orderId: `TEST-ORDER-${i}`,
        customerId: `TEST-CUSTOMER-${i}`,
        amount: 2500,
        currency: "INR",
        method,
        provider,
        status: "failed",
        retryCount: 0,
      });

      events.push({
        eventId: `TEST-RECOVERY-EVENT-${i}`,
        paymentId,
        eventType: "payment.failed",
        eventCategory: "failure",
        amount: 2500,
        method,
        provider,
        failure: {
          source: "bank",
          step: "authorization",
          reason: "temporary_bank_failure",
          description: "Temporary bank-side authorization failure.",
        },
        occurredAt: new Date(),
      });
    }

    await Payment.insertMany(payments);
    await PaymentEvent.insertMany(events);

    console.log("Recovery test data created successfully.");
    console.log(`Failed payments created: ${payments.length}`);
    console.log(`Total test revenue: ₹${payments.length * 2500}`);
  } catch (error) {
    console.error("Failed to create recovery test data:", error);
  } finally {
    await mongoose.connection.close();
  }
};

runTest();
