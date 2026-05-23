// src/api/customNamingService.js
import http from "./http";

// --------------------------------------------------
// GET APIs
// --------------------------------------------------

// Dashboard name + Service Type names
export const getDashboardAndServiceTypeNames = (surveyId) =>
    http.get(`/admin/surveys/${surveyId}/custom-naming/DashboardName`);

// Region names
export const getRegionNames = (surveyId) =>
    http.get(`/admin/surveys/${surveyId}/custom-naming/regions`);

// Service Attribute names
export const getServiceAttributeNames = (surveyId) =>
    http.get(`/admin/surveys/${surveyId}/custom-naming/service-attributes`);


// --------------------------------------------------
// POST APIs
// --------------------------------------------------

// Save dashboard name
export const saveDashboardName = (surveyId, payload) =>
    http.post(
        `/admin/surveys/${surveyId}/custom-naming/DashboardName`,
        payload
    );

// Save service type names
export const saveServiceTypeNames = (surveyId, payload) =>
    http.post(
        `/admin/surveys/${surveyId}/custom-naming/ServiceType`,
        payload
    );

// Save region names
export const saveRegionNames = (surveyId, payload) =>
    http.post(
        `/admin/surveys/${surveyId}/custom-naming/regions`,
        payload
    );

// Save service attribute names
export const saveServiceAttributeNames = (surveyId, payload) =>
    http.post(
        `/admin/surveys/${surveyId}/custom-naming/service-attributes`,
        payload
    );