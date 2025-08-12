// pages/index.js
import { useState } from "react";
import dynamic from "next/dynamic";
const ClientChart = dynamic(() => import("../components/ClientChart"), { ssr: false });

export default function Home() {
  const [tweetA, setTweetA] = useState("");
  const [tweetB, setTweetB] = useState("");
  const [resData, setResData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetA, tweetB })
      });
      if (!r.ok) throw new Error("API error");
      const j = await r.json();
      setResData(j);
    } catch (e) {
      console.error(e);
      setErr("Prediction failed — showing fallback results.");
      // If API fails, call the same endpoint will return fallback due to server code
      // but to be safe, show some local fallback:
      setResData({
        a: { likes: 50, retweets: 15, comments: 5, quotes: 2, confidence: 0.5 },
        b: { likes: 40, retweets: 12, comments: 4, quotes: 1, confidence: 0.45 },
        chartData: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
          datasets: [
            { label: "Tweet A", data: Array.from({ length: 24 }, () => Math.floor(Math.random()*5)), borderColor: "rgb(75,192,192)" },
            { label: "Tweet B", data: Array.from({ length: 24 }, () => Math.floor(Math.random()*4)), borderColor: "rgb(255,99,132)" }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <h1>Tweet Engagement Predictor (Demo)</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <textarea placeholder="Enter Tweet A..." value={tweetA} onChange={e=>setTweetA(e.target.value)} style={{flex:1, minHeight:120}}/>
        <textarea placeholder="Enter Tweet B..." value={tweetB} onChange={e=>setTweetB(e.target.value)} style={{flex:1, minHeight:120}}/>
      </div>

      <button onClick={handlePredict} disabled={loading || (!tweetA && !tweetB)} style={{padding:"8px 14px", background:"#0366d6", color:"#fff", border:0, borderRadius:6}}>
        {loading ? "Predicting..." : "Predict"}
      </button>

      {err && <div style={{ color: "orange", marginTop: 10 }}>{err}</div>}

      {resData && (
        <div style={{ marginTop: 18, background:"#fff", padding:16, borderRadius:8 }}>
          <div style={{ display:"flex", gap:16 }}>
            <div style={{flex:1}}>
              <h3>Tweet A</h3>
              <p>Likes: <strong>{resData.a.likes}</strong></p>
              <p>Retweets: <strong>{resData.a.retweets}</strong></p>
              <p>Comments: <strong>{resData.a.comments}</strong></p>
              <p>Confidence: <strong>{Math.round(resData.a.confidence*100)}%</strong></p>
            </div>
            <div style={{flex:1}}>
              <h3>Tweet B</h3>
              <p>Likes: <strong>{resData.b.likes}</strong></p>
              <p>Retweets: <strong>{resData.b.retweets}</strong></p>
              <p>Comments: <strong>{resData.b.comments}</strong></p>
              <p>Confidence: <strong>{Math.round(resData.b.confidence*100)}%</strong></p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4>Cumulative Engagement</h4>
            <ClientChart data={resData.chartData} />
          </div>
        </div>
      )}
    </div>
  );
}
