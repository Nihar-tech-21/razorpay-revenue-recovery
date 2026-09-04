const crypto = require("crypto");

const Incident = require("../models/Incident");

const getSeverity = (revenueAtRisk) => {
  if (revenueAtRisk > 200000) {
    return "critical";
  }

  if (revenueAtRisk > 50000) {
    return "high";
  }

  if (revenueAtRisk > 10000) {
    return "medium";
  }

  return "low";
};

const createOrUpdateIncident = async ({
  provider,
  method,
  failureRate,
  baselineFailureRate,
  affectedPayments,
  revenueAtRisk,
}) => {
  const incidentKey = `${provider}:${method}`;

  const existingIncident = await Incident.findOne({
    incidentKey,
    status: {
      $ne: "resolved",
    },
  });

  const severity = getSeverity(revenueAtRisk);

  if (existingIncident) {
    existingIncident.failureRate = failureRate;
    existingIncident.baselineFailureRate = baselineFailureRate;
    existingIncident.affectedPayments = affectedPayments;
    existingIncident.revenueAtRisk = revenueAtRisk;
    existingIncident.severity = severity;
    existingIncident.updatedAt = new Date();

    await existingIncident.save();

    return {
      incident: existingIncident,
      created: false,
    };
  }

  const incidentId = `INC-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

  const incident = await Incident.create({
    incidentId,
    incidentKey,
    provider,
    method,
    status: "detected",
    failureRate,
    baselineFailureRate,
    affectedPayments,
    revenueAtRisk,
    severity,
  });

  return {
    incident,
    created: true,
  };
};

module.exports = {
  createOrUpdateIncident,
  getSeverity,
};
