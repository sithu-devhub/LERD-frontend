// src/pages/CustomerSatisfaction.jsx
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartCard from "../components/ChartCard";

// Keep the exact same pieData, colors, and PieTooltip from your Dashboard file
const pieData = [
  { name: "Very Satisfied", value: 63 },
  { name: "Satisfied", value: 12 },
  { name: "Somewhat Satisfied", value: 20 },
];
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

export default function CustomerSatisfaction() {
  return (
    <ChartCard
      title="Customer Satisfaction"
      content={
        <div className="flex flex-col items-center">
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
                paddingAngle={0}
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
                wrapperStyle={{ zIndex: 9999, overflow: "visible" }}
                contentStyle={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: pieColors[0] }}
                />
                Very Satisfied
              </div>
              <div className="text-xl font-bold text-[#2B3674] mt-1">63%</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: pieColors[1] }}
                />
                Satisfied
              </div>
              <div className="text-xl font-bold text-[#2B3674] mt-1">12%</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: pieColors[2] }}
                />
                Somewhat Satisfied
              </div>
              <div className="text-xl font-bold text-[#2B3674] mt-1">20%</div>
            </div>
          </div>
        </div>
      }
    />
  );
}
