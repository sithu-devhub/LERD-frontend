import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import NpsGauge from "../components/NpsGauge";
import DashboardFilters from "../components/DashboardFilters";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, Legend, ReferenceLine,
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
  const side = (coordinate?.x != null && midX)
    ? ((coordinate.x < midX) ? 'right' : 'left')
    : 'left';

  const rows = [
    { key: 'very',      label: 'Very Satisfied',     cls: 'trend-dot trend-dot--very',      val: byKey.very },
    { key: 'satisfied', label: 'Satisfied',          cls: 'trend-dot trend-dot--satisfied', val: byKey.satisfied },
    { key: 'somewhat',  label: 'Somewhat Satisfied', cls: 'trend-dot trend-dot--somewhat',  val: byKey.somewhat },
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
  const side = (coordinate?.x != null && midX)
    ? ((coordinate.x < midX) ? 'right' : 'left')
    : 'left';

  return (
    <div className={`trend-tooltip trend-tooltip--${side}`}>
      <div className="trend-tooltip__total">{val}%</div>
    </div>
  );
};

const TrendLegendBelow = () => (
  <div className="trend-legend--below">
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--very" /> Very Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--satisfied" /> Satisfied
    </div>
    <div className="trend-legend__item">
      <span className="trend-dot trend-dot--somewhat" /> Somewhat Satisfied
    </div>
  </div>
);

const ServiceTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;

  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p.value]));
  const total = (byKey.always || 0) + (byKey.most || 0);

  const midX = (viewBox?.x ?? 0) + ((viewBox?.width ?? 0) / 2);
  const side = (coordinate?.x != null && midX)
    ? (coordinate.x < midX ? 'right' : 'left')
    : 'left';

  const rows = [
    { key: 'always', label: 'Always', cls: 'trend-dot trend-dot--very', val: byKey.always },
    { key: 'most',   label: 'Most of the time', cls: 'trend-dot trend-dot--satisfied', val: byKey.most },
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

/* ======= ADDED: Wrapped X-axis label helpers (for Service Attribute) ======= */
const LABEL_FONT_FAMILY = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
const LABEL_FONT_SIZE = 12;      // match your XAxis tick fontSize
const LABEL_LINE_HEIGHT = 16;    // px per line
const AXIS_BOTTOM_PADDING = 8;   // breathing room under labels

function measureTextWidth(text, font = `${LABEL_FONT_SIZE}px ${LABEL_FONT_FAMILY}`) {
  const canvas =
    measureTextWidth.__c || (measureTextWidth.__c = document.createElement("canvas"));
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
        // hard wrap single long word
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
      <text
        fontFamily={LABEL_FONT_FAMILY}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="middle"
        fill="#A3AED0"
      >
        {lines.map((ln, i) => (
          <tspan key={i} x={0} dy={LABEL_LINE_HEIGHT}>
            {ln}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const PercentLabel = ({ viewBox, value, color = '#A3AED0' }) => {
  // push label well to the right of the chart plotting area
  const x = viewBox.x + viewBox.width + 48; // increase this offset until it matches your design
  const y = viewBox.y;

  return (
    <text
      x={x}
      y={y}
      dy={4}
      fill={color}
      fontSize={12}
      textAnchor="end"   // right-align text at this position
    >
      {value}%
    </text>
  );
};



/* ======= /helpers ======= */

export default function Dashboard() {
  // Filter state to pass to the filter bar (matches your FilterState)
  const [filters, setFilters] = useState({
    gender: 'All',
    clientTypes: ['Residents'], // or [] to represent “All”
    period: { month: 'Jan', year: new Date().getFullYear() }
  });

  // Track the Service Attribute card width for dynamic label wrapping
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

  // Stable adapter for DashboardFilters -> this page’s FilterState
  const handleFilterChange = useCallback(({ gender, clientType, year, startMonth }) => {
    setFilters(prev => ({
      ...prev,
      gender,
      clientTypes: clientType === 'All' ? [] : [clientType],
      period: { year, month: MONTHS[startMonth] }
    }));
    // TODO: trigger your data reload here using the new `filters`
  }, []);

  return (
    <div className="p-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard – Retirement Village
      </h1>

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
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%" outerRadius={70}
                    startAngle={90} endAngle={-270}
                    dataKey="value" paddingAngle={0}
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
                    wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                    contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                  />
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

        {/* Satisfaction Trend */}
        <ChartCard
          title="Customer Satisfaction Trend"
          content={
            <div className="trend-chart relative">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={satisfactionTrend} barCategoryGap="35%">
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 14 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={<TrendTooltip />}
                    offset={0}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                    contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                  />
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

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Net Promoter Score */}
        <ChartCard
          title="Net Promoter Score"
          content={
            <>
              <NpsGauge value={72} />
            </>
          }
        />

        {/* NPS Distribution */}
        <ChartCard
          title="NPS Distribution"
          content={
            <div className="space-y-3">
              {npsDistribution.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${item.value * 5}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* Service Attribute (UPDATED with wrapped X-axis labels) */}
        <ChartCard
          title="Service Attribute"
          content={
            <div className="relative" ref={serviceCardRef}>
              <div className="absolute right-0 -mt-2 text-sm text-[#A3AED0]">
                Selected Attributes
              </div>

              {(() => {
                const slots = serviceData.length || 1;
                const perSlot = serviceCardWidth ? serviceCardWidth / slots : 90;
                // allowed width for each label under a bar
                const labelMaxWidth = Math.min(120, Math.max(60, perSlot * 0.85));

                const { linesMap, maxLines } = computeWrappedMapAndMaxLines(
                  serviceData,
                  "name",
                  labelMaxWidth
                );

                const xAxisHeight = maxLines * LABEL_LINE_HEIGHT + AXIS_BOTTOM_PADDING;

                return (
                  <>

                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={serviceData}
                        barCategoryGap="35%"
                        // more right margin so labels sit outside the plot
                        margin={{ top: 30, right: 56, left: 0, bottom: xAxisHeight }}
                      >
                        {/* keep the y domain to 0–100 */}
                        <YAxis domain={[0, 100]} hide />

                        {/* 80% guide */}
                        <ReferenceLine
                          y={80}
                          isFront
                          stroke="#A3AED0"
                          strokeDasharray="6 6"
                          ifOverflow="extendDomain"
                          label={<PercentLabel value={80} color="#3F11FF" />}
                        />
                        {/* 60% guide */}
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
                          tick={(props) => (
                            <WrappedTick {...props} linesMap={linesMap} maxLines={maxLines} />
                          )}
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
                      <div className="trend-legend__item">
                        <span className="trend-dot trend-dot--very" /> Always
                      </div>
                      <div className="trend-legend__item">
                        <span className="trend-dot trend-dot--satisfied" /> Most of the time
                      </div>
                    </div>
                  </>
                );
              })()}
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
