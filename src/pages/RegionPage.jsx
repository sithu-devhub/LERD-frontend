// src/pages/RegionPage.jsx
import React from "react";

const INITIAL_REGIONS = [
  "Region Name",
  "Musharof Chowdhury",
  "Naimur Rahman",
  "Shafiq Hammad",
  "Alex Semuyel",
  "Jhon Smith",
];

export default function RegionPage() {
  const [query, setQuery] = React.useState("");
  const [regions] = React.useState(INITIAL_REGIONS);
  const [selected, setSelected] = React.useState(
    () => new Set(["Naimur Rahman", "Shafiq Hammad", "Alex Semuyel"])
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? regions.filter((r) => r.toLowerCase().includes(q)) : regions;
  }, [regions, query]);

  const totalCount = regions.length - 1; // exclude header “Region Name”
  const selectedCount = [...selected].filter((r) => r !== "Region Name").length;

  const isAllVisibleChecked = filtered
    .filter((r) => r !== "Region Name")
    .every((r) => selected.has(r));

  const toggleOne = (name) => {
    if (name === "Region Name") return;
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  };

  const toggleAllVisible = () => {
    const names = filtered.filter((r) => r !== "Region Name");
    const next = new Set(selected);
    if (isAllVisibleChecked) {
      names.forEach((n) => next.delete(n));
    } else {
      names.forEach((n) => next.add(n));
    }
    setSelected(next);
  };

  return (
    <div className="p-0">
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Region
        </h1>
      </div>


      {/* Subheader */}
      <div className="text-sm text-[#8FA0C6] mb-4">
        <div>
          Current service type:&nbsp;
          <span className="text-[#2B3674] font-medium">Retirement Village</span>
        </div>
        <div>Select regions:</div>
      </div>

      {/* === BIG WHITE CANVAS (like your Figma) === */}
      <div
        className="
          mx-auto w-full max-w-[1600px]
          rounded-2xl bg-white border border-[#E6EBF6] shadow-sm
          px-4 sm:px-6 lg:px-8 py-4 sm:py-6
          min-h-[75vh]
        "
      >
        {/* Inner card with blue focus ring on inputs */}
        <div
          className="
            relative rounded-xl bg-white border border-[#E6EBF6]
            focus-within:border-[#2491ff] focus-within:ring-1 focus-within:ring-[#2491ff]
          "
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-[#EEF2FA]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isAllVisibleChecked}
                onChange={toggleAllVisible}
                className="h-4 w-4 rounded border-[#C9D3EA] text-[#3F11FF] focus:ring-0"
                aria-label="Select all"
              />
              <span className="text-sm text-[#8FA0C6]">Region Name</span>
            </div>

            {/* Search */}
            <div className="relative w-60">
              <svg
                viewBox="0 0 24 24"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3AED0]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 21l-4.35-4.35" />
                <circle cx="11" cy="11" r="7" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for village, suburb..."
                className="
                  w-full pl-8 pr-3 h-8 rounded-md border border-[#E6EBF6]
                  text-sm text-[#2B3674] placeholder-[#C2CBE0]
                  focus:outline-none focus:border-[#2491ff]
                "
              />
            </div>
          </div>

          {/* Rows */}
          <div className="max-h-[48vh] overflow-auto">
            {filtered.map((name, idx) => {
              const isHeader = name === "Region Name";
              if (isHeader) return null;

              const checked = selected.has(name);
              const rowHighlight =
                name === "Naimur Rahman" ? "bg-[#F7FAFF]" : "";

              return (
                <div
                  key={name + idx}
                  className={`flex items-center gap-3 px-4 sm:px-6 h-12 border-b border-[#F2F5FC] hover:bg-[#FAFBFE] ${rowHighlight}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(name)}
                    className="h-4 w-4 rounded border-[#C9D3EA] text-[#3F11FF] focus:ring-0"
                    aria-label={`Select ${name}`}
                  />
                  <span className="text-sm text-[#2B3674]">{name}</span>
                </div>
              );
            })}
          </div>
        </div>


      </div>
      {/* Footer count inside the canvas */}
      <div className="mt-3 text-xs text-[#8FA0C6]">
        Selected: <span className="text-[#2B3674]">{selectedCount}</span> of{" "}
        {totalCount}
      </div>
    </div>
  );
}
