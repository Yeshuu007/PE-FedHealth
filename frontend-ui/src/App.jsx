
import { useEffect, useMemo, useState } from "react";
import {
  Activity, HeartPulse, Brain, ShieldCheck, Network,
  LayoutDashboard, FileText, Settings, Thermometer, Wind,
  Waves, Play, RefreshCw, CheckCircle, AlertTriangle,
  ArrowUpRight, Sparkles, Zap, Server, ChevronRight,
  LockKeyhole, Gauge, Database, Cpu, Menu, X,
  TrendingUp, Clock, Download, CircleHelp, Eye,
  FlaskConical, RotateCcw
} from "lucide-react";
import "./App.css";


const API = "https://pe-fedhealth.onrender.com";


const NAVIGATION = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "prediction", label: "Risk Prediction", icon: HeartPulse },
  { id: "explainability", label: "Explainable AI", icon: Brain },
  { id: "federated", label: "Federated Learning", icon: Network },
  { id: "privacy", label: "Privacy Center", icon: ShieldCheck },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const SENSOR_FIELDS = [
  { key: "ecg_std", label: "ECG standard deviation", icon: Activity },
  { key: "eda_mean", label: "EDA mean", icon: Waves },
  { key: "temp_std", label: "Temperature standard deviation", icon: Thermometer },
  { key: "resp_std", label: "Respiratory standard deviation", icon: Wind },
];

const INITIAL_INPUTS = {
  ecg_std: "0.5",
  eda_mean: "0.4",
  temp_std: "0.3",
  resp_std: "0.7",
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error ${response.status}: ${message.slice(0, 200)}`);
  }

  return response.json();
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

function percent(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${(number <= 1 ? number * 100 : number).toFixed(1)}%`;
}

function saveJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function MetricCard({ icon: Icon, label, value, subtitle, accent = "cyan" }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <div className="metric-top">
        <span className="metric-icon"><Icon size={21} /></span>
        <ArrowUpRight size={17} className="muted-icon" />
      </div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-subtitle">{subtitle}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {Icon && <span className="panel-icon"><Icon size={20} /></span>}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ online }) {
  return (
    <span className={`status-pill ${online ? "is-online" : "is-offline"}`}>
      <span className="status-dot" />
      {online ? "Backend connected" : "Backend disconnected"}
    </span>
  );
}

function EmptyState({ icon: Icon = CircleHelp, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function FeatureBars({ explanation }) {
  const items = useMemo(() => {
    if (!explanation) return [];

    const raw =
      explanation.feature_contributions ??
      explanation.contributions ??
      explanation.shap_values ??
      explanation;

    if (Array.isArray(raw)) {
      return raw.map((item, index) => ({
        name: item.feature ?? item.name ?? `Feature ${index + 1}`,
        value: Number(
          item.contribution ?? item.value ?? item.shap_value ?? 0
        ),
      }));
    }

    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .filter(([, value]) => typeof value === "number")
        .map(([name, value]) => ({ name, value }));
    }

    return [];
  }, [explanation]);

  if (!items.length) {
    return (
      <EmptyState
        icon={Brain}
        title="No explanation yet"
        text="Run a prediction, then request an explanation to view feature contributions."
      />
    );
  }

  const maximum = Math.max(
    ...items.map(item => Math.abs(item.value)),
    0.001
  );

  return (
    <div className="feature-bars">
      {items.map(item => (
        <div className="feature-row" key={item.name}>
          <div className="feature-label">
            <span>{item.name.replaceAll("_", " ")}</span>
            <strong>
              {item.value > 0 ? "+" : ""}
              {formatNumber(item.value, 4)}
            </strong>
          </div>
          <div className="feature-track">
            <div
              className={`feature-fill ${item.value >= 0 ? "positive" : "negative"}`}
              style={{
                width: `${Math.max(3, Math.abs(item.value) / maximum * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="chart-footnote">
        Contributions describe model behavior, not medical causality.
      </p>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [federatedStatus, setFederatedStatus] = useState(null);
  const [trainingResult, setTrainingResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const activeNav =
    NAVIGATION.find(item => item.id === page) ?? NAVIGATION[0];

  async function checkBackend() {
    setChecking(true);
    setError("");

    try {
      const result = await apiRequest("/federated/status");
      setFederatedStatus(result);
      setBackendOnline(true);
      setLastUpdated(new Date());
    } catch (err) {
      setBackendOnline(false);
      setError(`Could not connect to the backend. ${err.message}`);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkBackend();
  }, []);

  function updateInput(key, value) {
    setInputs(previous => ({ ...previous, [key]: value }));
  }

  function validatedInputs() {
    const values = {};

    for (const field of SENSOR_FIELDS) {
      const value = inputs[field.key].trim();

      if (value === "" || !Number.isFinite(Number(value))) {
        throw new Error(`Enter a valid number for ${field.label}.`);
      }

      values[field.key] = Number(value);
    }

    return values;
  }

  // FIX: The prediction API returns its result inside result.prediction.
  async function runPrediction() {
    setLoadingAction("prediction");
    setError("");
    setNotice("");

    try {
      const values = validatedInputs();

      const result = await apiRequest("/prediction/risk", {
        method: "POST",
        body: JSON.stringify(values),
      });

      const predictionData = result.prediction ?? result;

      setPrediction(predictionData);
      setExplanation(null);

      setHistory(previous => [
        {
          id: Date.now(),
          time: new Date().toLocaleString(),
          inputs: values,
          result: predictionData,
        },
        ...previous,
      ].slice(0, 20));

      setBackendOnline(true);
      setLastUpdated(new Date());
      setNotice(result.message ?? "Prediction completed successfully.");
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setLoadingAction("");
    }
  }

  async function runExplanation() {
    setLoadingAction("explanation");
    setError("");
    setNotice("");

    try {
      const values = validatedInputs();

      const result = await apiRequest("/explanation/shap", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setExplanation(result);
      setPage("explainability");
      setBackendOnline(true);
      setLastUpdated(new Date());
      setNotice("Explanation response received from the backend.");
    } catch (err) {
      setError(err.message || "Explanation request failed.");
    } finally {
      setLoadingAction("");
    }
  }

  async function loadFederatedStatus() {
    setLoadingAction("status");
    setError("");

    try {
      const result = await apiRequest("/federated/status");
      setFederatedStatus(result);
      setBackendOnline(true);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      setBackendOnline(false);
    } finally {
      setLoadingAction("");
    }
  }

  async function runFederatedTraining() {
    const confirmed = window.confirm(
      "Run the federated training endpoint? Continue only if you intend to run training."
    );

    if (!confirmed) return;

    setLoadingAction("training");
    setError("");
    setNotice("");

    try {
      const result = await apiRequest("/federated/train", {
        method: "POST",
        body: JSON.stringify({ clients: 15 }),
      });

      setTrainingResult(result);

      setFederatedStatus(previous => ({
        ...previous,
        status: "Federated training completed",
        clients: result.clients_participated ?? previous?.clients,
        privacy: result.privacy ?? previous?.privacy,
        aggregation: result.aggregation ?? previous?.aggregation,
      }));

      setBackendOnline(true);
      setLastUpdated(new Date());
      setNotice(result.message ?? "Federated training response received.");
    } catch (err) {
      setError(err.message || "Federated training failed.");
    } finally {
      setLoadingAction("");
    }
  }

  // Your API calls this field model_metrics, not metrics.
  const modelMetrics =
    prediction?.model_metrics ?? prediction?.metrics ?? null;

  const globalMetrics = trainingResult?.global_model ?? null;

  function downloadReport() {
    const report = {
      project: "PE-FedHealth",
      generated_at: new Date().toISOString(),
      task: "Baseline vs Stress",
      note:
        "Research-oriented physiological indicators, not clinical diagnoses.",
      backend_status: backendOnline ? "connected" : "disconnected",
      prediction,
      explanation,
      federated_status: federatedStatus,
      federated_training_result: trainingResult,
      prediction_history: history,
    };

    saveJson("PE-FedHealth-report.json", report);
  }

  function goTo(nextPage) {
    setPage(nextPage);
    setMobileMenu(false);
    setError("");
    setNotice("");
  }

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo"><Activity size={28} /></div>
          <div>
            <div className="brand-name">PE-FedHealth</div>
            <div className="brand-caption">INTELLIGENT HEALTH AI</div>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="nav-heading">WORKSPACE</div>

        <nav className="navigation">
          {NAVIGATION.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => goTo(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {page === item.id && (
                  <ChevronRight size={16} className="nav-chevron" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-mini">
            <LockKeyhole size={21} />
            <div>
              <strong>Privacy-aware AI</strong>
              <span>Research prototype</span>
            </div>
          </div>
          <div className="version">PE-FEDHEALTH · V2.0</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={23} />
          </button>

          <div className="breadcrumb">
            Workspace <ChevronRight size={15} />
            <strong>{activeNav.label}</strong>
          </div>

          <div className="topbar-actions">
            <StatusPill online={backendOnline} />
            <button
              className="icon-button"
              onClick={checkBackend}
              title="Check backend"
              disabled={checking}
            >
              <RefreshCw size={17} className={checking ? "spin" : ""} />
            </button>
          </div>
        </header>

        <div className="page-container">
          {error && (
            <div className="alert alert-error" role="alert">
              <AlertTriangle size={19} />
              <div>
                <strong>Something needs attention</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={17} />
              </button>
            </div>
          )}

          {notice && (
            <div className="alert alert-success" role="status">
              <CheckCircle size={19} />
              <p>{notice}</p>
              <button onClick={() => setNotice("")} aria-label="Dismiss notice">
                <X size={17} />
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {page === "overview" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <Sparkles size={14} /> AI-POWERED HEALTH ANALYTICS
                  </div>
                  <h1>Health <span>Intelligence</span></h1>
                  <p>
                    Privacy-preserving and explainable federated learning for
                    wearable sensor data.
                  </p>
                </div>
                <div className="system-badge">
                  <span className="status-dot" /> Research System
                </div>
              </div>

              <section className="hero">
                <div className="hero-content">
                  <div className="hero-label">
                    <Sparkles size={15} /> FEDERATED AI · WEARABLE SENSORS
                  </div>
                  <h2>
                    Intelligent health insights,<br />
                    <span>without centralizing data.</span>
                  </h2>
                  <p>
                    Explore physiological state prediction using machine
                    learning, explainable AI, and privacy-aware federated
                    learning.
                  </p>
                  <div className="action-buttons">
                    <button
                      className="primary-button"
                      onClick={() => goTo("prediction")}
                    >
                      <Zap size={18} /> Run Prediction
                      <ArrowUpRight size={17} />
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => goTo("federated")}
                    >
                      <Network size={18} /> Explore Federation
                    </button>
                  </div>
                  <div className="research-note">
                    <ShieldCheck size={17} />
                    Research indicators only — not medical diagnoses.
                  </div>
                </div>

                <div className="hero-visual">
                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />
                  <div className="hero-orbit orbit-three" />
                  <div className="hero-center"><Activity size={48} /></div>
                  <div className="floating-card floating-top">
                    <HeartPulse size={18} /> Sensor Intelligence
                  </div>
                  <div className="floating-card floating-bottom">
                    <Network size={18} />
                    {federatedStatus?.clients ?? 15} Federated Clients
                  </div>
                </div>
              </section>

              <SectionHeading
                eyebrow="SYSTEM OVERVIEW"
                title="System Overview"
                description="View model, federation, and privacy information."
                action={
                  <button
                    className="secondary-button small-button"
                    onClick={checkBackend}
                    disabled={checking}
                  >
                    <RefreshCw size={15} /> Refresh
                  </button>
                }
              />

              <div className="metrics-grid">
                <MetricCard
                  icon={Gauge}
                  label="Model Accuracy"
                  value={
                    globalMetrics?.accuracy != null
                      ? percent(globalMetrics.accuracy)
                      : modelMetrics?.accuracy != null
                        ? percent(modelMetrics.accuracy)
                        : "72.0%*"
                  }
                  subtitle={
                    globalMetrics
                      ? "Latest federated evaluation"
                      : modelMetrics
                        ? "Latest prediction model evaluation"
                        : "Previously reported baseline"
                  }
                />
                <MetricCard
                  icon={Network}
                  label="Federated Clients"
                  value={federatedStatus?.clients ?? 15}
                  subtitle="Reported participating clients"
                  accent="purple"
                />
                <MetricCard
                  icon={RefreshCw}
                  label="Training Rounds"
                  value={trainingResult?.rounds ?? 5}
                  subtitle={
                    trainingResult
                      ? "Latest training response"
                      : "Previously reported configuration"
                  }
                  accent="blue"
                />
                <MetricCard
                  icon={ShieldCheck}
                  label="Privacy Mechanism"
                  value={federatedStatus?.privacy ?? "Check status"}
                  subtitle={federatedStatus?.aggregation ?? "Backend not checked"}
                  accent="green"
                />
              </div>

              <div className="content-grid">
                <Panel
                  title="How the system works"
                  subtitle="The PE-FedHealth research pipeline"
                  icon={Activity}
                >
                  {[
                    [ "01", Database, "Wearable Sensor Data", "Physiological features from WESAD" ],
                    [ "02", Network, "Federated Learning", "Client updates and weighted aggregation" ],
                    [ "03", Brain, "Explainable AI", "Feature contributions for predictions" ],
                    [ "04", ShieldCheck, "Privacy Layer", "Review implemented privacy mechanisms" ],
                  ].map(([number, Icon, title, description]) => (
                    <div className="pipeline-step" key={number}>
                      <span className="pipeline-number">{number}</span>
                      <span className="pipeline-icon"><Icon size={20} /></span>
                      <div className="pipeline-text">
                        <strong>{title}</strong>
                        <span>{description}</span>
                      </div>
                      <CheckCircle size={17} className="pipeline-check" />
                    </div>
                  ))}
                </Panel>

                <Panel title="Quick access" subtitle="Explore the platform" icon={Zap}>
                  {[
                    ["prediction", HeartPulse, "Risk Prediction", "Generate a model prediction"],
                    ["explainability", Brain, "Explainable AI", "Inspect feature contributions"],
                    ["federated", Network, "Federated Learning", "View status and run training"],
                    ["reports", FileText, "Reports", "Review experimental metrics"],
                  ].map(([id, Icon, title, description]) => (
                    <button
                      className="quick-action"
                      key={id}
                      onClick={() => goTo(id)}
                    >
                      <span className="quick-icon"><Icon size={20} /></span>
                      <span className="quick-text">
                        <strong>{title}</strong>
                        <small>{description}</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </Panel>
              </div>

              <Panel
                title="Recent activity"
                subtitle="Predictions from this browser session"
                icon={Clock}
              >
                {history.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="Ready for your first prediction"
                    text="Run a prediction to populate recent activity."
                  />
                ) : (
                  history.slice(0, 5).map(item => (
                    <div className="activity-row" key={item.id}>
                      <span className="activity-icon"><HeartPulse size={18} /></span>
                      <div className="activity-main">
                        <strong>{item.result.predicted_state ?? "Prediction completed"}</strong>
                        <span>{item.time}</span>
                      </div>
                      <span className="activity-value">
                        {percent(item.result.stress_probability)}
                      </span>
                      <button
                        className="text-button"
                        onClick={() => {
                          setInputs(
                            Object.fromEntries(
                              Object.entries(item.inputs).map(
                                ([key, value]) => [key, String(value)]
                              )
                            )
                          );
                          setPrediction(item.result);
                          goTo("prediction");
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))
                )}
              </Panel>

              <p className="page-footnote">
                *Fallback accuracy is a previously reported value, not a live
                evaluation. Run a prediction or training to view returned metrics.
              </p>
            </>
          )}

          {/* RISK PREDICTION */}
          {page === "prediction" && (
            <>
              <SectionHeading
                eyebrow="MACHINE LEARNING INFERENCE"
                title="Risk Prediction"
                description="Submit wearable sensor features to the Baseline-versus-Stress model."
              />

              <div className="workspace-grid">
                <Panel
                  title="Sensor input workspace"
                  subtitle="Enter the four features expected by the API"
                  icon={Activity}
                >
                  <div className="input-grid">
                    {SENSOR_FIELDS.map(field => {
                      const Icon = field.icon;

                      return (
                        <label className="input-field" key={field.key}>
                          <span className="input-label">
                            <Icon size={17} /> {field.label}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={inputs[field.key]}
                            onChange={event =>
                              updateInput(field.key, event.target.value)
                            }
                          />
                          <small>Feature: {field.key}</small>
                        </label>
                      );
                    })}
                  </div>

                  <div className="action-buttons form-actions">
                    <button
                      className="primary-button"
                      onClick={runPrediction}
                      disabled={loadingAction === "prediction"}
                    >
                      {loadingAction === "prediction"
                        ? <RefreshCw className="spin" size={18} />
                        : <Play size={18} />}
                      {loadingAction === "prediction"
                        ? "Predicting…"
                        : "Run Prediction"}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        setInputs(INITIAL_INPUTS);
                        setPrediction(null);
                        setExplanation(null);
                        setError("");
                        setNotice("");
                      }}
                    >
                      <RotateCcw size={17} /> Reset
                    </button>
                  </div>

                  <p className="chart-footnote">
                    Example values are for demonstration. Use appropriately
                    preprocessed features for meaningful model inputs.
                  </p>
                </Panel>

                <Panel
                  title="Prediction result"
                  subtitle="Output from the connected backend"
                  icon={Gauge}
                >
                  {!prediction ? (
                    <EmptyState
                      icon={HeartPulse}
                      title="Awaiting input"
                      text="Enter the sensor features and run a prediction."
                    />
                  ) : (
                    <div className="prediction-results">
                      <div className="prediction-state">
                        <span className="prediction-state-icon">
                          <Activity size={28} />
                        </span>
                        <div>
                          <small>Predicted state</small>
                          <h3>{prediction.predicted_state ?? "Not returned"}</h3>
                        </div>
                      </div>

                      <div className="result-grid">
                        {[
                          ["Cardiac indicator", prediction.cardiac_risk],
                          ["Stress indicator", prediction.stress_risk],
                          ["Respiratory indicator", prediction.respiratory_risk],
                          ["Overall indicator", prediction.overall_risk],
                        ].map(([label, value]) => (
                          <div className="result-card" key={label}>
                            <span>{label}</span>
                            <strong>
                              {value == null ? "—" : `${formatNumber(value, 1)}%`}
                            </strong>
                            <div className="result-track">
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, Number(value) || 0))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="result-row">
                        <span>Stress probability</span>
                        <strong>{percent(prediction.stress_probability)}</strong>
                      </div>
                      <div className="result-row">
                        <span>Model confidence</span>
                        <strong>{percent(prediction.confidence)}</strong>
                      </div>
                      <div className="result-row">
                        <span>Model</span>
                        <strong>{prediction.model_type ?? prediction.model ?? "—"}</strong>
                      </div>
                      <div className="result-row">
                        <span>Classification task</span>
                        <strong>{prediction.task ?? "Baseline vs Stress"}</strong>
                      </div>

                      {prediction.note && (
                        <p className="chart-footnote">{prediction.note}</p>
                      )}

                      <button
                        className="secondary-button full-button"
                        onClick={runExplanation}
                        disabled={loadingAction === "explanation"}
                      >
                        <Brain size={17} />
                        {loadingAction === "explanation"
                          ? "Generating explanation…"
                          : "Explain This Prediction"}
                      </button>
                    </div>
                  )}
                </Panel>
              </div>

              {modelMetrics && (
                <Panel
                  title="Model evaluation"
                  subtitle="Metrics returned by the backend"
                  icon={TrendingUp}
                >
                  <div className="metrics-grid compact-grid">
                    {Object.entries(modelMetrics)
                      .filter(([, value]) => typeof value === "number")
                      .map(([key, value]) => (
                        <MetricCard
                          key={key}
                          icon={Gauge}
                          label={key.replaceAll("_", " ")}
                          value={percent(value)}
                          subtitle="Reported evaluation metric"
                        />
                      ))}
                  </div>
                  <p className="chart-footnote">
                    Task: {modelMetrics.task ?? prediction.task ?? "Baseline vs Stress"}.
                    These are experimental classification metrics, not clinical validation.
                  </p>
                </Panel>
              )}
            </>
          )}

          {/* EXPLAINABLE AI */}
          {page === "explainability" && (
            <>
              <SectionHeading
                eyebrow="MODEL TRANSPARENCY"
                title="Explainable AI"
                description="Inspect feature contributions returned by the SHAP endpoint."
                action={
                  <button
                    className="secondary-button small-button"
                    onClick={runExplanation}
                    disabled={loadingAction === "explanation"}
                  >
                    <RefreshCw size={15} /> Recalculate
                  </button>
                }
              />

              <div className="content-grid">
                <Panel
                  title="Feature contributions"
                  subtitle={explanation?.method ?? "SHAP explanation"}
                  icon={Brain}
                >
                  <FeatureBars explanation={explanation} />
                </Panel>

                <Panel
                  title="Explanation summary"
                  subtitle="Prediction context"
                  icon={Eye}
                >
                  {explanation ? (
                    <>
                      <div className="summary-highlight">
                        <span>Predicted state</span>
                        <strong>
                          {explanation.predicted_state ??
                            prediction?.predicted_state ?? "—"}
                        </strong>
                      </div>
                      <div className="summary-highlight">
                        <span>Stress probability</span>
                        <strong>
                          {percent(
                            explanation.stress_probability ??
                            prediction?.stress_probability
                          )}
                        </strong>
                      </div>
                      <div className="summary-highlight">
                        <span>Explanation method</span>
                        <strong>{explanation.method ?? "Backend response"}</strong>
                      </div>
                      <p className="chart-footnote">
                        Feature contributions describe model behavior; they
                        do not prove medical causation.
                      </p>
                    </>
                  ) : (
                    <EmptyState
                      icon={Brain}
                      title="Explanation unavailable"
                      text="Generate an explanation to view the returned feature contributions."
                    />
                  )}

                  <button
                    className="primary-button full-button"
                    onClick={runExplanation}
                    disabled={loadingAction === "explanation"}
                  >
                    <Sparkles size={17} /> Generate Explanation
                  </button>
                </Panel>
              </div>
            </>
          )}

          {/* FEDERATED LEARNING */}
          {page === "federated" && (
            <>
              <SectionHeading
                eyebrow="DISTRIBUTED MODEL TRAINING"
                title="Federated Learning"
                description="Review backend status, aggregation details, and training results."
                action={
                  <button
                    className="secondary-button small-button"
                    onClick={loadFederatedStatus}
                    disabled={loadingAction === "status"}
                  >
                    <RefreshCw size={15} /> Refresh status
                  </button>
                }
              />

              <div className="metrics-grid">
                <MetricCard
                  icon={Network}
                  label="Participating clients"
                  value={federatedStatus?.clients ?? "—"}
                  subtitle="Backend-reported count"
                  accent="purple"
                />
                <MetricCard
                  icon={RefreshCw}
                  label="Training rounds"
                  value={trainingResult?.rounds ?? "—"}
                  subtitle="Latest training response"
                  accent="blue"
                />
                <MetricCard
                  icon={Gauge}
                  label="Global accuracy"
                  value={globalMetrics?.accuracy != null
                    ? percent(globalMetrics.accuracy) : "—"}
                  subtitle="Latest federated evaluation"
                />
                <MetricCard
                  icon={ShieldCheck}
                  label="Privacy status"
                  value={federatedStatus?.privacy ?? "—"}
                  subtitle="Backend-reported setting"
                  accent="green"
                />
              </div>

              <div className="content-grid">
                <Panel
                  title="Federated network"
                  subtitle="Conceptual view of participating clients"
                  icon={Network}
                >
                  <div className="network-visual">
                    <div className="network-hub">
                      <Activity size={30} />
                      <strong>Global model</strong>
                      <span>Aggregation server</span>
                    </div>
                    <div className="network-clients">
                      {Array.from(
                        { length: Number(federatedStatus?.clients) || 15 },
                        (_, index) => (
                          <div className="network-client" key={index}>
                            <Database size={15} />
                            <span>{String(index + 1).padStart(2, "0")}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <p className="chart-footnote">
                    Illustrative visualization, not live client telemetry.
                  </p>
                </Panel>

                <Panel
                  title="Training controls"
                  subtitle="Call the existing federated training endpoint"
                  icon={Cpu}
                >
                  <div className="training-info">
                    <div className="result-row">
                      <span>Backend status</span>
                      <strong>{backendOnline ? "Connected" : "Disconnected"}</strong>
                    </div>
                    <div className="result-row">
                      <span>Aggregation</span>
                      <strong>{federatedStatus?.aggregation ?? "Not reported"}</strong>
                    </div>
                    <div className="result-row">
                      <span>Last updated</span>
                      <strong>{lastUpdated?.toLocaleTimeString() ?? "Not checked"}</strong>
                    </div>
                  </div>

                  <button
                    className="primary-button full-button"
                    onClick={runFederatedTraining}
                    disabled={loadingAction === "training"}
                  >
                    {loadingAction === "training"
                      ? <RefreshCw className="spin" size={17} />
                      : <Play size={17} />}
                    {loadingAction === "training"
                      ? "Training…"
                      : "Run Federated Training"}
                  </button>
                  <p className="chart-footnote">
                    Training runs on the backend. A failed request is shown as
                    an error rather than a fabricated success.
                  </p>
                </Panel>
              </div>

              {trainingResult && (
                <Panel
                  title="Global model evaluation"
                  subtitle="Actual values from the latest training response"
                  icon={TrendingUp}
                >
                  <div className="metrics-grid compact-grid">
                    {Object.entries(trainingResult.global_model ?? {})
                      .filter(([, value]) => typeof value === "number")
                      .map(([key, value]) => (
                        <MetricCard
                          key={key}
                          icon={Gauge}
                          label={key.replaceAll("_", " ")}
                          value={percent(value)}
                          subtitle="Federated evaluation"
                        />
                      ))}
                  </div>
                  <div className="result-row">
                    <span>Clients participated</span>
                    <strong>{trainingResult.clients_participated ?? "—"}</strong>
                  </div>
                  <div className="result-row">
                    <span>Aggregation</span>
                    <strong>{trainingResult.aggregation ?? "—"}</strong>
                  </div>
                  <div className="result-row">
                    <span>Privacy</span>
                    <strong>{trainingResult.privacy ?? "—"}</strong>
                  </div>
                </Panel>
              )}
            </>
          )}

          {/* PRIVACY CENTER */}
          {page === "privacy" && (
            <>
              <SectionHeading
                eyebrow="PRIVACY & GOVERNANCE"
                title="Privacy Center"
                description="Review privacy mechanisms and the limitations of this research prototype."
              />

              <div className="metrics-grid">
                <MetricCard
                  icon={LockKeyhole}
                  label="Backend privacy field"
                  value={federatedStatus?.privacy ?? "Not reported"}
                  subtitle="Status endpoint"
                  accent="green"
                />
                <MetricCard
                  icon={Network}
                  label="Aggregation method"
                  value={federatedStatus?.aggregation ?? "Not reported"}
                  subtitle="Status endpoint"
                  accent="purple"
                />
                <MetricCard
                  icon={Database}
                  label="Sensor data"
                  value="Input-dependent"
                  subtitle="Review the data-handling pipeline"
                  accent="blue"
                />
                <MetricCard
                  icon={ShieldCheck}
                  label="Research scope"
                  value="Baseline vs Stress"
                  subtitle="Not clinical diagnosis"
                />
              </div>

              <div className="content-grid">
                <Panel title="Privacy checklist" subtitle="Review before your presentation" icon={ShieldCheck}>
                  {[
                    ["Differential privacy", "Confirm where noise is applied and whether a privacy budget is configured."],
                    ["Federated training", "Explain which data stays local and which updates are shared."],
                    ["Aggregation", "The current status API reports weighted aggregation. Do not claim cryptographic secure aggregation unless implemented."],
                    ["Data protection", "Avoid uploading identifiable health data to public test environments."],
                  ].map(([title, description]) => (
                    <div className="privacy-row" key={title}>
                      <ShieldCheck size={20} />
                      <div><strong>{title}</strong><p>{description}</p></div>
                    </div>
                  ))}
                </Panel>

                <Panel title="Research limitations" subtitle="Interpretation guidelines" icon={FlaskConical}>
                  <div className="notice">
                    <AlertTriangle size={19} />
                    <p>WESAD is a wearable stress and affect dataset. Its labels are not clinical disease diagnoses.</p>
                  </div>
                  <ul className="limitations-list">
                    <li>The current classification task is Baseline versus Stress.</li>
                    <li>Risk cards are experimental indicators, not validated clinical scores.</li>
                    <li>SHAP contributions do not establish causation.</li>
                    <li>Privacy claims must match the implemented backend.</li>
                  </ul>
                </Panel>
              </div>
            </>
          )}

          {/* REPORTS */}
          {page === "reports" && (
            <>
              <SectionHeading
                eyebrow="EXPERIMENTAL RESULTS"
                title="Reports & Analytics"
                description="Review session results and export the data available to this dashboard."
                action={
                  <button className="primary-button small-button" onClick={downloadReport}>
                    <Download size={16} /> Export report
                  </button>
                }
              />

              <div className="metrics-grid">
                <MetricCard icon={Activity} label="Session predictions" value={history.length} subtitle="Current browser session" />
                <MetricCard icon={Brain} label="Latest prediction" value={prediction?.predicted_state ?? "None"} subtitle="Most recent model output" accent="purple" />
                <MetricCard icon={Network} label="Training available" value={trainingResult ? "Yes" : "Not run"} subtitle="Current browser session" accent="blue" />
                <MetricCard icon={Server} label="Backend" value={backendOnline ? "Online" : "Offline"} subtitle="Latest connection check" accent="green" />
              </div>

              <Panel title="Prediction history" subtitle="History is kept in browser memory until refresh">
                {history.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No report data yet"
                    text="Run a prediction to create a session report."
                  />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Predicted state</th>
                          <th>Stress probability</th>
                          <th>Model</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(item => (
                          <tr key={item.id}>
                            <td>{item.time}</td>
                            <td>{item.result.predicted_state ?? "—"}</td>
                            <td>{percent(item.result.stress_probability)}</td>
                            <td>{item.result.model_type ?? "—"}</td>
                            <td>
                              <button
                                className="text-button"
                                onClick={() => {
                                  setInputs(
                                    Object.fromEntries(
                                      Object.entries(item.inputs).map(
                                        ([key, value]) => [key, String(value)]
                                      )
                                    )
                                  );
                                  setPrediction(item.result);
                                  goTo("prediction");
                                }}
                              >
                                Open
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel title="Export options" subtitle="Download available experimental results" icon={Download}>
                <p className="panel-description">
                  The JSON report includes prediction history, the latest
                  explanation, federated training results, and backend status.
                  It does not include server logs or the full training dataset.
                </p>
                <button className="primary-button" onClick={downloadReport}>
                  <Download size={17} /> Download JSON report
                </button>
              </Panel>
            </>
          )}

          {/* SETTINGS */}
          {page === "settings" && (
            <>
              <SectionHeading
                eyebrow="PLATFORM CONFIGURATION"
                title="Settings"
                description="Inspect the backend connection and current research configuration."
              />

              <Panel title="Backend connection" subtitle="API configuration" icon={Server}>
                <div className="settings-value">
                  <span>API base URL</span>
                  <code>{API}</code>
                  <button
                    className="secondary-button small-button"
                    onClick={() => navigator.clipboard?.writeText(API)}
                  >
                    <FileText size={15} /> Copy URL
                  </button>
                </div>
                <div className="settings-value">
                  <span>Connection state</span>
                  <StatusPill online={backendOnline} />
                </div>
                <div className="settings-value">
                  <span>Last checked</span>
                  <strong>{lastUpdated?.toLocaleString() ?? "Not checked yet"}</strong>
                </div>
                <button
                  className="primary-button"
                  onClick={checkBackend}
                  disabled={checking}
                >
                  <RefreshCw size={17} className={checking ? "spin" : ""} />
                  {checking ? "Checking…" : "Test API Connection"}
                </button>
              </Panel>

              <Panel title="Model configuration" subtitle="Classification and data context" icon={Cpu}>
                <div className="settings-value"><span>Classification task</span><strong>Baseline vs Stress</strong></div>
                <div className="settings-value"><span>Dataset</span><strong>WESAD wearable sensor research</strong></div>
                <div className="settings-value"><span>Explainability</span><strong>SHAP endpoint</strong></div>
                <div className="settings-value"><span>Aggregation</span><strong>{federatedStatus?.aggregation ?? "Not reported"}</strong></div>
              </Panel>

              <Panel title="Session controls" subtitle="Manage temporary browser data" icon={Settings}>
                <div className="settings-value">
                  <span>Clear prediction history</span>
                  <button
                    className="secondary-button small-button"
                    onClick={() => {
                      setHistory([]);
                      setPrediction(null);
                      setExplanation(null);
                      setNotice("Browser-session prediction history cleared.");
                    }}
                  >
                    Clear history
                  </button>
                </div>
                <div className="settings-value">
                  <span>Restore sample inputs</span>
                  <button
                    className="secondary-button small-button"
                    onClick={() => setInputs(INITIAL_INPUTS)}
                  >
                    Reset inputs
                  </button>
                </div>
              </Panel>
            </>
          )}

          <footer className="footer">
            <span><Activity size={15} /> PE-FedHealth · Research Prototype</span>
            <span><ShieldCheck size={15} /> Experimental indicators only · Not a medical device</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
