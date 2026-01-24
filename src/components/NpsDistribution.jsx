// src/components/NpsDistribution.jsx

import React, { useState, useEffect, useMemo } from "react";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";
import http from "../api/http";
import { useFilteredRegions } from "../utils/useFilteredRegions";

export default function NpsDistribution({ surveyId, gender, participantType, period }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState([]);

  const { selectedRegionIds, loading: regionFilterLoading } =
    useFilteredRegions(surveyId);

  /* ---------- LOCAL STORAGE (MEMO) ---------- */
  const storedSelectedRegionIds = useMemo(() => {
    try {
      const raw = localStorage.getItem(`selectedRegionIds:${surveyId}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }, [surveyId]);

  /* ---------- EFFECTIVE REGION IDS ---------- */
  const effectiveSelectedRegionIds = useMemo(() => {
    return storedSelectedRegionIds.length > 0
      ? storedSelectedRegionIds
      : (selectedRegionIds || []).map(String);
  }, [storedSelectedRegionIds, selectedRegionIds]);


  /* ---------- STABLE REGION DEPENDENCY KEY ---------- */
  const regionsKey = useMemo(
    () => effectiveSelectedRegionIds.join(","),
    [effectiveSelectedRegionIds]
  );



  useEffect(() => {
    if (!surveyId) return;
    let cancelled = false;

    const isEmpty = (v) =>
      v === undefined ||
      v === null ||
      v === "" ||
      v === "All" ||
      v === "Select period";

    const toNumber = (v) => {
      if (v === null || v === undefined) return 0;
      if (typeof v === "number") return v;
      const n = parseFloat(String(v).replace("%", ""));
      return Number.isFinite(n) ? n : 0;
    };

    async function fetchDistribution() {
      try {
        // wait for hook only if no localStorage selection
        if (regionFilterLoading && storedSelectedRegionIds.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        const params = new URLSearchParams({ surveyId });

        if (!isEmpty(gender)) params.append("gender", gender);
        if (!isEmpty(participantType)) params.append("participantType", participantType);

        const invalidPeriods = new Set([2026, "2026"]);
        if (!isEmpty(period) && !invalidPeriods.has(period)) {
          params.append("period", period);
        }

        if (effectiveSelectedRegionIds.length > 0) {
          effectiveSelectedRegionIds.forEach((id) => {
            params.append("regions", id);
          });
        }


        console.log("[NpsDistribution] sending params:", params);

        const res = await http.get(`/charts/nps?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const json = res.data;
        console.log("[NpsDistribution] response:", json);

        if (cancelled) return;

        if (json?.success) {
          const dist = json.data?.distribution || {};

          setDistribution([
            {
              name: "Promoter",
              value: toNumber(dist.promoterPercentage),
              count: toNumber(dist.promoterCount),
              color: "#3F11FF",
            },
            {
              name: "Passive",
              value: toNumber(dist.passivePercentage),
              count: toNumber(dist.passiveCount),
              color: "#6AD2FF",
            },
            {
              name: "Detractor",
              value: toNumber(dist.detractorPercentage),
              count: toNumber(dist.detractorCount),
              color: "#9CA3AF",
            },
          ]);
        } else {
          setDistribution([]);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load NPS distribution");
        if (!cancelled) setDistribution([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDistribution();

    return () => {
      cancelled = true;
    };
  }, [
  surveyId,
  gender,
  participantType,
  period,
  regionsKey,
  regionFilterLoading,
  storedSelectedRegionIds.length,
]);




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
