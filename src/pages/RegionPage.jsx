// src/pages/RegionPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http"; // axios instance

export default function RegionPage() {
  const navigate = useNavigate();

  // --- State (same as before) ---
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState([]); // from API
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
        if (regionsRes.data?.success && Array.isArray(regionsRes.data.data)) {
          // Map API fields to names used in UI
          allRegions = regionsRes.data.data.map((r) => r.regionName);
          setRegions(allRegions);
        }

        // 2️⃣ Fetch user filters to restore saved regions
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let savedRegionNames = [];
        if (filtersRes.data?.success && filtersRes.data.data?.regions?.length) {
          savedRegionNames = filtersRes.data.data.regions.map(
            (r) => r.regionName
          );
        }

        // 3️⃣ Default to select all if no saved filters
        const initialSelected =
          savedRegionNames.length > 0 ? savedRegionNames : allRegions;

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

  // === Filtering (unchanged) ===
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? regions.filter((r) => r.toLowerCase().includes(q)) : regions;
  }, [regions, query]);

  const totalCount = regions.length;
  const selectedCount = [...selected].length;
  const isAllVisibleChecked = filtered.every((r) => selected.has(r));

  // === Handlers (unchanged) ===
  const toggleOne = (name) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  };

  const toggleAllVisible = () => {
    const names = filtered;
    const next = new Set(selected);
    if (isAllVisibleChecked) {
      names.forEach((n) => next.delete(n));
    } else {
      names.forEach((n) => next.add(n));
    }
    setSelected(next);
  };

  // === Save selected regions ===
  async function handleSave() {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("accessToken");
    if (!user?.userId || !token) return;

    try {
      // Backend expects an array of strings, not objects
      const payload = {
        regions: Array.from(selected), // ["regionId1", "regionId2", ...]
      };

      await http.patch(
        `/users/${user.userId}/filters/regions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Regions saved:", payload);
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

  // === Original UI below (unchanged) ===
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
            {filtered.map((name, idx) => {
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
