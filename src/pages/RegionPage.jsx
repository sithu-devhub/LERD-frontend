// src/pages/RegionPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http"; // axios instance

export default function RegionPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const { serviceId } = useParams();
  const [selectionError, setSelectionError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "" });

  const [hasServices, setHasServices] = useState(true);

  // Error popup when no regions selected
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast({ open: false, message: "" }), 3000);
    return () => clearTimeout(t);
  }, [toast.open]);


  // === Fetch regions & saved selections ===
  useEffect(() => {
    async function fetchRegionsAndFilters() {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken");
        if (!user?.userId || !token) return;

        let activeSurveyId = serviceId;
        if (!activeSurveyId) activeSurveyId = localStorage.getItem("lastServiceId");


        // Step 1: Get selected service from API
        try {
          const servicesRes = await http.get(`/users/${user.userId}/services`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (servicesRes.data?.success && Array.isArray(servicesRes.data.data)) {
            const services = servicesRes.data.data;

            // If user has no services
            if (services.length === 0) {
              setHasServices(false);
              setApiError("");
              setLoading(false);
              return;
            }

            setHasServices(true);

            const selectedService = services.find(
              s => String(s.surveyId) === String(activeSurveyId)
            );

            if (selectedService?.surveyId) {
              activeSurveyId = selectedService.surveyId;

              const name = selectedService.serviceType || selectedService.surveyName;

              localStorage.setItem("lastServiceId", activeSurveyId);
              localStorage.setItem(`surveyName:${activeSurveyId}`, name);
              localStorage.setItem("lastServiceName", name);
            }


          }
        } catch (err) {
          console.warn("⚠️ Could not fetch selected service, fallback to lastServiceId");
        }

        if (!activeSurveyId) {
          setApiError("No active survey found for this user.");
          setLoading(false);
          return;
        }

        // Step 2: Fetch all regions for that survey
        const regionsRes = await http.get(`/surveys/${activeSurveyId}/regions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let allRegions = [];
        if (regionsRes.data?.success && Array.isArray(regionsRes.data.data)) {
          allRegions = regionsRes.data.data
            .filter(r => r.facilityCode)
            .map(r => ({ id: r.facilityCode, name: r.regionName }));
          setRegions(allRegions);
        }

        // Step 3: Fetch saved region filters
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId: activeSurveyId },
          headers: { Authorization: `Bearer ${token}` },
        });

        let savedRegionIds = [];
        if (filtersRes.data?.success && filtersRes.data.data?.region?.values) {
          savedRegionIds = filtersRes.data.data.region.values.map(String);
        }

        const validIds = new Set(allRegions.map(r => String(r.id)));
        savedRegionIds = savedRegionIds.filter(id => validIds.has(id));

        const initialSelected = savedRegionIds.length > 0
          ? savedRegionIds
          : allRegions.map(r => String(r.id));

        setSelected(new Set(initialSelected));

        const selectedCombined = allRegions
          .filter(r => initialSelected.includes(String(r.id)))
          .map(r => ({ id: String(r.id), name: r.name }));

        localStorage.setItem(`selectedRegions:${activeSurveyId}`, JSON.stringify(selectedCombined));
        localStorage.setItem(`selectedRegionIds:${activeSurveyId}`, JSON.stringify(initialSelected));

      } catch (err) {
        console.error("❌ Error fetching regions:", err);
        setApiError("Failed to load regions");
      } finally {
        setLoading(false);
      }
    }

    fetchRegionsAndFilters();
  }, [serviceId]);

  // === Filtering (unchanged logic) ===
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

  const toggleOne = (id) => {
    const idStr = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allIds = filtered.map((r) => String(r.id));

      if (isAllVisibleChecked) {
        // Deselect all visible (can become 0 — allowed)
        allIds.forEach((id) => next.delete(id));
      } else {
        // Select all visible
        allIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  async function handleSave() {
    if (selected.size === 0) {
      setToast({ open: true, message: "Please select at least one region to continue." });
      return;
    }
    
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("accessToken");
    const surveyId = serviceId || localStorage.getItem("lastServiceId");
    if (!user?.userId || !token || !surveyId) return;

    try {
      const uniqueIds = Array.from(new Set(Array.from(selected).map(String)));

      const payload = { surveyId, regions: uniqueIds };
      console.log("📤 Sending PATCH payload:", payload);

      const res = await http.patch(
        `/users/${user.userId}/filters/regions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Regions saved successfully:", res.data);

      const combined = regions
        .filter((r) => uniqueIds.includes(String(r.id)))
        .map((r) => ({ id: String(r.id), name: r.name }));

      localStorage.setItem(`selectedRegionIds:${surveyId}`, JSON.stringify(uniqueIds));
      localStorage.setItem(`selectedRegions:${surveyId}`, JSON.stringify(combined));

      if (regions.length > 0) {
        const regionNameMap = {};
        for (const r of regions) {
          regionNameMap[String(r.id)] = String(r.name);
        }
        localStorage.setItem("regionNameMap", JSON.stringify(regionNameMap));
      }

      const cachedName = localStorage.getItem(`surveyName:${surveyId}`);
      if (cachedName) {
        localStorage.setItem("lastServiceName", cachedName);
      }

      localStorage.setItem("filtersRefresh", "true");
      navigate(`/dashboard/${surveyId}`, { state: { service: cachedName } });
    } catch (err) {
      console.error("❌ Failed to save selected regions:", err);
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

  return (
    <div className="p-0">
      {/* Page heading */}
      <div className="flex justify-center items-center mb-6 mt-6">
        <h1 className="text-2xl font-semibold text-gray-800">Region</h1>
      </div>

      {/* Subheader */}
      <div className="text-sm text-[#8FA0C6] mb-4">
        <div>
          Current service type:&nbsp;
          <span className="text-[#2B3674] font-medium">
            {hasServices
              ? localStorage.getItem("lastServiceName") || "Service Type"
              : "—"}
          </span>
        </div>
        <div>Select regions:</div>
      </div>

      {apiError && <p className="text-red-500 text-sm mb-3">{apiError}</p>}

      {/* Placeholder appears here, under the heading */}
      {!hasServices ? (
        <div className="flex flex-col justify-center items-center py-20 text-gray-500 border border-[#E6EBF6] rounded-2xl bg-white shadow-sm">
          <h2 className="text-xl font-semibold">No Services Available</h2>
          <p className="text-sm mt-2">It looks like your account has no active surveys or services.</p>
          <p className="text-sm">Please contact your administrator to assign one.</p>
        </div>
      ) : (
        <>
          {/* === CANVAS === */}
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
                  return (
                    <div
                      key={r.id || idx}
                      className="flex items-center gap-3 px-4 sm:px-6 h-12 border-b border-[#F2F5FC] hover:bg-[#FAFBFE]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(r.id)}
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
        </>
      )}
    {toast.open && (
      <div className="fixed top-5 right-5 z-50">
        <div className="w-[360px] rounded-2xl border border-red-200 bg-white shadow-lg">
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>

            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">Selection required</div>
              <div className="mt-0.5 text-sm text-gray-600">{toast.message}</div>
            </div>

            <button
              onClick={() => setToast({ open: false, message: "" })}
              className="ml-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="h-1 w-full bg-red-100 overflow-hidden rounded-b-2xl">
            <div className="h-full w-full bg-red-400 animate-[toastbar_3s_linear_forwards]" />
          </div>
        </div>

        <style>{`
          @keyframes toastbar {
            from { transform: translateX(0%); }
            to { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    )}
    </div>
  );
}
