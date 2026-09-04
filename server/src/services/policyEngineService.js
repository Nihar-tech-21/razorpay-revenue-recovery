const evaluatePolicy = ({ incident, aiDiagnosis, providerHealth = null }) => {
  const { failureRate, baselineFailureRate } = incident;

  const { confidence, recommendedAction } = aiDiagnosis;

  // --------------------------------------------------
  // RULE 1: AI must have sufficient confidence
  // --------------------------------------------------

  if (confidence < 0.7) {
    return {
      decision: "escalate",
      reason: "AI confidence is below the required threshold.",
    };
  }

  // --------------------------------------------------
  // CURRENT PROVIDER HEALTH
  // --------------------------------------------------

  let currentFailureRate = failureRate;

  if (providerHealth && providerHealth.totalPayments > 0) {
    currentFailureRate = 100 - providerHealth.successRate;
  }

  const degradationIncrease = currentFailureRate - baselineFailureRate;

  // --------------------------------------------------
  // RULE 2: Pause recovery during systemic degradation
  // --------------------------------------------------

  const systemicDegradation =
    degradationIncrease >= 20 && currentFailureRate >= 25;

  if (recommendedAction === "pause_recovery" && systemicDegradation) {
    return {
      decision: "allow",
      reason:
        "Systemic payment degradation is confirmed. Recovery should be paused while the provider is unhealthy.",
    };
  }

  // --------------------------------------------------
  // RULE 3: Resume recovery only when provider is healthy
  // --------------------------------------------------

  if (recommendedAction === "resume_recovery") {
    if (!providerHealth) {
      return {
        decision: "block",
        reason:
          "Current provider health data is required before recovery can resume.",
      };
    }

    if (providerHealth.totalPayments === 0) {
      return {
        decision: "block",
        reason: "Insufficient payment data to confirm provider recovery.",
      };
    }

    if (providerHealth.status !== "healthy") {
      return {
        decision: "block",
        reason:
          "Provider is not healthy enough to safely resume automated recovery.",
      };
    }

    return {
      decision: "allow",
      reason:
        "Provider health has recovered sufficiently. Controlled recovery may resume.",
    };
  }

  // --------------------------------------------------
  // RULE 4: Monitoring is always allowed
  // --------------------------------------------------

  if (recommendedAction === "monitor") {
    return {
      decision: "allow",
      reason:
        "Monitoring is permitted while the payment system remains under observation.",
    };
  }

  // --------------------------------------------------
  // RULE 5: Escalation is always allowed
  // --------------------------------------------------

  if (recommendedAction === "escalate") {
    return {
      decision: "escalate",
      reason:
        "The AI recommendation requires human or operational intervention.",
    };
  }

  // --------------------------------------------------
  // DEFAULT SAFETY BEHAVIOR
  // --------------------------------------------------

  return {
    decision: "block",
    reason:
      "The recommended action does not satisfy the deterministic policy rules.",
  };
};

module.exports = {
  evaluatePolicy,
};
