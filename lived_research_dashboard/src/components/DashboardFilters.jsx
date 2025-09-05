import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { MdBarChart } from "react-icons/md";

// Small helper for outside-click
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

const Chip = ({ label, value, active, onClick }) => (
  <button
    onMouseDown={(e) => e.stopPropagation()}   // ⬅️ block doc mousedown
    onTouchStart={(e) => e.stopPropagation()}  // ⬅️ block doc touchstart
    onClick={onClick}
    className={[
      "group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-[#bfc8dd] text-white shadow-sm"
             : "bg-[#bfc8dd] text-white hover:bg-[#c7d0e3]",
    ].join(" ")}
  >
    <span className="inline-flex items-center gap-2">
      <span className="text-white">{label}</span>
      <span className="mx-2 inline-block h-1 w-1 rounded-full bg-white/60" />
      <span className="text-white">{value}</span>
    </span>
    <ChevronDown className="h-4 w-4 text-white" />
  </button>
);


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

function GenderMenu({ value, onChange, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  const options = ["All", "Male", "Female", "Other"];
  return (
    <FloatingCard ref={ref}>
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

function ClientTypeMenu({ value, onChange, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  const options = ["All", "Residents", "Next of Kin"];
  return (
    <FloatingCard ref={ref}>
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

function MonthButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-[#bfc8dd] text-white"
               : "bg-slate-100 text-black hover:bg-slate-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PeriodMenu({ start, end, year, onSetRange, onChangeYear, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const handleMonthClick = (idx) => {
    if (start === null || (start !== null && end !== null)) {
      onSetRange({ start: idx, end: null });
    } else if (start !== null && end === null) {
      if (idx < start) onSetRange({ start: idx, end: start });
      else onSetRange({ start, end: idx });
    }
  };

  return (
    <FloatingCard ref={ref} width={360}>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-black hover:bg-slate-50"
          onClick={() => onChangeYear(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> {year - 1}
        </button>
        <div className="text-sm font-semibold text-black">{year}</div>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-black hover:bg-slate-50"
          onClick={() => onChangeYear(year + 1)}
        >
          {year + 1} <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1">
        {months.map((m, idx) => {
          const isActive =
            (start !== null && idx === start) ||
            (end !== null && idx === end) ||
            (start !== null && end !== null && idx > start && idx < end);

          return (
            <MonthButton
              key={m}
              label={m}
              active={isActive}
              onClick={() => handleMonthClick(idx)}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-black">
        <span>
          Period:{" "}
          <span className="font-semibold text-black">
            {start !== null ? `${months[start]} ${year}` : "—"}
          </span>{" "}
          –{" "}
          <span className="ml-1 font-semibold text-black">
            {end !== null ? `${months[end]} ${year}` : "Current"}
          </span>
        </span>
        <button onClick={onClose} className="rounded-lg px-2 py-1 text-black hover:bg-white">
          Done
        </button>
      </div>
    </FloatingCard>
  );
}

export default function DashboardFilters({ value, onChange, className = "" }) {
  const [gender, setGender] = useState(value?.gender || "All");
  const [clientType, setClientType] = useState(value?.clientType || "All");
  const today = new Date();
  const defaultYear = value?.year || today.getFullYear();
  const [year, setYear] = useState(defaultYear);

  // Month range
  const [range, setRange] = useState({
    start: value?.startMonth ?? null,
    end: value?.endMonth ?? null,
  });

  // Which dropdown is open: 'gender' | 'client' | 'period' | null
  const [open, setOpen] = useState(null);

  // Auto-scroll the bar into view whenever a dropdown opens
  const barRef = useRef(null);
  useEffect(() => {
    if (open && barRef.current) {
      barRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [open]);

  // Push value up
  useEffect(() => {
    if (typeof onChange === "function") {
      onChange({ gender, clientType, year, ...range });
    }
  }, [gender, clientType, year, range]);

  const periodLabel = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (range.start !== null && range.end !== null) {
      return `${months[range.start]} ${year} – ${months[range.end]} ${year}`;
    } else if (range.start !== null) {
      return `${months[range.start]} ${year} – Current`;
    }
    return "Select period";
  }, [range, year]);

  // Open the requested menu; this always closes the previous one
  const openMenu = (key) => setOpen(key);

  return (
    <div ref={barRef} className={`w-full ${className}`}>
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
            label="Gender"
            value={gender}
            active={open === "gender"}
            onClick={() => openMenu("gender")}
          />
          {open === "gender" && (
            <GenderMenu
              value={gender}
              onChange={(v) => {
                setGender(v);
                setOpen(null); // close after choose
              }}
              onClose={() => setOpen(null)}
            />
          )}
        </div>

        {/* Client type */}
        <div className="relative">
          <Chip
            label="Client type"
            value={clientType}
            active={open === "client"}
            onClick={() => openMenu("client")}
          />
          {open === "client" && (
            <ClientTypeMenu
              value={clientType}
              onChange={(v) => {
                setClientType(v);
                setOpen(null); // close after choose
              }}
              onClose={() => setOpen(null)}
            />
          )}
        </div>

        {/* Period */}
        <div className="relative">
          <Chip
            label="Period"
            value={periodLabel}
            active={open === "period"}
            onClick={() => openMenu("period")}
          />
          {open === "period" && (
            <PeriodMenu
              start={range.start}
              end={range.end}
              year={year}
              onSetRange={setRange}
              onChangeYear={setYear}
              onClose={() => setOpen(null)}
            />
          )}
        </div>

        <div className="ml-auto hidden items-center gap-2 pr-1 sm:flex">
          <span className="text-xs text-slate-400">Data last updated:</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
