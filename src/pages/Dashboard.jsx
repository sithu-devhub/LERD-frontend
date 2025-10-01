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

  // Load default survey for logged-in user
  useEffect(() => {
    async function loadDefaultSurvey() {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.userId;
      if (!userId) return;

      try {
        setServiceLoading(true);
        const res = await http.get(`/users/${userId}/surveys/default`);
        const data = res.data;
        if (data.success) {
          setSurveyId(data.data.surveyId);

          // ✅ Prefer service name from Services page if provided, else use default survey name
          if (location.state?.service) {
            setServiceName(location.state.service);
          } else {
            setServiceName(data.data.surveyName);
          }
        }
      } catch (err) {
        setServiceError("Failed to load default survey");
      } finally {
        setServiceLoading(false);
      }
    }
    loadDefaultSurvey();
  }, [location.state?.service]);

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

      {/* Only render charts when surveyId is loaded */}
      {surveyId && (
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
