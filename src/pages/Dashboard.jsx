// src/pages/Dashboard.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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

import http from '../api/http'; // import axios instance

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// regex to check valid UUID format
const isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);

export default function Dashboard() {
  const genderReverseMap = { null: "All", 1: "Male", 2: "Female", 3: "Other" };
  const clientReverseMap = { null: "All", 1: "Residents", 2: "Next of Kin" };

  const { serviceId } = useParams();
  const location = useLocation();

  const humanize = (id) =>
    (id ? String(id).replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Retirement Village');

  const [surveyId, setSurveyId] = useState(null);
  const [serviceName, setServiceName] = useState(location.state?.service || humanize(serviceId) || 'Retirement Village');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  const [availableAttrs, setAvailableAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState(new Set());

  // Enhanced survey loading: checks route → backend filter → default
  useEffect(() => {
    async function loadDefaultSurvey() {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('accessToken');
      const userId = user?.userId;
      if (!userId || !token) return;

      try {
        setServiceLoading(true);

      let chosenSurveyId = serviceId;

      // 1.If not coming from route param, fall back to stored ID
      if (!chosenSurveyId) {
        chosenSurveyId = localStorage.getItem("lastServiceId");
      }

      // 2.Validate it's a real UUID (ignore slugs like 'residential_care')
      if (chosenSurveyId && !isUUID(chosenSurveyId)) {
        console.warn("Invalid surveyId slug detected, ignoring:", chosenSurveyId);
        chosenSurveyId = null;
      }

      // 3.If still no survey, get user's default survey from backend
      if (!chosenSurveyId) {
        try {
          const res = await http.get(`/users/${userId}/surveys/default`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.success) {
            chosenSurveyId = res.data.data.surveyId;
            setServiceName(res.data.data.surveyName);
          }
        } catch (e) {
          console.warn("Could not load default survey:", e);
        }
      }

      // 4.If we finally have one, apply and store it
      if (chosenSurveyId) {
        setSurveyId(chosenSurveyId);
        localStorage.setItem("lastServiceId", chosenSurveyId);

        // Keep each survey’s filters independent
        const prevSurveyId = localStorage.getItem("prevServiceId");
        if (prevSurveyId && prevSurveyId !== chosenSurveyId) {
          console.log(`🔄 Switched survey: ${prevSurveyId} → ${chosenSurveyId}`);
        }
        localStorage.setItem("prevServiceId", chosenSurveyId);

        // Update the service name from navigation, cache, or backend
        if (location.state?.service) {
          setServiceName(location.state.service);
          localStorage.setItem(`surveyName:${chosenSurveyId}`, location.state.service);
        } else {
          const cachedName = localStorage.getItem(`surveyName:${chosenSurveyId}`);
          if (cachedName) {
            setServiceName(cachedName);
          } else {
            try {
              const res = await http.get(`/users/${userId}/surveys/default`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.data?.success) {
                setServiceName(res.data.data.surveyName);
                localStorage.setItem(`surveyName:${res.data.data.surveyId}`, res.data.data.surveyName);
              } else {
                setServiceName(humanize(chosenSurveyId));
              }
            } catch {
              setServiceName(humanize(chosenSurveyId));
            }
          }
        }
      }


      } catch (err) {
        console.error(err);
        setServiceError("Failed to load survey data");
      } finally {
        setServiceLoading(false);
      }
    }

    loadDefaultSurvey();
  }, [location.state?.service, serviceId]);

  useEffect(() => {
    if (availableAttrs.length) {
      if (availableAttrs.length <= 5) {
        // Select all if 5 or fewer
        setSelectedAttrs(new Set(availableAttrs));
      } else {
        // Select first 5 only
        setSelectedAttrs(new Set(availableAttrs.slice(0, 5)));
      }
    }
  }, [availableAttrs]);

  // filters
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("dashboardFilters");
    return saved
      ? JSON.parse(saved)
      : { gender: null, participantType: null, period: new Date().getFullYear().toString() };
  });
  useEffect(() => { localStorage.setItem("dashboardFilters", JSON.stringify(filters)); }, [filters]);

  // handleFilterChange expects { gender, participantType, period }
  const handleFilterChange = useCallback(({ gender, participantType, period }) => {
    setFilters({ gender, participantType, period });
  }, []);

  return (
    <div className="p-0">
      {/* Header section with centered title + right image */}
      <div className="relative mb-6 flex items-center">
        {/* Centered heading */}
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold text-gray-800">
          Dashboard – {serviceLoading ? 'Loading…' : serviceName}
        </h1>

        {/* Right image */}
        <div className="ml-auto">
          <img
            src="/team_icon.PNG"
            alt="Logo"
            className="w-32 h-16 object-contain"
          />
        </div>
      </div>

      {serviceError && <div className="text-sm text-red-600 mb-4">{serviceError}</div>}

      {/* ✅ Only render charts when surveyId is a valid UUID */}
      {surveyId && isUUID(surveyId) && (
        <>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <ResponseChart 
              surveyId={surveyId} 
              gender={filters.gender} 
              participantType={filters.participantType} 
              period={filters.period}
            />
            <CustomerSatisfaction 
              surveyId={surveyId} 
              gender={filters.gender} 
              participantType={filters.participantType} 
              period={filters.period}
            />
            <CustomerSatisfactionTrend 
              surveyId={surveyId} 
              gender={filters.gender} 
              participantType={filters.participantType} 
              period={filters.period}
            />
          </div>

          <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
            <NpsChart 
              surveyId={surveyId} 
              gender={filters.gender} 
              participantType={filters.participantType} 
              period={filters.period}
            />
            <NpsDistribution 
              surveyId={surveyId} 
              gender={filters.gender} 
              participantType={filters.participantType} 
              period={filters.period}
            />

            {/* Service Attribute */}
            <ServiceAttributeChart
              surveyId={surveyId}
              gender={filters.gender}
              participantType={filters.participantType}
              period={filters.period}
              selectedAttrs={selectedAttrs}
              onAvailableAttrs={setAvailableAttrs}
              onSelectedChange={setSelectedAttrs}
            />
          </div>

          <div className="mb-6">
            <DashboardFilters
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
