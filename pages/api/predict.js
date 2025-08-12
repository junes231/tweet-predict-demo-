// pages/api/predict.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { tweetA, tweetB } = req.body;
  if (!tweetA && !tweetB) {
    return res.status(400).json({ error: "Both tweets are empty" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 调用 OpenAI API 进行预测
    const prompt = `
You are an AI that predicts Twitter engagement. 
Given two tweets, predict the expected likes, retweets, and comments for each one.
Return ONLY JSON with this structure:
{
  "a": {"likes": number, "retweets": number, "comments": number, "confidence": number},
  "b": {"likes": number, "retweets": number, "comments": number, "confidence": number}
}

Tweet A: "${tweetA}"
Tweet B: "${tweetB}"
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    let prediction;
    try {
      prediction = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse model output", e);
      return res.status(500).json({ error: "Failed to parse model output" });
    }

    // 生成简单的趋势图数据（假设增长率恒定）
    const makeSeries = (base) =>
      Array.from({ length: 24 }, (_, i) =>
        Math.round((base / 24) * (i + 1) + Math.random() * 3)
      );

    const chartData = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [
        { label: "Tweet A", data: makeSeries(prediction.a.likes), borderColor: "rgb(75,192,192)" },
        { label: "Tweet B", data: makeSeries(prediction.b.likes), borderColor: "rgb(255,99,132)" }
      ]
    };

    return res.status(200).json({
      a: prediction.a,
      b: prediction.b,
      chartData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Prediction failed" });
  }
}
