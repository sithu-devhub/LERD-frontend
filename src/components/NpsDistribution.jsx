// src/components/NpsDistribution.jsx

import React, { useState, useEffect } from "react";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";

export default function NpsDistribution({ surveyId, gender, participantType, period }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDistribution() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/charts/nps`;
        const params = new URLSearchParams({ surveyId });
        if (gender != null) params.append("gender", gender);
        if (participantType != null) params.append("participantType", participantType);
        if (period != null) params.append("period", period);

        const url = `${baseUrl}?${params.toString()}`;

        // ---- CONST TO SIMULATE ERROR -----
        const SIMULATE_ERROR = null; // "500", "401", null for no error
        // ---- CONST TO SIMULATE ERROR -----

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        
        // ---- SIMULATE ERROR -----
        if (SIMULATE_ERROR) {
          throw new Error(`Error ${SIMULATE_ERROR}`);
        }
        // ---- SIMULATE ERROR -----

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (!cancelled && json.success) {
          const dist = json.data?.distribution || {};
          setDistribution([
            { name: "Promoter", value: dist.promoterPercentage ?? 0, count: dist.promoterCount ?? 0, color: "#3F11FF" },
            { name: "Passive", value: dist.passivePercentage ?? 0, count: dist.passiveCount ?? 0, color: "#6AD2FF" },
            { name: "Detractor", value: dist.detractorPercentage ?? 0, count: dist.detractorCount ?? 0, color: "#9CA3AF" },
          ]);
        }

      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load NPS distribution");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDistribution();
    return () => {
      cancelled = true;
    };
  }, [surveyId, gender, participantType, period]);

  return (
    <ChartCard
      title="NPS Distribution"
      content={
        loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-10 bg-gray-200 rounded"></div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorPlaceholder
            status={error}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <div className="space-y-3">
            {distribution.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>{item.name}</span>
                  <span>{item.count} ({item.value}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      }
    />
  );
}
