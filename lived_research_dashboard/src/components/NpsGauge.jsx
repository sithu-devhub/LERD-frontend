// NpsGauge.jsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Customized } from "recharts";

export default function NpsGauge({
  value = 72,
  min = -100,
  max = 100,
  size = 220,
  thickness = 22,
}) {
  // clamp & normalize (0..1)
  const t = useMemo(() => {
    const v = Math.max(min, Math.min(max, value));
    return (v - min) / (max - min);
  }, [value, min, max]);

  // use float for geometry; round only for the displayed number
  const progressPct = t * 100; // 0..100
  const displayed = Math.round(value);

  const width = size;
  const height = Math.round(size * 0.6);
  const cx = width / 2;
  const cy = Math.round(height * 0.97);
  const outer = Math.min(cx, cy) - 4;
  const inner = outer - thickness;

  // --- Tick as a thin arc slice, placed by Recharts exactly at the end of progress ---
  // width of the tick in "gauge percent" (out of 100). ~0.8% ≈ 1.44° on a 180° gauge.
  const tickWidthPct = 1.2;

  // Split the gauge into [done-without-tick][tick][rest]
  const doneWithoutTick = Math.max(0, progressPct - tickWidthPct);
  const tickSlice = Math.min(tickWidthPct, progressPct); // 0 if progressPct === 0
  const rest = Math.max(0, 100 - doneWithoutTick - tickSlice);

  const EndLabels = () => (
    <>
      <text
        x={cx - (inner + outer) / 2}
        y={cy + 18}
        textAnchor="middle"
        fill="#A3AED0"
        fontSize="12"
      >
        -100
      </text>
      <text
        x={cx + (inner + outer) / 2}
        y={cy + 18}
        textAnchor="middle"
        fill="#A3AED0"
        fontSize="12"
      >
        +100
      </text>
    </>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-bold text-[#2B3674] leading-none mt-2">
        {displayed}
      </div>

      <PieChart width={width} height={height}>
        {/* Background track */}
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
          paddingAngle={0}
        />

        {/* Progress arc */}
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
          paddingAngle={0}
        >
          <Cell fill="#3F11FF" />
          <Cell fill="transparent" />
        </Pie>

        {/* Tick as a very thin arc centered at the end of the purple arc */}
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
          // Make the tick slightly overlap the purple band so it looks like a line
          innerRadius={inner - 8}
          outerRadius={outer + 8}
          isAnimationActive={false}
          paddingAngle={0}
        />

        <Customized component={<EndLabels />} />
      </PieChart>
    </div>
  );
}
