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
import ChartCard from "../components/ChartCard";

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

export default function CustomerSatisfactionTrend({ surveyId, gender, participantType }) {
  const [satisfactionTrend, setSatisfactionTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchTrend() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/charts/customer-satisfaction-trend`;
        const params = new URLSearchParams({ surveyId });

        if (gender != null) params.append("gender", gender);
        if (participantType != null) params.append("participantType", participantType);

        const url = `${baseUrl}?${params.toString()}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`Failed to fetch trend: ${res.status}`);
        const json = await res.json();

        if (!cancelled && json.success && Array.isArray(json.data?.years)) {
          const mapped = json.data.years.map((y) => ({
            year: String(y.year),
            very: y.verySatisfiedPercentage ?? 0,
            satisfied: y.satisfiedPercentage ?? 0,
            somewhat: y.somewhatSatisfiedPercentage ?? 0,
          }));
          setSatisfactionTrend(mapped);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load trend");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTrend();
    return () => { cancelled = true; };
  }, [surveyId, gender, participantType]);

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
                  {/* stacked placeholder bar */}
                  <div className="flex flex-col w-12 overflow-hidden rounded-md">
                    <div className="h-16 bg-gradient-to-b from-gray-300 to-gray-200 animate-pulse rounded-t-md mb-1"></div>
                    <div className="h-10 bg-gradient-to-b from-gray-200 to-gray-100 animate-pulse mb-1"></div>
                    <div className="h-8 bg-gradient-to-b from-gray-100 to-gray-50 animate-pulse rounded-b-md"></div>
                  </div>
                  {/* year label */}
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* legend placeholder */}
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

          <div className="p-4 text-red-500">{error}</div>
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
