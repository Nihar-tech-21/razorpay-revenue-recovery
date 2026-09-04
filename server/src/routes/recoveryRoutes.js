const express = require("express");

const {
  getEligiblePayments,
  simulateRecovery,
} = require("../services/recoveryService");

const { monitorRecovery } = require("../services/recoveryMonitorService");

const Incident = require("../models/Incident");

const router = express.Router();

/*
 * --------------------------------------------------
 * GET ELIGIBLE PAYMENTS
 * --------------------------------------------------
 */

router.post("/eligible", async (req, res) => {
  try {
    const { incidentId, provider, method, limit = 50 } = req.body;

    if (!incidentId || !provider || !method) {
      return res.status(400).json({
        message: "incidentId, provider and method are required",
      });
    }

    const result = await getEligiblePayments({
      incidentId,
      provider,
      method,
      limit,
    });

    return res.json({
      message: "Eligible recovery payments retrieved",
      ...result,
    });
  } catch (error) {
    console.error("Eligible payment error:", error);

    return res.status(500).json({
      message: "Failed to get eligible payments",
      error: error.message,
    });
  }
});

/*
 * --------------------------------------------------
 * MONITOR PROVIDER RECOVERY
 * --------------------------------------------------
 */

router.post("/monitor/:incidentId", async (req, res) => {
  try {
    const { incidentId } = req.params;

    const incident = await Incident.findOne({
      incidentId,
      status: { $ne: "resolved" },
    });

    if (!incident) {
      return res.status(404).json({
        message: "Active incident not found",
      });
    }

    const healthOverride = req.body?.healthOverride || null;

    const monitorResult = await monitorRecovery(incident, healthOverride);

    // Persist the recovery state.
    incident.status = monitorResult.status;

    if (monitorResult.status === "recovery_active") {
      incident.recommendedAction = "resume_recovery";
    }

    await incident.save();

    return res.json({
      message: "Recovery monitoring completed",
      incidentId,
      monitorResult,
      incidentStatus: incident.status,
    });
  } catch (error) {
    console.error("Recovery monitoring error:", error);

    return res.status(500).json({
      message: "Failed to monitor recovery",
      error: error.message,
    });
  }
});

/*
 * --------------------------------------------------
 * RUN RECOVERY
 * --------------------------------------------------
 */

router.post("/run", async (req, res) => {
  try {
    const { incidentId, provider, method, limit = 50 } = req.body;

    if (!incidentId || !provider || !method) {
      return res.status(400).json({
        message: "incidentId, provider and method are required",
      });
    }

    const incident = await Incident.findOne({ incidentId });

    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    if (incident.status !== "recovery_active") {
      return res.status(409).json({
        message:
          "Recovery cannot run because the incident is not recovery_active.",
        incidentStatus: incident.status,
      });
    }

    const result = await simulateRecovery({
      incidentId,
      provider,
      method,
      limit,
    });

    // --------------------------------------------------
    // RESOLVE INCIDENT AFTER SUCCESSFUL RECOVERY
    // --------------------------------------------------

    if (result.attempted > 0 && result.failed === 0) {
      incident.status = "resolved";

      incident.resolution = `Recovery completed successfully. ${result.recovered} payments recovered and ₹${result.revenueRecovered} revenue recovered.`;

      incident.resolvedAt = new Date();

      await incident.save();
    }

    return res.json({
      message: "Recovery simulation completed",
      ...result,
      incidentStatus: incident.status,
    });
  } catch (error) {
    console.error("Recovery execution error:", error);

    return res.status(500).json({
      message: "Failed to execute recovery",
      error: error.message,
    });
  }
});

module.exports = router;
