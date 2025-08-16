import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Customized } from "recharts";

export default function NpsGauge({
  value = 72,        // purple progress value in domain units
  min = -100,
  max = 100,
  size = 220,
  thickness = 22,

  // Choose ONE of these to position the cyan divider:
  parts,             // e.g. [63, 37] or [promoters, others] – tick at left/sum
  tickAt,            // e.g. 20 (domain value between min..max)

  // Optional: inset so the tick stays neatly inside the ring
  tickInset = 0,     // 0..(thickness/2) – 0 means edge-to-edge of the ring
}) {
  // normalize progress for purple arc
  const tProgress = useMemo(() => {
    const v = Math.max(min, Math.min(max, value));
    return (v - min) / (max - min); // 0..1
  }, [value, min, max]);

  // normalize tick position
  const tTick = useMemo(() => {
    if (Array.isArray(parts) && parts.length >= 2) {
      const [a, b] = parts;
      const sum = (Number(a) || 0) + (Number(b) || 0);
      return sum > 0 ? (a / sum) : 0; // 0..1 along the semicircle
    }
    if (tickAt != null) {
      // domain-based
      const v = Math.max(min, Math.min(max, tickAt));
      return (v - min) / (max - min); // 0..1
    }
    // default: put tick at progress end if nothing provided
    return tProgress;
  }, [parts, tickAt, tProgress, min, max]);

  const width = size;
  const height = Math.round(size * 0.60);
  const cx = width / 2;
  const cy = Math.round(height * 0.97);
  const outer = Math.min(cx, cy) - 4;
  const inner = outer - thickness;
  const rMid = (inner + outer) / 2;

  // angles: 180° (π) on the left to 0° on the right
  const progressPct = Math.round(tProgress * 100);
  const angleTick = Math.PI * (1 - tTick); // map 0..1 → π..0

  
  // Tick stays fully inside ring: from (inner+inset) to (outer-inset)
  const inset = Math.max(0, Math.min(thickness / 2 - 0.5, tickInset));
  const tickRInner = inner + inset;
  const tickROuter = outer - inset;

  const tickInner = {
    x: cx + tickRInner * Math.cos(angleTick),
    y: cy - tickRInner * Math.sin(angleTick),
  };
  const tickOuter = {
    x: cx + tickROuter * Math.cos(angleTick),
    y: cy - tickROuter * Math.sin(angleTick),
  };

  const EndLabels = () => (
    <>
      <text x={cx - rMid} y={cy + 18} textAnchor="middle" fill="#A3AED0" fontSize="12">-100</text>
      <text x={cx + rMid} y={cy + 18} textAnchor="middle" fill="#A3AED0" fontSize="12">+100</text>
    </>
  );

  const Tick = () => (
    <line
      x1={tickInner.x} y1={tickInner.y}
      x2={tickOuter.x} y2={tickOuter.y}
      stroke="#7FD3FF"
      strokeWidth="4"
      strokeLinecap="butt"   // sharp, not rounded
    />
  );

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-bold text-[#2B3674] leading-none mt-2">
        {Math.round(value)}
      </div>

      <PieChart width={width} height={height}>
        {/* Pale track */}
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
        />

        {/* Purple progress (flat ends) */}
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
        >
          <Cell fill="#3F11FF" />
          <Cell fill="transparent" />
        </Pie>

        {/* Cyan divider line + end labels */}
        <Customized component={<Tick />} />
        <Customized component={<EndLabels />} />
      </PieChart>
    </div>
  );
}
