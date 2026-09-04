const { getProviderHealth } = require("./providerHealthService");

const monitorRecovery = async (incident, healthOverride = null) => {
  // --------------------------------------------------
  // STEP 1: Get latest provider health
  // --------------------------------------------------

  const health =
    healthOverride ||
    (await getProviderHealth({
      provider: incident.provider,
      method: incident.method,
      windowMinutes: 10,
    }));

  // --------------------------------------------------
  // STEP 2: No data = cannot prove recovery
  // --------------------------------------------------

  if (health.totalPayments === 0) {
    return {
      status: "recovery_paused",
      action: "remain_paused",
      providerHealth: health,
      reason:
        "Insufficient payment data to confirm provider recovery. Automated recovery remains paused.",
    };
  }

  // --------------------------------------------------
  // STEP 3: Provider must explicitly be healthy
  // --------------------------------------------------

  if (health.status !== "healthy") {
    return {
      status: "recovery_paused",
      action: "remain_paused",
      providerHealth: health,
      reason:
        "Provider has not recovered sufficiently. Automated recovery remains paused.",
    };
  }

  // --------------------------------------------------
  // STEP 4: Provider is healthy
  // --------------------------------------------------

  return {
    status: "recovery_active",
    action: "resume_recovery",
    providerHealth: health,
    reason:
      "Provider health has recovered sufficiently. Controlled recovery may resume.",
  };
};

module.exports = {
  monitorRecovery,
};
