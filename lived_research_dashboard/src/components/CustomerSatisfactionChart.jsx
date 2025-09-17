// src/pages/CustomerSatisfaction.jsx
import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartCard from "../components/ChartCard";

const pieColors = ["#3F11FF", "#6AD2FF", "#E0E0E0"];

const PieTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const val = payload?.[0]?.value;
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

export default function CustomerSatisfaction({ surveyId, gender, participantType }) {
  const [data, setData] = useState({
    verySatisfiedPercentage: 0,
    satisfiedPercentage: 0,
    somewhatSatisfiedPercentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/charts/customer-satisfaction`;
        const params = new URLSearchParams({ surveyId });

        if (gender != null) params.append("gender", gender);
        if (participantType != null) params.append("participantType", participantType);

        const url = `${baseUrl}?${params.toString()}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (!aborted && json.data) {
          setData({
            verySatisfiedPercentage: json.data.verySatisfiedPercentage || 0,
            satisfiedPercentage: json.data.satisfiedPercentage || 0,
            somewhatSatisfiedPercentage: json.data.somewhatSatisfiedPercentage || 0,
          });
        }
      } catch (e) {
        if (!aborted) setError(e.message);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [surveyId, gender, participantType]);

  const pieData = [
    { name: "Very Satisfied", value: data.verySatisfiedPercentage },
    { name: "Satisfied", value: data.satisfiedPercentage },
    { name: "Somewhat Satisfied", value: data.somewhatSatisfiedPercentage },
  ];

  return (
    <ChartCard
      title="Customer Satisfaction"
      content={
        <div className="flex flex-col items-center">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {loading ? (
            /* ... your loader JSX unchanged ... */
            <div className="flex flex-col items-center justify-center w-full py-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-[#E5E7EB]"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3F11FF] animate-spin"></div>
              </div>
              {/* shimmer legend placeholders */}
              <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center animate-pulse">
                {/* ... placeholder blocks ... */}
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
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
                    contentStyle={{ background: "transparent", border: "none", boxShadow: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#A3AED0]">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[0] }} />
                    <span>Very Satisfied</span>
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">
                    {data.verySatisfiedPercentage}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#A3AED0]">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[1] }} />
                    <span>Satisfied</span>
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">
                    {data.satisfiedPercentage}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#A3AED0]">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[2] }} />
                    <span>Somewhat Satisfied</span>
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">
                    {data.somewhatSatisfiedPercentage}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
