import { useState } from "react";
import { apiRequest, monitorRecovery, runRecovery } from "../services/api";

const Recovery = () => {
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [monitorResult, setMonitorResult] = useState(null);
  const [recovering, setRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);

  const provider = "Bank-Test";
  const method = "UPI";
  const providerSuccessRate = 100;

  const runRecoveryCheck = async () => {
    try {
      setLoading(true);
      setMessage("");
      setRecoveryResult(null);
      setMonitorResult(null);

      const incidentData = await apiRequest("/incidents/detect", {
        method: "POST",
        body: JSON.stringify({
          provider,
          method,
          windowMinutes: 10,
        }),
      });

      if (!incidentData.incident?.incidentId) {
        setResult(null);
        setMessage(
          "No active payment degradation detected. There are currently no payments eligible for recovery.",
        );
        return;
      }

      const realIncidentId = incidentData.incident.incidentId;

      const eligibleData = await apiRequest("/recovery/eligible", {
        method: "POST",
        body: JSON.stringify({
          incidentId: realIncidentId,
          provider,
          method,
          limit: 10,
        }),
      });

      setResult({
        incident: incidentData.incident,
        eligible: eligibleData,
      });

      setMessage("Recovery eligibility check completed.");
    } catch (err) {
      console.error("Recovery error:", err);
      setMessage(err.message || "Recovery check failed.");
    } finally {
      setLoading(false);
    }
  };

  const simulateProviderRecovery = async () => {
    if (!result?.incident?.incidentId) {
      setMessage("Run the recovery eligibility check first.");
      return;
    }

    try {
      setMonitoring(true);
      setMessage("");

      const data = await monitorRecovery(result.incident.incidentId, {
        provider,
        method,
        totalPayments: 10,
        successfulPayments: 10,
        failedPayments: 0,
        successRate: 100,
        status: "healthy",
      });

      const updatedIncident = {
        ...result.incident,
        status: data.incidentStatus,
        recommendedAction:
          data.monitorResult?.action === "resume_recovery"
            ? "resume_recovery"
            : result.incident.recommendedAction,
      };

      const eligibleData = await apiRequest("/recovery/eligible", {
        method: "POST",
        body: JSON.stringify({
          incidentId: result.incident.incidentId,
          provider,
          method,
          limit: 10,
        }),
      });

      setMonitorResult(data);

      setResult({
        incident: updatedIncident,
        eligible: eligibleData,
      });

      setMessage(
        data.incidentStatus === "recovery_active"
          ? "Provider recovered. Controlled recovery is now active and eligible payments were refreshed."
          : "Provider health checked. Recovery remains guarded.",
      );
    } catch (err) {
      console.error("Recovery monitoring error:", err);

      setMessage(err.message || "Unable to monitor provider recovery.");
    } finally {
      setMonitoring(false);
    }
  };

  const executeRecovery = async () => {
    if (!result?.incident?.incidentId) {
      setMessage("No active incident found.");
      return;
    }

    try {
      setRecovering(true);
      setMessage("");

      const data = await runRecovery({
        incidentId: result.incident.incidentId,
        provider,
        method,
        limit: 10,
      });

      setRecoveryResult(data);

      setResult((previous) => ({
        ...previous,
        incident: {
          ...previous.incident,
          status: data.incidentStatus,
        },
        eligible: {
          ...previous.eligible,
          eligiblePayments: [],
          count: 0,
        },
      }));

      setMessage(
        `Recovery completed. ${data.recovered} payments recovered and ₹${data.revenueRecovered.toLocaleString(
          "en-IN",
        )} revenue recovered.`,
      );
    } catch (err) {
      console.error("Recovery execution error:", err);

      setMessage(err.message || "Controlled recovery failed.");
    } finally {
      setRecovering(false);
    }
  };

  const eligiblePayments =
    result?.eligible?.eligiblePayments || result?.eligible?.payments || [];

  const incidentStatus =
    monitorResult?.incidentStatus || result?.incident?.status || "detected";

  const recoveryCompleted = recoveryResult?.incidentStatus === "resolved";

  const providerRecovered =
    incidentStatus === "recovery_active" || recoveryCompleted;

  const recoveryStatus = recoveryCompleted
    ? "Completed"
    : incidentStatus === "recovery_active"
      ? "Recovery Active"
      : "Guarded";

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Recovery</h1>
          <p>
            Control and monitor safe payment recovery after provider recovery.
          </p>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          Recovery Engine
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Recovery Status</span>

          <strong
            className={`metric-value ${
              providerRecovered ? "success" : "danger"
            }`}
          >
            {recoveryStatus}
          </strong>

          <small>
            {recoveryCompleted
              ? "Recovery operation finished successfully"
              : "Policy controlled"}
          </small>
        </div>

        <div className="metric-card">
          <span className="metric-label">Eligible Payments</span>

          <strong className="metric-value">{eligiblePayments.length}</strong>

          <small>
            {recoveryCompleted
              ? "All eligible payments processed"
              : "Ready for controlled recovery"}
          </small>
        </div>

        <div className="metric-card">
          <span className="metric-label">Retry Limit</span>

          <strong className="metric-value">2</strong>

          <small>Maximum recovery attempts</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">Safety Policy</span>

          <strong className="metric-value success">Active</strong>

          <small>Deterministic policy guard</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recovery Pipeline</h2>

              <p>
                Payments move through recovery only after system health is
                confirmed.
              </p>
            </div>
          </div>

          <div className="incident-summary">
            <div>
              <span>1. Failure Detection</span>
              <strong className="success-text">Complete</strong>
            </div>

            <div>
              <span>2. AI Diagnosis</span>
              <strong className="success-text">Complete</strong>
            </div>

            <div>
              <span>3. Provider Health</span>
              <strong className={providerRecovered ? "success-text" : ""}>
                {providerRecovered ? "Recovered" : "Required"}
              </strong>
            </div>

            <div>
              <span>4. Controlled Recovery</span>

              <strong
                className={
                  recoveryCompleted
                    ? "success-text"
                    : providerRecovered
                      ? "success-text"
                      : ""
                }
              >
                {recoveryCompleted
                  ? "Completed"
                  : providerRecovered
                    ? "Active"
                    : "Guarded"}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recovery Controls</h2>

              <p>Check eligibility and monitor provider recovery.</p>
            </div>
          </div>

          <button
            className="recovery-button"
            onClick={runRecoveryCheck}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Recovery Eligibility"}
          </button>

          <button
            className="recovery-button"
            onClick={simulateProviderRecovery}
            disabled={
              monitoring || !result?.incident?.incidentId || recoveryCompleted
            }
          >
            {monitoring ? "Checking Provider..." : "Simulate Provider Recovery"}
          </button>

          <button
            className="recovery-button"
            onClick={executeRecovery}
            disabled={
              recovering ||
              !providerRecovered ||
              recoveryCompleted ||
              eligiblePayments.length === 0
            }
          >
            {recovering ? "Recovering Payments..." : "Run Controlled Recovery"}
          </button>

          {message && <p className="recovery-message">{message}</p>}
        </section>
      </div>

      {result && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recovery Eligibility</h2>

              <p>Current incident: {result.incident.incidentId}</p>
            </div>

            <span className="status-badge">
              {eligiblePayments.length} eligible
            </span>
          </div>

          {eligiblePayments.length > 0 ? (
            <div className="incident-summary">
              {eligiblePayments.slice(0, 4).map((payment, index) => (
                <div key={payment.paymentId || index}>
                  <span>Payment</span>

                  <strong>{payment.paymentId || `Payment ${index + 1}`}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>
              {recoveryCompleted
                ? "All eligible payments have been processed successfully."
                : "No payments are currently eligible. Recovery remains guarded until the incident reaches an approved recovery state."}
            </p>
          )}
        </section>
      )}

      {recoveryResult && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recovery Results</h2>

              <p>Outcome of the controlled recovery operation.</p>
            </div>

            <span className="status-badge success">
              {recoveryCompleted ? "COMPLETED" : recoveryResult.incidentStatus}
            </span>
          </div>

          <div className="incident-summary">
            <div>
              <span>Payments Attempted</span>
              <strong>{recoveryResult.attempted}</strong>
            </div>

            <div>
              <span>Payments Recovered</span>

              <strong className="success-text">
                {recoveryResult.recovered}
              </strong>
            </div>

            <div>
              <span>Failed Attempts</span>

              <strong>{recoveryResult.failed}</strong>
            </div>

            <div>
              <span>Revenue Recovered</span>

              <strong className="success-text">
                ₹{recoveryResult.revenueRecovered.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </section>
      )}

      {monitorResult && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Provider Recovery</h2>

              <p>
                Current provider health has been evaluated by the recovery
                monitor.
              </p>
            </div>

            <span className="status-badge success">HEALTHY</span>
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
              <strong>{providerSuccessRate}%</strong>
            </div>

            <div>
              <span>Recovery State</span>

              <strong className="success-text">
                {recoveryCompleted
                  ? "Completed"
                  : incidentStatus === "recovery_active"
                    ? "Recovery Active"
                    : "Guarded"}
              </strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Recovery;
