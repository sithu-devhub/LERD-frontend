# LERD Frontend - Comprehensive Documentation

## 1. Overview

The frontend of the the LERD (Lived Experience Research Dashboard) is developed using React (Vite). It provides an interactive interface for visualising and analysing survey data and communicates with backend APIs hosted on Azure.

The system allows users to:

- View survey analytics through interactive dashboards
- Apply dynamic filters
- Explore charts and data visualisations
- Manage dashboard customisation features
- Access role-based system functionality

---

## 2. Repository

The frontend codebase is maintained in a Bitbucket repository and includes:

- UI components
- Routing logic
- API integration
- Styling
- Utility functions

### Frontend Repository
https://bitbucket.org/uclivedexperinceteam/livedashboard-frontend

---

## 3. Live Application Access

### Staging Environment
https://lerd.netlify.app/login

### Production Environment
https://lerd-insights.netlify.app/login

### Demo Credentials

Username: `sithu`  
Password: `456123abc`

### Netlify Deployment Dashboard (Admin Access)

https://app.netlify.com/projects/lerd-insights

Access is restricted to authorized users such as project supervisors.

The Netlify dashboard provides access to:

- Deployment history
- Build logs
- Deployment configuration settings
- Monitoring and maintenance information

---

## 4. Technologies Used

### Frontend
- React (Vite)
- React Router
- Tailwind CSS
- Axios
- Recharts

### Backend
- .NET Core REST APIs

### Database
- PostgreSQL

### Testing Tools
- Postman

### Design
- Figma

---

## 5. Features

- Interactive dashboard for survey analytics
- Dynamic filtering functionality
- Multiple chart visualisations
- Download Reports
- Custom naming
- User Management
- Role-based access control (RBAC)
- REST API integration
- Toast notifications and loading indicators
- Clean and maintainable folder structure

---

## 6. Folder Structure Overview

```text
src/
 ├── api/          → API service logic
 ├── components/   → Reusable UI components
 ├── pages/        → Main application pages
 ├── styles/       → Styling files
 ├── utils/        → Helper functions

public/            → Static assets
```

---

## 7. Routing Configuration

The application uses React Router for client-side routing.

Netlify redirects are used in production to ensure React Router routes function correctly.

The `_redirects` file ensures:

- Support navigation between pages without full page reloads
- Direct URL access (e.g., `/dashboard`) works correctly
- Prevent page refresh 404 errors

---

## 8. Environment Configuration

The application uses environment variables:

```env
VITE_API_BASE_URL=/api
VITE_LOGIN_API_BASE_URL=/api
```

### Explanation

- `/api` is used as a relative base path
- This avoids hardcoding backend URLs in the frontend
- The actual backend URL is handled through proxy/redirect configuration

---

## 9. API Handling

### Development (Vite Proxy)

During local development, API requests are proxied using `vite.config.js`:

```javascript
server: {
  port: 3000,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'https://livedashboard2026-d0d8gqd3deaqacf5.australiaeast-01.azurewebsites.net',
      changeOrigin: true,
      secure: true,
    },
  },
}
```

This means:

- Requests to `/api` are forwarded to the staging Azure backend
- CORS issues are avoided during development

### Production (Netlify Redirects)

In production, Netlify handles API routing using the `_redirects` file:

```text
# Proxy API calls to backend
/api/*  https://livedashboard2026-d0d8gqd3deaqacf5.australiaeast-01.azurewebsites.net/api/:splat  200

# Let React Router handle all other routes
/*      /index.html   200
```

This ensures:

- All `/api` requests are forwarded to the production backend service
- Frontend and backend remain loosely coupled
- No need to hardcode backend URLs in frontend code

---

## 10. Compatibility Support

The application is designed to work correctly across:

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

The UI components, popup modals, dashboard customisation features, and download functionality are tested across supported browsers.

---

## 11. Important Notes

- The backend API must be running and accessible for full system functionality
- API routing differs between development and production environments
- Development uses Vite proxy configuration
- Production uses Netlify redirect configuration

If the backend URL changes, update:

- `vite.config.js`
- `_redirects` file

---

## 12. Local Setup Summary

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

The production build output is generated in the `dist/` directory.