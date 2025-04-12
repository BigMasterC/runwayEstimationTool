
# Redone Est Tool

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
