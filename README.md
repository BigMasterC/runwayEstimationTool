# Storage Forecast Dashboard

A dashboard for monitoring storage usage trends and forecasting future storage needs. This application helps analyze the impact of pipeline failures on storage capacity and runway.

## Features

- Historical storage usage tracking for multiple storage systems
- Forecasted storage usage based on pipeline impact
- What-if scenarios for different pipeline failures
- Storage capacity and runway calculations
- Dynamic visualization of data

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
   - Run the SQL script in `server/db/init.sql` to create tables and populate with sample data:
     ```
     psql -U <username> -d storage_forecast -f server/db/init.sql
     ```

4. Set up environment variables:
   - Create a `.env` file in the root directory with your database configuration:
   ```
   DB_USER=<your-username>
   DB_HOST=localhost
   DB_NAME=storage_forecast
   DB_PASSWORD=<your-password>
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

## Using the Dashboard

1. **Select a Storage System**: Choose from the dropdown menu to view data for a specific storage system.

2. **Toggle Pipeline Failures**: Use the checkboxes in the "What-If Scenarios" section to simulate pipeline failures.

3. **View Historical Data**: See how storage usage has changed over time based on actual data.

4. **Analyze Forecasts**: Examine the predicted future storage usage under different pipeline failure scenarios.

5. **Check Runway Information**: View the calculated runway (days until storage is full) for each storage system.

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/storage/systems` - Get all storage systems
- `GET /api/storage/history/:systemId` - Get historical storage usage for a specific system
- `GET /api/pipelines` - Get all pipelines and their status
- `PUT /api/pipelines/:id/status` - Update pipeline status (active, failed, paused)
- `GET /api/storage/runway` - Get runway calculations for all storage systems
- `GET /api/storage/forecast/:systemId` - Get forecasted storage usage for a specific system

## Database Schema

The application uses three main tables:

1. **storage_systems**: Information about storage systems, their capacity, and current usage.
2. **pipelines**: Details about different pipelines (garbage collection, compaction, data ingestion, backup) and their impact on storage.
3. **storage_usage_history**: Historical storage usage data for each storage system.

## Tech Stack

- **Frontend**: React, Recharts, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL

## Command to Start the Webpage

Run these commands in the terminal under the following directory:  
`C:\Users\domin\.cursor-tutor\redoneEstTool`

To start just the backend:
```bash
npm run server
```

To start the React frontend:
```bash
npm start
```

## .SQL files are SCRIPTS that run in the current specificed DB (in the .env file)

## How I Got Cursor to Make It

I initially asked:  
**"How can I run and view the output of this code?"**  
*(code from: https://poe.com/s/igFajY2Z9TrdWt0X1IfN)*

Then I asked it to:
**"Update the code for the dashboard so that it has an Express.js backend that connects to a PostgreSQL database to determine the outcome of the Historical Storage Usage and Forecasted Storage Usage graphs."**

## Database Stuff I Learned

I'm using PostgreSQL (psql, for short).  
**Remember: ";" terminates the language!**

### Useful Commands:
- `createdb [DATABASE NAME]` - Creates a database via the command line.
- `psql -U [USERNAME] -d [DATABASE NAME]` - Connects to a database (e.g., `"domin"` is my user).
- `psql -l` - Lists all databases under your account.
- `\dt` - View all the tables in your database.
- `SELECT * FROM [TABLE NAME];` - View all the contents of a table (both rows and columns).
