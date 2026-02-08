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

        // ✅ Source of truth: URL param
        if (serviceId && isUUID(serviceId)) {
          activeSurveyId = serviceId;
        } else {
          // ✅ fallback: default survey, then redirect
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

        // ✅ Get service name for title
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

        // ✅ Regions from backend saved filters
        const filtersRes = await http.get(`/users/${user.userId}/filters`, {
          params: { surveyId: activeSurveyId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const savedIds = filtersRes.data?.data?.region?.values?.map(String) || [];
        setSelectedRegions(savedIds);

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

  return (
    <div className="p-0">
      <div className="relative mb-6 flex items-center">
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold text-gray-800">
          Dashboard – {serviceLoading ? 'Loading…' : serviceName}
        </h1>
        <div className="ml-auto">
          <img src="/team_icon.PNG" alt="Logo" className="w-32 h-16 object-contain" />
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
        <>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <ResponseChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period}/>
            <CustomerSatisfaction surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period}/>
            <CustomerSatisfactionTrend surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period}/>
          </div>

          <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
            <NpsChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period}/>
            <NpsDistribution surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period}/>
            <ServiceAttributeChart surveyId={surveyId} regionIds={selectedRegions} gender={filters.gender} participantType={filters.participantType} period={filters.period} selectedAttrs={selectedAttrs} onAvailableAttrs={setAvailableAttrs} onSelectedChange={setSelectedAttrs}/>
          </div>

          <div className="mb-6">
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
        </>
      )}
    </div>
  );
}
