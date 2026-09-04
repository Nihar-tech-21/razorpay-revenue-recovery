import { useEffect, useState } from "react";
import { getDegradation, getRevenueRisk } from "../services/api";

const Dashboard = () => {
  const [degradation, setDegradation] = useState(null);
  const [revenueRisk, setRevenueRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const provider = "Bank-Test";
  const method = "UPI";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [degradationData, revenueData] = await Promise.all([
          getDegradation({
            provider,
            method,
            windowMinutes: 10,
          }),
          getRevenueRisk({
            provider,
            method,
            windowMinutes: 10,
          }),
        ]);

        setDegradation(degradationData);
        setRevenueRisk(revenueData);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const hasRecentData = (degradation?.totalPayments ?? 0) > 0;

  const failureRate = degradation?.failureRate ?? 0;
  const totalPayments = degradation?.totalPayments ?? 0;
  const failedPayments = degradation?.failedPayments ?? 0;
  const successRate = degradation?.successRate ?? 0;
  const revenueAtRisk = revenueRisk?.revenueAtRisk ?? 0;

  const providerStatus = !hasRecentData
    ? "No Recent Data"
    : degradation?.degradationDetected
      ? "Degraded"
      : "Healthy";

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Monitor payment health, revenue exposure and recovery activity.</p>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          Live Monitoring
        </div>
      </div>

      {loading && (
        <div className="panel">
          <p>Loading live payment data...</p>
        </div>
      )}

      {error && (
        <div className="panel">
          <p>Unable to load live data: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Provider Health</span>

              <strong
                className={
                  providerStatus === "Degraded"
                    ? "metric-value danger"
                    : providerStatus === "Healthy"
                      ? "metric-value success"
                      : "metric-value"
                }
              >
                {providerStatus}
              </strong>

              <small>
                {provider} · {method}
              </small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Failure Rate</span>

              <strong className="metric-value">
                {hasRecentData ? `${failureRate}%` : "—"}
              </strong>

              <small>
                {hasRecentData
                  ? `Baseline ${degradation?.baselineFailureRate ?? 5}%`
                  : "No payments in monitoring window"}
              </small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Affected Payments</span>

              <strong className="metric-value">
                {hasRecentData ? totalPayments : "—"}
              </strong>

              <small>
                {hasRecentData
                  ? `${failedPayments} failed payments`
                  : "No recent payment events"}
              </small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Revenue at Risk</span>

              <strong
                className={
                  revenueAtRisk > 0 ? "metric-value danger" : "metric-value"
                }
              >
                ₹{revenueAtRisk.toLocaleString("en-IN")}
              </strong>

              <small>
                {revenueAtRisk > 0 ? "Current exposure" : "No current exposure"}
              </small>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Payment Health</h2>
                  <p>Recent provider performance</p>
                </div>

                <span
                  className={`status-badge ${
                    providerStatus === "Degraded"
                      ? "danger"
                      : providerStatus === "Healthy"
                        ? "success"
                        : ""
                  }`}
                >
                  {providerStatus}
                </span>
              </div>

              <div className="incident-summary">
                <div>
                  <span>Provider</span>
                  <strong>{provider}</strong>
                </div>

                <div>
                  <span>Method</span>
                  <strong>{method}</strong>
                </div>

                <div>
                  <span>Success Rate</span>
                  <strong>{hasRecentData ? `${successRate}%` : "—"}</strong>
                </div>

                <div>
                  <span>Failure Rate</span>
                  <strong>{hasRecentData ? `${failureRate}%` : "—"}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Revenue Exposure</h2>
                  <p>Estimated recoverable revenue</p>
                </div>
              </div>

              <div className="incident-summary">
                <div>
                  <span>Failed Revenue</span>
                  <strong>
                    ₹{(revenueRisk?.failedRevenue ?? 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Revenue at Risk</span>
                  <strong>₹{revenueAtRisk.toLocaleString("en-IN")}</strong>
                </div>

                <div>
                  <span>Excess Failures</span>
                  <strong>{revenueRisk?.excessFailureCount ?? 0}</strong>
                </div>

                <div>
                  <span>Window</span>
                  <strong>10 min</strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
