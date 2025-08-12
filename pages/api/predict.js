// pages/api/predict.js
export default async function handler(req, res) {
  try {
    const { tweetA, tweetB } = req.body;

    // 如果没有传推文内容
    if (!tweetA || !tweetB) {
      return res.status(400).json({ error: "Missing tweets" });
    }

    // ==== 真实 API 调用（目前先注释掉） ====
    // const openaiApiKey = process.env.OPENAI_API_KEY;
    // if (!openaiApiKey) throw new Error("Missing API key");
    // const result = await fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${openaiApiKey}`
    //   },
    //   body: JSON.stringify({
    //     model: "gpt-3.5-turbo",
    //     messages: [
    //       { role: "system", content: "You are an AI that predicts tweet engagement." },
    //       { role: "user", content: `Predict engagement for:\nA: ${tweetA}\nB: ${tweetB}` }
    //     ]
    //   })
    // });

    // 如果真实 API 失败，直接走模拟预测
    const fakePrediction = {
      tweetA: { likes: 120, retweets: 45, comments: 12, confidence: 0.76 },
      tweetB: { likes: 90, retweets: 30, comments: 8, confidence: 0.65 }
    };

    res.status(200).json(fakePrediction);

  } catch (error) {
    console.error("Prediction API error:", error);

    // 返回模拟结果作为兜底
    res.status(200).json({
      tweetA: { likes: 50, retweets: 20, comments: 5, confidence: 0.5 },
      tweetB: { likes: 40, retweets: 15, comments: 4, confidence: 0.45 }
    });
  }
}
