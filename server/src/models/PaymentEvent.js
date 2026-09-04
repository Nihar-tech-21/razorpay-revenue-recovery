const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },

    paymentId: {
      type: String,
      required: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        "payment.created",
        "payment.authorized",
        "payment.captured",
        "payment.failed",
      ],
    },

    eventCategory: {
      type: String,
      required: true,
      enum: ["success", "failure", "neutral"],
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    provider: {
      type: String,
      required: true,
    },

    failure: {
      source: {
        type: String,
      },

      step: {
        type: String,
      },

      reason: {
        type: String,
      },

      description: {
        type: String,
      },
    },

    occurredAt: {
      type: Date,
      required: true,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const PaymentEvent = mongoose.model("PaymentEvent", paymentEventSchema);

module.exports = PaymentEvent;
