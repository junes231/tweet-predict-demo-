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
    // pages/api/predict.js
export default async function handler(req, res) {
  try {
    const { tweetA, tweetB } = req.body;

    if (!tweetA || !tweetB) {
      return res.status(400).json({ error: 'Missing tweets' });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 也可用 gpt-4o
        messages: [
          {
            role: "system",
            content: "You are an expert social media analyst. Predict engagement for two tweets."
          },
          {
            role: "user",
            content: `Predict the number of likes, retweets, and comments each tweet will get in the first 24 hours.\n\nTweet A: "${tweetA}"\nTweet B: "${tweetB}"\nRespond in JSON format: {"A": {"likes": ..., "retweets": ..., "comments": ..., "confidence": ...}, "B": {...}}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();

    let prediction;
    try {
      prediction = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response", raw: data });
    }

    res.status(200).json(prediction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
