// src/pages/CustomerSatisfactionTrend.jsx
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import http from "../api/http";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";

const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const total =
    (byKey.somewhat || 0) + (byKey.satisfied || 0) + (byKey.very || 0);

  const rows = [
    { key: "very", label: "Very Satisfied", cls: "trend-dot trend-dot--very", val: byKey.very },
    { key: "satisfied", label: "Satisfied", cls: "trend-dot trend-dot--satisfied", val: byKey.satisfied },
    { key: "somewhat", label: "Somewhat Satisfied", cls: "trend-dot trend-dot--somewhat", val: byKey.somewhat },
  ];

  return (
    <div className="trend-tooltip trend-tooltip--left">
      <div className="trend-tooltip__total">{total}%</div>
      {rows.map((r) => (
        <div key={r.key} className="trend-tooltip__row">
          <span className={r.cls} />
          <span className="trend-tooltip__value">{r.val}%</span>
        </div>
      ))}
    </div>
  );
};

const TrendLegendBelow = () => (
  <div className="trend-legend--below">
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--very" /> Very Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--satisfied" /> Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--somewhat" /> Somewhat Satisfied
    </div>
  </div>
);

export default function CustomerSatisfactionTrend({ surveyId, gender, participantType, period }) {
  const [satisfactionTrend, setSatisfactionTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


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

    async function fetchTrend() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        // Build params like ResponseChart (avoid sending default UI values)
        const params = { surveyId };

        if (!isEmpty(gender)) params.gender = gender;
        if (!isEmpty(participantType)) params.participantType = participantType;

        // block accidental default year (same as your ResponseChart)
        const invalidPeriods = new Set([2026, "2026"]);
        if (!isEmpty(period) && !invalidPeriods.has(period)) {
          params.period = period;
        }

        console.log("[CustomerSatisfactionTrend] sending params:", params);

        const res = await http.get("/charts/customer-satisfaction-trend", {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const json = res.data;
        console.log("[CustomerSatisfactionTrend] response:", json);

        if (cancelled) return;

        if (json?.success && Array.isArray(json.data?.years)) {
          const mapped = json.data.years.map((y) => ({
            year: String(y.year),
            very: toNumber(y.verySatisfiedPercentage),
            satisfied: toNumber(y.satisfiedPercentage),
            somewhat: toNumber(y.somewhatSatisfiedPercentage),
          }));

          setSatisfactionTrend(mapped);
        } else {
          setSatisfactionTrend([]);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load trend");
        if (!cancelled) setSatisfactionTrend([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrend();

    return () => {
      cancelled = true;
    };
  }, [surveyId, gender, participantType, period]);


  const noData = !loading && !error && (!satisfactionTrend || satisfactionTrend.length === 0);

  return (
    <ChartCard
      title="Customer Satisfaction Trend"
      content={
        loading ? (
          // ==== Nicer Skeleton Loader ====
          <div className="w-full">
            <div className="flex items-end justify-around h-[220px] gap-10">
              {[2023, 2024, 2025].map((year) => (
                <div key={year} className="flex flex-col items-center gap-3">
                  <div className="flex flex-col w-12 overflow-hidden rounded-md">
                    <div className="h-16 bg-gradient-to-b from-gray-300 to-gray-200 animate-pulse rounded-t-md mb-1"></div>
                    <div className="h-10 bg-gradient-to-b from-gray-200 to-gray-100 animate-pulse mb-1"></div>
                    <div className="h-8 bg-gradient-to-b from-gray-100 to-gray-50 animate-pulse rounded-b-md"></div>
                  </div>
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="trend-legend--below mt-4 flex justify-center gap-6">
              {["Very Satisfied", "Satisfied", "Somewhat"].map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorPlaceholder
            status={error}
            onRetry={() => window.location.reload()}
          />
        ) : noData ? (
          // No data placeholder
          <div className="w-full flex flex-col items-center justify-start h-[250px] opacity-75 mt-6">
            <div className="flex items-end justify-around h-[200px] gap-10">
              {[2023, 2024, 2025].map((year) => (
                <div key={year} className="flex flex-col items-center gap-2">
                  {/* stacked faded bars */}
                  <div className="flex flex-col w-12 overflow-hidden rounded-md">
                    <div className="h-14 bg-gray-200 rounded-t-md mb-1"></div>
                    <div className="h-9 bg-gray-100 mb-1"></div>
                    <div className="h-7 bg-gray-50 rounded-b-md"></div>
                  </div>
                  {/* year label placeholder */}
                  <div className="h-3 w-12 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>

            {/* legend faded */}
            <div className="trend-legend--below mt-3 flex justify-center gap-6 text-gray-400">
              {["Very Satisfied", "Satisfied", "Somewhat"].map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200"></div>
                  <div className="h-3 w-20 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm font-medium text-gray-400">
              No data for selected filters
            </div>
          </div>
        ) : (
          <div className="trend-chart relative">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={satisfactionTrend} barCategoryGap="35%">
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A3AED0", fontSize: 14 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<TrendTooltip />}
                  offset={0}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999, overflow: "visible" }}
                  contentStyle={{
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                  }}
                />
                <Bar dataKey="somewhat" stackId="a" fill="#E0E6F5" />
                <Bar dataKey="satisfied" stackId="a" fill="#40CFFF" />
                <Bar
                  dataKey="very"
                  stackId="a"
                  fill="#3F11FF"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <TrendLegendBelow />
          </div>
        )
      }
    />
  );
}
