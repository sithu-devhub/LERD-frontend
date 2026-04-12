// src/pages/CustomerSatisfactionTrend.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import http from "../api/http";
import ChartCard from "../components/ChartCard";
import ErrorPlaceholder from "./ErrorPlaceholder";

// ======================================================
// Clean blended label renderer for each stacked bar section
// - No pill / no badge
// - Just soft text inside each section
// - Hides label if section is too small
// ======================================================
const SegmentLabel = ({ x, y, width, height, value, fill }) => {
  const num = Number(value) || 0;

  // Hide labels for zero / very small sections
  if (num <= 0 || height < 26) return null;

  // Softer text colors that blend with the chart
  const textColor = fill === "#E0E6F5" ? "#6B7AA5" : "rgba(255,255,255,0.92)";

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={textColor}
      fontSize={9}
      fontWeight={500}
      letterSpacing="0.1px"
    >
      {num.toFixed(1)}%
    </text>
  );
};


const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const totalRaw =
    (byKey.somewhat || 0) + (byKey.satisfied || 0) + (byKey.very || 0);

  const total = Math.round(totalRaw * 100) / 100;

  const rows = [
    {
      key: "somewhat",
      label: "Somewhat Satisfied",
      cls: "trend-dot trend-dot--somewhat",
      val: byKey.somewhat,
    },
    {
      key: "satisfied",
      label: "Satisfied",
      cls: "trend-dot trend-dot--satisfied",
      val: byKey.satisfied,
    },
    {
      key: "very",
      label: "Very Satisfied",
      cls: "trend-dot trend-dot--very",
      val: byKey.very,
    },
  ];

  return (
    <div className="trend-tooltip trend-tooltip--left">
      <div className="trend-tooltip__total">{total.toFixed(2)}%</div>
      {rows.map((r) => (
        <div key={r.key} className="trend-tooltip__row">
          <span className={r.cls} />
          <span className="trend-tooltip__value">{r.val.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

const TrendLegendBelow = () => (
  <div className="trend-legend--below">
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--somewhat" /> Somewhat Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--satisfied" /> Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--very" /> Very Satisfied
    </div>
  </div>
);

export default function CustomerSatisfactionTrend({
  surveyId,
  regionIds = [],
  regionsLoaded,
  gender,
  participantType,
  period,
  onData,
}) {
  const [satisfactionTrend, setSatisfactionTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hoverBar, setHoverBar] = useState(false);
  const wrapRef = useRef(null);

  const regionKey = Array.isArray(regionIds)
    ? regionIds.map(String).sort().join(",")
    : "";

  useEffect(() => {
    if (!surveyId || !regionsLoaded) return;

    let cancelled = false;

    console.log("[CustomerSatisfactionTrend effect trigger]", {
      surveyId,
      regionIdsCount: Array.isArray(regionIds) ? regionIds.length : 0,
      regionKey,
    });


    const isEmpty = (v) =>
      v === undefined ||
      v === null ||
      v === "" ||
      v === "All" ||
      v === "Select period";

    const toNumber = (v) => {
      if (v === null || v === undefined) return 0;
      const n =
        typeof v === "number" ? v : parseFloat(String(v).replace("%", ""));
      if (!Number.isFinite(n)) return 0;

      // round to 2 decimal places
      return Math.round(n * 100) / 100;
    };

    async function fetchTrend() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        console.log("[CustomerSatisfactionTrend props]", {
          surveyId,
          gender,
          participantType,
          period,
          regionIds,
          regionKey,
        });


        // Build params like ResponseChart (avoid sending default UI values)
        const params = new URLSearchParams({ surveyId });

        if (!isEmpty(gender)) params.append("gender", gender);
        if (!isEmpty(participantType)) params.append("participantType", participantType);

        // block accidental default year (same as your ResponseChart)
        const invalidPeriods = new Set([2026, "2026"]);
        if (!isEmpty(period) && !invalidPeriods.has(period)) {
          params.append("period", period);
        }


        // region filter (only if selected)
        const selectedIds = regionKey ? regionKey.split(",") : [];

        console.log("[CustomerSatisfactionTrend selectedIds]", selectedIds);

        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            params.append("regions", id);
          });
        }


        console.log("[CustomerSatisfactionTrend] sending params:", params);

        const res = await http.get(
          `/charts/customer-satisfaction-trend?${params.toString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );


        const json = res.data;
        console.log("[CustomerSatisfactionTrend] response:", json);

        if (cancelled) return;
        if (json?.success && Array.isArray(json.data?.years)) {
          const mapped = json.data.years.map((y) => ({
            Year: String(y.year),
            "Very Satisfied": toNumber(y.verySatisfiedPercentage),
            Satisfied: toNumber(y.satisfiedPercentage),
            "Somewhat Satisfied": toNumber(y.somewhatSatisfiedPercentage),
          }));

          // For chart rendering
          setSatisfactionTrend(
            mapped.map((row) => ({
              year: row.Year,
              very: row["Very Satisfied"],
              satisfied: row.Satisfied,
              somewhat: row["Somewhat Satisfied"],
            }))
          );

          // For Excel export in Dashboard
          if (onData) {
            onData(mapped);
          }
        } else {
          setSatisfactionTrend([]);
          if (onData) onData([]);
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
  }, [surveyId, regionsLoaded, gender, participantType, period, regionKey]);

  const noData =
    !loading && !error && (!satisfactionTrend || satisfactionTrend.length === 0);

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
          <div ref={wrapRef} className="trend-chart relative">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={satisfactionTrend} barCategoryGap="35%" onMouseLeave={() => setHoverBar(false)}>

                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A3AED0", fontSize: 14 }}
                />
                <YAxis hide />

                <Tooltip
                  active={hoverBar}
                  isAnimationActive={false}
                  cursor={{ fill: "transparent" }}
                  content={<TrendTooltip />}
                  offset={0}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999, overflow: "visible", pointerEvents: "none" }}
                  contentStyle={{
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                  }}
                />

                <Bar
                  dataKey="somewhat"
                  stackId="a"
                  fill="#E0E6F5"
                  isAnimationActive={false}
                  onMouseEnter={() => setHoverBar(true)}
                  onMouseLeave={() => setHoverBar(false)}
                >
                  <LabelList
                    dataKey="somewhat"
                    content={<SegmentLabel fill="#E0E6F5" />}
                  />
                </Bar>

                <Bar
                  dataKey="satisfied"
                  stackId="a"
                  fill="#40CFFF"
                  isAnimationActive={false}
                  onMouseEnter={() => setHoverBar(true)}
                  onMouseLeave={() => setHoverBar(false)}
                >
                  <LabelList
                    dataKey="satisfied"
                    content={<SegmentLabel fill="#40CFFF" />}
                  />
                </Bar>

                <Bar
                  dataKey="very"
                  stackId="a"
                  fill="#3F11FF"
                  isAnimationActive={false}
                  radius={[8, 8, 0, 0]}
                  onMouseEnter={() => setHoverBar(true)}
                  onMouseLeave={() => setHoverBar(false)}
                >
                  <LabelList
                    dataKey="very"
                    content={<SegmentLabel fill="#3F11FF" />}
                  />
                </Bar>

              </BarChart>
            </ResponsiveContainer>
            <TrendLegendBelow />
          </div>
        )
      }
    />
  );
}
