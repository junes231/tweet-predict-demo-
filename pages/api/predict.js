// pages/api/predict.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

    const { tweetA = "", tweetB = "" } = req.body;
    if (!tweetA && !tweetB) return res.status(400).json({ error: "Provide tweetA or tweetB" });

    // simple scoring heuristic (deterministic-ish)
    function score(text) {
      const len = Math.min((text || "").length, 280);
      const words = (text || "").split(/\s+/).filter(Boolean).length;
      const exclaim = ((text || "").match(/!/g) || []).length;
      const hashtags = ((text || "").match(/#/g) || []).length;
      const kw = ((text || "").match(/\b(AI|news|breaking|win|vote|Trump|Biden)\b/gi) || []).length;
      const base = Math.round(len * 0.15 + words * 1.5 + exclaim * 12 + hashtags * 8 + kw * 40);
      return Math.max(5, base);
    }

    const aScore = score(tweetA);
    const bScore = score(tweetB);

    function makeSeries(scoreVal) {
      const arr = [];
      let cum = 0;
      for (let h = 0; h < 24; h++) {
        const rate = (0.02 + 0.06 * Math.sin((h / 24) * Math.PI)) + (Math.random() * 0.03);
        cum += Math.round(scoreVal * rate);
        arr.push(cum);
      }
      return arr;
    }

    const aSeries = makeSeries(aScore);
    const bSeries = makeSeries(bScore);

    const result = {
      a: {
        likes: aScore,
        retweets: Math.round(aScore * 0.35),
        comments: Math.round(aScore * 0.12),
        quotes: Math.round(aScore * 0.05),
        confidence: Math.min(0.99, 0.5 + Math.random() * 0.45)
      },
      b: {
        likes: bScore,
        retweets: Math.round(bScore * 0.35),
        comments: Math.round(bScore * 0.12),
        quotes: Math.round(bScore * 0.05),
        confidence: Math.min(0.99, 0.5 + Math.random() * 0.45)
      },
      chartData: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
        datasets: [
          { label: "Tweet A", data: aSeries, borderColor: "rgb(75,192,192)" },
          { label: "Tweet B", data: bSeries, borderColor: "rgb(255,99,132)" }
        ]
      }
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error("predict api error:", err);
    // fallback safe response
    return res.status(200).json({
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
  }
}
