const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    customerId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    method: {
      type: String,
      required: true,
    },

    provider: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed"],
      default: "created",
    },

    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
