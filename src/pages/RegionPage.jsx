// src/pages/RegionPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http"; // axios instance

export default function RegionPage() {
  const navigate = useNavigate();

  // --- State (same as before) ---
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState([]); // from API [{id, name}]
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // === Fetch regions & saved selections ===
  useEffect(() => {
    async function fetchRegionsAndFilters() {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken");
        const surveyId = localStorage.getItem("lastServiceId");
        if (!user?.userId || !token || !surveyId) return;

        // 1️⃣ Fetch regions for this survey
        const regionsRes = await http.get(`/surveys/${surveyId}/regions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let allRegions = [];
        console.log("🔍 Raw regions response:", regionsRes.data.data[0]);
        if (regionsRes.data?.success && Array.isArray(regionsRes.data.data)) {
          console.log("🔍 Raw regions response sample:", regionsRes.data.data[0]);

          // Correct mapping: use facilityCode as ID, regionName as name
          allRegions = regionsRes.data.data
            .filter((r) => r.facilityCode) // ensure valid ID
            .map((r) => ({
              id: r.facilityCode, // key
              name: r.regionName, // name
            }));

          console.log("📦 Loaded regions (fixed mapping):", allRegions);
          setRegions(allRegions);

          // 🗺️ Save region name↔ID mapping for dashboard filters
          if (Array.isArray(allRegions) && allRegions.length > 0) {
            const regionNameMap = {};
            for (const r of allRegions) {
              regionNameMap[String(r.id)] = String(r.name);
            }
            localStorage.setItem("regionNameMap", JSON.stringify(regionNameMap));
            console.log("🗺️ Saved regionNameMap:", regionNameMap);
          }
        }

        // 2️⃣ Fetch user filters to restore saved regions
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId },
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🧩 Full /filters?surveyId response:", filtersRes.data);

        let savedRegionIds = [];
        if (
          filtersRes.data?.success &&
          filtersRes.data.data?.region?.values &&
          Array.isArray(filtersRes.data.data.region.values)
        ) {
          savedRegionIds = filtersRes.data.data.region.values.map(String); // ensure string IDs
        }

        // 3️⃣ Default to select all if no saved filters
        const initialSelected =
          savedRegionIds.length > 0
            ? savedRegionIds
            : allRegions.map((r) => String(r.id));

        console.log("✅ Initial selected IDs:", initialSelected);

        setSelected(new Set(initialSelected));
      } catch (err) {
        console.error("Failed to load regions:", err);
        setApiError("Failed to load regions");
      } finally {
        setLoading(false);
      }
    }

    fetchRegionsAndFilters();
  }, []);

  // === Filtering (unchanged logic, now works with names) ===
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? regions.filter((r) => r.name.toLowerCase().includes(q))
      : regions;
  }, [regions, query]);

  const totalCount = regions.length;
  const selectedCount = [...selected].length;
  const isAllVisibleChecked =
    filtered.length > 0 && filtered.every((r) => selected.has(String(r.id)));

  // === Handlers (fixed to work per ID) ===
  const toggleOne = (id) => {
    const idStr = String(id);
    const next = new Set(selected);
    if (next.has(idStr)) {
      next.delete(idStr);
      console.log(`❌ Unselected region ID: ${idStr}`);
    } else {
      next.add(idStr);
      console.log(`✅ Selected region ID: ${idStr}`);
    }
    console.log("🧠 Current selected set:", Array.from(next));
    setSelected(next);
  };

  const toggleAllVisible = () => {
    const next = new Set(selected);
    const allIds = filtered.map((r) => String(r.id));
    console.log("⚙️ Toggle all visible IDs:", allIds);

    if (isAllVisibleChecked) {
      allIds.forEach((id) => next.delete(id));
      console.log("🚫 Deselected all visible regions");
    } else {
      allIds.forEach((id) => next.add(id));
      console.log("✅ Selected all visible regions");
    }

    console.log("🧠 New selected set after toggle all:", Array.from(next));
    setSelected(next);
  };

  // === Save selected regions ===
  async function handleSave() {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("accessToken");
    const surveyId = localStorage.getItem("lastServiceId");
    if (!user?.userId || !token || !surveyId) return;

    try {
      // Convert selected IDs into their matching names
      const payload = {
        surveyId,
        regions: Array.from(selected).map((id) => {
          const region = regions.find((r) => String(r.id) === String(id));
          return region?.name || id; // fallback if region not found
        }),
      };

      console.log("📤 Sending PATCH payload:", payload);

      await http.patch(`/users/${user.userId}/filters/regions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Regions saved successfully:", payload);

      // 💾 Save locally for dashboard sync
      localStorage.setItem("selectedRegionIds", JSON.stringify(Array.from(selected)));
      if (regions.length > 0) {
        const regionNameMap = {};
        for (const r of regions) {
          regionNameMap[String(r.id)] = String(r.name);
        }
        localStorage.setItem("regionNameMap", JSON.stringify(regionNameMap));
        console.log("🗺️ Updated regionNameMap:", regionNameMap);
      }

      localStorage.setItem("filtersRefresh", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to save selected regions:", err);
      alert("Failed to save regions");
    }
  }

  // === Loader ===
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3F11FF]"></div>
      </div>
    );
  }

  // === Original UI (unchanged) ===
  return (
    <div className="p-0">
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Region</h1>
      </div>

      {/* Subheader */}
      <div className="text-sm text-[#8FA0C6] mb-4">
        <div>
          Current service type:&nbsp;
          <span className="text-[#2B3674] font-medium">
            {localStorage.getItem("lastServiceName") || "Service Type"}
          </span>
        </div>
        <div>Select regions:</div>
      </div>

      {apiError && <p className="text-red-500 text-sm mb-3">{apiError}</p>}

      {/* === BIG WHITE CANVAS === */}
      <div
        className="
          mx-auto w-full max-w-[1600px]
          rounded-2xl bg-white border border-[#E6EBF6] shadow-sm
          px-4 sm:px-6 lg:px-8 py-4 sm:py-6
          min-h-[75vh]
        "
      >
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
            {filtered.map((r, idx) => {
              const checked = selected.has(String(r.id));
              const rowHighlight =
                r.name === "Naimur Rahman" ? "bg-[#F7FAFF]" : "";

              return (
                <div
                  key={r.id || idx}
                  className={`flex items-center gap-3 px-4 sm:px-6 h-12 border-b border-[#F2F5FC] hover:bg-[#FAFBFE] ${rowHighlight}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      console.log(
                        `🖱️ Clicked on checkbox for region:`,
                        r.name,
                        "| ID:",
                        r.id
                      );
                      toggleOne(r.id);
                    }}
                    className="h-4 w-4 rounded border-[#C9D3EA] text-[#3F11FF] focus:ring-0"
                    aria-label={`Select ${r.name}`}
                  />
                  <span className="text-sm text-[#2B3674]">{r.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#8FA0C6]">
        <div>
          Selected:{" "}
          <span className="text-[#2B3674]">{selectedCount}</span> of{" "}
          {totalCount}
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#3F11FF] hover:opacity-90 shadow"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
