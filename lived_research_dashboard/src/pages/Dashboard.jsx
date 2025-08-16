import React from 'react';
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import NpsGauge from "../components/NpsGauge";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, Legend,
} from 'recharts';

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

  // Decide side based on bar X vs chart mid X (fallback to 'left' if missing)
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

/* Pie tooltip that reuses the same bubble + arrow classes */
const PieTooltip = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;

  const val = payload?.[0]?.value; // your pie values are already percentages

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

const promoterData = [
  { name: 'Promoter', value: 15, color: '#5B4EFF' },
  { name: 'Passive', value: 10, color: '#7FDBFF' },
  { name: 'Detractor', value: 11, color: '#E0E0E0' },
];

const serviceData = [
  { name: 'Activity Availability', always: 36, most: 59 },
  { name: 'Facilities', always: 30, most: 50 },
  { name: 'Garden Care', always: 35, most: 45 },
  { name: 'Safety & Security', always: 36, most: 59 },
  { name: 'Staff Service', always: 30, most: 50 },
  { name: 'Village Location Access', always: 36, most: 45 },
];

export default function Dashboard() {
  return (
    <div className="p-0"> {/* content only; AppLayout provides padding/background */}
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
                    {/* fixed hex (was '#3406ffff') */}
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

                  {/* ADDED: Tooltip for Pie using same bubble + arrow */}
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

                  {/* bottom → middle → top */}
                  <Bar dataKey="somewhat" stackId="a" fill="#E0E6F5" />
                  <Bar dataKey="satisfied" stackId="a" fill="#40CFFF" />
                  <Bar dataKey="very" stackId="a" fill="#5B4EFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* absolute legend inside the card */}
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
            <NpsGauge value={72} />   // pass any NPS number here
          }
        />

        {/* Promoter Statistic */}
        <ChartCard
          title="Promoter Statistic"
          content={
            <div className="space-y-3">
              {promoterData.map((item, i) => (
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

        {/* Service Attribute */}
        <ChartCard
          title="Service Attribute"
          content={
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={serviceData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="most" stackId="a" fill="#7FDBFF" />
                  <Bar dataKey="always" stackId="a" fill="#5B4EFF" />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-500 mt-2">Selected Attributes</div>
            </>
          }
        />
      </div>
    </div>
  );
}
