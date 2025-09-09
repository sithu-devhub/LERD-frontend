import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom'; // ADDED
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import NpsGauge from "../components/NpsGauge";
import DashboardFilters from "../components/DashboardFilters";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const responseData = [
  { name: 'Village Name 1', value: 88 },
  { name: 'Village Name 2', value: 101 },
  { name: 'Village Name 3', value: 90 },
];

const pieData = [
  { name: 'Very Satisfied', value: 63 },
  { name: 'Satisfied', value: 12 },
  { name: 'Somewhat Satisfied', value: 20 },
];
const pieColors = ['#3F11FF', '#6AD2FF', '#E0E0E0'];

const satisfactionTrend = [
  { year: '2023', very: 26, satisfied: 40, somewhat: 32 },
  { year: '2024', very: 56, satisfied: 20, somewhat: 22 },
  { year: '2025', very: 36, satisfied: 30, somewhat: 32 },
];

const TrendTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p.value]));
  const total = (byKey.somewhat || 0) + (byKey.satisfied || 0) + (byKey.very || 0);
  const midX = (viewBox?.x ?? 0) + ((viewBox?.width ?? 0) / 2);
  const side = (coordinate?.x != null && midX) ? (coordinate.x < midX ? 'right' : 'left') : 'left';

  const rows = [
    { key: 'very', label: 'Very Satisfied', cls: 'trend-dot trend-dot--very', val: byKey.very },
    { key: 'satisfied', label: 'Satisfied', cls: 'trend-dot trend-dot--satisfied', val: byKey.satisfied },
    { key: 'somewhat', label: 'Somewhat Satisfied', cls: 'trend-dot trend-dot--somewhat', val: byKey.somewhat },
  ];

  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
      <div className="trend-tooltip__total">{total}%</div>
      {rows.map(r => (
        <div key={r.key} className="trend-tooltip__row">
          <span className={r.cls} />
          <span className="trend-tooltip__value">{r.val}%</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const val = payload?.[0]?.value;
  const midX = (viewBox?.x ?? 0) + ((viewBox?.width ?? 0) / 2);
  const side = (coordinate?.x != null && midX) ? (coordinate.x < midX ? 'right' : 'left') : 'left';
  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
      <div className="trend-tooltip__total">{val}%</div>
    </div>
  );
};

const TrendLegendBelow = () => (
  <div className="trend-legend--below">
    <div className="trend-legend__item"><span className="trend-dot trend-dot--very" /> Very Satisfied</div>
    <div className="trend-legend__item"><span className="trend-dot trend-dot--satisfied" /> Satisfied</div>
    <div className="trend-legend__item"><span className="trend-dot trend-dot--somewhat" /> Somewhat Satisfied</div>
  </div>
);

const ServiceTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p.value]));
  const total = (byKey.always || 0) + (byKey.most || 0);
  const midX = (viewBox?.x ?? 0) + ((viewBox?.width ?? 0) / 2);
  const side = (coordinate?.x != null && midX) ? (coordinate.x < midX ? 'right' : 'left') : 'left';

  const rows = [
    { key: 'always', label: 'Always', cls: 'trend-dot trend-dot--very', val: byKey.always },
    { key: 'most', label: 'Most of the time', cls: 'trend-dot trend-dot--satisfied', val: byKey.most },
  ];

  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
      <div className="trend-tooltip__total">{total}%</div>
      {rows.map(r => (
        <div key={r.key} className="trend-tooltip__row">
          <span className={r.cls} />
          <span className="trend-tooltip__value">{r.val}%</span>
        </div>
      ))}
    </div>
  );
};

const npsDistribution = [
  { name: 'Promoter', value: 15, color: '#7FDBFF' },
  { name: 'Passive', value: 10, color: '#7FDBFF' },
  { name: 'Detractor', value: 11, color: '#7FDBFF' },
];

const serviceData = [
  { name: 'Activity Availability', always: 36, most: 59 },
  { name: 'Facilities', always: 30, most: 50 },
  { name: 'Garden Care', always: 35, most: 45 },
  { name: 'Safety & Security', always: 36, most: 59 },
  { name: 'Staff Service', always: 30, most: 50 },
  { name: 'Village Location Access', always: 36, most: 45 },
];

/* ======= Wrapped X-axis label helpers (for Service Attribute) ======= */
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
/* ======= /helpers ======= */

/* ======= Dropdown for Selected Attributes (mock style) ======= */
function useClickAway(ref, onAway) {
  React.useEffect(() => {
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

const SelectedAttributesDropdown = ({ allItems, selectedSet, onChange, className = "" }) => {
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef(null);
  useClickAway(boxRef, () => setOpen(false));

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (name) => {
    const next = new Set(selectedSet);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange(next);
  };

  const allChecked = selectedSet.size === allItems.length;
  const clearAll = () => onChange(new Set());
  const selectAll = () => onChange(new Set(allItems));

  return (
    <div ref={boxRef} className={`relative inline-block ${className}`}>
      {/* text-only trigger; brighter hover blue to match theme */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm text-[#A3AED0] hover:text-[#3F11FF] focus:outline-none cursor-pointer"
      >
        <span className="select-none">Selected Attributes</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className="opacity-70 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[320px] rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,25,39,0.12)] ring-1 ring-black/5 z-50"
          role="menu"
        >
          {/* header */}
          <div className="px-4 py-3 border-b border-[#E7ECF6] flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#2B3674]">Attributes</span>
            <button
              onClick={allChecked ? clearAll : selectAll}
              className="text-[13px] font-medium text-[#3F11FF] hover:underline"
            >
              {allChecked ? "Clear all" : "Select all"}
            </button>
          </div>

          {/* list */}
          <div className="max-h-64 overflow-y-auto">
            {allItems.map((name, idx) => {
              const checked = selectedSet.has(name);
              const isLast = idx === allItems.length - 1;
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => toggle(name)}
                  className={`w-full px-4 py-3 text-left text-[15px] text-[#2B3674] 
                              flex items-center gap-3 hover:bg-[#F6F8FF] ${!isLast ? "border-b border-[#EEF2FB]" : ""}`}
                >
                  <CheckBoxIcon checked={checked} />
                  <span className="leading-snug">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
/* ======= /dropdown ======= */

export default function Dashboard() {
  // ===== DYNAMIC SERVICE NAME (ADDED) =====
  const { serviceId } = useParams();
  const location = useLocation();

  // Humanize fallback: "home_care" -> "Home Care"
  const humanize = (id) =>
    (id ? String(id).replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Retirement Village');

  const [serviceName, setServiceName] = useState(
    // If you ever pass state.name from navigation, use it optimistically
    location.state?.service || humanize(serviceId) || 'Retirement Village'
  );
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    if (!serviceId) return; // stay with default title if no ID in URL
    let aborted = false;

    async function load() {
      try {
        setServiceLoading(true);
        setServiceError('');
        // endpoint to match mock/real API
        const res = await fetch(`http://localhost:8000/api/services/${encodeURIComponent(serviceId)}`);
        if (!res.ok) {
          // If your mock server returns arrays, you can adapt parsing here.
          throw new Error(`Failed to fetch service: ${res.status}`);
        }
        const data = await res.json(); // expected shape: { id, name, ... }
        if (!aborted) {
          const name = data?.name || data?.label || humanize(serviceId);
          setServiceName(name);
        }
      } catch (e) {
        if (!aborted) {
          setServiceError(e?.message || 'Failed to load service');
          setServiceName((prev) => prev || humanize(serviceId)); // ensure we show something readable
        }
      } finally {
        if (!aborted) setServiceLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [serviceId]); // re-run if user navigates to a different service

  // =======================================

  // Filter bar state
  const [filters, setFilters] = useState({
    gender: 'All',
    clientTypes: ['Residents'],
    period: { month: 'Jan', year: new Date().getFullYear() }
  });

  // Measure card width
  const serviceCardRef = useRef(null);
  const [serviceCardWidth, setServiceCardWidth] = useState(0);
  useLayoutEffect(() => {
    const el = serviceCardRef.current;
    if (!el) return;
    const update = () => setServiceCardWidth(el.clientWidth || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleFilterChange = useCallback(({ gender, clientType, year, startMonth }) => {
    setFilters(prev => ({
      ...prev,
      gender,
      clientTypes: clientType === 'All' ? [] : [clientType],
      period: { year, month: MONTHS[startMonth] }
    }));
  }, []);

  // Dropdown selections for Service Attribute
  const allServiceNames = serviceData.map(d => d.name);
  const [selectedAttrs, setSelectedAttrs] = useState(new Set(allServiceNames));
  const filteredServiceData = React.useMemo(() => {
    if (!selectedAttrs.size) return [];
    const sel = selectedAttrs;
    return serviceData.filter(d => sel.has(d.name));
  }, [selectedAttrs]);

  return (
    <div className="p-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard – {serviceLoading ? 'Loading…' : serviceName}
      </h1>
      {serviceError && (
        <div className="text-sm text-red-600 mb-4">{serviceError}</div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Response */}
        <ChartCard
          title="Response"
          content={
            <>
              <div className="flex flex-col gap-2 mb-6">
                <div className="metric-aligned-row">
                  <h2 className="metric-number-aligned">279</h2>
                  <span className="metric-label-aligned">Participants</span>
                </div>
                <div className="metric-aligned-row">
                  <h2 className="metric-number-aligned">23%</h2>
                  <span className="metric-label-aligned">Response Rate</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={responseData} margin={{ top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="brightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3406FF" />
                      <stop offset="100%" stopColor="#C6BBFF" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ className: 'bar-xaxis' }} />
                  <YAxis hide />
                  <Bar dataKey="value" fill="url(#brightGradient)" radius={[10, 10, 0, 0]} barSize={18}>
                    <LabelList dataKey="value" position="top" className="bar-label" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          }
        />

        {/* Customer Satisfaction */}
        <ChartCard
          title="Customer Satisfaction"
          content={
            <div className="flex flex-col items-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={0}>
                    {pieData.map((entry, i) => (<Cell key={i} fill={pieColors[i]} />))}
                  </Pie>
                  <Tooltip cursor={false} content={<PieTooltip />} offset={0} allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 9999, overflow: 'visible' }} contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pieColors[0] }} />
                    Very Satisfied
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">63%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pieColors[1] }} />
                    Satisfied
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">12%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm text-[#A3AED0]">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pieColors[2] }} />
                    Somewhat Satisfied
                  </div>
                  <div className="text-xl font-bold text-[#2B3674] mt-1">20%</div>
                </div>
              </div>
            </div>
          }
        />

        {/* Customer Satisfaction Trend */}
        <ChartCard
          title="Customer Satisfaction Trend"
          content={
            <div className="trend-chart relative">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={satisfactionTrend} barCategoryGap="35%">
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 14 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<TrendTooltip />} offset={0}
                    allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                    contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
                  <Bar dataKey="somewhat" stackId="a" fill="#E0E6F5" />
                  <Bar dataKey="satisfied" stackId="a" fill="#40CFFF" />
                  <Bar dataKey="very" stackId="a" fill="#5B4EFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <TrendLegendBelow />
            </div>
          }
        />
      </div>

      <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
        {/* Net Promoter Score */}
        <ChartCard title="Net Promoter Score" content={<NpsGauge value={72} />} />

        {/* NPS Distribution */}
        <ChartCard
          title="NPS Distribution"
          content={
            <div className="space-y-3">
              {npsDistribution.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{item.name}</span><span>{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-2 rounded-full" style={{ width: `${item.value * 5}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* Service Attribute */}
        <ChartCard
          title="Service Attribute"
          content={
            <div className="relative" ref={serviceCardRef}>
              {/* DROPDOWN ABOVE CHART */}
              <div className="absolute right-0 -mt-2 z-50 pointer-events-auto">
                <SelectedAttributesDropdown
                  allItems={allServiceNames}
                  selectedSet={selectedAttrs}
                  onChange={setSelectedAttrs}
                />
              </div>

              {/* CHART */}
              <div className="relative z-0">
                {(() => {
                  const dataForChart = filteredServiceData;
                  const slots = dataForChart.length || 1;
                  const perSlot = serviceCardWidth ? serviceCardWidth / slots : 90;
                  const labelMaxWidth = Math.min(120, Math.max(60, perSlot * 0.85));
                  const { linesMap, maxLines } = computeWrappedMapAndMaxLines(dataForChart, "name", labelMaxWidth);
                  const xAxisHeight = maxLines * LABEL_LINE_HEIGHT + AXIS_BOTTOM_PADDING;

                  return (
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
                            cursor={{ fill: 'transparent' }}
                            content={<ServiceTooltip />}
                            offset={0}
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                            contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                          />

                          <Bar dataKey="most" stackId="a" fill="#6AD2FF" stroke="none" barSize={32} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="always" stackId="a" fill="#3F11FF" stroke="none" barSize={32} radius={[8, 8, 0, 0]} minPointSize={6} />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="trend-legend--below mt-2">
                        <div className="trend-legend__item"><span className="trend-dot trend-dot--very" /> Always</div>
                        <div className="trend-legend__item"><span className="trend-dot trend-dot--satisfied" /> Most of the time</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          }
        />
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <DashboardFilters
          value={{
            gender: filters.gender,
            clientType: filters.clientTypes[0] || 'All',
            year: filters.period.year,
            startMonth: MONTHS.indexOf(filters.period.month),
          }}
          onChange={handleFilterChange}
        />
      </div>
    </div>
  );
}
