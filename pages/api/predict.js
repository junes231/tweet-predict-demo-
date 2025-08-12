// pages/api/predict.js
// Immune to SDK: use fetch, robust parsing of model output with code fences, and helpful logs.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { tweetA = "", tweetB = "" } = req.body || {};
    if (!tweetA && !tweetB) {
      return res.status(400).json({ error: "Provide tweetA or tweetB" });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      console.error("❌ Missing OPENAI_API_KEY in environment variables.");
      return res.status(500).json({ error: "Server misconfiguration: OPENAI_API_KEY missing" });
    }

    // Prompt - keep it strict so model returns JSON
    const prompt = `
You are a concise social media analyst. Given two tweets, predict the expected engagement
(numbers) for each tweet in the first 24 hours. Return only a JSON object (no explanation)
with this exact structure:

{
  "a": { "likes": number, "retweets": number, "comments": number, "quotes": number, "confidence": number },
  "b": { "likes": number, "retweets": number, "comments": number, "quotes": number, "confidence": number }
}

Tweet A: ${JSON.stringify(tweetA)}
Tweet B: ${JSON.stringify(tweetB)}

Make numbers realistic (integers) and confidence between 0 and 1.
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or "gpt-3.5-turbo" if you prefer
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500
      }),
    });

    const rawText = await r.text();
    console.log("🔍 OpenAI raw response:", rawText);

    // Try parse whole HTTP response as JSON
    let whole;
    try {
      whole = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Response is not valid top-level JSON from OpenAI:", e);
      return res.status(500).json({ error: "OpenAI top-level response not JSON", raw: rawText });
    }

    const modelContent = whole?.choices?.[0]?.message?.content ?? "";
    if (!modelContent) {
      console.error("❌ No model content found in response", whole);
      return res.status(500).json({ error: "No content in model response", raw: whole });
    }

    // Remove surrounding code fences if present and try to extract JSON substring
    let jsonText = modelContent;
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      jsonText = fenceMatch[1];
    } else {
      // remove any stray ``` and trim
      jsonText = jsonText.replace(/```/g, "").trim();
    }

    // If still not pure JSON, try to extract the first {...} block
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      const maybe = jsonText.match(/\{[\s\S]*\}/);
      if (maybe) {
        try {
          parsed = JSON.parse(maybe[0]);
        } catch (e2) {
          console.error("❌ Failed to parse JSON inside model content:", e2);
          return res.status(500).json({ error: "Failed to parse JSON from model", rawModelContent: jsonText });
        }
      } else {
        console.error("❌ No JSON found inside model content.");
        return res.status(500).json({ error: "Model did not return JSON", rawModelContent: jsonText });
      }
    }

    // Validate shape minimally
    if (!parsed.a || !parsed.b) {
      console.error("❌ Parsed object missing a or b:", parsed);
      return res.status(500).json({ error: "Parsed JSON missing keys", parsed });
    }

    // Build deterministic-ish chart series from likes
    function makeSeriesFromLikes(likes) {
      const arr = [];
      let cum = 0;
      // Spread likes across 24 points with small smooth ramp
      for (let i = 0; i < 24; i++) {
        // simple deterministic increment based on position (no randomness)
        const frac = (i + 1) / 24;
        const inc = Math.max(0, Math.round((likes / 24) * (0.6 + 0.8 * frac)));
        cum += inc;
        arr.push(cum);
      }
      return arr;
    }

    const aLikes = Math.max(0, Math.round(parsed.a.likes || 0));
    const bLikes = Math.max(0, Math.round(parsed.b.likes || 0));

    const chartData = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [
        { label: "Tweet A", data: makeSeriesFromLikes(aLikes), borderColor: "rgb(75,192,192)" },
        { label: "Tweet B", data: makeSeriesFromLikes(bLikes), borderColor: "rgb(255,99,132)" }
      ]
    };

    // return normalized object + chartData
    const result = {
      a: {
        likes: aLikes,
        retweets: Math.max(0, Math.round(parsed.a.retweets || 0)),
        comments: Math.max(0, Math.round(parsed.a.comments || 0)),
        quotes: Math.max(0, Math.round(parsed.a.quotes || 0)),
        confidence: Number(parsed.a.confidence || 0)
      },
      b: {
        likes: bLikes,
        retweets: Math.max(0, Math.round(parsed.b.retweets || 0)),
        comments: Math.max(0, Math.round(parsed.b.comments || 0)),
        quotes: Math.max(0, Math.round(parsed.b.quotes || 0)),
        confidence: Number(parsed.b.confidence || 0)
      },
      chartData
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error("❌ API handler error:", err);
    return res.status(500).json({ error: "Prediction failed", detail: err.message });
  }
}
