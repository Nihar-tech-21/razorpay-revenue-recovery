const express = require("express");

const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const eventData = req.body;

    const {
      eventId,
      eventType,
      paymentId,
      amount,
      method,
      provider,
      failure,
      occurredAt,
      orderId,
      customerId,
    } = eventData;

    const existingEvent = await PaymentEvent.findOne({ eventId });

    if (existingEvent) {
      return res.status(200).json({
        message: "Duplicate event ignored",
        eventId,
      });
    }

    const paymentEvent = await PaymentEvent.create({
      eventId,
      paymentId,
      eventType,
      eventCategory: getEventCategory(eventType),
      amount,
      method,
      provider,
      failure,
      occurredAt: occurredAt || new Date(),
    });

    let payment = await Payment.findOne({ paymentId });

    if (!payment) {
      payment = await Payment.create({
        paymentId,
        orderId,
        customerId,
        amount,
        method,
        provider,
        status: getPaymentStatus(eventType),
      });
    } else {
      payment.status = getPaymentStatus(eventType);
      await payment.save();
    }

    return res.status(201).json({
      message: "Event processed successfully",
      payment,
      event: paymentEvent,
    });
  } catch (error) {
    console.error("Event processing error:", error);

    return res.status(500).json({
      message: "Failed to process event",
      error: error.message,
    });
  }
});

function getPaymentStatus(eventType) {
  switch (eventType) {
    case "payment.created":
      return "created";

    case "payment.authorized":
      return "authorized";

    case "payment.captured":
      return "captured";

    case "payment.failed":
      return "failed";

    default:
      return "created";
  }
}

function getEventCategory(eventType) {
  switch (eventType) {
    case "payment.authorized":
    case "payment.captured":
      return "success";

    case "payment.failed":
      return "failure";

    case "payment.created":
      return "neutral";

    default:
      return "neutral";
  }
}

module.exports = router;
