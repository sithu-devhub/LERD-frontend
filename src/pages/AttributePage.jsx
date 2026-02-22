import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http"; // keep for later API switch

// Temporary mock attributes until backend API is ready
const MOCK_ATTRIBUTES = [
    { id: "activityAvailability", name: "Activity Availability" },
    { id: "facilities", name: "Facilities" },
    { id: "gardenCare", name: "Garden Care" },
    { id: "villageLocationAccess", name: "Village Location Access" },
    { id: "safetySecurity", name: "Safety & Security" },
];

export default function AttributePage() {
    const navigate = useNavigate();
    const { serviceId } = useParams();

    const [query, setQuery] = useState("");
    const [attributes, setAttributes] = useState([]);
    const [selected, setSelected] = useState(new Set());

    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");
    const [toast, setToast] = useState({ open: false, message: "" });
    const [hasServices, setHasServices] = useState(true);

    // Toast auto close
    useEffect(() => {
        if (!toast.open) return;
        const t = setTimeout(() => setToast({ open: false, message: "" }), 3000);
        return () => clearTimeout(t);
    }, [toast.open]);

    // Fetch service context (same logic as RegionPage) + load attributes (mock for now)
    useEffect(() => {
        async function fetchServiceAndInit() {
            try {
                setLoading(true);
                setApiError("");

                const user = JSON.parse(localStorage.getItem("user"));
                const token = localStorage.getItem("accessToken");
                if (!user?.userId || !token) {
                    setApiError("Missing session. Please log in again.");
                    return;
                }

                let activeSurveyId = serviceId || localStorage.getItem("lastServiceId");

                // Step 1: Get selected service from API (keep as-is)
                try {
                    const servicesRes = await http.get(`/users/${user.userId}/services`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (servicesRes.data?.success && Array.isArray(servicesRes.data.data)) {
                        const services = servicesRes.data.data;

                        if (services.length === 0) {
                            setHasServices(false);
                            return;
                        }

                        setHasServices(true);

                        const selectedService = services.find(
                            (s) => String(s.surveyId) === String(activeSurveyId)
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
                    // ok to fallback
                }

                if (!activeSurveyId) {
                    setApiError("No active survey found for this user.");
                    return;
                }

                // Step 2 (TEMP): load attributes from mock
                const allAttributes = MOCK_ATTRIBUTES.map((a) => ({
                    id: String(a.id),
                    name: a.name,
                }));
                setAttributes(allAttributes);

                // Step 3 (TEMP): load saved selections from localStorage
                const saved = JSON.parse(
                    localStorage.getItem(`selectedAttributeIds:${activeSurveyId}`) || "null"
                );

                const validIds = new Set(allAttributes.map((a) => String(a.id)));
                const savedIds = Array.isArray(saved)
                    ? saved.map(String).filter((id) => validIds.has(id))
                    : [];

                const initialSelected =
                    savedIds.length > 0 ? savedIds : allAttributes.map((a) => String(a.id));

                setSelected(new Set(initialSelected));

                const combined = allAttributes
                    .filter((a) => initialSelected.includes(String(a.id)))
                    .map((a) => ({ id: String(a.id), name: a.name }));

                localStorage.setItem(
                    `selectedAttributes:${activeSurveyId}`,
                    JSON.stringify(combined)
                );
                localStorage.setItem(
                    `selectedAttributeIds:${activeSurveyId}`,
                    JSON.stringify(initialSelected)
                );
            } catch (err) {
                setApiError("Failed to load attributes.");
            } finally {
                setLoading(false);
            }
        }

        fetchServiceAndInit();
    }, [serviceId]);

    // Filtering
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? attributes.filter((a) => a.name.toLowerCase().includes(q)) : attributes;
    }, [attributes, query]);

    const totalCount = attributes.length;
    const selectedCount = [...selected].length;

    const isAllVisibleChecked =
        filtered.length > 0 && filtered.every((a) => selected.has(String(a.id)));

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
            const allIds = filtered.map((a) => String(a.id));

            if (isAllVisibleChecked) allIds.forEach((id) => next.delete(id));
            else allIds.forEach((id) => next.add(id));

            return next;
        });
    };

    async function handleSave() {
        if (selected.size === 0) {
            setToast({ open: true, message: "Please select at least one attribute to continue." });
            return;
        }

        const surveyId = serviceId || localStorage.getItem("lastServiceId");
        if (!surveyId) return;

        const uniqueIds = Array.from(new Set(Array.from(selected).map(String)));

        // TEMP: save to localStorage until API exists
        const combined = attributes
            .filter((a) => uniqueIds.includes(String(a.id)))
            .map((a) => ({ id: String(a.id), name: a.name }));

        localStorage.setItem(`selectedAttributeIds:${surveyId}`, JSON.stringify(uniqueIds));
        localStorage.setItem(`selectedAttributes:${surveyId}`, JSON.stringify(combined));

        // Later: replace this block with API call (keep the rest unchanged)
        // const user = JSON.parse(localStorage.getItem("user"));
        // const token = localStorage.getItem("accessToken");
        // await http.patch(
        //   `/users/${user.userId}/filters/attributes`,
        //   { surveyId, attributes: uniqueIds },
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );

        localStorage.setItem("filtersRefresh", "true");
        navigate(`/dashboard/${surveyId}`);
    }

    // Loader
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3F11FF]"></div>
            </div>
        );
    }

    return (
        <div className="p-0">
            <div className="flex justify-center items-center mb-6 mt-6">
                <h1 className="text-2xl font-semibold text-gray-800">Attributes</h1>
            </div>

            <div className="text-sm text-[#8FA0C6] mb-4">
                <div>
                    Current service type:&nbsp;
                    <span className="text-[#2B3674] font-medium">
                        {hasServices ? localStorage.getItem("lastServiceName") || "Service Type" : "—"}
                    </span>
                </div>
                <div>Select attributes:</div>
            </div>

            {apiError && <p className="text-red-500 text-sm mb-3">{apiError}</p>}

            {!hasServices ? (
                <div className="flex flex-col justify-center items-center py-20 text-gray-500 border border-[#E6EBF6] rounded-2xl bg-white shadow-sm">
                    <h2 className="text-xl font-semibold">No Services Available</h2>
                    <p className="text-sm mt-2">It looks like your account has no active surveys or services.</p>
                    <p className="text-sm">Please contact your administrator to assign one.</p>
                </div>
            ) : (
                <>
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
                            <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-[#EEF2FA]">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isAllVisibleChecked}
                                        onChange={toggleAllVisible}
                                        className="h-4 w-4 rounded border-[#C9D3EA] text-[#3F11FF] focus:ring-0"
                                        aria-label="Select all"
                                    />
                                    <span className="text-sm text-[#8FA0C6]">Attribute Name</span>
                                </div>

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
                                        placeholder="Search for attribute..."
                                        className="
                      w-full pl-8 pr-3 h-8 rounded-md border border-[#E6EBF6]
                      text-sm text-[#2B3674] placeholder-[#C2CBE0]
                      focus:outline-none focus:border-[#2491ff]
                    "
                                    />
                                </div>
                            </div>

                            <div className="max-h-[48vh] overflow-auto">
                                {filtered.map((a, idx) => {
                                    const checked = selected.has(String(a.id));
                                    return (
                                        <div
                                            key={a.id || idx}
                                            className="flex items-center gap-3 px-4 sm:px-6 h-12 border-b border-[#F2F5FC] hover:bg-[#FAFBFE]"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleOne(a.id)}
                                                className="h-4 w-4 rounded border-[#C9D3EA] text-[#3F11FF] focus:ring-0"
                                                aria-label={`Select ${a.name}`}
                                            />
                                            <span className="text-sm text-[#2B3674]">{a.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#8FA0C6]">
                        <div>
                            Selected: <span className="text-[#2B3674]">{selectedCount}</span> of {totalCount}
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