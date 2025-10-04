// ServiceTypePage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http"; // axios instance

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
        "flex flex-col justify-center",
        "focus:outline-none",
        disabled
          ? "bg-[#BFC7DC] text-white opacity-70 cursor-not-allowed"
          : isSelected
          ? "bg-gradient-to-r from-[#7B61FF] to-[#3F11FF] text-white"
          : "bg-white text-[#2B3674] border border-[#E9EEF7] hover:border-[#C8D3EE] hover:shadow",
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

// helper for UUID detection
const isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);

export default function ServiceType() {
  const navigate = useNavigate();

  // state for API-driven surveys
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // hardcoded fallback
  const options = [
    { value: "retirement_village", label: "Retirement Village" },
    { value: "residential_care", label: "Residential Care", sublabel: "(Nursing Home)" },
    { value: "respite_care", label: "Respite Care" },
    { value: "home_care", label: "Home Care" },
    { value: "chsp", label: "CHSP" },
    { value: "day_club", label: "Day Club" },
    { value: "kites", label: "Kites" },
  ];

  const [selected, setSelected] = useState("retirement_village");

  // fetch surveys from API
  useEffect(() => {
    async function fetchUserSurveys() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken"); // added
        if (!user?.userId || !token) return;
        setLoading(true);

        // call API with Authorization header
        const res = await http.get(`/users/${user.userId}/surveys`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // API returns data.data.surveys[]
        if (res.data?.success && Array.isArray(res.data.data.surveys)) {
          setSurveys(res.data.data.surveys);
          if (res.data.data.surveys.length > 0) {
            setSelected(res.data.data.surveys[0].surveyId); // default select first
          }
        }
      } catch (err) {
        console.error(err);
        setApiError("Failed to load surveys");
      } finally {
        setLoading(false);
      }
    }
    fetchUserSurveys();
  }, []);

  // keyboard nav
  const groupRef = React.useRef(null);
  const currentIndex = (surveys.length > 0 ? surveys : options).findIndex(
    (o) => o.value === selected || o.surveyId === selected
  );
  const onArrow = (dir) => {
    const list = surveys.length > 0 ? surveys : options;
    const len = list.length;
    const nextIndex = (currentIndex + dir + len) % len;
    setSelected(list[nextIndex].surveyId || list[nextIndex].value);
  };



  async function handleContinue() {
    console.log("Selected:", selected);
    if (!selected) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("accessToken");
    if (!user?.userId || !token) {
      navigate("/login");
      return;
    }

    if (isUUID(selected)) {
      try {
        await http.patch(
          `/users/${user.userId}/filters/service`,
          { surveyId: selected },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to update selected service:", err);
      }

      localStorage.setItem("lastServiceId", selected);

      const selectedSurvey = surveys.find((s) => s.surveyId === selected);
      navigate(`/dashboard/${encodeURIComponent(selected)}`, {
        state: { service: selectedSurvey?.surveyName },
      });
    } else {
      // ❌ instead of navigating with fallback slug, warn user
      alert("No valid surveys found for your account. Please contact admin.");
    }
  }



  return (
    <div className="p-0">
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Service</h1>
      </div>

      <div className="text-sm text-[#8FA0C6] mb-5">Select one service type:</div>

      {apiError && <p className="text-red-500 text-sm mb-3">{apiError}</p>}

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
      {/* Loader while fetching */}
      {loading && (
        <div className="col-span-full flex justify-center items-center py-16">
          <div className="w-12 h-12 border-4 border-[#7B61FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* API returned surveys */}
      {!loading && surveys.length > 0 &&
        surveys.map((item) => (
          <div
            key={item.surveyId}
            className="w-full"
            style={{ aspectRatio: "2 / 1", minHeight: 50 }}
          >
            <ServiceTile
              value={item.surveyId}
              label={item.surveyName}
              sublabel={item.sublabel}
              selected={selected}
              onChange={setSelected}
            />
          </div>
        ))
      }

      {/* No data (empty state) */}
      {!loading && surveys.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg font-medium">No surveys available</p>
          <p className="text-sm">Please check with your administrator.</p>
        </div>
      )}
      </div>




      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-sm font-medium text-[#2B3674] bg-white border border-[#E6EBF6] hover:border-[#C8D3EE]"
          onClick={() =>
            setSelected(
              surveys.length > 0
                ? surveys[0].surveyId // real UUID
                : options[0].value    // still fallback, but handled gracefully in handleContinue()
            )
          }
        >
          Reset
        </button>
        <button
          type="button"
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#3F11FF] hover:opacity-90 shadow"
          onClick={handleContinue} 
        >
          Continue
        </button>
      </div>
    </div>
  );
}
