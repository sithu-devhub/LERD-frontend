// ServiceTypePage.jsx

import React from "react";
import { useNavigate } from "react-router-dom"; // ADDED

/**
 * Reusable tile that behaves like a radio option
 */
function ServiceTile({
  label,
  sublabel,
  value,
  selected,
  onChange,
  disabled = false,
}) {
  // colors
  const isSelected = selected === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(value);
        }
      }}
      aria-pressed={isSelected}
      aria-checked={isSelected}
      role="radio"
      className={[
        "relative w-full h-full text-left rounded-2xl transition shadow-sm",
        "px-6 py-6",
        "flex flex-col justify-center",          // center content, fill square
        "focus:outline-none",                     // no blue focus ring
        disabled
          ? "bg-[#BFC7DC] text-white opacity-70 cursor-not-allowed" // inactive
          : isSelected
          ? "bg-gradient-to-r from-[#7B61FF] to-[#3F11FF] text-white" // selected
          : "bg-white text-[#2B3674] border border-[#E9EEF7] hover:border-[#C8D3EE] hover:shadow" // unselected
      ].join(" ")}
    >
      {/* radio dot */}
      <span
        aria-hidden="true"
        className={[
          "absolute top-3 right-3 inline-flex items-center justify-center",
          "h-5 w-5 rounded-full border",
          isSelected
            ? "border-white"
            : disabled
            ? "border-[#D7DDEC]"
            : "border-[#B9C4DD]",
          "bg-transparent",
        ].join(" ")}
      >
        <span
          className={[
            "block h-2.5 w-2.5 rounded-full",
            isSelected ? "bg-white" : "bg-transparent",
          ].join(" ")}
        />
      </span>

      <div className="space-y-1 pr-8">
        <div
          className={[
            "font-semibold",
            // keep labels readable on both states
            isSelected ? "text-white" : "text-[#2B3674]",
          ].join(" ")}
        >
          {label}
        </div>
        {sublabel && (
          <div
            className={[
              "text-sm",
              isSelected ? "text-white/85" : "text-[#8FA0C6]",
            ].join(" ")}
          >
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

export default function ServiceType() {
  const navigate = useNavigate(); // ADDED

  const options = [
    { value: "retirement_village", label: "Retirement Village" },
    {
      value: "residential_care",
      label: "Residential Care",
      sublabel: "(Nursing Home)",
    },
    { value: "respite_care", label: "Respite Care" },
    { value: "home_care", label: "Home Care" },
    { value: "chsp", label: "CHSP" },
    { value: "day_club", label: "Day Club" },
    { value: "kites", label: "Kites" },
  ];

  const [selected, setSelected] = React.useState("retirement_village");

  // for keyboard radio group semantics
  const groupRef = React.useRef(null);
  const currentIndex = options.findIndex((o) => o.value === selected);
  const onArrow = (dir) => {
    const len = options.length;
    const nextIndex = (currentIndex + dir + len) % len;
    setSelected(options[nextIndex].value);
  };

  return (
    <div className="p-0">
      <h1 className="text-xl md:text-2xl font-semibold text-[#2B3674] mb-2">
        Service
      </h1>

      <div className="text-sm text-[#8FA0C6] mb-5">
        Select one service type:
      </div>

      {/* Radio group container */}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Service type"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            onArrow(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            onArrow(-1);
          }
        }}
      >
        {/* row 1 */}
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="retirement_village"
            label="Retirement Village"
            selected={selected}
            onChange={setSelected}
          />
        </div>
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="residential_care"
            label="Residential Care"
            sublabel="(Nursing Home)"
            selected={selected}
            onChange={setSelected}
          />
        </div>
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="respite_care"
            label="Respite Care"
            selected={selected}
            onChange={setSelected}
          />
        </div>
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="home_care"
            label="Home Care"
            selected={selected}
            onChange={setSelected}
          />
        </div>

        {/* row 2 */}
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="chsp"
            label="CHSP"
            selected={selected}
            onChange={setSelected}
            disabled={true}
          />
        </div>
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="day_club"
            label="Day Club"
            selected={selected}
            onChange={setSelected}
          />
        </div>
        <div className="w-full" style={{ aspectRatio: "2 / 1", minHeight: 50 }}>
          <ServiceTile
            value="kites"
            label="Kites"
            selected={selected}
            onChange={setSelected}
            disabled={true}
          />
        </div>
      </div>

      {/* Actions (optional) */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-sm font-medium text-[#2B3674] bg-white border border-[#E6EBF6] hover:border-[#C8D3EE]"
          onClick={() => setSelected("retirement_village")}
        >
          Reset
        </button>
        <button
          type="button"
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#3F11FF] hover:opacity-90 shadow"
          onClick={() => {
            console.log("Selected:", selected);
            if (selected) {
              // Save last choice for redirect fallback
              localStorage.setItem("lastServiceId", selected);
              // Navigate to dashboard with ID
              navigate(`/dashboard/${encodeURIComponent(selected)}`);
            }
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
