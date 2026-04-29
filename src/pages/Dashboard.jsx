// src/pages/Dashboard.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChartCard from '../components/ChartCard';
import '../styles/dashboard.css';
import DashboardFilters from "../components/DashboardFilters";

import ResponseChart from "../components/ResponseChart";
import CustomerSatisfaction from "../components/CustomerSatisfactionChart";
import CustomerSatisfactionTrend from "../components/CustomerSatisfactionTrend";
import NpsChart from "../components/NpsChart";
import NpsDistribution from "../components/NpsDistribution";
import ServiceAttributeChart from "../components/ServiceAttributeChart.jsx";

import http from '../api/http';

import html2canvas from "html2canvas";
import jsPDF from "jspdf"; // Library used to generate pdf files
import PptxGenJS from "pptxgenjs"; // Library used to generate PowerPoint files
import * as XLSX from "xlsx"; // Library used to generate Excel files
import { Pencil } from "lucide-react";
import CustomizeDashboardModal from "../components/CustomizeDashboardModal";

import {
  Download,
  ChevronDown,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

const isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);

const getDisplayName = (item, fallback = "Unnamed") => {
  const customName = String(item?.customName || "").trim();
  const name = String(item?.name || fallback).trim();

  return customName.length > 0 ? customName : name;
};

export default function Dashboard() {
  const genderReverseMap = { null: "All", 1: "Male", 2: "Female", 3: "Other" };
  const clientReverseMap = { null: "All", 1: "Residents", 2: "Next of Kin" };

  const { serviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [surveyId, setSurveyId] = useState(null);
  const [serviceName, setServiceName] = useState("Loading…");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [regionsLoaded, setRegionsLoaded] = useState(false);

  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  const [availableAttrs, setAvailableAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState(new Set());
  const [hasServices, setHasServices] = useState(true);

  const [regionLabelById, setRegionLabelById] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const [responseData, setResponseData] = useState([]);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [satisfactionTrendData, setSatisfactionTrendData] = useState([]);
  const [npsData, setNpsData] = useState([]);
  const [npsDistributionData, setNpsDistributionData] = useState([]);
  const [serviceAttrData, setServiceAttrData] = useState([]);
  const [isAllRegionsModalOpen, setIsAllRegionsModalOpen] = useState(false);

  // Stores whether the logged-in user is an admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Stores whether the admin check is still loading
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [customDashboardName, setCustomDashboardName] = useState("");
  const [customRegionLabels, setCustomRegionLabels] = useState({});
  const [customAttributeLabels, setCustomAttributeLabels] = useState({});
  const [customServiceLabels, setCustomServiceLabels] = useState({});

  const [tempDashboardName, setTempDashboardName] = useState("");
  const [tempRegionLabels, setTempRegionLabels] = useState({});
  const [tempAttributeLabels, setTempAttributeLabels] = useState({});
  const [tempServiceLabels, setTempServiceLabels] = useState({});

  // enable save only when modal values differ from saved values
  const hasRenameChanges =
    tempDashboardName !== customDashboardName ||
    JSON.stringify(tempServiceLabels) !== JSON.stringify(customServiceLabels) ||
    JSON.stringify(tempRegionLabels) !== JSON.stringify(customRegionLabels) ||
    JSON.stringify(tempAttributeLabels) !== JSON.stringify(customAttributeLabels);

  const [allRegions, setAllRegions] = useState([]);
  const [modalRegions, setModalRegions] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);

  const [modalServices, setModalServices] = useState([]);
  const [modalAttributes, setModalAttributes] = useState([]);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("dashboardFilters");
    return saved
      ? JSON.parse(saved)
      : { gender: null, participantType: null, period: null };
  });

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


  // Captures the dashboard as a canvas image.
  // This function is reused by PDF, PNG and PPT exports.
  const captureDashboardCanvas = async () => {

    // Get the dashboard container
    const original = document.getElementById("dashboard-export");
    if (!original) return null;

    // Create an off-screen container so the export layout does not affect UI
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.top = "0";
    holder.style.width = original.offsetWidth + "px";
    holder.style.background = "#ffffff";
    holder.style.zIndex = "-1";

    // Retrieve user information and token
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("accessToken");

    if (!user?.userId || !token || !surveyId) return null;

    // Ensure region names exist for export (instead of region IDs)
    let regionMap = regionLabelById;
    const missing = selectedRegions.some((id) => !regionMap[String(id)]);

    // If labels are missing, fetch them
    if (selectedRegions.length > 0 && missing) {
      try {
        const fetched = await fetchRegionLabelMap({ token, surveyId });
        regionMap = { ...regionMap, ...fetched };
      } catch (e) {
        console.error("Region label fetch failed:", e);
      }
    }

    // Build export layout with filters
    holder.innerHTML = buildExportHTML(regionMap);
    document.body.appendChild(holder);

    // Mount cloned dashboard into export container
    const exportMount = holder.querySelector("#export-dashboard");
    const clone = original.cloneNode(true);

    // Remove filter UI from export (filters already shown in summary)
    const filterArea = clone.querySelector("#dashboard-filters");
    if (filterArea) filterArea.remove();

    exportMount.appendChild(clone);

    // Add borders around charts to improve exported report appearance
    const chartBoxes = clone.querySelectorAll('[class*="grid"] > *');
    chartBoxes.forEach((box) => {
      box.style.border = "1px solid #e5e7eb";
      box.style.borderRadius = "8px";
      box.style.padding = "8px";
      box.style.background = "#ffffff";
    });

    // Wait briefly to ensure layout and fonts render correctly
    await new Promise((r) => setTimeout(r, 400));

    // Convert dashboard into a canvas image
    const canvas = await html2canvas(holder, {
      scale: 2,        // Higher resolution
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // Remove temporary container
    document.body.removeChild(holder);

    return canvas;
  };

  // Generates a PDF file from the captured dashboard image
  const downloadPDF = async () => {

    const canvas = await captureDashboardCanvas();
    if (!canvas) return;

    // Convert canvas into PNG image data
    const imgData = canvas.toDataURL("image/png");

    // Create PDF document
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Insert image into PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Save PDF file
    pdf.save("dashboard.pdf");
  };


  // Downloads the dashboard as a PNG image
  const downloadPNG = async () => {

    const canvas = await captureDashboardCanvas();
    if (!canvas) return;

    // Convert canvas to PNG
    const imgData = canvas.toDataURL("image/png");

    // Create download link
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "dashboard.png";

    // Trigger download
    link.click();
  };

  // Generates a PowerPoint (.pptx) file containing the dashboard image
  const downloadPPT = async () => {
    const canvas = await captureDashboardCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");

    // Create PowerPoint presentation
    const pptx = new PptxGenJS();

    // Use widescreen layout
    pptx.layout = "LAYOUT_WIDE";

    // Add a slide
    const slide = pptx.addSlide();

    // Add slide title
    slide.addText(`Dashboard – ${serviceName}`, {
      x: 0.5,
      y: 0.2,
      w: 12.3,
      h: 0.4,
      fontSize: 20,
      bold: true,
      align: "center",
    });

    // Area available for the dashboard image
    const maxWidth = 12.7;
    const maxHeight = 6.1;
    const startX = 0.3;
    const startY = 0.9;

    // Original image aspect ratio
    const imageRatio = canvas.width / canvas.height;
    const boxRatio = maxWidth / maxHeight;

    let renderWidth;
    let renderHeight;
    let renderX = startX;
    let renderY = startY;

    // Fit image inside the box without stretching
    if (imageRatio > boxRatio) {
      // Image is wider, fit by width
      renderWidth = maxWidth;
      renderHeight = maxWidth / imageRatio;
      renderY = startY + (maxHeight - renderHeight) / 2;
    } else {
      // Image is taller, fit by height
      renderHeight = maxHeight;
      renderWidth = maxHeight * imageRatio;
      renderX = startX + (maxWidth - renderWidth) / 2;
    }

    // Add dashboard image without distortion
    slide.addImage({
      data: imgData,
      x: renderX,
      y: renderY,
      w: renderWidth,
      h: renderHeight,
    });

    // Save PowerPoint file
    await pptx.writeFile({ fileName: "dashboard.pptx" });
  };

  // Downloads dashboard filter/report data as an Excel file
  const downloadExcel = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}"); const token = localStorage.getItem("accessToken");

    if (!user?.userId || !token || !surveyId) return;

    let regionMap = regionLabelById;
    const missing = selectedRegions.some((id) => !regionMap[String(id)]);

    if (selectedRegions.length > 0 && missing) {
      try {
        const fetched = await fetchRegionLabelMap({ token, surveyId });
        regionMap = { ...regionMap, ...fetched };
      } catch (error) {
        console.error("Failed to fetch region labels for Excel export:", error);
      }
    }

    const regionText =
      selectedRegions.length === 0
        ? "All"
        : selectedRegions.map((id) => regionMap[String(id)] || String(id)).join(", ");

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryRows = [
      {
        "Service Name": serviceName,
        "Survey ID": surveyId,
        "Gender": genderReverseMap[filters.gender],
        "Client Type": clientReverseMap[filters.participantType],
        "Period": filters.period || "All",
        "Selected Regions": regionText,
        "Exported At": new Date().toLocaleString(),
      },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet["!cols"] = [
      { wch: 25 },
      { wch: 40 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 40 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Response
    if (responseData.length > 0) {
      const responseSheet = XLSX.utils.json_to_sheet(responseData);
      XLSX.utils.book_append_sheet(workbook, responseSheet, "Response");
    }

    // Satisfaction
    if (satisfactionData.length > 0) {
      const satisfactionSheet = XLSX.utils.json_to_sheet(satisfactionData);
      XLSX.utils.book_append_sheet(workbook, satisfactionSheet, "Satisfaction");
    }

    // Satisfaction Trend
    if (satisfactionTrendData.length > 0) {
      const trendSheet = XLSX.utils.json_to_sheet(satisfactionTrendData);
      XLSX.utils.book_append_sheet(workbook, trendSheet, "Satisfaction Trend");
    }

    // NPS
    if (npsData.length > 0) {
      const npsSheet = XLSX.utils.json_to_sheet(npsData);
      XLSX.utils.book_append_sheet(workbook, npsSheet, "NPS");
    }

    // NPS Distribution
    if (npsDistributionData.length > 0) {
      const npsDistSheet = XLSX.utils.json_to_sheet(npsDistributionData);
      XLSX.utils.book_append_sheet(workbook, npsDistSheet, "NPS Distribution");
    }

    // Service Attributes
    if (serviceAttrData.length > 0) {
      const attrSheet = XLSX.utils.json_to_sheet(serviceAttrData);
      XLSX.utils.book_append_sheet(workbook, attrSheet, "Service Attributes");
    }

    XLSX.writeFile(workbook, "dashboard_report.xlsx");
  };

  // Fetch all service attributes for the survey (for custom naming modal)
  const fetchAllAttributes = async ({ token, surveyId }) => {
    const res = await http.get(`/charts/service-attributes?surveyId=${surveyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = res.data?.data?.attributes || [];

    return raw.map((attr, index) => ({
      id: String(attr.id ?? attr.attributeId ?? index),
      name: String(attr.attributeName || "").trim() || `Attribute ${index + 1}`,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Determine admin status from stored user (no API call needed)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const adminStatus =
      String(user?.userRole || "").toLowerCase() === "admin" &&
      user?.isActive === true;

    setIsAdmin(adminStatus);
    setIsAdminLoading(false);
  }, []);

  // Load survey + selected regions
  useEffect(() => {
    async function loadSurveyAndRegions() {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
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

        let match = null;

        if (servicesRes.data?.success && Array.isArray(servicesRes.data.data)) {
          const services = servicesRes.data.data;

          if (services.length === 0) {
            setHasServices(false);
            setServiceError("");
            return;
          }

          setHasServices(true);

          match = services.find(
            (s) => String(s.surveyId) === String(activeSurveyId)
          );

          if (!match) {
            const selectedService = services.find((s) => s.isSelected) || services[0];

            if (selectedService?.surveyId && String(selectedService.surveyId) !== String(activeSurveyId)) {
              navigate(`/dashboard/${encodeURIComponent(selectedService.surveyId)}`, { replace: true });
              return;
            }
          }

          activeServiceName =
            match?.serviceName ||
            match?.serviceType ||
            match?.surveyName ||
            null;

          console.log("Dashboard title debug:", {
            activeSurveyId,
            matchedService: match,
            resolvedName: activeServiceName,
            locationStateService: location.state?.service,
            cachedSurveyName: localStorage.getItem(`surveyName:${activeSurveyId}`),
            lastServiceName: localStorage.getItem("lastServiceName"),
          });
        }

        setSurveyId(activeSurveyId);
        setServiceName(activeServiceName || "Unknown Survey");

        let resolvedDashboardName = `Dashboard – ${activeServiceName || "Unknown Survey"}`;

        try {
          const res = await http.get(
            `/admin/surveys/${activeSurveyId}/custom-naming/DashboardName`
          );

          console.log("Rename API response:", res.data);
          console.log("Active survey id:", activeSurveyId);

          const renameItems = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];

          const dashboardRecord = renameItems.find(
            (item) =>
              String(item.fieldType || "").trim().toLowerCase() === "dashboard" &&
              String(item.customName || "").trim().length > 0
          );

          console.log("Matched dashboard record:", dashboardRecord);

          if (dashboardRecord) {
            resolvedDashboardName = getDisplayName(
              dashboardRecord,
              `Dashboard – ${activeServiceName || "Unknown Survey"}`
            );
          }

        } catch (err) {
          console.error("Dashboard name fetch failed:", err);
        }

        // SET FINAL VALUE
        setCustomDashboardName(resolvedDashboardName);
        setTempDashboardName(resolvedDashboardName);

        // (cache)
        localStorage.setItem("lastServiceId", activeSurveyId);
        if (match && activeServiceName) {
          localStorage.setItem(`surveyName:${activeSurveyId}`, activeServiceName);
        }

        // Regions from backend saved filters
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId: activeSurveyId },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Filters API response:", filtersRes.data);

        const savedIds = filtersRes.data?.data?.region?.values?.map(String) || [];
        setSelectedRegions(savedIds);
        setRegionsLoaded(true);

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
          setAllRegions(list);
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
  }, [serviceId, navigate]);

  useEffect(() => {
    if (availableAttrs.length) {
      if (availableAttrs.length <= 5) {
        setSelectedAttrs(new Set(availableAttrs));
      } else {
        setSelectedAttrs(new Set(availableAttrs.slice(0, 5)));
      }
    }
  }, [availableAttrs]);

  useEffect(() => { localStorage.setItem("dashboardFilters", JSON.stringify(filters)); }, [filters]);

  useEffect(() => {
    console.log("Dashboard filters state:", filters);
  }, [filters]);


  // Sync the editable dashboard title with the loaded service name
  // Runs whenever `serviceName` changes (after API load)
  // useEffect(() => {
  //   // If service name exists, set it as the default editable dashboard name
  //   if (serviceName) {
  //     setCustomDashboardName(`Dashboard – ${serviceName}`);
  //   }
  // }, [serviceName]); // dependency: re-run when serviceName updates


  // Auto-hide success toast after 3 seconds when it becomes visible
  useEffect(() => {
    if (!showSuccessToast) return;

    const timer = setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showSuccessToast]);



  const handleFilterChange = useCallback(({ gender, participantType, period }) => {
    setFilters({ gender, participantType, period });
  }, []);


  // Builds a simplified HTML layout for the PDF export, including a readable summary of the currently applied dashboard filters.
  const buildExportHTML = (regionMap) => {
    const gender = genderReverseMap[filters.gender];
    const clientType = clientReverseMap[filters.participantType];
    const period = filters.period ? filters.period : "-";

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
          {serviceLoading ? 'Loading…' : customDashboardName}
        </h1>

        <div className="ml-auto flex items-center gap-3">

          {/* Show Customize Name button only for admin users */}
          {!isAdminLoading && isAdmin && (
            <button
              onClick={async () => {
                const token = localStorage.getItem("accessToken");

                try {
                  console.log("Fetching latest dashboard name on button click...");

                  // Call Dashboard Renaming GET API
                  const res = await http.get(
                    `/admin/surveys/${surveyId}/custom-naming/DashboardName`
                  );

                  console.log("Rename API response (on click):", res.data);

                  const renameItems = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.data)
                      ? res.data.data
                      : [];

                  console.log("Rename items:", renameItems);

                  const dashboardRecord = renameItems.find(
                    (item) =>
                      String(item.fieldType || "").trim().toLowerCase() === "dashboard"
                  );

                  console.log("Matched dashboard record on click:", dashboardRecord);

                  const latestName =
                    String(dashboardRecord?.customName || "").trim() ||
                    String(dashboardRecord?.name || "").trim() ||
                    customDashboardName;

                  // update BOTH states
                  setCustomDashboardName(latestName);
                  setTempDashboardName(latestName);


                  // Call Service Type Renaming GET API (Use SAME API as dashboard name)
                  const serviceTypeRes = await http.get(
                    `/admin/surveys/${surveyId}/custom-naming/DashboardName`
                  );

                  const serviceTypeItems = Array.isArray(serviceTypeRes.data)
                    ? serviceTypeRes.data
                    : Array.isArray(serviceTypeRes.data?.data)
                      ? serviceTypeRes.data.data
                      : [];

                  // Filter service_type records for this survey
                  const filteredServiceTypes = serviceTypeItems
                    .filter(
                      (item) =>
                        String(item.surveyId).trim() === String(surveyId).trim() &&
                        String(item.fieldType || "").trim().toLowerCase() === "service_type"
                    )
                    .map((item) => ({
                      id: String(item.id),

                      // Show actual service type value
                      name:
                        item.serviceType && String(item.serviceType).trim().length > 0
                          ? String(item.serviceType)
                          : "-",
                    }));

                  const serviceTypeLabels = {};

                  serviceTypeItems.forEach((item) => {
                    if (
                      String(item.surveyId).trim() === String(surveyId).trim() &&
                      String(item.fieldType || "").trim().toLowerCase() === "service_type"
                    ) {
                      serviceTypeLabels[String(item.id)] = String(item.customName || "");
                    }
                  });
                  // Set data into modal state
                  // This drives:
                  // - left column → Service Type list
                  // - right column → Custom Label inputs
                  setModalServices(filteredServiceTypes);
                  setTempServiceLabels(serviceTypeLabels);


                  // ------------------------------------------------------------
                  // Fetch region custom naming data for modal
                  // ------------------------------------------------------------

                  const regionRes = await http.get(
                    `/admin/surveys/${surveyId}/custom-naming/regions`
                  );

                  // Normalize response because API may return array or { data: [] }
                  const regionItems = Array.isArray(regionRes.data)
                    ? regionRes.data
                    : Array.isArray(regionRes.data?.data)
                      ? regionRes.data.data
                      : [];

                  // Build region list for the left column
                  const filteredRegions = regionItems.map((item) => ({
                    id: String(item.originalKey || item.id),

                    // Show originalName under Region Name
                    name:
                      item.originalName && String(item.originalName).trim().length > 0
                        ? String(item.originalName)
                        : "-",

                    originalKey: String(item.originalKey || ""),
                  }));

                  // Build custom label object for the right column
                  const regionLabelMap = {};

                  regionItems.forEach((item) => {
                    const key = String(item.originalKey || item.id);

                    // If customName is null or empty, show "-"
                    regionLabelMap[key] =
                      item.customName && String(item.customName).trim().length > 0
                        ? String(item.customName)
                        : "";
                  });

                  setModalRegions(filteredRegions);
                  setTempRegionLabels(regionLabelMap);

                  // ------------------------------------------------------------
                  // Fetch service attribute custom naming data for modal
                  // ------------------------------------------------------------

                  const attributeRes = await http.get(
                    `/admin/surveys/${surveyId}/custom-naming/service-attributes`
                  );

                  const attributeItems = Array.isArray(attributeRes.data?.data)
                    ? attributeRes.data.data
                    : Array.isArray(attributeRes.data)
                      ? attributeRes.data
                      : [];

                  const filteredAttributes = attributeItems.map((item) => ({
                    id: String(item.originalKey || item.id),
                    name:
                      item.originalKey && String(item.originalKey).trim().length > 0
                        ? String(item.originalKey)
                        : "-",
                    originalKey: String(item.originalKey || ""),
                  }));

                  const attributeLabelMap = {};

                  attributeItems.forEach((item) => {
                    const key = String(item.originalKey || item.id);

                    attributeLabelMap[key] =
                      item.customName && String(item.customName).trim().length > 0
                        ? String(item.customName)
                        : "";
                  });

                  setModalAttributes(filteredAttributes);
                  setTempAttributeLabels(attributeLabelMap);

                } catch (err) {
                  console.error("Rename fetch failed on click:", err);
                }

                // open modal AFTER fetching
                setShowRenameModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 
              bg-indigo-50 text-indigo-700 
              border border-indigo-200
              rounded-lg shadow-sm 
              hover:bg-indigo-100 
              hover:border-indigo-300
              transition"
            >
              <Pencil size={18} className="text-indigo-600" />
              <span className="text-m font-medium leading-none">Customize Name</span>
            </button>
          )}

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
            >
              <Download size={18} />
              <span>Export</span>
              <ChevronDown size={16} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    downloadPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <FileText size={16} />
                  Download PDF
                </button>

                <button
                  onClick={() => {
                    downloadPNG();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <FileImage size={16} />
                  Download PNG
                </button>

                <button
                  onClick={() => {
                    downloadPPT();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Presentation size={16} />
                  Download PPT
                </button>

                <button
                  onClick={() => {
                    downloadExcel();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <FileSpreadsheet size={16} />
                  Download Excel
                </button>
              </div>
            )}
          </div>

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
            <ResponseChart
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              onData={setResponseData}
              onAllRegionsModalToggle={setIsAllRegionsModalOpen}
            />
            <CustomerSatisfaction
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              onData={setSatisfactionData}
            />

            <CustomerSatisfactionTrend
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              onData={setSatisfactionTrendData}
            />
          </div>

          <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
            <NpsChart
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              onData={setNpsData}
            />

            <NpsDistribution
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              onData={setNpsDistributionData}
            />

            <ServiceAttributeChart
              surveyId={surveyId}
              regionIds={selectedRegions}
              regionsLoaded={regionsLoaded}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              selectedAttrs={selectedAttrs}
              onAvailableAttrs={setAvailableAttrs}
              onSelectedChange={setSelectedAttrs}
              onData={setServiceAttrData}
            />
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
      <CustomizeDashboardModal
        open={showRenameModal}
        onClose={() => setShowRenameModal(false)}

        dashboardName={tempDashboardName}
        setDashboardName={setTempDashboardName}

        hasChanges={hasRenameChanges}

        services={modalServices}
        serviceLabels={tempServiceLabels}

        regionLabels={tempRegionLabels}
        attributeLabels={tempAttributeLabels}


        onRegionLabelChange={(id, value) =>
          setTempRegionLabels((prev) => {
            const updated = { ...prev };

            if (value.trim() === "") {
              delete updated[id];
            } else {
              updated[id] = value;
            }

            return updated;
          })
        }

        onAttributeLabelChange={(id, value) =>
          setTempAttributeLabels((prev) => {
            const updated = { ...prev };

            if (value.trim() === "") {
              delete updated[id];
            } else {
              updated[id] = value;
            }

            return updated;
          })
        }

        onServiceLabelChange={(id, value) =>
          setTempServiceLabels((prev) => {
            const updated = { ...prev };

            if (value.trim() === "") {
              delete updated[id];
            } else {
              updated[id] = value;
            }

            return updated;
          })
        }

        regions={modalRegions}
        attributes={modalAttributes}

        onReset={() => {
          setTempDashboardName(`Dashboard – ${serviceName}`);
          setTempRegionLabels({});
          setTempAttributeLabels({});
          setTempServiceLabels({});
        }}

        onSave={async (updatedDashboardName) => {
          try {
            // ------------------------------------------------------------
            // 1. Save dashboard name
            // ------------------------------------------------------------

            const dashboardPayload = {
              surveyId: surveyId,              // survey id from URL/state
              fieldType: "dashboard",          // identifies dashboard rename
              customName: updatedDashboardName // value entered in modal
            };

            console.log("Saving dashboard name:", dashboardPayload);

            const dashboardRes = await http.post(
              `/admin/surveys/${surveyId}/custom-naming/DashboardName`,
              dashboardPayload
            );

            console.log("Dashboard name save response:", dashboardRes.data);


            // ------------------------------------------------------------
            // 2. Prepare service type payload
            // ------------------------------------------------------------

            const serviceTypePayload = {
              surveyId: surveyId,

              // Build mappings from modal data
              customMappings: modalServices.map((service) => ({
                id: service.id,
                customName: tempServiceLabels[service.id] || service.name || "-",
                surveyId: surveyId,
                fieldType: "service_type"
              })),
            };

            console.log("Saving service type names:", serviceTypePayload);


            // ------------------------------------------------------------
            // 3. Call service type POST API
            // ------------------------------------------------------------

            const serviceTypeSaveRes = await http.post(
              `/admin/surveys/${surveyId}/custom-naming/ServiceType`,
              serviceTypePayload
            );

            console.log("Service type save response:", serviceTypeSaveRes.data);

            // ------------------------------------------------------------
            // Prepare region rename payload
            // ------------------------------------------------------------

            const regionPayload = {
              mappings: modalRegions.map((region) => ({
                originalKey: region.originalKey,
                customName: tempRegionLabels[region.id] || region.name || "-",
              })),
            };

            console.log("Saving region names:", regionPayload);

            // ------------------------------------------------------------
            // Call region POST API
            // ------------------------------------------------------------

            const regionSaveRes = await http.post(
              `/admin/surveys/${surveyId}/custom-naming/regions`,
              regionPayload
            );

            console.log("Region save response:", regionSaveRes.data);

            // ------------------------------------------------------------
            // Prepare service attribute rename payload
            // ------------------------------------------------------------

            const attributePayload = {
              mappings: modalAttributes.map((attr) => ({
                originalKey: attr.originalKey,
                customName: tempAttributeLabels[attr.id] || "",
              })),
            };

            console.log("Saving service attribute names:", attributePayload);

            // ------------------------------------------------------------
            // Call service attribute POST API
            // ------------------------------------------------------------

            const attributeSaveRes = await http.post(
              `/admin/surveys/${surveyId}/custom-naming/service-attributes`,
              attributePayload
            );

            console.log("Service attribute save response:", attributeSaveRes.data);


            // ------------------------------------------------------------
            // 4. Update local UI state after success
            // ------------------------------------------------------------

            setCustomDashboardName(updatedDashboardName);
            setTempDashboardName(updatedDashboardName);

            setCustomRegionLabels(tempRegionLabels);
            setCustomAttributeLabels(tempAttributeLabels);

            // store updated service labels locally
            setCustomServiceLabels(tempServiceLabels);

            // show success message
            setSuccessMessage("Names saved successfully");
            setShowSuccessToast(true);

            // close modal
            setShowRenameModal(false);


          } catch (err) {

            // ------------------------------------------------------------
            // 5. Error handling
            // ------------------------------------------------------------

            console.error("Name save failed:", err.response?.data || err);

            setSuccessMessage("Failed to save names");
            setShowSuccessToast(true);
          }
        }}
      />

      {showSuccessToast &&
        createPortal(
          <div className="fixed top-24 right-6 z-[20000]">
            <div className="min-w-[320px] rounded-2xl border border-[#dfe3ff] bg-white shadow-lg">
              <div className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#4f46e5]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">Success</div>
                  <div className="mt-1 text-sm text-gray-600">{successMessage}</div>
                </div>

                <button
                  onClick={() => setShowSuccessToast(false)}
                  className="ml-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="h-1 w-full overflow-hidden rounded-b-2xl bg-[#eef2ff]">
                <div className="h-full w-full bg-[#4f46e5] animate-[toastbar_3s_linear_forwards]" />
              </div>
            </div>

            <style>{`
        @keyframes toastbar_3s_linear_forwards {
          from { transform: translateX(0%); }
          to { transform: translateX(-100%); }
        }
      `}</style>
          </div>,
          document.body
        )}

    </div>
  );
}
