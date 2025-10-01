// src/components/DashboardFilters.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { MdBarChart } from "react-icons/md";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// outside-click helper
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const DividerDot = () => (
  <span className="mx-2 inline-block h-1 w-1 rounded-full bg-white/60" />
);

// Chip (pill)
const Chip = ({ label, value, active, onClick, chipRef }) => (
  <button
    ref={chipRef}
    onMouseDown={(e) => e.stopPropagation()}
    onTouchStart={(e) => e.stopPropagation()}
    onClick={onClick}
    className={[
      "group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-[#bfc8dd] text-white shadow-sm"
             : "bg-[#bfc8dd] text-white hover:bg-[#c7d0e3]",
    ].join(" ")}
  >
    <span className="inline-flex items-center gap-2">
      <span className="text-white">{label}</span>
      <DividerDot />
      <span className="text-white">{value}</span>
    </span>
    <ChevronDown className="h-4 w-4 text-white" />
  </button>
);

// Floating card
const FloatingCard = React.forwardRef(function FloatingCard(
  { children, width = 320 },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ width }}
      className="absolute left-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-black"
    >
      {children}
    </div>
  );
});

function MenuItem({ checked, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-black hover:bg-slate-50"
    >
      <span>{children}</span>
      {checked ? <Check className="h-4 w-4 text-blue-600" /> : <span className="h-4 w-4" />}
    </button>
  );
}

function GenderMenu({ value, onChange, onClose, menuRef }) {
  useClickOutside(menuRef, onClose);
  const options = ["All", "Male", "Female", "Other"];
  return (
    <FloatingCard ref={menuRef}>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <MenuItem key={opt} checked={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </MenuItem>
        ))}
      </div>
    </FloatingCard>
  );
}

function ClientTypeMenu({ value, onChange, onClose, menuRef }) {
  useClickOutside(menuRef, onClose);
  const options = ["All", "Residents", "Next of Kin"];
  return (
    <FloatingCard ref={menuRef}>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <MenuItem key={opt} checked={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </MenuItem>
        ))}
      </div>
    </FloatingCard>
  );
}

function MonthButton({ label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-[#bfc8dd] text-white"
          : disabled
          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
          : "bg-slate-100 text-black hover:bg-slate-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PeriodMenu({ start, end, year, onSetRange, onChangeYear, onClose, menuRef, startYear, endYear }) {
  useClickOutside(menuRef, onClose);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  const handleMonthClick = (idx) => {
    if (year === currentYear && idx > currentMonth) return; // block future months

    // If starting fresh OR resetting range
    if (start === null || (start !== null && end !== null)) {
      onSetRange({ start: idx, startYear: year, end: null, endYear: null });
    } 
    // If already have start, set end
    else if (start !== null && end === null) {
      if (year < startYear || (year === startYear && idx < start)) {
        // selected before start → swap
        onSetRange({ start: idx, startYear: year, end: start, endYear: startYear });
      } else {
        // selected after start
        onSetRange({ start, startYear, end: idx, endYear: year });
      }
    }
  };

  return (
    <FloatingCard ref={menuRef} width={360}>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-black hover:bg-slate-50"
          onClick={() => onChangeYear(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> {year - 1}
        </button>
        <div className="text-sm font-semibold text-black">{year}</div>
        <button
          disabled={year >= currentYear}
          className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm ${
            year >= currentYear
              ? "text-slate-300 cursor-not-allowed"
              : "text-black hover:bg-slate-50"
          }`}
          onClick={() => onChangeYear(year + 1)}
        >
          {year + 1} <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1">
        {months.map((m, idx) => {
          const disabled = year === currentYear && idx > currentMonth;
          const isActive =
            (start !== null && idx === start && startYear === year) ||
            (end !== null && idx === end && endYear === year) ||
            (start !== null && end !== null &&
              ((year > startYear && year < endYear) ||
               (year === startYear && idx > start && (year < endYear || idx < end)) ||
               (year === endYear && idx < end && (year > startYear || idx > start))));
          return (
            <MonthButton
              key={`${m}-${year}`}
              label={m}
              active={isActive}
              onClick={() => handleMonthClick(idx)}
              disabled={disabled}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-black">
        <span>
          Period:{" "}
          <span className="font-semibold text-black">
            {start !== null ? `${months[start]} ${startYear}` : "—"}
          </span>{" "}
          –{" "}
          <span className="ml-1 font-semibold text-black">
            {end !== null ? `${months[end]} ${endYear}` : "Current"}
          </span>
        </span>
        <button 
          onClick={() => {
            onSetRange({ start, startYear, end, endYear }); // trigger state update for refresh
            onClose();                  // close menu
          }} 
          className="rounded-lg px-2 py-1 text-black hover:bg-white"
        >
          Done
        </button>
      </div>
    </FloatingCard>
  );
}

// === helper for API period string ===
function buildPeriodParam(range) {
  if (range.start !== null && range.end !== null) {
    const start = `${range.startYear}-${String(range.start + 1).padStart(2, "0")}`;
    const end = `${range.endYear}-${String(range.end + 1).padStart(2, "0")}`;
    return `${start}:${end}`;
  } else if (range.start !== null) {
    return `${range.startYear}-${String(range.start + 1).padStart(2, "0")}`;
  }
  return `${new Date().getFullYear()}`;
}

export default function DashboardFilters({ value, onChange, className = "" }) {
  // committed filters (actually used in API calls)
  const [gender, setGender] = useState(value?.gender || "All");
  const [clientType, setClientType] = useState(value?.clientType || "All");

  const [range, setRange] = useState({
    start: value?.startMonth ?? null,
    startYear: value?.startYear ?? new Date().getFullYear(),
    end: value?.endMonth ?? null,
    endYear: value?.endYear ?? null,
  });

  // pending filters (edited inside menus until Done is clicked)
  const [pendingGender, setPendingGender] = useState(gender);
  const [pendingClientType, setPendingClientType] = useState(clientType);
  const [pendingRange, setPendingRange] = useState(range);

  const [open, setOpen] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // calendar navigation

  const genderChipRef = useRef(null);
  const clientChipRef = useRef(null);
  const periodChipRef = useRef(null);

  const genderMenuRef = useRef(null);
  const clientMenuRef = useRef(null);
  const periodMenuRef = useRef(null);

  const rootRef = useRef(null);
  useClickOutside(rootRef, () => setOpen(null));

  // === NEW: data freshness state
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isFreshnessLoading, setIsFreshnessLoading] = useState(false);

  // Only fire API when committed state changes (after Done)
  useEffect(() => {
    if (typeof onChange === "function") {
      const genderMap = { All: null, Male: 1, Female: 2, Other: 3 };
      const clientTypeMap = { All: null, Residents: 1, "Next of Kin": 2 };

      const period = buildPeriodParam(range);

      onChange({
        gender: genderMap[gender],
        participantType: clientTypeMap[clientType],
        period,
      });
    }
  }, [gender, clientType, range, onChange]);

  // === NEW: Fetch Survey Data Freshness when surveyId changes
  useEffect(() => {
    const surveyId = value?.surveyId;
    if (!surveyId) {
      setLastUpdated(null);
      return;
    }

    let aborted = false;
    async function fetchFreshness() {
      try {
        setIsFreshnessLoading(true);
        const res = await fetch(`${API_BASE}/surveys/${surveyId}/last-updated`);
        const json = await res.json();
        if (!aborted) {
          if (json?.success && json?.data?.formattedTime) {
            setLastUpdated(json.data.formattedTime);
          } else {
            setLastUpdated("No data available");
          }
        }
      } catch (e) {
        if (!aborted) setLastUpdated("Error fetching");
      } finally {
        if (!aborted) setIsFreshnessLoading(false);
      }
    }

    fetchFreshness();
    return () => { aborted = true; };
  }, [value?.surveyId]);

  const periodLabel = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (pendingRange.start !== null && pendingRange.end !== null) {
      return `${months[pendingRange.start]} ${pendingRange.startYear} – ${months[pendingRange.end]} ${pendingRange.endYear}`;
    } else if (pendingRange.start !== null) {
      return `${months[pendingRange.start]} ${pendingRange.startYear} – Current`;
    }
    return "Select period";
  }, [pendingRange]);

  const handleOpen = (key) => {
    setOpen((prev) => (prev === key ? null : key));
    if (key === "period") {
      setCurrentYear(pendingRange.startYear || new Date().getFullYear());
    }
  };

  useEffect(() => {
    if (!open) return;
    const map = {
      gender: genderMenuRef.current,
      client: clientMenuRef.current,
      period: periodMenuRef.current,
    };
    const el = map[open];
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const bottomPad = 16;
      const topPad = 16;
      const overflowBottom = rect.bottom - (window.innerHeight - bottomPad);
      const overflowTop = topPad - rect.top;
      if (overflowBottom > 0) {
        window.scrollBy({ top: overflowBottom, behavior: "smooth" });
      } else if (overflowTop > 0) {
        window.scrollBy({ top: -overflowTop, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div ref={rootRef} className={`w-full ${className}`}>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#F3F0FF]">
            <MdBarChart className="h-4 w-4 text-[#4318FF]" />
          </div>
          Data filter:
        </div>

        {/* Gender */}
        <div className="relative">
          <Chip
            chipRef={genderChipRef}
            label="Gender"
            value={pendingGender}
            active={open === "gender"}
            onClick={() => handleOpen("gender")}
          />
          {open === "gender" && (
            <GenderMenu
              value={pendingGender}
              onChange={(v) => {
                setPendingGender(v);
                setGender(v); // commit immediately or move to Done if needed
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
              menuRef={genderMenuRef}
            />
          )}
        </div>

        {/* Client type */}
        <div className="relative">
          <Chip
            chipRef={clientChipRef}
            label="Client type"
            value={pendingClientType}
            active={open === "client"}
            onClick={() => handleOpen("client")}
          />
          {open === "client" && (
            <ClientTypeMenu
              value={pendingClientType}
              onChange={(v) => {
                setPendingClientType(v);
                setClientType(v);
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
              menuRef={clientMenuRef}
            />
          )}
        </div>

        {/* Period */}
        <div className="relative">
          <Chip
            chipRef={periodChipRef}
            label="Period"
            value={periodLabel}
            active={open === "period"}
            onClick={() => handleOpen("period")}
          />
          {open === "period" && (
            <PeriodMenu
              start={pendingRange.start}
              end={pendingRange.end}
              startYear={pendingRange.startYear}
              endYear={pendingRange.endYear}
              year={currentYear}
              onSetRange={setPendingRange}
              onChangeYear={setCurrentYear}
              onClose={() => {
                setRange(pendingRange); // commit full range (with years)
                setOpen(null);
              }}
              menuRef={periodMenuRef}
            />
          )}
        </div>

        <div className="ml-auto hidden items-center gap-2 pr-1 sm:flex">
          <span className="text-xs text-slate-400">Data last updated:</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {isFreshnessLoading
              ? "Loading..."
              : lastUpdated || new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
