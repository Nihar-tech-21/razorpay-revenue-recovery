const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
    },

    provider: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "detected",
        "investigating",
        "recovery_paused",
        "recovery_active",
        "resolved",
        "escalated",
      ],
      default: "detected",
    },

    incidentKey: {
      type: String,
      required: true,
    },

    failureRate: {
      type: Number,
      required: true,
    },

    baselineFailureRate: {
      type: Number,
      required: true,
    },

    affectedPayments: {
      type: Number,
      required: true,
    },

    revenueAtRisk: {
      type: Number,
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    diagnosis: {
      type: String,
      default: null,
    },

    aiConfidence: {
      type: Number,
      default: null,
    },

    recommendedAction: {
      type: String,
      default: null,
    },

    policyDecision: {
      type: String,
      default: null,
    },

    resolution: {
      type: String,
      default: null,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Incident = mongoose.model("Incident", incidentSchema);

module.exports = Incident;
