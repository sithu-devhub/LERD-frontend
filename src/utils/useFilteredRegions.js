// src/utils/useFilteredRegions.js
import { useEffect, useState } from "react";
import http from "../api/http";

export function useFilteredRegions(surveyId, regions = []) {
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);
  const [regionNames, setRegionNames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!surveyId) return;
    let cancelled = false;

    async function fetchRegions() {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken");
        if (!user?.userId || !token) return;

        // API always first
        const res = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && !cancelled) {
          const ids = res.data.data?.region?.values?.map(String) || [];
          setSelectedRegionIds(ids);

          const nameMap = JSON.parse(localStorage.getItem("regionNameMap") || "{}");
          setRegionNames(ids.map(id => nameMap[id] || id));

          // overwrite cache
          localStorage.setItem(`selectedRegionIds:${surveyId}`, JSON.stringify(ids));
        }
      } catch (err) {
        // fallback to cache if API fails
        if (!cancelled) {
          const cached = JSON.parse(localStorage.getItem(`selectedRegionIds:${surveyId}`) || "[]");
          setSelectedRegionIds(cached);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRegions();
    return () => { cancelled = true };
  }, [surveyId]);

  useEffect(() => {
    if (!regions.length) return;
    if (selectedRegionIds.length === 0) {
      setFilteredRegions(regions);
      return;
    }

    const filtered = regions.filter(r =>
      selectedRegionIds.includes(String(r.id)) ||
      selectedRegionIds.includes(String(r.facilityCode))
    );
    setFilteredRegions(filtered.length > 0 ? filtered : regions);
  }, [regions, selectedRegionIds]);

  return { filteredRegions, selectedRegionIds, regionNames, loading };
}
