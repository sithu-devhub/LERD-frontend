// src/pages/Dashboard.jsx

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import DashboardFilters from "../components/DashboardFilters";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts';

import ResponseChart from "../components/ResponseChart";
import CustomerSatisfaction from "../components/CustomerSatisfactionChart";
import CustomerSatisfactionTrend from "../components/CustomerSatisfactionTrend"; 
import NpsChart from "../components/NpsChart"; 
import NpsDistribution from "../components/NpsDistribution"; 
import ServiceAttributeChart from "../components/ServiceAttributeChart.jsx"; 

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


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
  // ===== Reverse maps for UI =====
  const genderReverseMap = { null: "All", 1: "Male", 2: "Female", 3: "Other" };
  const clientReverseMap = { null: "All", 1: "Residents", 2: "Next of Kin" };

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
    if (!serviceId) return;
    let aborted = false;

    async function load() {
      try {
        setServiceLoading(true);
        setServiceError('');

        // TEMPORARILY DISABLED UNTIL API IS READY
        // const res = await fetch(`http://localhost:8000/api/services/${encodeURIComponent(serviceId)}`);
        // if (!res.ok) throw new Error(`Failed to fetch service: ${res.status}`);
        // const data = await res.json();
        // if (!aborted) {
        //   const name = data?.name || data?.label || humanize(serviceId);
        //   setServiceName(name);
        // }

        // fallback: just humanize
        if (!aborted) {
          setServiceName(humanize(serviceId));
        }

      } catch (e) {
        if (!aborted) {
          setServiceError(e?.message || 'Failed to load service');
          setServiceName((prev) => prev || humanize(serviceId));
        }
      } finally {
        if (!aborted) setServiceLoading(false);
      }
    }

    load();
    return () => { aborted = true; };
  }, [serviceId]);

  // =======================================


  
  // Filter bar state
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("dashboardFilters");
    return saved
      ? JSON.parse(saved)
      : {
          gender: null,
          participantType: null,
          year: new Date().getFullYear(),
          start: null,
          end: null,
        };
  });

  // Persist filters
  useEffect(() => {
    localStorage.setItem("dashboardFilters", JSON.stringify(filters));
  }, [filters]);




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

  const handleFilterChange = useCallback(({ gender, participantType, year, start, end }) => {
    setFilters({
      gender,           
      participantType,  
      year,
      start,
      end,
    });
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
        <ResponseChart
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
        />

        {/* Customer Satisfaction */}
        <CustomerSatisfaction
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
        />

        {/* Customer Satisfaction Trend */}
        <CustomerSatisfactionTrend
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
        />

      </div>

      <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
        {/* Net Promoter Score */}  
        <NpsChart
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
        />

        {/* NPS Distribution */}
        <NpsDistribution
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
        />


        {/* Service Attribute */}
        <ServiceAttributeChart
          surveyId={"8dff523d-2a46-4ee3-8017-614af3813b32"}
          gender={filters.gender}
          participantType={filters.participantType}
          selectedAttrs={selectedAttrs}
        />

      </div>

      {/* Filter bar */}
      <div className="mb-6">
      <DashboardFilters
        value={{
          gender: genderReverseMap[filters.gender],
          clientType: clientReverseMap[filters.participantType],
          year: filters.year,
          startMonth: filters.start,
          endMonth: filters.end,
        }}
        onChange={handleFilterChange}
      />
      </div>
    </div>
  );
}
