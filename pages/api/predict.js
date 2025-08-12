// pages/api/predict.js
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  const { tweetA = "", tweetB = "" } = req.body;

  // simple heuristic + randomness to make outputs plausible
  function score(text) {
    const len = Math.min(text.length, 280);
    const words = text.split(/\s+/).filter(Boolean).length;
    const exclaim = (text.match(/!/g) || []).length;
    const hashtags = (text.match(/#/g) || []).length;
    const caps = Math.min((text.match(/[A-Z]/g) || []).length / Math.max(1, text.length), 0.2);

    let base = len * 0.2 + words * 2 + exclaim * 15 + hashtags * 10 + caps * 50;
    // keywords boost
    const kwBoost = (text.match(/\b(AI|breaking|news|win|vote|Trump|Biden)\b/gi) || []).length * 50;
    base += kwBoost;
    // randomness
    base = Math.round(Math.max(5, base * (0.6 + Math.random() * 0.8)));
    return base;
  }

  const aScore = score(tweetA);
  const bScore = score(tweetB);

  function makeTimeSeries(scoreVal) {
    // simulate 24-hour cumulative curve
    const points = [];
    let cum = 0;
    for (let h = 0; h < 24; h++) {
      // growth rate varies; more activity early hours
      const rate = (0.02 + Math.random() * 0.08) * (1 + Math.sin((h / 24) * Math.PI));
      cum += Math.max(0, Math.round(scoreVal * rate));
      points.push(cum);
    }
    return points;
  }

  const aSeries = makeTimeSeries(aScore);
  const bSeries = makeTimeSeries(bScore);

  const response = {
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
        {
          label: "Tweet A",
          data: aSeries,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75,192,192,0.2)",
          tension: 0.25
        },
        {
          label: "Tweet B",
          data: bSeries,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255,99,132,0.2)",
          tension: 0.25
        }
      ]
    }
  };

  return res.status(200).json(response);
}
