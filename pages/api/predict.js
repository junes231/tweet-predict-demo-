// pages/api/predict.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tweetA, tweetB } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });
  }

  try {
    const prompt = `
    我会给你两个推文版本，请预测每个版本可能的互动情况。
    请按以下 JSON 格式返回：
    {
      "versionA": { "likes": 数字, "comments": 数字, "retweets": 数字, "quotes": 数字 },
      "versionB": { "likes": 数字, "comments": 数字, "retweets": 数字, "quotes": 数字 }
    }

    推文版本A:
    ${tweetA}

    推文版本B:
    ${tweetB}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 你可以换成别的模型
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    let predictions;
    try {
      predictions = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ message: '模型返回数据解析失败', raw: text });
    }

    res.status(200).json(predictions);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'API 调用失败', error: error.message });
  }
}
