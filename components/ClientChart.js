// components/ClientChart.js
import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function ClientChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const cfg = {
      type: "line",
      data: data,
      options: { responsive: true, plugins: { legend: { position: "top" } } }
    };
    const chart = new Chart(ctx, cfg);
    return () => chart.destroy();
  }, [data]);

  return <canvas ref={canvasRef} />;
}
