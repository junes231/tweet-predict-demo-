import { useState } from "react";
import Head from "next/head";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [tweetA, setTweetA] = useState("");
  const [tweetB, setTweetB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetA, tweetB })
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Tweet Predict Demo</title>
      </Head>
      <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
        <h1 style={{ marginBottom: 12 }}>Tweet Engagement Predictor (Demo)</h1>

        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <textarea
            placeholder="Enter Tweet A..."
            value={tweetA}
            onChange={(e) => setTweetA(e.target.value)}
            style={{ flex: 1, minHeight: 120, padding: 10, fontSize: 14 }}
          />
          <textarea
            placeholder="Enter Tweet B..."
            value={tweetB}
            onChange={(e) => setTweetB(e.target.value)}
            style={{ flex: 1, minHeight: 120, padding: 10, fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handlePredict}
            disabled={loading || (!tweetA && !tweetB)}
            style={{
              background: "#0366d6",
              color: "#fff",
              padding: "10px 16px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>

        {result && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
            <h2 style={{ marginTop: 0 }}>Prediction Result</h2>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3>Tweet A</h3>
                <p>Likes: <strong>{result.a.likes}</strong></p>
                <p>Retweets: <strong>{result.a.retweets}</strong></p>
                <p>Comments: <strong>{result.a.comments}</strong></p>
                <p>Quotes: <strong>{result.a.quotes}</strong></p>
                <p>Confidence: <strong>{(result.a.confidence*100).toFixed(0)}%</strong></p>
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <h3>Tweet B</h3>
                <p>Likes: <strong>{result.b.likes}</strong></p>
                <p>Retweets: <strong>{result.b.retweets}</strong></p>
                <p>Comments: <strong>{result.b.comments}</strong></p>
                <p>Quotes: <strong>{result.b.quotes}</strong></p>
                <p>Confidence: <strong>{(result.b.confidence*100).toFixed(0)}%</strong></p>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h3>Cumulative Engagement (simulated)</h3>
              <Line data={result.chartData} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, color: "#666" }}>
          <small>Demo: the predictions are simulated (not real model). Use for prototype/UI only.</small>
        </div>
      </div>
    </>
  );
}
