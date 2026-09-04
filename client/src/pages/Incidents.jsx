import { useEffect, useState } from "react";
import { detectIncident, diagnoseIncident } from "../services/api";

const Incidents = () => {
  const [incidentData, setIncidentData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const provider = "Bank-Test";
  const method = "UPI";

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await detectIncident({
          provider,
          method,
          windowMinutes: 10,
        });

        setIncidentData(data);
      } catch (err) {
        console.error("Incident loading error:", err);
        setError(err.message || "Failed to load incident data.");
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, []);

  const handleDiagnosis = async () => {
    if (!incidentData?.incident?.incidentId) return;

    try {
      setDiagnosing(true);
      setError("");
      setMessage("");

      const data = await diagnoseIncident(incidentData.incident.incidentId);

      setDiagnosisData(data);

      if (data.incident) {
        setIncidentData((previous) => ({
          ...previous,
          incident: data.incident,
        }));
      }

      setMessage("AI diagnosis completed and policy evaluated.");
    } catch (err) {
      console.error("AI diagnosis error:", err);
      setError(err.message || "AI diagnosis failed.");
    } finally {
      setDiagnosing(false);
    }
  };

  const incident = incidentData?.incident;
  const degradation = incidentData?.degradation;
  const revenueRisk = incidentData?.revenueRisk;

  const severity = incident?.severity || "medium";

  const aiResponse =
    diagnosisData?.aiResponse || diagnosisData?.diagnosis || null;

  const policyDecision =
    diagnosisData?.policyDecision?.decision ||
    incident?.policyDecision ||
    "pending";

  const recommendedAction =
    aiResponse?.recommendedAction || incident?.recommendedAction || "pending";

  const confidence = aiResponse?.confidence ?? incident?.aiConfidence ?? null;

  const policyDisplay =
    policyDecision === "allow" && recommendedAction === "pause_recovery"
      ? "Pause Approved"
      : policyDecision === "allow" && recommendedAction === "resume_recovery"
        ? "Recovery Approved"
        : policyDecision;

  const policyExplanation =
    policyDecision === "allow" && recommendedAction === "pause_recovery"
      ? "Policy approved the pause because systemic degradation was confirmed."
      : policyDecision === "allow" && recommendedAction === "resume_recovery"
        ? "Policy approved controlled recovery after provider health recovered."
        : policyDecision === "escalate"
          ? "Policy requires operational intervention."
          : policyDecision === "block"
            ? "Policy blocked the requested recovery action."
            : "Policy has not yet been evaluated.";

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p>Detect, diagnose and safely manage systemic payment failures.</p>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          Live Monitoring
        </div>
      </div>

      {loading && (
        <div className="panel">
          <p>Detecting active payment incidents...</p>
        </div>
      )}

      {error && (
        <div className="panel">
          <p>Unable to process incident: {error}</p>
        </div>
      )}

      {!loading && !error && incident && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Incident Status</span>

              <strong className="metric-value danger">
                {incident.status?.replaceAll("_", " ")}
              </strong>

              <small>
                {provider} · {method}
              </small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Failure Rate</span>

              <strong className="metric-value danger">
                {incident.failureRate}%
              </strong>

              <small>Baseline {incident.baselineFailureRate}%</small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Affected Payments</span>

              <strong className="metric-value">
                {incident.affectedPayments}
              </strong>

              <small>Payments impacted</small>
            </div>

            <div className="metric-card">
              <span className="metric-label">Revenue at Risk</span>

              <strong className="metric-value danger">
                ₹{incident.revenueAtRisk.toLocaleString("en-IN")}
              </strong>

              <small>Estimated exposure</small>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Active Incident</h2>
                  <p>Systemic payment degradation detected</p>
                </div>

                <span
                  className={`status-badge ${
                    severity === "critical" || severity === "high"
                      ? "danger"
                      : ""
                  }`}
                >
                  {severity.toUpperCase()}
                </span>
              </div>

              <div className="incident-summary">
                <div>
                  <span>Incident ID</span>
                  <strong>{incident.incidentId}</strong>
                </div>

                <div>
                  <span>Provider</span>
                  <strong>{incident.provider}</strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>{incident.method}</strong>
                </div>

                <div>
                  <span>Detection Window</span>
                  <strong>10 min</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Failure Analysis</h2>
                  <p>Signals detected from recent payment events</p>
                </div>
              </div>

              <div className="incident-summary">
                <div>
                  <span>Failure Rate</span>
                  <strong>{degradation?.failureRate ?? 0}%</strong>
                </div>

                <div>
                  <span>Baseline</span>
                  <strong>{degradation?.baselineFailureRate ?? 5}%</strong>
                </div>

                <div>
                  <span>Degradation</span>
                  <strong>
                    {degradation?.degradationDetected
                      ? "Detected"
                      : "Not Detected"}
                  </strong>
                </div>

                <div>
                  <span>Failed Revenue</span>
                  <strong>
                    ₹{(revenueRisk?.failedRevenue ?? 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>AI Diagnosis</h2>

                <p>
                  Gemini analyzes failure patterns before recovery decisions.
                </p>
              </div>

              {!diagnosisData && (
                <button
                  className="recovery-button"
                  onClick={handleDiagnosis}
                  disabled={diagnosing}
                >
                  {diagnosing ? "Analyzing..." : "Run AI Diagnosis"}
                </button>
              )}
            </div>

            {!diagnosisData ? (
              <div className="incident-summary">
                <div>
                  <span>Diagnosis</span>
                  <strong>Pending</strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>—</strong>
                </div>

                <div>
                  <span>Recommended Action</span>
                  <strong>Pending</strong>
                </div>

                <div>
                  <span>Policy</span>
                  <strong>Not Evaluated</strong>
                </div>
              </div>
            ) : (
              <>
                <div className="incident-summary">
                  <div>
                    <span>Diagnosis</span>
                    <strong>{aiResponse?.diagnosis || "Available"}</strong>
                  </div>

                  <div>
                    <span>Confidence</span>
                    <strong>
                      {confidence !== null
                        ? `${Math.round(confidence * 100)}%`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Recommended Action</span>
                    <strong>{recommendedAction.replaceAll("_", " ")}</strong>
                  </div>

                  <div>
                    <span>Policy Decision</span>
                    <strong>{policyDisplay}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <span className="metric-label">Policy Explanation</span>

                  <p style={{ marginTop: "8px" }}>{policyExplanation}</p>
                </div>

                {aiResponse?.reason && (
                  <div style={{ marginTop: "24px" }}>
                    <span className="metric-label">AI Reasoning</span>

                    <p style={{ marginTop: "8px" }}>{aiResponse.reason}</p>
                  </div>
                )}
              </>
            )}

            {message && <p style={{ marginTop: "20px" }}>{message}</p>}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Incident Pipeline</h2>

                <p>Current state of the revenue recovery orchestration flow.</p>
              </div>
            </div>

            <div className="incident-summary">
              <div>
                <span>1. Detection</span>
                <strong className="success-text">Complete</strong>
              </div>

              <div>
                <span>2. AI Diagnosis</span>
                <strong className={diagnosisData ? "success-text" : ""}>
                  {diagnosisData ? "Complete" : "Pending"}
                </strong>
              </div>

              <div>
                <span>3. Policy Evaluation</span>
                <strong className={diagnosisData ? "success-text" : ""}>
                  {diagnosisData ? "Complete" : "Pending"}
                </strong>
              </div>

              <div>
                <span>4. Recovery</span>

                <strong
                  className={
                    incident.status === "recovery_active" ||
                    incident.status === "resolved"
                      ? "success-text"
                      : incident.status === "escalated"
                        ? "danger-text"
                        : ""
                  }
                >
                  {incident.status === "recovery_active"
                    ? "Active"
                    : incident.status === "resolved"
                      ? "Resolved"
                      : incident.status === "escalated"
                        ? "Escalated"
                        : "Guarded"}
                </strong>
              </div>
            </div>
          </section>
        </>
      )}

      {!loading && !error && !incident && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>No Active Incidents</h2>

              <p>
                Payment systems are currently operating within normal
                thresholds.
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
              <span>Monitoring Window</span>
              <strong>10 min</strong>
            </div>

            <div>
              <span>System Status</span>
              <strong className="success-text">Normal</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Incidents;
