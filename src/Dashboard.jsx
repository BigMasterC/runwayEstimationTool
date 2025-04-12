import React, { useState, useEffect } from "react";
import axios from "axios";
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

const API_BASE_URL = "http://localhost:5000/api";

const Dashboard = () => {
  // State for data from the backend
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [metrics, setMetrics] = useState({
    currentUsage: 0,
    totalCapacity: 500,
    remainingCapacity: 0,
    runwayDays: 0,
    dailyGrowth: 0
  });
  
  const [warning, setWarning] = useState("");

  // What-if scenario toggles
  const [pipelineADown, setPipelineADown] = useState(false);
  const [pipelineBDown, setPipelineBDown] = useState(false);

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch historical data
        const historyResponse = await axios.get(`${API_BASE_URL}/storage/history`);
        const formattedHistoryData = historyResponse.data.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          usedSpace: parseFloat(item.usage_tb),
        }));
        setHistoricalData(formattedHistoryData);

        // Fetch forecast data
        const forecastResponse = await axios.get(`${API_BASE_URL}/storage/forecast`);
        const formattedForecastData = forecastResponse.data.map(item => {
          const baselineValue = parseFloat(item.baseline_tb);
          const pipelineADownValue = parseFloat(item.pipeline_a_down_tb);
          const pipelineBDownValue = parseFloat(item.pipeline_b_down_tb);
          
          return {
            date: new Date(item.date).toLocaleDateString(),
            baseline: baselineValue,
            pipelineADown: pipelineADownValue,
            pipelineBDown: pipelineBDownValue,
            // Dynamic value based on which pipelines are down
            usedSpace: pipelineADown && pipelineBDown 
              ? Math.min(pipelineADownValue, pipelineBDownValue) 
              : pipelineADown 
                ? pipelineADownValue 
                : pipelineBDown 
                  ? pipelineBDownValue 
                  : baselineValue
          };
        });
        setForecastData(formattedForecastData);

        // Fetch metrics data
        const metricsResponse = await axios.get(`${API_BASE_URL}/storage/metrics`);
        setMetrics({
          currentUsage: parseFloat(metricsResponse.data.currentUsage),
          totalCapacity: parseFloat(metricsResponse.data.totalCapacity),
          remainingCapacity: parseFloat(metricsResponse.data.remainingCapacity),
          runwayDays: parseInt(metricsResponse.data.runwayDays),
          dailyGrowth: parseFloat(metricsResponse.data.dailyGrowth)
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Recalculate runway based on what-if scenarios
  useEffect(() => {
    if (forecastData.length === 0) return;

    // Update runway days based on what-if scenarios
    let adjustedRunwayDays = metrics.runwayDays;
    
    if (pipelineADown) {
      // Reduce runway by 10% if Pipeline A is down
      adjustedRunwayDays = Math.floor(adjustedRunwayDays * 0.9);
    }
    
    if (pipelineBDown) {
      // Reduce runway by 15% if Pipeline B is down
      adjustedRunwayDays = Math.floor(adjustedRunwayDays * 0.85);
    }
    
    // Set warnings based on adjusted runway days
    if (adjustedRunwayDays <= 3) {
      setWarning("Critical: Only 3 days or less of storage left!");
    } else if (adjustedRunwayDays <= 7) {
      setWarning("Warning: Less than a week of storage left!");
    } else {
      setWarning("");
    }
    
    // Update metrics with new runway
    setMetrics(prev => ({
      ...prev,
      runwayDays: adjustedRunwayDays
    }));
    
  }, [pipelineADown, pipelineBDown, metrics.runwayDays, forecastData]);

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
              This graph shows how storage usage has changed over time based on data from the database.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usedSpace" stroke="#8884d8" name="Used Space (TB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecasted Storage Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Forecasted Storage Usage</h2>
            <p className="text-gray-600 mb-4">
              This graph predicts future storage usage based on current trends and selected what-if scenarios.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usedSpace" stroke="#ff7300" name="Forecasted Used Space (TB)" />
                {!pipelineADown && !pipelineBDown && (
                  <Line type="monotone" dataKey="baseline" stroke="#8884d8" name="Baseline Forecast (TB)" strokeDasharray="5 5" />
                )}
                {pipelineADown && (
                  <Line type="monotone" dataKey="pipelineADown" stroke="#82ca9d" name="Pipeline A Down (TB)" strokeDasharray="3 3" />
                )}
                {pipelineBDown && (
                  <Line type="monotone" dataKey="pipelineBDown" stroke="#ffc658" name="Pipeline B Down (TB)" strokeDasharray="3 3" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Runway Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Usage</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.currentUsage.toFixed(2)} TB</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Daily Growth</p>
              <p className="text-2xl font-bold text-green-600">{metrics.dailyGrowth.toFixed(2)} TB/day</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Runway</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.runwayDays} days</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Storage Capacity</span>
              <span className="text-gray-600">{metrics.currentUsage.toFixed(2)} / {metrics.totalCapacity.toFixed(2)} TB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(metrics.currentUsage / metrics.totalCapacity) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;