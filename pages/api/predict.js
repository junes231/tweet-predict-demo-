// pages/api/predict.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { tweetA, tweetB } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ Missing OPENAI_API_KEY in environment variables.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // 构造要发送给 OpenAI 的 prompt
    const prompt = `
Compare the potential Twitter engagement between these two tweets:
Tweet A: "${tweetA}"
Tweet B: "${tweetB}"
Estimate likes, retweets, comments, and give a confidence score (0-1) for each.
Respond in JSON format like:
{
  "a": { "likes": number, "retweets": number, "comments": number, "quotes": number, "confidence": number },
  "b": { "likes": number, "retweets": number, "comments": number, "quotes": number, "confidence": number }
}
    `.trim();

    // 调用 OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }),
    });

    const rawText = await response.text();
    console.log("🔍 OpenAI raw response:", rawText);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      return res.status(500).json({ error: "Invalid JSON from OpenAI", raw: rawText });
    }

    const content = parsed?.choices?.[0]?.message?.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse model content:", content);
      return res.status(500).json({ error: "Model returned invalid JSON", raw: content });
    }

    // 返回预测结果 + chartData
    result.chartData = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [
        { label: "Tweet A", data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 5)), borderColor: "rgb(75,192,192)" },
        { label: "Tweet B", data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 4)), borderColor: "rgb(255,99,132)" }
      ]
    };

    res.status(200).json(result);

  } catch (err) {
    console.error("❌ API request error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
}
