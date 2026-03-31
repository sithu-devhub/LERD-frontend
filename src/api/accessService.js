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

function cloneSurveyHierarchy(data) {
    return JSON.parse(JSON.stringify(data));
}

export const getUserAccess = async (user) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const username = (user?.username || '').toLowerCase();

    if (username === 'employee@gmail.com') {
        return {
            data: {
                success: true,
                data: {
                    userId: user.id,
                    username: user.username,
                    isActive: user.isActive ?? true,
                    surveys: [
                        {
                            surveyId: 'survey-1',
                            surveyName: 'Retirement Village',
                            isGranted: true,
                            allFacilitiesGranted: false,
                            facilities: [
                                { facilityCode: 'rv-1', facilityName: 'Village Name 1', isGranted: true },
                                { facilityCode: 'rv-2', facilityName: 'Village Name 2', isGranted: false },
                                { facilityCode: 'rv-3', facilityName: 'Village Name 3', isGranted: true },
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
                    ],
                },
            },
        };
    }

    if (username === 'sithu') {
        return {
            data: {
                success: true,
                data: {
                    userId: user.id,
                    username: user.username,
                    isActive: user.isActive ?? true,
                    surveys: [
                        {
                            surveyId: 'survey-1',
                            surveyName: 'Retirement Village',
                            isGranted: true,
                            allFacilitiesGranted: true,
                            facilities: [
                                { facilityCode: 'rv-1', facilityName: 'Village Name 1', isGranted: true },
                                { facilityCode: 'rv-2', facilityName: 'Village Name 2', isGranted: true },
                                { facilityCode: 'rv-3', facilityName: 'Village Name 3', isGranted: true },
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
                    ],
                },
            },
        };
    }

    // admins or any other users
    return {
        data: {
            success: true,
            data: {
                userId: user.id,
                username: user.username,
                isActive: user.isActive ?? true,
                surveys: cloneSurveyHierarchy(emptySurveyHierarchy),
            },
        },
    };
};