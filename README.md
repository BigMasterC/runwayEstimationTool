# Storage Forecast Dashboard

A dashboard for monitoring storage usage trends and forecasting future storage needs. This application uses a React frontend with Recharts for data visualization and an Express.js backend that connects to a PostgreSQL database.

## Features

- Historical storage usage tracking
- Forecasted storage usage based on current trends
- What-if scenarios for different pipeline states
- Storage capacity and runway calculations

## Prerequisites

- Node.js (v14+ recommended)
- PostgreSQL database

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd storage-forecast-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the PostgreSQL database:
   - Create a database named `storage_forecast`
   - Run the SQL script in `server/db/init.sql` to create tables and populate with sample data

4. Set up environment variables:
   - Create a `.env` file in the root directory with your database configuration:
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=storage_forecast
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=5000
   ```

## Running the Application

1. Start the backend server:
   ```
   npm run server
   ```

2. In a separate terminal, start the React development server:
   ```
   npm start
   ```

3. Or run both servers concurrently:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/storage/history` - Get historical storage usage data
- `GET /api/storage/forecast` - Get forecasted storage usage data
- `GET /api/storage/metrics` - Get storage metrics including capacity and runway

## Tech Stack

- **Frontend**: React, Recharts, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL 