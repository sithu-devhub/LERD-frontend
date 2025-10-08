// ServiceTypePage.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http"; // axios instance

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
        "px-6 py-6 flex flex-col justify-center focus:outline-none",
        disabled
          ? "bg-[#BFC7DC] text-white opacity-70 cursor-not-allowed"
          : isSelected
          ? "bg-gradient-to-r from-[#7B61FF] to-[#3F11FF] text-white"
          : "bg-white text-[#2B3674] border border-[#E9EEF7] hover:border-[#C8D3EE] hover:shadow",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute top-3 right-3 inline-flex items-center justify-center h-5 w-5 rounded-full border",
          isSelected
            ? "border-white"
            : disabled
            ? "border-[#D7DDEC]"
            : "border-[#B9C4DD]",
        ].join(" ")}
      >
        <span
          className={[
            "block h-2.5 w-2.5 rounded-full",
            isSelected ? "bg-white" : "bg-transparent",
          ].join(" ")}
        />
      </span>

      <div className="flex flex-col items-center justify-center h-full space-y-3 pr-8">
        <div
          className={[
            "font-black text-2xl tracking-wide text-center",
            isSelected ? "text-white" : "text-gray-500",
          ].join(" ")}
        >
          {label}
        </div>

        {sublabel && (
          <div
            className={[
              "text-xl text-center",
              isSelected ? "text-white/90 font-semibold" : "text-gray-400 font-medium",
            ].join(" ")}
          >
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

const isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);

export default function ServiceType() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [hasServices, setHasServices] = useState(true);

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
  const hasUserSelected = useRef(false);

  useEffect(() => {
    async function fetchUserServices() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("accessToken");
        if (!user?.userId || !token) return;

        setLoading(true);
        setApiError("");

        const res = await http.get(`/users/${user.userId}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          const services = res.data.data;
          setSurveys(services);

          if (services.length === 0) {
            setHasServices(false);
            setApiError("");
            return;
          } else {
            setHasServices(true);
          }

          const selectedService = services.find((s) => s.isSelected);
          if (selectedService) {
            setSelected(selectedService.surveyId);
          } else if (services.length > 0) {
            try {
              const def = await http.get(`/users/${user.userId}/surveys/default`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (def.data?.success && def.data.data?.surveyId) {
                setSelected(def.data.data.surveyId);
              } else {
                setSelected(services[0].surveyId);
              }
            } catch {
              setSelected(services[0].surveyId);
            }
          }
        } else {
          setHasServices(false);
          setApiError("No services found for your account.");
        }
      } catch (err) {
        console.error(err);
        setHasServices(false);
        setApiError("Failed to load services");
      } finally {
        setLoading(false);
      }
    }

    fetchUserServices();
  }, []);

  async function handleContinue() {
    hasUserSelected.current = true;
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
      if (selectedSurvey?.serviceName) {
        localStorage.setItem("lastServiceName", selectedSurvey.serviceName);
        localStorage.setItem(`surveyName:${selected}`, selectedSurvey.serviceName);
      }

      navigate(`/dashboard/${encodeURIComponent(selected)}`, {
        state: { service: selectedSurvey?.serviceName },
      });
    } else {
      alert("No valid surveys found for your account. Please contact admin.");
    }
  }

  const groupRef = React.useRef(null);
  const currentIndex = (surveys.length > 0 ? surveys : options).findIndex(
    (o) => o.value === selected || o.surveyId === selected
  );
  const onArrow = (dir) => {
    const list = surveys.length > 0 ? surveys : options;
    const len = list.length;
    const nextIndex = (currentIndex + dir + len) % len;
    hasUserSelected.current = true;
    setSelected(list[nextIndex].surveyId || list[nextIndex].value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3F11FF]"></div>
      </div>
    );
  }

  // ✅ NEW: placeholder integrated below heading
  return (
    <div className="p-0">
      {/* Page heading */}
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Service</h1>
      </div>

      <div className="text-sm text-[#8FA0C6] mb-5">Select one service type:</div>

      {apiError && <p className="text-red-500 text-sm mb-3">{apiError}</p>}

      {!hasServices ? (
        <div className="flex flex-col justify-center items-center py-20 text-gray-500 border border-[#E6EBF6] rounded-2xl bg-white shadow-sm">
          <h2 className="text-xl font-semibold">No Services Available</h2>
          <p className="text-sm mt-2">
            It looks like your account has no active surveys or services.
          </p>
          <p className="text-sm">
            Please contact your administrator to assign one.
          </p>
        </div>
      ) : (
        <>
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
            {!loading &&
              surveys.map((item) => (
                <div
                  key={item.surveyId}
                  className="w-full"
                  style={{ aspectRatio: "2 / 1", minHeight: 50 }}
                >
                  <ServiceTile
                    value={item.surveyId}
                    label={item.serviceName}
                    sublabel={item.serviceType || item.description || ""}
                    selected={selected}
                    onChange={(val) => {
                      hasUserSelected.current = true;
                      setSelected(val);
                    }}
                  />
                </div>
              ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#2B3674] bg-white border border-[#E6EBF6] hover:border-[#C8D3EE]"
              onClick={() => {
                hasUserSelected.current = true;
                setSelected(
                  surveys.length > 0 ? surveys[0].surveyId : options[0].value
                );
              }}
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
        </>
      )}
    </div>
  );
}
