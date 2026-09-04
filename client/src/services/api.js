const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

export const getDegradation = async ({
  provider,
  method,
  windowMinutes = 10,
}) => {
  const params = new URLSearchParams({
    provider,
    method,
    windowMinutes: String(windowMinutes),
  });

  return apiRequest(`/health/degradation?${params.toString()}`);
};

export const getRevenueRisk = async ({
  provider,
  method,
  windowMinutes = 10,
}) => {
  const params = new URLSearchParams({
    provider,
    method,
    windowMinutes: String(windowMinutes),
  });

  return apiRequest(`/revenue/risk?${params.toString()}`);
};

export const detectIncident = async ({
  provider,
  method,
  windowMinutes = 10,
}) => {
  return apiRequest("/incidents/detect", {
    method: "POST",
    body: JSON.stringify({
      provider,
      method,
      windowMinutes,
    }),
  });
};

export const diagnoseIncident = async (incidentId) => {
  return apiRequest(`/agent/diagnose/${incidentId}`, {
    method: "POST",
  });
};

export const monitorRecovery = async (incidentId, healthOverride = null) => {
  return apiRequest(`/recovery/monitor/${incidentId}`, {
    method: "POST",
    body: JSON.stringify(healthOverride ? { healthOverride } : {}),
  });
};

export const runRecovery = async ({
  incidentId,
  provider,
  method,
  limit = 10,
}) => {
  return apiRequest("/recovery/run", {
    method: "POST",
    body: JSON.stringify({
      incidentId,
      provider,
      method,
      limit,
    }),
  });
};
