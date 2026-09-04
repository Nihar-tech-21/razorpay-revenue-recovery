const express = require("express");

const Incident = require("../models/Incident");

const { diagnoseIncident } = require("../services/agentService");

const { evaluatePolicy } = require("../services/policyEngineService");

const {
  applyRecoveryDecision,
} = require("../services/recoveryControllerService");

const { getProviderHealth } = require("../services/providerHealthService");

const router = express.Router();

router.post("/diagnose/:incidentId", async (req, res) => {
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

    // --------------------------------------------------
    // STEP 1: AI INVESTIGATION + RECOMMENDATION
    // --------------------------------------------------

    const aiDiagnosis = await diagnoseIncident(incident);

    // --------------------------------------------------
    // STEP 2: PERSIST AI DIAGNOSIS
    // --------------------------------------------------

    incident.diagnosis = aiDiagnosis.diagnosis;
    incident.aiConfidence = aiDiagnosis.confidence;
    incident.recommendedAction = aiDiagnosis.recommendedAction;

    const providerHealth = await getProviderHealth({
      provider: incident.provider,
      method: incident.method,
      windowMinutes: 10,
    });

    // --------------------------------------------------
    // STEP 3: DETERMINISTIC POLICY ENGINE
    // --------------------------------------------------

    const policyResult = evaluatePolicy({
      incident,
      aiDiagnosis,
      providerHealth,
    });

    incident.policyDecision = policyResult.decision;

    // --------------------------------------------------
    // STEP 4: RECOVERY CONTROLLER
    // --------------------------------------------------

    const recoveryResult = applyRecoveryDecision({
      incident,
      policyResult,
    });

    // --------------------------------------------------
    // STEP 5: PERSIST RECOVERY DECISION
    // --------------------------------------------------

    incident.status = recoveryResult.status;

    await incident.save();

    // --------------------------------------------------
    // STEP 6: RETURN COMPLETE RESULT
    // --------------------------------------------------

    return res.json({
      message:
        "AI diagnosis, policy evaluation, and recovery decision completed",

      incidentId,

      aiResponse: aiDiagnosis,

      providerHealth,

      policyDecision: policyResult,

      recoveryDecision: recoveryResult,

      incidentStatus: incident.status,
    });
  } catch (error) {
    console.error("Agent diagnosis error:", error);

    return res.status(500).json({
      message: "Failed to diagnose incident",
      error: error.message,
    });
  }
});

module.exports = router;
