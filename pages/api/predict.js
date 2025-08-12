// pages/api/predict.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { tweetA, tweetB } = req.body;

  if (!tweetA || !tweetB) {
    return res.status(400).json({ error: "Missing tweet content" });
  }

  try {
    const prompt = `
      You are an AI that predicts engagement metrics for two tweets.
      For each tweet, estimate: likes, retweets, comments, and confidence (0 to 1).
      Return JSON in the following format:
      {
        "a": { "likes": number, "retweets": number, "comments": number, "confidence": number },
        "b": { "likes": number, "retweets": number, "comments": number, "confidence": number }
      }

      Tweet A: "${tweetA}"
      Tweet B: "${tweetB}"
    `;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY in environment variables");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    // 尝试解析 AI 返回的 JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    res.status(200).json({
      ...result,
      chartData: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
        datasets: [
          {
            label: "Tweet A",
            data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 5)),
            borderColor: "rgb(75,192,192)",
          },
          {
            label: "Tweet B",
            data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 4)),
            borderColor: "rgb(255,99,132)",
          },
        ],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Prediction failed" });
  }
}
