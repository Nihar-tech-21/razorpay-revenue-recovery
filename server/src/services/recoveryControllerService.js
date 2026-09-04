const applyRecoveryDecision = ({ incident, policyResult }) => {
  if (policyResult.decision !== "allow") {
    return {
      action: "none",
      status: incident.status,
      message: "Recovery action was not allowed by policy.",
    };
  }

  if (incident.recommendedAction === "pause_recovery") {
    return {
      action: "pause_recovery",
      status: "recovery_paused",
      message:
        "Recovery paused because systemic payment degradation was confirmed.",
    };
  }

  if (incident.recommendedAction === "monitor") {
    return {
      action: "monitor",
      status: "investigating",
      message:
        "Incident remains under monitoring while provider health is evaluated.",
    };
  }

  if (incident.recommendedAction === "resume_recovery") {
    return {
      action: "resume_recovery",
      status: "recovery_active",
      message: "Recovery resumed after policy approval.",
    };
  }

  if (incident.recommendedAction === "escalate") {
    return {
      action: "escalate",
      status: "escalated",
      message:
        "Incident escalated because the policy allows operational escalation.",
    };
  }

  return {
    action: "none",
    status: incident.status,
    message: "No recognized recovery action.",
  };
};

module.exports = {
  applyRecoveryDecision,
};
