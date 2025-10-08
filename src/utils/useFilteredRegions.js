// src/utils/useFilteredRegions.js

import { useEffect, useState } from "react";
import http from "../api/http";

/**
 * Fetches region filters for the logged-in user and applies them to chart data.
 *
 * @param {string} surveyId - Current survey ID.
 * @param {Array} regions - Full list of regions returned from a chart API.
 * @returns {Object} { filteredRegions, selectedRegionIds, regionNames, loading, error }
 */
export function useFilteredRegions(surveyId, regions = []) {
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);
  const [regionNames, setRegionNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    let aborted = false;

    async function fetchFilters() {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken");
        if (!user?.userId || !token) return;

        const res = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && !aborted) {
          const regionIds = res.data.data?.region?.values?.map(String) || [];
          setSelectedRegionIds(regionIds);

          // 🔍 convert numeric region IDs → region names if found in localStorage (optional)
          const nameMap = JSON.parse(localStorage.getItem("regionNameMap") || "{}");
          const names = regionIds.map((id) => nameMap[id] || id);
          setRegionNames(names);

          console.log("🎯 Loaded saved region filters:", regionIds, "→ names:", names);
        }
      } catch (err) {
        if (!aborted) {
          console.warn("⚠️ Region filter fetch failed:", err.message);
          setError(err.message);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchFilters();
    return () => {
      aborted = true;
    };
  }, [surveyId]);

  // Apply region filter
  useEffect(() => {
    if (!regions.length) return;

    if (selectedRegionIds.length === 0 && regionNames.length === 0) {
      setFilteredRegions(regions);
      return;
    }

    const filtered = regions.filter((r) => {
      const regionKeys = [
        String(r.id || "").trim(),
        String(r.facilityCode || "").trim(),
        String(r.villageName || "").trim(),
        String(r.name || "").trim(),
      ].filter(Boolean);

      // Match numeric or name-based filters
      return (
        selectedRegionIds.some((id) => regionKeys.includes(id)) ||
        regionNames.some((nm) => regionKeys.includes(nm))
      );
    });

    console.log("🎯 Matching regions:", filtered.map((r) => r.name || r.villageName));

    setFilteredRegions(filtered.length > 0 ? filtered : regions);
  }, [regions, selectedRegionIds, regionNames]);

  return { filteredRegions, selectedRegionIds, regionNames, loading, error };
}
