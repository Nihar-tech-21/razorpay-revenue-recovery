const mongoose = require("mongoose");

const recoveryAttemptSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
    },

    paymentId: {
      type: String,
      required: true,
    },

    provider: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["attempted", "recovered", "failed", "blocked"],
      required: true,
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },

    message: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const RecoveryAttempt = mongoose.model(
  "RecoveryAttempt",
  recoveryAttemptSchema,
);

module.exports = RecoveryAttempt;
