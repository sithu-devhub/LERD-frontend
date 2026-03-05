// src/pages/Dashboard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import DashboardFilters from "../components/DashboardFilters";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts';

import ResponseChart from "../components/ResponseChart";
import CustomerSatisfaction from "../components/CustomerSatisfactionChart";
import CustomerSatisfactionTrend from "../components/CustomerSatisfactionTrend";
import NpsChart from "../components/NpsChart";
import NpsDistribution from "../components/NpsDistribution";
import ServiceAttributeChart from "../components/ServiceAttributeChart.jsx";

import http from '../api/http';

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);

export default function Dashboard() {
  const genderReverseMap = { null: "All", 1: "Male", 2: "Female", 3: "Other" };
  const clientReverseMap = { null: "All", 1: "Residents", 2: "Next of Kin" };

  const { serviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [surveyId, setSurveyId] = useState(null);
  const [serviceName, setServiceName] = useState("Loading…");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  const [availableAttrs, setAvailableAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState(new Set());
  const [hasServices, setHasServices] = useState(true);

  const [regionLabelById, setRegionLabelById] = useState({});


  // Builds { regionId: regionName } from the filters API response if labels/names exist.
  const buildRegionMapFromFilters = (filtersResData) => {
    const region = filtersResData?.data?.region;

    const values = region?.values || [];
    const labels = region?.labels || region?.names || region?.displayValues || [];

    if (!Array.isArray(values) || !Array.isArray(labels)) return {};
    if (values.length === 0 || labels.length === 0) return {};
    if (values.length !== labels.length) return {};

    const map = {};
    for (let i = 0; i < values.length; i++) {
      map[String(values[i])] = String(labels[i]);
    }
    return map;
  };

  // Fetches region data from the API and converts it into { regionId: regionName }
  const fetchRegionLabelMap = async ({ token, surveyId }) => {
    const regionsRes = await http.get(`/surveys/${surveyId}/regions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = regionsRes.data?.data;
    const list = Array.isArray(raw) ? raw : (raw?.regions || raw?.items || []);

    const map = {};
    for (const r of list) {
      const id = String(r.facilityCode ?? r.regionId ?? r.id);
      const name = String(r.regionName ?? r.name ?? id);
      if (id && id !== "undefined") map[id] = name;
    }
    return map;
  };

  // PDF Report exporting
  const downloadPDF = async () => {
    const original = document.getElementById("dashboard-export");
    if (!original) return;

    // Create an off-screen container
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.top = "0";
    holder.style.width = original.offsetWidth + "px";
    holder.style.background = "#ffffff";
    holder.style.zIndex = "-1";


    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("accessToken");
    if (!user?.userId || !token || !surveyId) return;

    // If map doesn't contain all selected region ids, fetch fresh map for export
    let regionMap = regionLabelById;
    const missing = selectedRegions.some((id) => !regionMap[String(id)]);
    console.log("Export selectedRegions:", selectedRegions);
    console.log("Export regionLabelById (state):", regionLabelById);
    console.log("Export missing labels?", missing);

    if (selectedRegions.length > 0 && missing) {
      try {
        console.log("Export fetchRegionLabelMap args:", { surveyId }); const fetched = await fetchRegionLabelMap({
          token,
          surveyId,
        });

        // merge so we keep any names we already had
        regionMap = { ...regionMap, ...fetched };

      } catch (e) {
        // fallback: keep existing map (PDF will show ids if still missing)
      }
    }
    console.log("Export regionMap (final):", regionMap);
    console.log(
      "Export resolved labels:",
      selectedRegions.map((id) => ({ id: String(id), label: regionMap[String(id)] }))
    );

    holder.innerHTML = buildExportHTML(regionMap);
    document.body.appendChild(holder);

    // Clone dashboard into the export container
    const exportMount = holder.querySelector("#export-dashboard");
    const clone = original.cloneNode(true);

    // Remove real filters UI from clone (we already added text summary above)
    const filterArea = clone.querySelector("#dashboard-filters");
    if (filterArea) filterArea.remove();

    exportMount.appendChild(clone);

    // Add faint outlines to charts for the exported report
    const chartBoxes = clone.querySelectorAll('[class*="grid"] > *');
    chartBoxes.forEach((box) => {
      box.style.border = "1px solid #e5e7eb";
      box.style.borderRadius = "8px";
      box.style.padding = "8px";
    });

    // Wait a moment for layout/fonts
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(holder, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dashboard.pdf");

    // Clean up
    document.body.removeChild(holder);
  };
  // Load survey + selected regions
  useEffect(() => {
    async function loadSurveyAndRegions() {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("accessToken");
      if (!user?.userId || !token) return;

      try {
        setServiceLoading(true);
        setServiceError("");

        let activeSurveyId = null;
        let activeServiceName = null;

        // Source of truth: URL param
        if (serviceId && isUUID(serviceId)) {
          activeSurveyId = serviceId;
        } else {
          // fallback: default survey, then redirect
          const def = await http.get(`/users/${user.userId}/surveys/default`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const defId = def.data?.data?.surveyId;
          if (def.data?.success && defId && isUUID(defId)) {
            navigate(`/dashboard/${encodeURIComponent(defId)}`, { replace: true });
            return;
          }

          setServiceError("No valid survey found");
          return;
        }

        // Get service name for title
        const servicesRes = await http.get(`/users/${user.userId}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (servicesRes.data?.success && Array.isArray(servicesRes.data.data)) {
          const services = servicesRes.data.data;

          if (services.length === 0) {
            setHasServices(false);
            setServiceError("");
            return;
          }

          setHasServices(true);

          const match = services.find((s) => String(s.surveyId) === String(activeSurveyId));
          activeServiceName = match?.serviceType || match?.serviceName;
        }

        setSurveyId(activeSurveyId);
        setServiceName(activeServiceName || "Unknown Survey");

        // (cache)
        localStorage.setItem("lastServiceId", activeSurveyId);
        localStorage.setItem("lastServiceName", activeServiceName || "");
        localStorage.setItem(`surveyName:${activeSurveyId}`, activeServiceName || "");

        // Regions from backend saved filters
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId: activeSurveyId },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Filters API response:", filtersRes.data);

        const savedIds = filtersRes.data?.data?.region?.values?.map(String) || [];
        setSelectedRegions(savedIds);

        const mapFromFilters = buildRegionMapFromFilters(filtersRes.data);
        if (Object.keys(mapFromFilters).length > 0) {
          setRegionLabelById(mapFromFilters);
        }


        // load region names (so PDF shows names not IDs)
        try {
          const regionsRes = await http.get(`/surveys/${activeSurveyId}/regions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Regions API response:", regionsRes.data);

          const list = regionsRes.data?.data || [];
          const map = {};
          for (const r of list) {
            const id = String(r.facilityCode ?? r.regionId ?? r.id);
            const name = r.regionName ?? r.name ?? id;
            map[id] = name;
          }
          setRegionLabelById((prev) => ({ ...prev, ...map }));

          console.log("Region map created:", map);
          console.log("Selected region IDs:", savedIds);

        } catch (e) {
          // if endpoint doesn't exist, ignore and fallback to IDs
        }

        // optional cache
        localStorage.setItem(`selectedRegionIds:${activeSurveyId}`, JSON.stringify(savedIds));
      } catch (err) {
        console.error("❌ Dashboard load error:", err);
        setServiceError("Failed to load survey data");
      } finally {
        setServiceLoading(false);
      }
    }

    loadSurveyAndRegions();
  }, [serviceId, navigate, location.state?.service]);


  useEffect(() => {
    if (availableAttrs.length) {
      if (availableAttrs.length <= 5) {
        setSelectedAttrs(new Set(availableAttrs));
      } else {
        setSelectedAttrs(new Set(availableAttrs.slice(0, 5)));
      }
    }
  }, [availableAttrs]);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("dashboardFilters");
    return saved
      ? JSON.parse(saved)
      : { gender: null, participantType: null, period: new Date().getFullYear().toString() };
  });
  useEffect(() => { localStorage.setItem("dashboardFilters", JSON.stringify(filters)); }, [filters]);

  const handleFilterChange = useCallback(({ gender, participantType, period }) => {
    setFilters({ gender, participantType, period });
  }, []);


  // Builds a simplified HTML layout for the PDF export, including a readable summary of the currently applied dashboard filters.
  const buildExportHTML = (regionMap) => {
    const gender = genderReverseMap[filters.gender];
    const clientType = clientReverseMap[filters.participantType];
    const period = filters.period;

    const regionsText = (!selectedRegions || selectedRegions.length === 0)
      ? "All"
      : selectedRegions.map((id) => regionMap[String(id)] || String(id)).join(", ");
    console.log("Export regionsText:", regionsText);

    return `
    <div style="padding:16px; font-family: Arial, sans-serif; color:#111;">
      <h2 style="text-align:center; font-size:28px; font-weight:700; margin-bottom:80px;">
        Dashboard – ${serviceName}
      </h2>

      <!-- Dashboard content goes here -->
      <div id="export-dashboard"></div>

      <!-- Filters at the bottom -->
      <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-top:16px;">
        <div style="font-weight:700; margin-bottom:8px;">Filters</div>
        <div><b>Gender:</b> ${gender}</div>
        <div><b>Client type:</b> ${clientType}</div>
        <div><b>Period:</b> ${period}</div>
        <div style="margin-top:8px;"><b>Selected regions:</b> ${regionsText}</div>
      </div>
    </div>
  `;
  };

  return (
    <div className="p-0">
      <div className="relative mb-6 flex items-center">
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold text-gray-800">
          Dashboard – {serviceLoading ? 'Loading…' : serviceName}
        </h1>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Download PDF
          </button>
          <img
            src="/team_icon.PNG"
            alt="Logo"
            className="w-32 h-16 object-contain"
          />
        </div>

      </div>

      {serviceError && <div className="text-sm text-red-600 mb-4">{serviceError}</div>}

      {/* No Services Placeholder */}
      {!serviceLoading && !hasServices && (
        <div className="flex flex-col justify-center items-center py-20 text-gray-500">
          <h2 className="text-xl font-semibold">No Services Available</h2>
          <p className="text-sm mt-2">It looks like your account has no active surveys or services.</p>
          <p className="text-sm">Please contact your administrator to assign one.</p>
        </div>
      )}


      {surveyId && isUUID(surveyId) && hasServices && (
        // <>
        <div id="dashboard-export">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <ResponseChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} />
            <CustomerSatisfaction surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} />
            <CustomerSatisfactionTrend surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} />
          </div>

          <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
            <NpsChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} />
            <NpsDistribution surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} />
            <ServiceAttributeChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} selectedAttrs={selectedAttrs} onAvailableAttrs={setAvailableAttrs} onSelectedChange={setSelectedAttrs} />
          </div>

          <div className="mb-6" id="dashboard-filters">
            <DashboardFilters
              regionIds={selectedRegions}
              value={{
                surveyId,
                gender: genderReverseMap[filters.gender],
                clientType: clientReverseMap[filters.participantType],
              }}
              onChange={handleFilterChange}
            />
          </div>

        </div>
      )}
    </div>
  );
}
