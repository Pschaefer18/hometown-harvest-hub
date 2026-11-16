"use client";

// Latest reading + history charts for one Raspberry Pi climate source,
// plus the set-temperature control when the source has one.
import { useCallback, useEffect, useState } from "react";
import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from "firebase/firestore";
import { climateDb, climateIsSeparate } from "@/lib/firebase";
import LineChart from "./LineChart";
import { signInWithGoogle } from "./AuthGate";

// Ranges are measured back from the most recent reading, so the charts still
// show the last data even when the Pis are off for the winter.
const RANGES = [
  { id: "24h", label: "24 hours", ms: 24 * 3600e3 },
  { id: "7d", label: "7 days", ms: 7 * 24 * 3600e3 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 3600e3 },
];
const MAX_POINTS = 3000;

const round1 = (n) => Math.round(n * 10) / 10;

export default function ClimatePanel({ source }) {
  const [range, setRange] = useState(RANGES[0]);
  const [readings, setReadings] = useState(null);
  const [setpoint, setSetpoint] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReadings(null);
    setError("");
    (async () => {
      const log = collection(climateDb, source.collection, "history", "log");
      const latest = await getDocs(query(log, orderBy("timestamp", "desc"), limit(1)));
      let rows = [];
      if (!latest.empty) {
        const end = latest.docs[0].get("timestamp").toMillis();
        const snap = await getDocs(
          query(log, where("timestamp", ">=", Timestamp.fromMillis(end - range.ms)), orderBy("timestamp"), limit(MAX_POINTS))
        );
        rows = snap.docs.map((d) => ({ t: d.get("timestamp").toMillis(), ...d.data() }));
      }
      const set = source.hasSetpoint ? await getDoc(doc(climateDb, source.collection, "set-climate")) : null;
      if (cancelled) return;
      setReadings(rows);
      if (set?.exists()) setSetpoint(set.get("temperature"));
    })().catch((err) => {
      if (!cancelled) setError(err.code === "permission-denied" ? "permission" : err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [source, range, reloadKey]);

  if (error === "permission") {
    return (
      <div className="card">
        <p>Couldn&apos;t read the {source.title.toLowerCase()} data{climateIsSeparate ? " from the climate project" : ""}.</p>
        <button className="btn btn-primary" onClick={() => signInWithGoogle().then(() => setReloadKey((k) => k + 1))}>
          Reconnect with Google
        </button>
        <p className="muted small">If this keeps happening, see &quot;Climate data&quot; in the README.</p>
      </div>
    );
  }
  if (error) return <p className="error">{error}</p>;

  const temps = (readings || []).filter((r) => typeof r.temperature === "number").map((r) => ({ t: r.t, v: round1(r.temperature) }));
  const humidity = (readings || []).filter((r) => typeof r.humidity === "number").map((r) => ({ t: r.t, v: round1(r.humidity) }));
  const last = readings?.[readings.length - 1];

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="stat-value">{last?.temperature != null ? `${round1(last.temperature)}°F` : "—"}</div>
          <div className="stat-label">Temperature</div>
        </div>
        {last?.humidity != null && (
          <div className="stat">
            <div className="stat-value">{round1(last.humidity)}%</div>
            <div className="stat-label">Humidity</div>
          </div>
        )}
        <div className="stat">
          <div className="stat-value small-value">{last ? new Date(last.t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</div>
          <div className="stat-label">Last reading</div>
        </div>
      </div>

      {source.hasSetpoint && <SetpointEditor source={source} value={setpoint} onSaved={setSetpoint} />}

      <div className="segmented">
        {RANGES.map((r) => (
          <button key={r.id} className={r.id === range.id ? "active" : ""} onClick={() => setRange(r)}>
            {r.label}
          </button>
        ))}
      </div>

      {readings === null ? (
        <p className="muted">Loading readings…</p>
      ) : (
        <>
          <section className="card">
            <h3>Temperature (°F)</h3>
            <LineChart points={temps} unit="°F" reference={source.hasSetpoint ? setpoint : null} label={`${source.title} temperature`} />
          </section>
          {humidity.length > 0 && (
            <section className="card">
              <h3>Humidity (%)</h3>
              <LineChart points={humidity} unit="%" label={`${source.title} humidity`} />
            </section>
          )}
        </>
      )}
    </>
  );
}

function SetpointEditor({ source, value, onSaved }) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(value ?? ""), [value]);

  const save = useCallback(async () => {
    const temp = parseFloat(draft);
    if (Number.isNaN(temp) || temp < 40 || temp > 110) {
      alert("Enter a temperature between 40 and 110 °F.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(climateDb, source.collection, "set-climate"), { temperature: temp }, { merge: true });
      onSaved(temp);
    } catch (err) {
      alert(`Couldn't save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [draft, source, onSaved]);

  return (
    <div className="card setpoint">
      <label className="field">
        <span>Set temperature (°F)</span>
        <input type="number" inputMode="decimal" step="0.5" value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <button className="btn btn-primary" onClick={save} disabled={saving || String(draft) === String(value ?? "")}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
