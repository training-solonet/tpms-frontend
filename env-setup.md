# Environment Setup Instructions

## Create .env file

Create a `.env` file in the root directory with the following content:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws

# API Endpoints
VITE_API_LOGIN_ENDPOINT=/auth/login
VITE_API_TRUCKS_ENDPOINT=/trucks
VITE_API_DASHBOARD_ENDPOINT=/dashboard
VITE_API_MINING_AREA_ENDPOINT=/mining-area
VITE_API_REALTIME_LOCATIONS_ENDPOINT=/realtime/locations

# Application Settings
VITE_APP_NAME=Fleet Monitor
VITE_COMPANY_NAME=PT Borneo Indobara
VITE_AUTO_REFRESH_INTERVAL=3000
VITE_MAX_TRUCKS_DISPLAY=100
```

## Steps to create .env:

1. Copy the content above
2. Create a new file named `.env` in the project root
3. Paste the content
4. Save the file
5. Restart the development server: `npm run dev`

## Note:
The application will work without .env file using fallback values, but creating .env is recommended for proper configuration.
