// /pages/api/predict.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { tweetA, tweetB } = req.body;

    // 调用 OpenAI API（免依赖版本）
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY in environment variables");
    }

    // 拼接 prompt
    const prompt = `
    Compare the engagement potential of the two tweets below.
    Tweet A: "${tweetA}"
    Tweet B: "${tweetB}"
    Return JSON with fields: a.likes, a.retweets, a.comments, a.confidence,
    b.likes, b.retweets, b.comments, b.confidence.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 你也可以用 gpt-3.5-turbo
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 尝试解析 AI 返回的 JSON
    const result = JSON.parse(content);

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Prediction failed" });
  }
}
