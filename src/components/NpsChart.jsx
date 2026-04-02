// src/components/NpsChart.jsx
import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";
import http from "../api/http";

export default function NpsChart({
  surveyId,
  regionIds = [],
  gender = null,
  participantType = null,
  period = null,
  min = -100,
  max = 100,
  size = 220,
  thickness = 22,
  onData,
}) {

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const regionKey = Array.isArray(regionIds)
    ? regionIds.map(String).sort().join(",")
    : "";

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

    async function fetchNps() {
      try {

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

        const selectedIds = regionKey ? regionKey.split(",") : [];
        console.log("[NpsChart selectedIds]", selectedIds);

        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            params.append("regions", id);
          });
        }



        console.log("[NpsChart] sending params:", params);

        const res = await http.get(`/charts/nps?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const json = res.data;
        console.log("[NpsChart] response:", json);

        // Extract NPS score from API, update chart, and send it to parent for Excel export
        if (!cancelled && json?.success) {
          const npsScore = toNumber(json.data?.npsScore);

          setScore(npsScore);

          if (onData) {
            onData([
              {
                Metric: "Net Promoter Score",
                Score: npsScore,
              },
            ]);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load NPS data");
        if (!cancelled) setScore(0);
        if (!cancelled && onData) onData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNps();

    return () => {
      cancelled = true;
    };
  }, [surveyId, gender, participantType, period, regionKey]);


  const t = useMemo(() => {
    const v = Math.max(min, Math.min(max, score));
    return (v - min) / (max - min);
  }, [score, min, max]);

  const progressPct = t * 100;
  const displayed = Math.round(score);

  const width = size + 100;
  const height = Math.round(size * 0.75);
  const cx = width / 2;
  const cy = Math.round(height * 0.75);
  const outer = Math.min(cx, cy) - 4;
  const inner = outer - thickness;

  const tickWidthPct = 1.2;
  const doneWithoutTick = Math.max(0, progressPct - tickWidthPct);
  const tickSlice = Math.min(tickWidthPct, progressPct);
  const rest = Math.max(0, 100 - doneWithoutTick - tickSlice);

  const EndLabels = () => (
    <>
      <text
        x={cx - outer + 15}  // shift right
        y={height - 1}
        textAnchor="middle"
        fill="#A3AED0"
        fontSize="14"
        fontWeight="600"
      >
        -100
      </text>

      <text
        x={cx + outer - 12}  // shift left
        y={height - 1}
        textAnchor="middle"
        fill="#A3AED0"
        fontSize="14"
        fontWeight="600"
      >
        +100
      </text>
    </>
  );

  return (
    <ChartCard title="Net Promoter Score">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-6 h-[200px]">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-[180px] h-[100px] rounded-t-full bg-gradient-to-t from-gray-300 to-gray-100 animate-pulse"></div>
        </div>
      ) : error ? (
        <ErrorPlaceholder
          status={error}
          onRetry={() => window.location.reload()}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-[#2B3674] leading-none mt-6 mb-2">
            {displayed}
          </div>

          <PieChart width={width} height={height}>
            <Pie
              data={[{ name: "track", value: 100 }]}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cx={cx}
              cy={cy}
              innerRadius={inner}
              outerRadius={outer}
              stroke="none"
              fill="#EEF2FF"
              isAnimationActive={false}
            />
            <Pie
              data={[
                { name: "progress", value: progressPct, fill: "#3F11FF" },
                { name: "rest", value: 100 - progressPct, fill: "transparent" },
              ]}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cx={cx}
              cy={cy}
              innerRadius={inner}
              outerRadius={outer}
              isAnimationActive={false}
            >
              <Cell fill="#3F11FF" />
              <Cell fill="transparent" />
            </Pie>
            <Pie
              data={[
                { name: "done", value: doneWithoutTick, fill: "transparent" },
                { name: "tick", value: tickSlice, fill: "#7FD3FF" },
                { name: "rest", value: rest, fill: "transparent" },
              ]}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cx={cx}
              cy={cy}
              innerRadius={inner - 8}
              outerRadius={outer + 8}
              isAnimationActive={false}
            />
            {/* Render labels directly instead of Customized */}
            <EndLabels />
          </PieChart>
        </div>
      )}
    </ChartCard>
  );
}
