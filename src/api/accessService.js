// src/api/accessService.js

import http from './http';

// get selected user's access details
export const getUserAccess = (user) => {
    const userId = typeof user === 'string' ? user : user?.id;
    return http.get(`/users/${userId}/access`);
};

// update selected user's access details
export const updateUserAccess = (userId, payload) => {
    return http.put(`/users/${userId}/access`, payload);
};

// get selected user's services
export const getUserServices = (userId) =>
    http.get(`/users/${userId}/services`);

// get regions for a survey
export const getSurveyRegions = (surveyId) =>
    http.get(`/surveys/${surveyId}/regions`);