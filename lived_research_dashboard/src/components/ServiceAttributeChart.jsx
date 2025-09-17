// src/components/ServiceAttributeChart.jsx

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine
} from "recharts";
import ChartCard from "./ChartCard";

// === small helper for click-away ===
function useClickAway(ref, onAway) {
  useEffect(() => {
    function handler(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onAway?.();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onAway]);
}

const CheckBoxIcon = ({ checked }) => (
  <span
    className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
      checked ? "bg-[#3F11FF] border-[#3F11FF]" : "bg-white border-[#DCE1ED]"
    }`}
  >
    <svg width="10" height="10" viewBox="0 0 24 24">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke={checked ? "#FFFFFF" : "transparent"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const SelectedAttributesDropdown = ({ allItems, selectedSet, onChange }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useClickAway(boxRef, () => setOpen(false));

  const toggle = (name) => {
    const next = new Set(selectedSet);

    if (next.has(name)) {
      next.delete(name);
    } else {
      // ✅ Enforce max 5
      if (next.size >= 5) {
        return; // block more than 5
      }
      next.add(name);
    }
    onChange(next);
  };

  const clearAll = () => onChange(new Set());
  const selectFive = () => onChange(new Set(allItems.slice(0, 5))); // ✅ only first 5

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-[#A3AED0] hover:text-[#3F11FF]"
      >
        <span className="select-none">Selected Attributes</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] rounded-2xl bg-white shadow-lg ring-1 ring-black/5 z-50">
          <div className="px-4 py-3 border-b border-[#E7ECF6] flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#2B3674]">Attributes</span>
            <button
              onClick={selectedSet.size > 0 ? clearAll : selectFive}
              className="text-[13px] font-medium text-[#3F11FF] hover:underline"
            >
              {selectedSet.size > 0 ? "Clear all" : "Select 5"}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {allItems.map((name, idx) => {
              const checked = selectedSet.has(name);
              const disabled = !checked && selectedSet.size >= 5; // ✅ disable after 5
              return (
                <button
                  key={name}
                  onClick={() => toggle(name)}
                  disabled={disabled}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 text-[15px] text-[#2B3674] hover:bg-[#F6F8FF] ${
                    idx !== allItems.length - 1 ? "border-b border-[#EEF2FB]" : ""
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <CheckBoxIcon checked={checked} />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// === Tooltip inline (to avoid missing file imports) ===
const ServiceAttributeTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const total = (byKey.always || 0) + (byKey.most || 0);
  const midX = (viewBox?.x ?? 0) + ((viewBox?.width ?? 0) / 2);
  const side =
    coordinate?.x != null && midX
      ? coordinate.x < midX
        ? "right"
        : "left"
      : "left";

  const rows = [
    { key: "always", label: "Always", cls: "trend-dot trend-dot--very", val: byKey.always },
    { key: "most", label: "Most of the time", cls: "trend-dot trend-dot--satisfied", val: byKey.most },
  ];

  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
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

// === Label wrapping helpers ===
const LABEL_FONT_FAMILY = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 16;
const AXIS_BOTTOM_PADDING = 8;
const GUIDE_LABEL_OFFSET = 18;
const GUIDE_MARGIN_RIGHT = 84;

function measureTextWidth(text, font = `${LABEL_FONT_SIZE}px ${LABEL_FONT_FAMILY}`) {
  const canvas = measureTextWidth.__c || (measureTextWidth.__c = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  return ctx.measureText(text).width;
}

function wrapLabelToLines(label, maxWidthPx) {
  const words = String(label).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (measureTextWidth(test) <= maxWidthPx) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (measureTextWidth(w) > maxWidthPx) {
        let part = "";
        for (const ch of w) {
          if (measureTextWidth(part + ch) > maxWidthPx) {
            lines.push(part);
            part = ch;
          } else {
            part += ch;
          }
        }
        current = part;
      } else {
        current = w;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function computeWrappedMapAndMaxLines(data, labelKey, maxWidthPx) {
  const map = new Map();
  let maxLines = 1;
  data.forEach((d) => {
    const label = d[labelKey];
    const lines = wrapLabelToLines(label, maxWidthPx);
    map.set(label, lines);
    if (lines.length > maxLines) maxLines = lines.length;
  });
  return { linesMap: map, maxLines };
}

const WrappedTick = ({ x, y, payload, linesMap, maxLines }) => {
  const lines = linesMap.get(payload.value) || [payload.value];
  const reservedH = maxLines * LABEL_LINE_HEIGHT;
  const ownH = lines.length * LABEL_LINE_HEIGHT;
  const offsetY = y + (reservedH - ownH) / 2;

  return (
    <g transform={`translate(${x},${offsetY})`}>
      <text fontFamily={LABEL_FONT_FAMILY} fontSize={LABEL_FONT_SIZE} textAnchor="middle" fill="#A3AED0">
        {lines.map((ln, i) => (
          <tspan key={i} x={0} dy={LABEL_LINE_HEIGHT}>{ln}</tspan>
        ))}
      </text>
    </g>
  );
};

const PercentLabel = ({ viewBox, value, color = '#A3AED0' }) => {
  const x = viewBox.x + viewBox.width + GUIDE_LABEL_OFFSET;
  const y = viewBox.y;
  return (
    <text x={x} y={y} dy={4} fill={color} fontSize={12} textAnchor="start">
      {value}%
    </text>
  );
};


// === Loader skeleton for chart ===
const ChartSkeleton = () => {
  return (
    <div className="animate-pulse p-6">
      <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
      <div className="flex items-end space-x-4 h-48">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-8 bg-gray-300 rounded-t" style={{ height: `${40 + i * 20}px` }}></div>
            <div className="h-4 w-12 bg-gray-200 rounded mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};


// === Component ===
export default function ServiceAttributeChart({ surveyId, gender, participantType, selectedAttrs, onAvailableAttrs, onSelectedChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [availableAttrs, setAvailableAttrs] = useState([]);

  const chartRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(0);
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => setCardWidth(el.clientWidth || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fetch attributes
  useEffect(() => {
    let cancelled = false;

    async function fetchServiceAttributes() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/charts/service-attributes`;
        const params = new URLSearchParams({ surveyId });
        if (gender != null) params.append("gender", gender);
        if (participantType != null) params.append("participantType", participantType);

        const url = `${baseUrl}?${params.toString()}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (!cancelled && json.success) {
          if (Array.isArray(json.data?.attributes)) {
            const mapped = json.data.attributes.map((a) => ({
              name: a.attributeName,
              always: a.alwaysPercentage ?? 0,
              most: a.mostPercentage ?? 0,
            }));
            setData(mapped);

            const avail = mapped.map(a => a.name);
            setAvailableAttrs(avail);
            onAvailableAttrs?.(avail);

            // Default to first 5 if nothing selected
            if (!selectedAttrs || selectedAttrs.size === 0) {
              onSelectedChange?.(new Set(avail.slice(0, 5)));
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load Service Attributes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchServiceAttributes();
    return () => { cancelled = true; };
  }, [surveyId, gender, participantType]);

  const dataForChart = useMemo(() => {
    if (!selectedAttrs || selectedAttrs.size === 0) return data;
    return data.filter((d) => selectedAttrs.has(d.name));
  }, [data, selectedAttrs]);

  const slots = dataForChart.length || 1;
  const perSlot = cardWidth ? cardWidth / slots : 90;
  const labelMaxWidth = Math.min(120, Math.max(60, perSlot * 0.85));
  const { linesMap, maxLines } = computeWrappedMapAndMaxLines(dataForChart, "name", labelMaxWidth);
  const xAxisHeight = maxLines * LABEL_LINE_HEIGHT + AXIS_BOTTOM_PADDING;

  return (
    <ChartCard
      title={
        <div className="flex justify-between items-center">
          <span>Service Attribute</span>
          <SelectedAttributesDropdown
            allItems={availableAttrs}
            selectedSet={selectedAttrs}
            onChange={onSelectedChange}
          />
        </div>
      }
      content={
        <div className="relative" ref={chartRef}>
          {loading ? (
            <ChartSkeleton />
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={dataForChart}
                  barCategoryGap="35%"
                  margin={{ top: 30, right: GUIDE_MARGIN_RIGHT, left: 0, bottom: xAxisHeight }}
                >
                  <YAxis domain={[0, 100]} hide />

                  <ReferenceLine
                    y={80}
                    isFront
                    stroke="#A3AED0"
                    strokeDasharray="6 6"
                    ifOverflow="extendDomain"
                    label={<PercentLabel value={80} color="#3F11FF" />}
                  />
                  <ReferenceLine
                    y={60}
                    isFront
                    stroke="#A3AED0"
                    strokeDasharray="6 6"
                    ifOverflow="extendDomain"
                    label={<PercentLabel value={60} color="#6AD2FF" />}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={xAxisHeight}
                    tick={(props) => <WrappedTick {...props} linesMap={linesMap} maxLines={maxLines} />}
                  />

                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={<ServiceAttributeTooltip />}
                    offset={0}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 9999, overflow: "visible" }}
                    contentStyle={{ background: "transparent", border: "none", boxShadow: "none" }}
                  />

                  <Bar dataKey="most" stackId="a" fill="#6AD2FF" barSize={32} />
                  <Bar dataKey="always" stackId="a" fill="#3F11FF" barSize={32} radius={[8, 8, 0, 0]} minPointSize={6} />
                </BarChart>
              </ResponsiveContainer>

              <div className="trend-legend--below mt-2">
                <div className="trend-legend__item"><span className="trend-dot trend-dot--very" /> Always</div>
                <div className="trend-legend__item"><span className="trend-dot trend-dot--satisfied" /> Most of the time</div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
