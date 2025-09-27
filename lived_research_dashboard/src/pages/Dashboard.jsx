// src/pages/Dashboard.jsx

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const genderReverseMap = { null: "All", 1: "Male", 2: "Female", 3: "Other" };
  const clientReverseMap = { null: "All", 1: "Residents", 2: "Next of Kin" };

  const { serviceId } = useParams();
  const location = useLocation();

  const humanize = (id) =>
    (id ? String(id).replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Retirement Village');

  const [serviceName, setServiceName] = useState(location.state?.service || humanize(serviceId) || 'Retirement Village');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  const [availableAttrs, setAvailableAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState(new Set());

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
      : { gender: null, participantType: null, year: new Date().getFullYear(), start: null, end: null };
  });
  useEffect(() => { localStorage.setItem("dashboardFilters", JSON.stringify(filters)); }, [filters]);

  const handleFilterChange = useCallback(({ gender, participantType, year, start, end }) => {
    setFilters({ gender, participantType, year, start, end });
  }, []);

  return (
    <div className="p-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard – {serviceLoading ? 'Loading…' : serviceName}
      </h1>
      {serviceError && <div className="text-sm text-red-600 mb-4">{serviceError}</div>}

      <div className="grid grid-cols-3 gap-6 mb-6">
        <ResponseChart surveyId="8dff523d-2a46-4ee3-8017-614af3813b32" gender={filters.gender} participantType={filters.participantType} />
        <CustomerSatisfaction surveyId="8dff523d-2a46-4ee3-8017-614af3813b32" gender={filters.gender} participantType={filters.participantType} />
        <CustomerSatisfactionTrend surveyId="8dff523d-2a46-4ee3-8017-614af3813b32" gender={filters.gender} participantType={filters.participantType} />
      </div>

      <div className="grid gap-6 mb-6 grid-cols-[1fr_1fr_2fr]">
        <NpsChart surveyId="8dff523d-2a46-4ee3-8017-614af3813b32" gender={filters.gender} participantType={filters.participantType} />
        <NpsDistribution surveyId="8dff523d-2a46-4ee3-8017-614af3813b32" gender={filters.gender} participantType={filters.participantType} />

        {/* Service Attribute */}
        <ServiceAttributeChart
          surveyId="8dff523d-2a46-4ee3-8017-614af3813b32"
          gender={filters.gender}
          participantType={filters.participantType}
          selectedAttrs={selectedAttrs}
          onAvailableAttrs={setAvailableAttrs}
          onSelectedChange={setSelectedAttrs}
        />


      </div>

      <div className="mb-6">
        <DashboardFilters
          value={{
            gender: genderReverseMap[filters.gender],
            clientType: clientReverseMap[filters.participantType],
            year: filters.year,
            startMonth: filters.start,
            endMonth: filters.end,
          }}
          onChange={handleFilterChange}
        />
      </div>
    </div>
  );
}
