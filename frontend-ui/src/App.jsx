import { useState } from "react";

import {
  Activity,
  HeartPulse,
  Brain,
  ShieldCheck,
  Network,
  LayoutDashboard,
  FileText,
  Settings,
  Thermometer,
  Wind,
  Waves,
  Play,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import "./App.css";


const API = "https://pe-fedhealth.onrender.com";


const menuItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Risk Prediction", icon: HeartPulse },
  { name: "Explainable AI", icon: Brain },
  { name: "Federated Learning", icon: Network },
  { name: "Privacy Center", icon: ShieldCheck },
  { name: "Reports", icon: FileText },
];

function App() {
  const [page, setPage] = useState("Overview");

  const [ecg, setEcg] = useState("0.8");
  const [eda, setEda] = useState("2.5");
  const [temp, setTemp] = useState("0.4");
  const [resp, setResp] = useState("0.7");

  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");

  const [flStatus, setFlStatus] = useState(null);
  const [flLoading, setFlLoading] = useState(false);

  const [trainingResult, setTrainingResult] = useState(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingError, setTrainingError] = useState("");

  async function predictRisk() {
    setPredictionLoading(true);
    setPredictionError("");
    setPrediction(null);

    try {
      const response = await fetch(`${API}/prediction/risk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ecg_std: Number(ecg),
          eda_mean: Number(eda),
          temp_std: Number(temp),
          resp_std: Number(resp),
        }),
      });

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      setPrediction(data.prediction);
    } catch (error) {
      console.error(error);

      setPredictionError(
        "Unable to connect to the Risk Prediction API."
      );
    } finally {
      setPredictionLoading(false);
    }
  }

  async function explainPrediction() {
    setExplanationLoading(true);
    setExplanationError("");
    setExplanation(null);

    try {
      const response = await fetch(`${API}/explanation/shap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ecg_std: Number(ecg),
          eda_mean: Number(eda),
          temp_std: Number(temp),
          resp_std: Number(resp),
        }),
      });

      if (!response.ok) {
        throw new Error("Explanation request failed");
      }

      const data = await response.json();

      setExplanation(data);
    } catch (error) {
      console.error(error);

      setExplanationError(
        "Unable to connect to the Explainability API."
      );
    } finally {
      setExplanationLoading(false);
    }
  }

  async function checkFederatedStatus() {
    setFlLoading(true);
    setTrainingError("");

    try {
      const response = await fetch(`${API}/federated/status`);

      if (!response.ok) {
        throw new Error(
          "Federated status request failed"
        );
      }

      const data = await response.json();

      setFlStatus(data);
    } catch (error) {
      console.error(error);

      setTrainingError(
        "Unable to connect to the Federated Learning API."
      );
    } finally {
      setFlLoading(false);
    }
  }

  async function startFederatedTraining() {
    setTrainingLoading(true);
    setTrainingError("");
    setTrainingResult(null);

    try {
      const response = await fetch(`${API}/federated/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clients: 15,
        }),
      });

      if (!response.ok) {
        throw new Error("Federated training failed");
      }

      const data = await response.json();

      setTrainingResult(data);
    } catch (error) {
      console.error(error);

      setTrainingError(
        "Federated training failed. Check the FastAPI terminal for details."
      );
    } finally {
      setTrainingLoading(false);
    }
  }

  function goTo(pageName) {
    setPage(pageName);
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Activity size={28} />
          </div>

          <div>
            <h2>PE-FedHealth</h2>
            <span>INTELLIGENT HEALTH AI</span>
          </div>

        </div>

        <div className="nav-label">
          WORKSPACE
        </div>

        <nav>

          {menuItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                page === name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => goTo(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <div className="privacy-mini">

            <ShieldCheck size={22} />

            <div>
              <strong>Privacy aware</strong>
              <span>Research prototype</span>
            </div>

          </div>

          <button
            className={
              page === "Settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => goTo("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        <header className="page-header">

          <div>

            <p className="eyebrow">
              AI-POWERED HEALTH ANALYTICS
            </p>

            <h1>
              {page === "Overview"
                ? "Health Intelligence"
                : page}
            </h1>

            <p className="subtitle">
              Privacy-preserving and explainable
              federated learning for wearable
              sensor research.
            </p>

          </div>

          <div className="research-pill">
            <Activity size={17} />
            Research dashboard
          </div>

        </header>

        {/* OVERVIEW */}

        {page === "Overview" && (

          <section>

            <div className="stats-grid">

              <StatCard
                icon={HeartPulse}
                title="ECG SIGNAL"
                value="72.4"
                unit="bpm*"
                note="Illustrative sensor value"
              />

              <StatCard
                icon={Waves}
                title="EDA SIGNAL"
                value="0.42"
                unit="μS*"
                note="Illustrative sensor value"
              />

              <StatCard
                icon={Thermometer}
                title="TEMPERATURE"
                value="36.8"
                unit="°C*"
                note="Illustrative sensor value"
              />

              <StatCard
                icon={Wind}
                title="RESPIRATION"
                value="16.2"
                unit="/min*"
                note="Illustrative sensor value"
              />

            </div>

            <div className="panel">

              <div className="panel-heading">

                <div>

                  <h2>PE-FedHealth</h2>

                  <p>
                    Privacy-preserving and explainable
                    federated learning framework.
                  </p>

                </div>

                <Activity size={28} />

              </div>

              <div className="overview-grid">

                <InfoBox
                  title="Dataset"
                  value="WESAD"
                />

                <InfoBox
                  title="Federated Clients"
                  value="15"
                />

                <InfoBox
                  title="Training Rounds"
                  value="5"
                />

                <InfoBox
                  title="Aggregation"
                  value="Weighted Averaging"
                />

              </div>

              <div className="warning-box">

                WESAD labels are not clinical disease
                diagnoses. Therefore, the system produces
                research-oriented physiological state
                indicators rather than medical diagnoses.

              </div>

              <button
                className="primary-button"
                onClick={() => goTo("Risk Prediction")}
              >
                Run Risk Prediction
              </button>

            </div>

          </section>
        )}

        {/* RISK PREDICTION */}

        {page === "Risk Prediction" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Risk Prediction</h2>

                <p>
                  Enter wearable sensor features.
                </p>

              </div>

              <HeartPulse size={28} />

            </div>

            <SensorInputs
              ecg={ecg}
              setEcg={setEcg}
              eda={eda}
              setEda={setEda}
              temp={temp}
              setTemp={setTemp}
              resp={resp}
              setResp={setResp}
            />

            <button
              className="primary-button"
              onClick={predictRisk}
              disabled={predictionLoading}
            >
              {predictionLoading
                ? "Generating Prediction..."
                : "Predict Health Risk"}
            </button>

            {predictionError && (

              <div className="error-box">

                <AlertTriangle size={18} />

                {predictionError}

              </div>

            )}

            {prediction && (

              <div className="result-section">

                <div className="success-heading">

                  <CheckCircle size={23} />

                  <div>
                    <h2>Prediction Results</h2>
                    <p>
                      Research-oriented physiological
                      risk indicators.
                    </p>
                  </div>

                </div>

                <div className="result-grid">

                  <ResultCard
                    title="Cardiac Risk"
                    value={prediction.cardiac_risk}
                  />

                  <ResultCard
                    title="Stress Risk"
                    value={prediction.stress_risk}
                  />

                  <ResultCard
                    title="Respiratory Risk"
                    value={prediction.respiratory_risk}
                  />

                  <ResultCard
                    title="Overall Risk"
                    value={prediction.overall_risk}
                  />

                </div>

                {prediction.predicted_state && (

                  <div className="info-list">

                    <div>
                      <strong>Predicted State</strong>
                      <span>
                        {prediction.predicted_state}
                      </span>
                    </div>

                    <div>
                      <strong>Model Type</strong>
                      <span>
                        {prediction.model_type ||
                          "Logistic Regression"}
                      </span>
                    </div>

                    <div>
                      <strong>Stress Probability</strong>
                      <span>
                        {prediction.stress_probability != null
                          ? `${(
                              prediction.stress_probability * 100
                            ).toFixed(1)}%`
                          : "-"}
                      </span>
                    </div>

                  </div>

                )}

                <div className="warning-box">

                  These are research-oriented risk
                  indicators generated by the current
                  project implementation. They are not
                  medical diagnoses.

                </div>

              </div>

            )}

          </section>

        )}

        {/* EXPLAINABLE AI */}

        {page === "Explainable AI" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Explainable AI</h2>

                <p>
                  SHAP-based feature contribution analysis.
                </p>

              </div>

              <Brain size={28} />

            </div>

            <SensorInputs
              ecg={ecg}
              setEcg={setEcg}
              eda={eda}
              setEda={setEda}
              temp={temp}
              setTemp={setTemp}
              resp={resp}
              setResp={setResp}
            />

            <button
              className="primary-button"
              onClick={explainPrediction}
              disabled={explanationLoading}
            >
              {explanationLoading
                ? "Generating Explanation..."
                : "Explain Prediction"}
            </button>

            {explanationError && (

              <div className="error-box">

                <AlertTriangle size={18} />

                {explanationError}

              </div>

            )}

            {explanation && (

              <div className="result-section">

                <div className="success-heading">

                  <CheckCircle size={23} />

                  <div>

                    <h2>
                      Feature Contributions
                    </h2>

                    <p>
                      SHAP contribution values for
                      the current prediction.
                    </p>

                  </div>

                </div>

                <div className="explanation-grid">

                  {Object.entries(
                    explanation.feature_contributions ||
                    explanation
                  )
                    .filter(
                      ([key]) =>
                        [
                          "ecg_std",
                          "eda_mean",
                          "temp_std",
                          "resp_std",
                        ].includes(key)
                    )
                    .map(([feature, value]) => (

                      <InfoBox
                        key={feature}
                        title={formatFeatureName(feature)}
                        value={
                          typeof value === "number"
                            ? value.toFixed(4)
                            : value
                        }
                      />

                    ))}

                </div>

                {explanation.predicted_state && (

                  <div className="info-list">

                    <div>

                      <strong>
                        Predicted State
                      </strong>

                      <span>
                        {explanation.predicted_state}
                      </span>

                    </div>

                    {explanation.stress_probability != null && (

                      <div>

                        <strong>
                          Stress Probability
                        </strong>

                        <span>
                          {(
                            explanation.stress_probability *
                            100
                          ).toFixed(1)}
                          %
                        </span>

                      </div>

                    )}

                    {explanation.method && (

                      <div>

                        <strong>
                          Method
                        </strong>

                        <span>
                          {explanation.method}
                        </span>

                      </div>

                    )}

                  </div>

                )}

                <div className="warning-box">

                  Feature contribution indicates how
                  each input influenced the model output.
                  It does not establish medical causation.

                </div>

              </div>

            )}

          </section>

        )}

        {/* FEDERATED LEARNING */}

        {page === "Federated Learning" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Federated Learning</h2>

                <p>
                  Distributed Baseline versus Stress
                  model training using multiple clients.
                </p>

              </div>

              <Network size={28} />

            </div>

            <div className="feature-grid">

              <div className="feature-card">

                <div className="feature-icon">
                  <Network size={22} />
                </div>

                <div>
                  <h3>Distributed Clients</h3>

                  <p>
                    Multiple clients train locally
                    using their own physiological data.
                  </p>
                </div>

              </div>

              <div className="feature-card">

                <div className="feature-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h3>Privacy Protection</h3>

                  <p>
                    Differential privacy is applied
                    to local model parameters.
                  </p>
                </div>

              </div>

              <div className="feature-card">

                <div className="feature-icon">
                  <RefreshCw size={22} />
                </div>

                <div>
                  <h3>Weighted Aggregation</h3>

                  <p>
                    Client parameters are combined
                    using sample-weighted aggregation.
                  </p>
                </div>

              </div>

              <div className="feature-card">

                <div className="feature-icon">
                  <Activity size={22} />
                </div>

                <div>
                  <h3>Stress Prediction</h3>

                  <p>
                    The current model learns Baseline
                    versus Stress physiological states.
                  </p>
                </div>

              </div>

            </div>

            <div className="action-row">

              <button
                className="secondary-button"
                onClick={checkFederatedStatus}
                disabled={flLoading}
              >
                {flLoading
                  ? "Checking..."
                  : "Check Status"}
              </button>

              <button
                className="primary-button"
                onClick={startFederatedTraining}
                disabled={trainingLoading}
              >
                {trainingLoading ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="spin"
                    />
                    Training...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Start Federated Training
                  </>
                )}
              </button>

            </div>

            {flStatus && (

              <div className="status-card">

                <div className="success-heading">

                  <CheckCircle size={22} />

                  <div>

                    <h3>
                      Federated Learning Status
                    </h3>

                    <p>
                      {flStatus.status}
                    </p>

                  </div>

                </div>

                <div className="info-list">

                  <div>
                    <strong>Clients</strong>
                    <span>
                      {flStatus.clients}
                    </span>
                  </div>

                  <div>
                    <strong>Privacy</strong>
                    <span>
                      {flStatus.privacy}
                    </span>
                  </div>

                  <div>
                    <strong>Aggregation</strong>
                    <span>
                      {flStatus.aggregation}
                    </span>
                  </div>

                </div>

              </div>

            )}

            {trainingError && (

              <div className="error-box">

                <AlertTriangle size={20} />

                <span>
                  {trainingError}
                </span>

              </div>

            )}

            {trainingResult && (

              <div className="result-section">

                <div className="success-heading">

                  <CheckCircle size={23} />

                  <div>

                    <h2>
                      Training Completed
                    </h2>

                    <p>
                      Federated training results
                      returned successfully by FastAPI.
                    </p>

                  </div>

                </div>

                <div className="result-grid">

                  <InfoBox
                    title="Clients Participated"
                    value={
                      trainingResult.clients_participated
                    }
                  />

                  <InfoBox
                    title="Training Rounds"
                    value={
                      trainingResult.rounds
                    }
                  />

                  <InfoBox
                    title="Global Model"
                    value={
                      trainingResult.global_model?.status
                    }
                  />

                  <InfoBox
                    title="Global Accuracy"
                    value={
                      trainingResult.global_model?.accuracy != null
                        ? `${(
                            trainingResult.global_model.accuracy *
                            100
                          ).toFixed(1)}%`
                        : "-"
                    }
                  />

                  <InfoBox
                    title="Precision"
                    value={
                      trainingResult.global_model?.precision != null
                        ? `${(
                            trainingResult.global_model.precision *
                            100
                          ).toFixed(1)}%`
                        : "-"
                    }
                  />

                  <InfoBox
                    title="Recall"
                    value={
                      trainingResult.global_model?.recall != null
                        ? `${(
                            trainingResult.global_model.recall *
                            100
                          ).toFixed(1)}%`
                        : "-"
                    }
                  />

                  <InfoBox
                    title="F1-Score"
                    value={
                      trainingResult.global_model?.f1_score != null
                        ? `${(
                            trainingResult.global_model.f1_score *
                            100
                          ).toFixed(1)}%`
                        : "-"
                    }
                  />

                  <InfoBox
                    title="ROC-AUC"
                    value={
                      trainingResult.global_model?.roc_auc != null
                        ? `${(
                            trainingResult.global_model.roc_auc *
                            100
                          ).toFixed(1)}%`
                        : "-"
                    }
                  />

                </div>

                <div className="info-list">

                  <div>

                    <strong>
                      Privacy
                    </strong>

                    <span>
                      {trainingResult.privacy}
                    </span>

                  </div>

                  <div>

                    <strong>
                      Aggregation
                    </strong>

                    <span>
                      {trainingResult.aggregation}
                    </span>

                  </div>

                  <div>

                    <strong>
                      Task
                    </strong>

                    <span>
                      {trainingResult.task ||
                        "Baseline vs Stress"}
                    </span>

                  </div>

                  <div>

                    <strong>
                      Evaluation
                    </strong>

                    <span>
                      {trainingResult.global_model
                        ?.evaluation ||
                        "Held-out test data"}
                    </span>

                  </div>

                </div>

                <h2 className="sub-heading">
                  Local Client Training
                </h2>

                <div className="client-list">

                  {trainingResult.client_results?.map(
                    (client) => (

                      <div
                        className="client-row"
                        key={client.client_id}
                      >

                        <div>

                          <strong>
                            Client {client.client_id}
                          </strong>

                          <span>
                            Samples: {client.samples}
                          </span>

                        </div>

                        <strong>
                          {client.accuracy != null
                            ? `${(
                                client.accuracy * 100
                              ).toFixed(1)}%`
                            : "-"}
                        </strong>

                      </div>

                    )
                  )}

                </div>

                <div className="warning-box">

                  Accuracy, precision, recall, F1-score,
                  and ROC-AUC are experimental research
                  metrics evaluated on held-out
                  Baseline/Stress test data.

                </div>

              </div>

            )}

          </section>

        )}

        {/* PRIVACY CENTER */}

        {page === "Privacy Center" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Privacy Center</h2>

                <p>
                  Privacy mechanisms used by
                  the research prototype.
                </p>

              </div>

              <ShieldCheck size={28} />

            </div>

            <div className="privacy-grid">

              <PrivacyCard
                icon={ShieldCheck}
                title="Differential Privacy"
                description="Noise is added to local model parameters to provide an additional privacy layer."
                status="Enabled"
              />

              <PrivacyCard
                icon={Network}
                title="Federated Learning"
                description="Client data remains local while model updates are aggregated."
                status="Enabled"
              />

              <PrivacyCard
                icon={RefreshCw}
                title="Weighted Aggregation"
                description="Client model updates are combined according to the number of local samples."
                status="Enabled"
              />

            </div>

            <div className="warning-box">

              This project is a research prototype.
              The implemented privacy mechanisms should
              not be interpreted as a formal certified
              privacy guarantee.

            </div>

          </section>

        )}

        {/* REPORTS */}

        {page === "Reports" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Reports</h2>

                <p>
                  Project model and experiment summary.
                </p>

              </div>

              <FileText size={28} />

            </div>

            <div className="report-grid">

              <InfoBox
                title="Dataset"
                value="WESAD"
              />

              <InfoBox
                title="Federated Clients"
                value="15"
              />

              <InfoBox
                title="Training Rounds"
                value="5"
              />

              <InfoBox
                title="Prediction Task"
                value="Baseline vs Stress"
              />

            </div>

            {trainingResult?.global_model && (

              <div className="result-section">

                <h2>
                  Latest Federated Results
                </h2>

                <div className="result-grid">

                  <ResultCard
                    title="Accuracy"
                    value={
                      trainingResult.global_model.accuracy
                    }
                  />

                  <ResultCard
                    title="Precision"
                    value={
                      trainingResult.global_model.precision
                    }
                  />

                  <ResultCard
                    title="Recall"
                    value={
                      trainingResult.global_model.recall
                    }
                  />

                  <ResultCard
                    title="F1-Score"
                    value={
                      trainingResult.global_model.f1_score
                    }
                  />

                  <ResultCard
                    title="ROC-AUC"
                    value={
                      trainingResult.global_model.roc_auc
                    }
                  />

                </div>

              </div>

            )}

            <div className="warning-box">

              WESAD is a wearable stress and affect
              dataset. The results should be presented
              as research-oriented physiological state
              prediction rather than clinical diagnosis.

            </div>

          </section>

        )}

        {/* SETTINGS */}

        {page === "Settings" && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>Settings</h2>

                <p>
                  PE-FedHealth project configuration.
                </p>

              </div>

              <Settings size={28} />

            </div>

            <div className="settings-list">

              <div className="setting-row">

                <div>

                  <strong>
                    Backend API
                  </strong>

                  <span>
                    FastAPI
                  </span>

                </div>

                <span className="status-badge">
                  Active
                </span>

              </div>

              <div className="setting-row">

                <div>

                  <strong>
                    Frontend
                  </strong>

                  <span>
                    React + Vite
                  </span>

                </div>

                <span className="status-badge">
                  Active
                </span>

              </div>

              <div className="setting-row">

                <div>

                  <strong>
                    Dataset
                  </strong>

                  <span>
                    WESAD
                  </span>

                </div>

                <span className="status-badge">
                  Loaded
                </span>

              </div>

              <div className="setting-row">

                <div>

                  <strong>
                    Model
                  </strong>

                  <span>
                    Logistic Regression
                  </span>

                </div>

                <span className="status-badge">
                  Ready
                </span>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}


/* ------------------------------------------------ */
/* SENSOR INPUTS */
/* ------------------------------------------------ */

function SensorInputs({
  ecg,
  setEcg,
  eda,
  setEda,
  temp,
  setTemp,
  resp,
  setResp,
}) {
  return (

    <div className="input-grid">

      <InputField
        label="ECG Std Dev"
        value={ecg}
        setValue={setEcg}
        icon={HeartPulse}
      />

      <InputField
        label="EDA Mean"
        value={eda}
        setValue={setEda}
        icon={Waves}
      />

      <InputField
        label="Temperature Std Dev"
        value={temp}
        setValue={setTemp}
        icon={Thermometer}
      />

      <InputField
        label="Respiratory Std Dev"
        value={resp}
        setValue={setResp}
        icon={Wind}
      />

    </div>

  );
}


/* ------------------------------------------------ */
/* INPUT FIELD */
/* ------------------------------------------------ */

function InputField({
  label,
  value,
  setValue,
  icon: Icon,
}) {
  return (

    <div className="input-group">

      <label>
        <Icon size={17} />
        {label}
      </label>

      <input
        type="number"
        step="any"
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
      />

    </div>

  );
}


/* ------------------------------------------------ */
/* STAT CARD */
/* ------------------------------------------------ */

function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  note,
}) {
  return (

    <div className="stat-card">

      <div className="stat-icon">
        <Icon size={22} />
      </div>

      <span className="stat-title">
        {title}
      </span>

      <div className="stat-value">

        {value}

        <small>
          {unit}
        </small>

      </div>

      <span className="stat-note">
        {note}
      </span>

    </div>

  );
}


/* ------------------------------------------------ */
/* INFO BOX */
/* ------------------------------------------------ */

function InfoBox({
  title,
  value,
}) {
  return (

    <div className="info-box">

      <span>
        {title}
      </span>

      <strong>
        {value ?? "-"}
      </strong>

    </div>

  );
}


/* ------------------------------------------------ */
/* RESULT CARD */
/* ------------------------------------------------ */

function ResultCard({
  title,
  value,
}) {
  let displayValue = "-";

  if (value !== null && value !== undefined) {

    if (
      typeof value === "number" &&
      value >= 0 &&
      value <= 1
    ) {
      displayValue =
        `${(value * 100).toFixed(1)}%`;
    } else if (
      typeof value === "number"
    ) {
      displayValue =
        `${value.toFixed(1)}%`;
    } else {
      displayValue = value;
    }

  }

  return (

    <div className="result-card">

      <span>
        {title}
      </span>

      <strong>
        {displayValue}
      </strong>

    </div>

  );
}


/* ------------------------------------------------ */
/* PRIVACY CARD */
/* ------------------------------------------------ */

function PrivacyCard({
  icon: Icon,
  title,
  description,
  status,
}) {
  return (

    <div className="privacy-card">

      <div className="privacy-card-icon">
        <Icon size={24} />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <span className="status-badge">
        {status}
      </span>

    </div>

  );
}


/* ------------------------------------------------ */
/* FEATURE NAME */
/* ------------------------------------------------ */

function formatFeatureName(feature) {

  const names = {
    ecg_std: "ECG Standard Deviation",
    eda_mean: "EDA Mean",
    temp_std: "Temperature Standard Deviation",
    resp_std: "Respiratory Standard Deviation",
  };

  return names[feature] || feature;
}


export default App;
