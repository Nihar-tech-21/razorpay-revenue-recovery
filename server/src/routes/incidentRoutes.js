const express = require("express");

const { detectDegradation } = require("../services/degradationService");

const { calculateRevenueAtRisk } = require("../services/revenueRiskService");

const { createOrUpdateIncident } = require("../services/incidentService");

const router = express.Router();

router.post("/detect", async (req, res) => {
  try {
    const { provider, method, windowMinutes = 10 } = req.body;

    if (!provider || !method) {
      return res.status(400).json({
        message: "provider and method are required",
      });
    }

    const degradation = await detectDegradation({
      provider,
      method,
      windowMinutes,
    });

    if (!degradation.degradationDetected) {
      return res.json({
        message: "No degradation detected",
        degradation,
      });
    }

    const revenueRisk = await calculateRevenueAtRisk({
      provider,
      method,
      windowMinutes,
    });

    const incidentResult = await createOrUpdateIncident({
      provider,
      method,
      failureRate: degradation.failureRate,
      baselineFailureRate: degradation.baselineFailureRate,
      affectedPayments: degradation.totalPayments,
      revenueAtRisk: revenueRisk.revenueAtRisk,
    });

    return res.status(incidentResult.created ? 201 : 200).json({
      message: incidentResult.created
        ? "Degradation incident created"
        : "Existing degradation incident updated",

      incident: incidentResult.incident,

      degradation,

      revenueRisk,
    });
  } catch (error) {
    console.error("Incident detection error:", error);

    return res.status(500).json({
      message: "Failed to create incident",
      error: error.message,
    });
  }
});

module.exports = router;
