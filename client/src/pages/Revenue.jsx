import { useEffect, useState } from "react";
import { getRevenueRisk } from "../services/api";

const Revenue = () => {
  const [revenueRisk, setRevenueRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const provider = "Bank-Test";
  const method = "UPI";

  useEffect(() => {
    const loadRevenueRisk = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRevenueRisk({
          provider,
          method,
          windowMinutes: 10,
        });

        setRevenueRisk(data);
      } catch (err) {
        console.error("Revenue loading error:", err);
        setError(err.message || "Failed to load revenue data.");
      } finally {
        setLoading(false);
      }
    };

    loadRevenueRisk();
  }, []);

  const hasRecentData = (revenueRisk?.totalPayments ?? 0) > 0;
  const revenueAtRisk = revenueRisk?.revenueAtRisk ?? 0;
  const averageBasketSize = revenueRisk?.averageFailedAmount ?? 0;

  const exposureActive = hasRecentData && revenueAtRisk > 0;

  const exposureStatus = !hasRecentData
    ? "No Recent Data"
    : exposureActive
      ? "Exposure Active"
      : "No Active Exposure";

  const bankRouteSummary = !hasRecentData
    ? "No recent exposure data"
    : exposureActive
      ? `₹${revenueAtRisk.toLocaleString("en-IN")} at risk · 100% of current risk`
      : "₹0 at risk · No active exposure";

  const recoveryTarget = exposureActive
    ? `₹${revenueAtRisk.toLocaleString("en-IN")} (upon health resumption)`
    : hasRecentData
      ? "₹0 · Exposure cleared"
      : "No current recovery target";

  return (
    <div className="dashboard">
      <div className="page-heading">
        <p className="page-eyebrow">FINANCIAL TELEMETRY</p>

        <h2>Revenue Operations</h2>

        <p>
          Monitor processed volume, systemic exposure risk, and recovered
          transaction capital.
        </p>
      </div>

      {loading && (
        <div className="panel">
          <p>Loading revenue telemetry...</p>
        </div>
      )}

      {error && (
        <div className="panel">
          <p>Unable to load revenue data: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span>Monitored Volume (GMV)</span>

              <strong>
                ₹{(revenueRisk?.totalVolume ?? 0).toLocaleString("en-IN")}
              </strong>

              <small>
                Current {revenueRisk?.windowMinutes ?? 10} min window
              </small>
            </div>

            <div className="metric-card">
              <span>Revenue at Risk</span>

              <strong>₹{revenueAtRisk.toLocaleString("en-IN")}</strong>

              <small>
                {exposureActive
                  ? "Systemic degradation exposure"
                  : hasRecentData
                    ? "No active exposure"
                    : "No recent exposure data"}
              </small>
            </div>

            <div className="metric-card">
              <span>Recoverable Capital</span>

              <strong>₹{revenueAtRisk.toLocaleString("en-IN")}</strong>

              <small>
                {exposureActive
                  ? "Eligible recovery exposure"
                  : hasRecentData
                    ? "No current recovery exposure"
                    : "No recent recovery data"}
              </small>
            </div>

            <div className="metric-card">
              <span>Preserved Margin</span>

              <strong>100%</strong>

              <small>Zero wasteful retry fees</small>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-eyebrow">
                    FINANCIAL IMPACT BREAKDOWN
                  </span>

                  <h3>Exposure by Gateway / Bank</h3>
                </div>

                <span className="incident-badge">{exposureStatus}</span>
              </div>

              <div className="incident-summary">
                <div>
                  <span>Bank-Test · UPI Route</span>

                  <strong>{bankRouteSummary}</strong>
                </div>

                <div>
                  <span>HDFC Gateway Route</span>

                  <strong>₹0 at risk · Nominal operations</strong>
                </div>

                <div>
                  <span>ICICI Gateway Route</span>

                  <strong>₹0 at risk · Nominal operations</strong>
                </div>

                <div>
                  <span>Average Basket Size</span>

                  <strong>
                    {hasRecentData
                      ? `₹${averageBasketSize.toLocaleString(
                          "en-IN",
                        )} / transaction`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Estimated Recovery Target</span>

                  <strong>{recoveryTarget}</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-eyebrow">COST OPTIMIZATION</span>

                  <h3>Orchestration Savings</h3>
                </div>

                <span className="health-badge">Cost Guard Active</span>
              </div>

              <div className="health-placeholder">
                <p>Smart Pause Prevents Blind Retry Attempts</p>

                <span>
                  Recovery remains paused while systemic payment degradation is
                  detected, reducing unnecessary retry activity during provider
                  downtime.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Revenue;
