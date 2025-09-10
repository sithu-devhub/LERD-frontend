// src/components/ResponseChart.jsx
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import ChartCard from "./ChartCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  ResponsiveContainer,
} from "recharts";

/* === Custom Tick for two-line names === */
const TwoLineTick = ({ x, y, payload }) => {
  const parts = String(payload.value).split(" ");
  const lineHeight = 14;

  return (
    <g transform={`translate(${x},${y + lineHeight})`}>
      <text
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontSize={12}
        textAnchor="middle"
        fill="#A3AED0"
      >
        {parts.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};
/* === /tick === */

export default function ResponseChart() {
  const [responseData, setResponseData] = useState([]);
  const [responseTotals, setResponseTotals] = useState({
    totalParticipants: 0,
    responseRate: "0%",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const chartRef = useRef(null);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {});
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let aborted = false;
    async function loadResponse() {
      try {
        setLoading(true);
        setError("");
        const url = `${import.meta.env.VITE_API_BASE_URL}/charts/response?surveyId=8dff523d-2a46-4ee3-8017-614af3813b32&gender=1&participantType=2`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (json.data && !aborted) {
          setResponseTotals({
            totalParticipants: json.data.totalParticipants || 0,
            responseRate: json.data.responseRate || "0%",
          });

          if (Array.isArray(json.data.regions)) {
            setResponseData(
              json.data.regions.map((r) => ({
                name: r.villageName || "Unknown",
                value: r.participantCount || 0,
              }))
            );
          }
        }
      } catch (e) {
        if (!aborted) setError(e.message);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    loadResponse();
    return () => {
      aborted = true;
    };
  }, []);

  let displayData;
  if (showAll) {
    displayData = [
      { name: "Overall", value: responseTotals.totalParticipants || 0 },
    ];
  } else {
    displayData = responseData.slice(0, 5);
  }

  return (
    <ChartCard
      title="Response"
      content={
        <>
          {loading && <div>Loading response data…</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && (
            <div ref={chartRef}>
              {/* Big numbers + Arrow button row */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-2">
                  <div className="metric-aligned-row">
                    <h2 className="metric-number-aligned">
                      {responseTotals.totalParticipants}
                    </h2>
                    <span className="metric-label-aligned">Participants</span>
                  </div>
                  <div className="metric-aligned-row">
                    <h2 className="metric-number-aligned">
                      {responseTotals.responseRate}
                    </h2>
                    <span className="metric-label-aligned">Response Rate</span>
                  </div>
                </div>

                {/* Arrow toggle placed after chart, aligned right */}
                {responseData.length > 5 && (
                <div className="flex justify-end mt-3">
                    <button
                    onClick={() => setShowAll((prev) => !prev)}
                    className="p-1 transition-transform duration-300 hover:scale-110"
                    >
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        className={`transition-transform duration-300 ${
                        showAll ? "rotate-180" : "rotate-0"
                        }`}
                    >
                        <defs>
                        {/* Vertical animated gradient */}
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#6366F1" />

                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            dur="2s"               
                            repeatCount="indefinite"
                            values="0 -1; 0 1; 0 1" 
                            keyTimes="0;0.8;1"      
                        />
                        </linearGradient>



                        </defs>

                        {/* Right-pointing arrow */}
                        <path
                        d="M10 7l5 5-5 5"
                        fill="none"
                        stroke="url(#arrowGradient)"
                        strokeWidth="4"   //thicker arrow
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        />
                    </svg>
                    </button>
                </div>
                )}


              </div>

              {/* Chart */}
              {displayData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={displayData}
                    margin={{ top: 10, bottom: 50, left: 0, right: 10 }}
                  >
                    <defs>
                      <linearGradient id="brightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3406FF" />
                        <stop offset="100%" stopColor="#C6BBFF" />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={50}
                      tick={<TwoLineTick />}
                    />
                    <YAxis hide />
                    <Bar
                      dataKey="value"
                      fill="url(#brightGradient)"
                      radius={[10, 10, 0, 0]}
                      barSize={20}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        className="bar-label"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      }
    />
  );
}

