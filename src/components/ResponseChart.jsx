// src/components/ResponseChart.jsx
import React, { useEffect, useState, useRef } from "react";
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
import http from "../api/http";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="w-[380px] max-h-[72vh] rounded-3xl bg-white border border-[#EEF2FF] shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="text-[20px] font-semibold text-[#2B3674]">
              Selected Villages
            </h3>
            <p className="mt-1 text-sm text-[#A3AED0]">
              {villages.length} regions included
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="px-4 pb-5">
          <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            <ul className="space-y-2">
              {villages.map((v, index) => (
                <li
                  key={v}
                  className="flex items-center gap-3 py-3 text-sm text-[#2B3674] border-b border-[#EEF2FF] cursor-default"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-xs font-semibold text-[#3F11FF]">
                    {index + 1}
                  </span>
                  <span className="leading-5">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
/* === /modal === */

// Popup modal displaying a scrollable bar chart of all regions when region count exceeds 5
const AllRegionsBarChartModal = ({ visible, onClose, data }) => {
  if (!visible) return null;

  const topRegion = data?.[0];
  const totalRegions = data?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/35 backdrop-blur-[6px] px-4">
      <div className="w-[92vw] max-w-[1180px] h-[84vh] rounded-[28px] bg-white border border-[#E9EEFF] shadow-[0_30px_80px_rgba(15,23,42,0.22)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative border-b border-[#EEF2FF] bg-gradient-to-r from-[#F8FAFF] via-white to-[#F6F8FF] px-7 pt-6 pb-5">
          <div className="pr-14">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#4318FF] to-[#9F8CFF] text-white shadow-[0_10px_24px_rgba(67,24,255,0.28)]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 19V11"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 19V5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19 19V8"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-[28px] font-bold tracking-[-0.02em] text-[#2B3674]">
                  All Regions Response Chart
                </h3>
                <p className="mt-1 text-sm text-[#8F9BBA]">
                  Compare participant counts across all selected regions
                </p>
              </div>
            </div>

            {/* Stats chips */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F7FE] px-4 py-2 text-sm text-[#2B3674]">
                <span className="font-semibold">{totalRegions}</span>
                <span className="text-[#8F9BBA]">Regions</span>
              </div>

              {topRegion && (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-sm text-[#2B3674]">
                  <span className="text-[#8F9BBA]">Top Region</span>
                  <span className="font-semibold">{topRegion.name}</span>
                  <span className="text-[#4318FF] font-semibold">
                    {topRegion.value}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#E6ECFF] bg-white text-[#A3AED0] shadow-sm transition hover:scale-105 hover:bg-[#F8FAFF] hover:text-[#2B3674]"
            aria-label="Close modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 bg-[#FCFDFF] px-6 py-6 overflow-hidden">
          <div className="h-full rounded-[24px] border border-[#EEF2FF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] overflow-hidden flex flex-col">
            {/* Optional top label */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F4FF]">
              <div>
                <p className="text-sm font-semibold text-[#2B3674]">
                  Region-wise Participants
                </p>
                <p className="text-xs text-[#A3AED0] mt-1">
                  Scroll horizontally if needed to view all bars clearly
                </p>
              </div>

              <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#F4F7FE] px-3 py-1.5 text-xs font-medium text-[#8F9BBA]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4318FF]" />
                Participant Count
              </div>
            </div>

            {/* Chart area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-6 custom-scrollbar">
              <div
                style={{
                  width: `${Math.max(data.length * 130, 920)}px`,
                  height: "100%",
                  minHeight: "420px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 30, right: 24, left: 10, bottom: 70 }}
                  >
                    <defs>
                      <linearGradient
                        id="popupBrightGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#4318FF" />
                        <stop offset="100%" stopColor="#C6BBFF" />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={78}
                      tick={<TwoLineTick />}
                    />
                    <YAxis hide />
                    <Bar
                      dataKey="value"
                      fill="url(#popupBrightGradient)"
                      radius={[12, 12, 0, 0]}
                      barSize={32}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        className="bar-label"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-[#F1F4FF] bg-[#FBFCFF] px-5 py-4">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full bg-[#4318FF] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(67,24,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(67,24,255,0.28)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResponseChart({
  surveyId,
  regionIds = [],
  gender,
  participantType,
  period,
  onData,
  onAllRegionsModalToggle,
}) {
  const [responseData, setResponseData] = useState([]);
  const [responseTotals, setResponseTotals] = useState({
    totalParticipants: 0,
    responseRate: "0%",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegionView, setShowRegionView] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showAllRegionsChartModal, setShowAllRegionsChartModal] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (onAllRegionsModalToggle) {
      onAllRegionsModalToggle(showAllRegionsChartModal);
    }
  }, [showAllRegionsChartModal, onAllRegionsModalToggle]);

  const regionKey = Array.isArray(regionIds)
    ? regionIds.map(String).sort().join(",")
    : "";

  useEffect(() => {
    if (!surveyId) return;
    console.log("[ResponseChart effect trigger]", {
      surveyId,
      regionIdsCount: Array.isArray(regionIds) ? regionIds.length : 0,
    });


    setShowRegionView(false);
    setShowVillageModal(false);
    setShowAllRegionsChartModal(false);

    let aborted = false;

    async function loadResponse() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        console.log("[ResponseChart] props:", { gender, participantType, period, surveyId, regionIds });

        const isEmpty = (v) =>
          v === undefined || v === null || v === "" || v === "All" || v === "Select period";

        const params = new URLSearchParams({ surveyId });

        // Send only if user truly selected something
        if (!isEmpty(gender)) params.append("gender", gender);
        if (!isEmpty(participantType)) params.append("participantType", participantType);

        const invalidPeriods = new Set([2026, "2026"]);
        if (!isEmpty(period) && !invalidPeriods.has(period)) {
          params.append("period", period);
        }


        /**
         * Regions filter:
         * - If user has saved specific regions -> send regions=...
         * - If user selected all (or no saved filter) -> do not send regions
         * - Prevent sending until filteredRegions is loaded
         */
        const selectedIds = regionKey ? regionKey.split(",") : [];

        // Send regions only if user selected something
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            params.append("regions", id);
          });
        }

        console.log("[ResponseChart] sending params:", params.toString());

        const res = await http.get(`/charts/response?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = res.data;

        if (json.data && !aborted) {
          setResponseTotals({
            totalParticipants: json.data.totalParticipants || 0,
            responseRate: json.data.responseRate || "0%",
          });

          if (Array.isArray(json.data.regions)) {
            const allRegions = (json.data.regions || [])
              .map((r) => ({
                Region: String(r.villageName || "").trim(),
                Participants: Number(r.participantCount) || 0,
              }))
              .filter((r) => r.Region && r.Participants > 0)
              .sort((a, b) => b.Participants - a.Participants);

            console.log("[ResponseChart] allRegions:", allRegions);

            // For chart rendering
            setResponseData(
              allRegions.map((r) => ({
                name: r.Region,
                value: r.Participants,
              }))
            );

            // For Excel export in Dashboard
            if (onData) {
              onData([
                {
                  Metric: "Total Participants",
                  Value: json.data.totalParticipants || 0,
                },
                {
                  Metric: "Response Rate",
                  Value: json.data.responseRate || "0%",
                },
                ...allRegions,
              ]);
            }
          }

        }
      } catch (e) {
        if (!aborted) setError(e?.response?.data?.message || e.message || "Failed to load response chart");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    loadResponse();
    return () => {
      aborted = true;
    };
  }, [gender, participantType, period, surveyId, regionKey]);



  const hasMoreThanFiveRegions = responseData.length > 5;
  const displayData = hasMoreThanFiveRegions
    ? showRegionView
      ? responseData.slice(0, 5)
      : [{ name: "Overall", value: responseTotals.totalParticipants || 0 }]
    : responseData;

  // detect no-data
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
                      className={`w-6 bg-gray-300 rounded-t ${i % 2 === 0 ? "h-24" : "h-16"
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
                {hasMoreThanFiveRegions && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => setShowRegionView((prev) => !prev)}
                      className="p-1 transition-transform duration-300 hover:scale-110"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        className={`transition-transform duration-300 ${showRegionView ? "rotate-180" : "rotate-0"}`}
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
                              stopColor="#d8d8edff"
                              stopOpacity="0.9"
                            />
                            <stop offset="100%" stopColor="#6366F1" />
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

              {/* No data state */}
              {noData ? (
                <div className="w-full" ref={chartRef}>
                  {/* static placeholder bars */}
                  <div className="w-full flex items-end justify-around gap-1 opacity-70 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className={`w-6 bg-gray-200 rounded-t ${i % 2 === 0 ? "h-24" : "h-16"
                            }`}
                        ></div>
                        <div className="h-3 w-12 bg-gray-100 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* subtle message */}
                  <div className="mt-3 text-sm text-gray-400 text-center">
                    No data for selected filters
                  </div>
                </div>
              ) : (
                <>
                  {/* Chart */}
                  {displayData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={displayData}
                        margin={{ top: 20, bottom: 10, left: 0, right: 10 }}
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
                  {showRegionView && hasMoreThanFiveRegions && (
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setShowVillageModal(true)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200"
                      >
                        +{responseData.length - 5} more
                      </button>

                      <button
                        onClick={() => setShowAllRegionsChartModal(true)}
                        className="group inline-flex items-center gap-2 rounded-full border border-[#D9E1FF] bg-white/95 px-4 py-2 text-sm font-medium text-[#2B3674] shadow-[0_8px_24px_rgba(67,24,255,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C6FF] hover:shadow-[0_12px_28px_rgba(67,24,255,0.18)]"
                        aria-label="Open popup chart for all regions"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#4318FF] to-[#9F8CFF] text-white shadow-[0_6px_16px_rgba(67,24,255,0.28)]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 19V11"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 19V5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M19 19V8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>

                        <span className="flex flex-col items-start leading-none">
                          <span className="text-sm font-semibold text-[#2B3674]">
                            All Regions
                          </span>
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Modal with scrollable sorted villages */}
                  <VillageListModal
                    visible={showVillageModal}
                    onClose={() => setShowVillageModal(false)}
                    villages={responseData.map((r) => r.name)}
                  />

                  <AllRegionsBarChartModal
                    visible={showAllRegionsChartModal}
                    onClose={() => setShowAllRegionsChartModal(false)}
                    data={responseData}
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
