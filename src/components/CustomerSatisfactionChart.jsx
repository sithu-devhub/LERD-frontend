// src/components/CustomerSatisfactionChart.js.js

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";
import { useFilteredRegions } from "../utils/useFilteredRegions";
import http from "../api/http";

const pieColors = ["#3F11FF", "#6AD2FF", "#E0E0E0"];

const round2 = (v) => {
  const n =
    typeof v === "number" ? v : parseFloat(String(v ?? "").replace("%", ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
};

const PieTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const val = round2(payload?.[0]?.value).toFixed(2);
  const midX = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) / 2;
  const side =
    coordinate?.x != null && midX
      ? coordinate.x < midX
        ? "right"
        : "left"
      : "left";
  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
      <div className="trend-tooltip__total">{val}%</div>
    </div>
  );
};

export default function CustomerSatisfaction({
  surveyId,
  regions = [],
  gender,
  participantType,
  period,
}) {
  const [data, setData] = useState({
    verySatisfiedPercentage: 0,
    satisfiedPercentage: 0,
    somewhatSatisfiedPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // also take loading from hook so we don't fetch until IDs are ready
  const { selectedRegionIds, loading: regionFilterLoading } = useFilteredRegions(surveyId);

  // State kept as-is (you had it before); we won't remove it
  const [regionResponses, setRegionResponses] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Don't start loading until we have valid filters
      if (!surveyId) return;

      // Only wait for region filter if we are actually going to send regions
      if (regionFilterLoading && selectedRegionIds?.length) return;


      setLoading(true);
      setError("");

      console.groupCollapsed("[CustomerSatisfaction] Fetch start");
      console.log("Survey ID:", surveyId);
      console.log("Gender:", gender);
      console.log("ParticipantType:", participantType);
      console.log("Period:", period);
      console.log("Regions prop:", regions);
      console.log("Selected Region IDs (from hook):", selectedRegionIds);
      console.groupEnd();

      try {
        const token = localStorage.getItem("accessToken");

        const isEmpty = (v) => {
          const s = String(v ?? "").trim().toLowerCase();
          return (
            s === "" ||
            s === "all" ||
            s === "select period" ||
            s === "select" ||
            s === "undefined" ||
            s === "null"
          );
        };

        const params = { surveyId };

        // send only if user actually selected something
        if (!isEmpty(gender)) params.gender = gender;
        if (!isEmpty(participantType)) params.participantType = participantType;

        // block accidental default year like 2026
        const invalidPeriods = new Set(["2026", 2026]);
        if (!isEmpty(period) && !invalidPeriods.has(period)) {
          params.period = period;
        }

        // region filter (only if selected)
        if (selectedRegionIds?.length) {
          params.region = selectedRegionIds.join(",");
        }

        console.log("[CustomerSatisfaction] Sending params:", params);

        const res = await http.get("/charts/customer-satisfaction", {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });



        if (cancelled) return;

        const d = res.data?.data || {};
        setData({
          verySatisfiedPercentage: round2(d.verySatisfiedPercentage),
          satisfiedPercentage: round2(d.satisfiedPercentage),
          somewhatSatisfiedPercentage: round2(d.somewhatSatisfiedPercentage),
        });

      } catch (err) {
        if (!cancelled) {
          console.error("[CustomerSatisfaction] ❌ Fetch failed:", err);
          setError(err.message);
        }
      }
      finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [surveyId, gender, participantType, period, selectedRegionIds, regionFilterLoading]);


  const pieData = [
    { name: "Very Satisfied", value: data.verySatisfiedPercentage },
    { name: "Satisfied", value: data.satisfiedPercentage },
    { name: "Somewhat Satisfied", value: data.somewhatSatisfiedPercentage },
  ];

  const noData = !loading && !error && pieData.every((p) => Number(p.value) === 0);

  return (
    <ChartCard
      title="Customer Satisfaction"
      content={
        <div className="flex flex-col items-center w-full">
          {error ? (
            <ErrorPlaceholder status={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center w-full py-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-[#E5E7EB]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3F11FF] animate-spin" />
              </div>
            </div>
          ) : noData ? (
            <div className="flex flex-col items-center justify-center w-full py-8 opacity-80">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-[#E5E7EB]" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-gray-50 to-white shadow-inner" />
              </div>
              <div className="mt-4 text-sm font-medium text-gray-400">
                No data for selected filters
              </div>
            </div>
          ) : (
            <>
              {/* fixed layout height so legend can sit at the card bottom */}
              <div className="w-full h-[300px] flex flex-col items-center justify-between">
                {/* Pie stays same size */}
                <div className="flex justify-center pt-2 w-full">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="60%"
                        cy="60%"
                        outerRadius={70}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={pieColors[i]} />
                        ))}
                      </Pie>

                      <Tooltip
                        cursor={false}
                        content={<PieTooltip />}
                        offset={0}
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 9999 }}
                        contentStyle={{
                          background: "transparent",
                          border: "none",
                          boxShadow: "none",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend sits at the bottom naturally */}
                <div className="w-full grid grid-cols-3 gap-4 text-center pb-2">
                  {pieData.map((p, i) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-center gap-2 text-xs text-[#A3AED0] min-h-[28px] leading-tight">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: pieColors[i] }}
                        />
                        <span>{p.name}</span>
                      </div>
                      <div className="text-xl font-bold text-[#2B3674] mt-1">
                        {round2(p.value).toFixed(2)}%
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </>
          )

          }
        </div>
      }
    />
  );
}
