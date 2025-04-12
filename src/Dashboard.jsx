import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const Dashboard = () => {
  // Simulated historical storage data (replace this with SQL or API data)
  const historicalData = [
    { date: "2025-04-01", usedSpace: 500, garbageCollected: 50, pipelineActivity: 80 },
    { date: "2025-04-02", usedSpace: 520, garbageCollected: 30, pipelineActivity: 90 },
    { date: "2025-04-03", usedSpace: 550, garbageCollected: 40, pipelineActivity: 85 },
    { date: "2025-04-04", usedSpace: 580, garbageCollected: 20, pipelineActivity: 70 },
    { date: "2025-04-05", usedSpace: 620, garbageCollected: 50, pipelineActivity: 60 },
    { date: "2025-04-06", usedSpace: 650, garbageCollected: 40, pipelineActivity: 75 },
    { date: "2025-04-07", usedSpace: 700, garbageCollected: 30, pipelineActivity: 80 },
  ];

  const [forecastData, setForecastData] = useState([]);
  const [runwayDays, setRunwayDays] = useState(0);
  const [warning, setWarning] = useState("");

  // What-if scenario toggles
  const [pipelineADown, setPipelineADown] = useState(false);
  const [pipelineBDown, setPipelineBDown] = useState(false);

  // Storage capacity in GB
  const totalCapacity = 1000;

  // Forecast logic
  useEffect(() => {
    const forecast = [];
    let currentUsedSpace = historicalData[historicalData.length - 1].usedSpace;

    for (let i = 1; i <= 30; i++) {
      // Calculate daily increase based on pipeline activity
      const baseDailyIncrease = 30; // Default daily usage increase
      const pipelineAImpact = pipelineADown ? 10 : 0; // Pipeline A down increases usage by 10 GB
      const pipelineBImpact = pipelineBDown ? 20 : 0; // Pipeline B down increases usage by 20 GB
      const dailyIncrease = baseDailyIncrease + pipelineAImpact + pipelineBImpact;

      // Simulated garbage collection
      const garbageCollected = 40;

      // Update used space
      currentUsedSpace += dailyIncrease - garbageCollected;

      forecast.push({
        date: `Day ${i}`,
        usedSpace: currentUsedSpace > totalCapacity ? totalCapacity : currentUsedSpace,
        garbageCollected,
      });

      // Determine runway (days left)
      if (currentUsedSpace >= totalCapacity && runwayDays === 0) {
        setRunwayDays(i);
      }
    }

    setForecastData(forecast);

    // Set warnings based on runway days
    if (runwayDays <= 3) {
      setWarning("Critical: Only 3 days or less of storage left!");
    } else if (runwayDays <= 7) {
      setWarning("Warning: Less than a week of storage left!");
    } else {
      setWarning("");
    }
  }, [historicalData, runwayDays, pipelineADown, pipelineBDown]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Storage Forecast Dashboard</h1>
          <p className="text-gray-600">Monitor storage usage and forecast runway availability.</p>
        </header>

        {warning && (
          <motion.div
            className="p-4 mb-6 text-white bg-red-500 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {warning}
          </motion.div>
        )}

        {/* What-if Scenarios */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What-If Scenarios</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pipelineADown}
                onChange={() => setPipelineADown(!pipelineADown)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-800">Pipeline A is Down</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pipelineBDown}
                onChange={() => setPipelineBDown(!pipelineBDown)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-800">Pipeline B is Down</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historical Storage Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Historical Storage Usage</h2>
            <p className="text-gray-600 mb-4">
              This graph shows how storage usage has changed over the past week, including how much garbage was collected daily.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usedSpace" stroke="#8884d8" name="Used Space (GB)" />
                <Line type="monotone" dataKey="garbageCollected" stroke="#82ca9d" name="Garbage Collected (GB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecasted Storage Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Forecasted Storage Usage</h2>
            <p className="text-gray-600 mb-4">
              This graph predicts future storage usage over the next 30 days based on current trends and selected what-if scenarios.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usedSpace" stroke="#ff7300" name="Forecasted Used Space (GB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Runway Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Runway Information</h2>
          <p className="text-gray-600">
            Estimated days until storage is full:{" "}
            <span className="font-bold text-gray-800">{runwayDays || "Calculating..."}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;