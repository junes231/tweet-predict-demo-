const handlePredict = async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetA, tweetB })
    });

    if (!res.ok) throw new Error("API request failed");

    const data = await res.json();
    setPrediction(data);

  } catch (err) {
    console.error(err);
    setError("Prediction failed, showing simulated results.");
    setPrediction({
      tweetA: { likes: 50, retweets: 20, comments: 5, confidence: 0.5 },
      tweetB: { likes: 40, retweets: 15, comments: 4, confidence: 0.45 }
    });
  } finally {
    setLoading(false);
  }
};
