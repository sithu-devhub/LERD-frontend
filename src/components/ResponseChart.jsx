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
import ErrorPlaceholder from "./ErrorPlaceholder";

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

/* === Scrollable Modal Component for showing all villages === */
const VillageListModal = ({ visible, onClose, villages }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[350px] max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Selected Villages
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Scrollable list */}
        <ul className="overflow-y-auto pr-2 flex-1">
          {villages.map((v) => (
            <li
              key={v}
              className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 mb-2"
            >
              {v}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
/* === /modal === */

export default function ResponseChart({ surveyId, gender, participantType, period }) {
  const [responseData, setResponseData] = useState([]);
  const [responseTotals, setResponseTotals] = useState({
    totalParticipants: 0,
    responseRate: "0%",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);

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

        const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/charts/response`;
        const params = new URLSearchParams({
          surveyId:
            surveyId || "8dff523d-2a46-4ee3-8017-614af3813b32", // fallback
        });

        if (gender) params.append("gender", gender);
        if (participantType) params.append("participantType", participantType);
        if (period) params.append("period", period);

        const url = `${baseUrl}?${params.toString()}`;

        const SIMULATE_ERROR = null;
        const res = await fetch(url, { headers: { Accept: "application/json" } });

        if (SIMULATE_ERROR) throw new Error(`Error ${SIMULATE_ERROR}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);

        const json = await res.json();

        if (json.data && !aborted) {
          setResponseTotals({
            totalParticipants: json.data.totalParticipants || 0,
            responseRate: json.data.responseRate || "0%",
          });

          if (Array.isArray(json.data.regions)) {
            const sorted = json.data.regions
              .map((r) => ({
                name: r.villageName || "Unknown",
                value: r.participantCount || 0,
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            setResponseData(sorted);
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
  }, [gender, participantType, period, surveyId]);

  let displayData;
  if (showAll) {
    displayData = [
      { name: "Overall", value: responseTotals.totalParticipants || 0 },
    ];
  } else {
    displayData = responseData.slice(0, 5);
  }

  // ✅ NEW: detect no-data
  const noData =
    (responseTotals.totalParticipants || 0) === 0 ||
    responseData.length === 0;

  return (
    <ChartCard
      title="Response"
      content={
        <>
          {loading && (
            <div className="animate-pulse" ref={chartRef}>
              {/* Skeleton */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-4">
                  <div className="h-6 w-28 bg-gray-300 rounded"></div>
                  <div className="h-6 w-20 bg-gray-300 rounded"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              </div>
              <div className="w-full h-[200px] flex items-end justify-around gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-6 bg-gray-300 rounded-t ${
                        i % 2 === 0 ? "h-24" : "h-16"
                      }`}
                    ></div>
                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <ErrorPlaceholder
              status={error}
              onRetry={() => window.location.reload()}
            />
          )}

          {!loading && !error && (
            <div ref={chartRef}>
              {/* Metrics */}
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

                {/* Arrow toggle */}
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
                          <linearGradient
                            id="arrowGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop
                              offset="50%"
                              stopColor="#FFFFFF"
                              stopOpacity="0.9"
                            />
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
                        <path
                          d="M10 7l5 5-5 5"
                          fill="none"
                          stroke="url(#arrowGradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ NEW: No data state */}
              {noData ? (
                <div className="flex flex-col items-center justify-center w-full h-[200px] text-[#A3AED0]">
                  <svg width="200" height="120" viewBox="0 0 200 120">
                    <rect x="20" y="80" width="20" height="20" fill="#E5E7EB" rx="4" />
                    <rect x="60" y="60" width="20" height="40" fill="#E5E7EB" rx="4" />
                    <rect x="100" y="40" width="20" height="60" fill="#E5E7EB" rx="4" />
                    <rect x="140" y="20" width="20" height="80" fill="#E5E7EB" rx="4" />
                  </svg>
                  <div className="mt-2 text-sm font-medium">No data for selected filters</div>
                </div>
              ) : (
                <>
                  {/* Chart */}
                  {displayData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={displayData}
                        margin={{ top: 10, bottom: 50, left: 0, right: 10 }}
                      >
                        <defs>
                          <linearGradient
                            id="brightGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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

                  {/* +N more chip */}
                  {responseData.length > 5 && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => setShowVillageModal(true)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200"
                      >
                        +{responseData.length - 5} more
                      </button>
                    </div>
                  )}

                  {/* Modal with scrollable sorted villages */}
                  <VillageListModal
                    visible={showVillageModal}
                    onClose={() => setShowVillageModal(false)}
                    villages={responseData.map((r) => r.name)}
                  />
                </>
              )}
            </div>
          )}
        </>
      }
    />
  );
}
