// src/api/accessService.js

const emptySurveyHierarchy = [
    {
        surveyId: 'survey-1',
        surveyName: 'Retirement Village',
        isGranted: false,
        allFacilitiesGranted: false,
        facilities: [
            { facilityCode: 'rv-1', facilityName: 'Village Name 1', isGranted: false },
            { facilityCode: 'rv-2', facilityName: 'Village Name 2', isGranted: false },
            { facilityCode: 'rv-3', facilityName: 'Village Name 3', isGranted: false },
        ],
    },
    {
        surveyId: 'survey-2',
        surveyName: 'Residential Care',
        isGranted: false,
        allFacilitiesGranted: false,
        facilities: [
            { facilityCode: 'rc-1', facilityName: 'Name A', isGranted: false },
            { facilityCode: 'rc-2', facilityName: 'Name B', isGranted: false },
            { facilityCode: 'rc-3', facilityName: 'Name C', isGranted: false },
            { facilityCode: 'rc-4', facilityName: 'Name D', isGranted: false },
        ],
    },
];

function cloneDeep(data) {
    return JSON.parse(JSON.stringify(data));
}

function buildSurveyAccess(baseHierarchy, selectedSurveys) {
    if (!Array.isArray(selectedSurveys) || selectedSurveys.length === 0) {
        return cloneDeep(baseHierarchy).map((survey) => ({
            ...survey,
            isGranted: false,
            allFacilitiesGranted: false,
            facilities: survey.facilities.map((facility) => ({
                ...facility,
                isGranted: false,
            })),
        }));
    }

    return cloneDeep(baseHierarchy).map((survey) => {
        const savedSurvey = selectedSurveys.find(
            (item) => item.surveyId === survey.surveyId
        );

        if (!savedSurvey) {
            return {
                ...survey,
                isGranted: false,
                allFacilitiesGranted: false,
                facilities: survey.facilities.map((facility) => ({
                    ...facility,
                    isGranted: false,
                })),
            };
        }

        // facilityCodes: null => all facilities selected
        if (savedSurvey.facilityCodes === null) {
            return {
                ...survey,
                isGranted: true,
                allFacilitiesGranted: true,
                facilities: survey.facilities.map((facility) => ({
                    ...facility,
                    isGranted: true,
                })),
            };
        }

        const selectedCodes = savedSurvey.facilityCodes || [];

        const updatedFacilities = survey.facilities.map((facility) => ({
            ...facility,
            isGranted: selectedCodes.includes(facility.facilityCode),
        }));

        const grantedCount = updatedFacilities.filter((f) => f.isGranted).length;

        return {
            ...survey,
            isGranted: grantedCount > 0,
            allFacilitiesGranted:
                updatedFacilities.length > 0 &&
                grantedCount === updatedFacilities.length,
            facilities: updatedFacilities,
        };
    });
}

// in-memory saved access by username
const mockAccessStore = {
    'employee@gmail.com': {
        surveys: [
            {
                surveyId: 'survey-1',
                facilityCodes: ['rv-1', 'rv-3'],
            },
        ],
    },
    'sithu': {
        surveys: [
            {
                surveyId: 'survey-1',
                facilityCodes: null,
            },
        ],
    },
};

export const getUserAccess = async (user) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const username = (user?.username || '').toLowerCase();
    const savedAccess = mockAccessStore[username] || { surveys: [] };

    return {
        data: {
            success: true,
            data: {
                userId: user.id,
                username: user.username,
                isActive: user.isActive ?? true,
                surveys: buildSurveyAccess(emptySurveyHierarchy, savedAccess.surveys),
            },
        },
    };
};

export const updateUserAccess = async (userId, username, payload) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalizedUsername = (username || '').toLowerCase();

    mockAccessStore[normalizedUsername] = {
        surveys: cloneDeep(payload.surveys || []),
    };

    console.log('Mock PUT /api/users/{userId}/access');
    console.log('userId:', userId);
    console.log('username:', normalizedUsername);
    console.log('payload:', payload);
    console.log('updatedStore:', mockAccessStore);

    return {
        data: {
            success: true,
            message: 'Access updated successfully.',
            data: {
                userId,
                isActive: true,
                removedFiltersCount: 2,
            },
        },
    };
};