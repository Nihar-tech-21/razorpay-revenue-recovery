import { useEffect, useState } from "react";
import { getDegradation } from "../services/api";

const System = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const provider = "Bank-Test";
  const method = "UPI";

  useEffect(() => {
    const loadHealth = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDegradation({
          provider,
          method,
          windowMinutes: 10,
        });

        setHealth(data);
      } catch (err) {
        console.error("System health loading error:", err);
        setError(err.message || "Failed to load system health.");
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
  }, []);

  const hasRecentData = (health?.totalPayments ?? 0) > 0;

  const successRate = health?.successRate;
  const failureRate = health?.failureRate;

  const providerStatus = !hasRecentData
    ? "No Recent Data"
    : health?.degradationDetected
      ? "Degraded"
      : "Healthy";

  const displaySuccessRate = hasRecentData ? `${successRate}%` : "—";

  const displayFailureRate = hasRecentData ? `${failureRate}%` : "—";

  return (
    <div className="dashboard">
      <div className="page-heading">
        <p className="page-eyebrow">INFRASTRUCTURE</p>

        <h2>System Health</h2>

        <p>
          Telemetry metrics, gateway connections, and provider diagnostic health
          probes.
        </p>
      </div>

      {loading && (
        <div className="panel">
          <p>Loading provider health...</p>
        </div>
      )}

      {error && (
        <div className="panel">
          <p>Unable to load system health: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="metrics-grid">
          <div className="metric-card">
            <span>Connected Providers</span>
            <strong>1</strong>
            <small>Bank-Test</small>
          </div>

          <div className="metric-card">
            <span>Overall Health</span>

            <strong
              className={
                providerStatus === "Healthy"
                  ? "success-text"
                  : providerStatus === "Degraded"
                    ? "danger-text"
                    : ""
              }
            >
              {providerStatus}
            </strong>

            <small>
              {hasRecentData
                ? `${failureRate}% failure rate`
                : "No payments in monitoring window"}
            </small>
          </div>

          <div className="metric-card">
            <span>Success Rate</span>

            <strong>{displaySuccessRate}</strong>

            <small>
              {hasRecentData
                ? `${health.totalPayments} payments monitored`
                : "No recent payment events"}
            </small>
          </div>

          <div className="metric-card">
            <span>Detection Engine</span>

            <strong className="success-text">Active</strong>

            <small>Provider health monitoring running</small>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">GATEWAYS</span>

              <h3>Provider Telemetry</h3>
            </div>

            <span className="health-badge">Live Checks</span>
          </div>

          <div className="incident-summary">
            <div>
              <span>Provider</span>
              <strong>{provider}</strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>{method}</strong>
            </div>

            <div>
              <span>Success Rate</span>
              <strong>{displaySuccessRate}</strong>
            </div>

            <div>
              <span>Failure Rate</span>
              <strong>{displayFailureRate}</strong>
            </div>

            <div>
              <span>Provider Status</span>

              <strong
                className={
                  providerStatus === "Healthy"
                    ? "success-text"
                    : providerStatus === "Degraded"
                      ? "danger-text"
                      : ""
                }
              >
                {providerStatus}
              </strong>
            </div>

            <div>
              <span>Monitored Payments</span>

              <strong>{health?.totalPayments ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">DIAGNOSTICS</span>

              <h3>Health Probes</h3>
            </div>

            <span className="incident-badge">10 Min Window</span>
          </div>

          <div className="health-placeholder">
            <p>Provider Health Monitoring Active</p>

            <span>Evaluating payment events over the last 10 minutes.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;
