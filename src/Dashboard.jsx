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
  const [storageSystems, setStorageSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [runwayData, setRunwayData] = useState([]);
  const [warning, setWarning] = useState("");

  // What-if scenario toggles for pipeline failures
  const [failedPipelines, setFailedPipelines] = useState({});

  // Fetch initial data from the backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch storage systems
        const systemsResponse = await axios.get(`${API_BASE_URL}/storage/systems`);
        setStorageSystems(systemsResponse.data);
        
        // Set the first system as selected by default
        if (systemsResponse.data.length > 0) {
          setSelectedSystem(systemsResponse.data[0].id);
        }
        
        // Fetch pipelines
        const pipelinesResponse = await axios.get(`${API_BASE_URL}/pipelines`);
        setPipelines(pipelinesResponse.data);
        
        // Initialize failed pipelines state
        const initialFailedState = {};
        pipelinesResponse.data.forEach(pipeline => {
          initialFailedState[pipeline.id] = pipeline.status === 'failed';
        });
        setFailedPipelines(initialFailedState);
        
        // Fetch runway data
        const runwayResponse = await axios.get(`${API_BASE_URL}/storage/runway`);
        setRunwayData(runwayResponse.data);
        
        // Set warning based on runway days
        if (runwayResponse.data.length > 0) {
          const primarySystem = runwayResponse.data[0]; // assuming first is primary
          if (primarySystem.estimated_runway_days <= 3) {
            setWarning("Critical: Only 3 days or less of storage left!");
          } else if (primarySystem.estimated_runway_days <= 7) {
            setWarning("Warning: Less than a week of storage left!");
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch system-specific data when selected system changes
  useEffect(() => {
    if (!selectedSystem) return;

    const fetchSystemData = async () => {
      try {
        // Fetch historical data for the selected system
        const historyResponse = await axios.get(`${API_BASE_URL}/storage/history/${selectedSystem}`);
        const formattedHistoryData = historyResponse.data.map(item => ({
          date: new Date(item.recorded_at).toLocaleDateString(),
          usedSpace: parseFloat(item.used_capacity_gb),
        }));
        setHistoricalData(formattedHistoryData);

        // Fetch forecast data for the selected system
        const forecastResponse = await axios.get(`${API_BASE_URL}/storage/forecast/${selectedSystem}`);
        setForecastData(forecastResponse.data);
      } catch (error) {
        console.error("Error fetching system data:", error);
      }
    };

    fetchSystemData();
  }, [selectedSystem]);

  // Update pipeline status when a what-if toggle is changed
  const handlePipelineToggle = async (pipelineId, isFailedNow) => {
    try {
      // Update local state immediately for responsive UI
      setFailedPipelines(prev => ({
        ...prev,
        [pipelineId]: isFailedNow
      }));
      
      // Update pipeline status in the database
      await axios.put(`${API_BASE_URL}/pipelines/${pipelineId}/status`, {
        status: isFailedNow ? 'failed' : 'active'
      });
      
      // Refetch pipeline data
      const pipelinesResponse = await axios.get(`${API_BASE_URL}/pipelines`);
      setPipelines(pipelinesResponse.data);
      
      // Refetch runway data
      const runwayResponse = await axios.get(`${API_BASE_URL}/storage/runway`);
      setRunwayData(runwayResponse.data);
      
      // Refetch forecast data if a system is selected
      if (selectedSystem) {
        const forecastResponse = await axios.get(`${API_BASE_URL}/storage/forecast/${selectedSystem}`);
        setForecastData(forecastResponse.data);
      }
      
      // Update warning based on new runway days
      if (runwayResponse.data.length > 0) {
        const primarySystem = runwayResponse.data[0]; // assuming first is primary
        if (primarySystem.estimated_runway_days <= 3) {
          setWarning("Critical: Only 3 days or less of storage left!");
        } else if (primarySystem.estimated_runway_days <= 7) {
          setWarning("Warning: Less than a week of storage left!");
        } else {
          setWarning("");
        }
      }
    } catch (error) {
      console.error("Error updating pipeline status:", error);
      // Revert the toggle if the API call fails
      setFailedPipelines(prev => ({
        ...prev,
        [pipelineId]: !isFailedNow
      }));
    }
  };

  // Get the currently selected storage system object
  const currentSystem = storageSystems.find(system => system.id === selectedSystem) || {};

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Storage Forecast Dashboard</h1>
          <p className="text-gray-600">Monitor storage usage and forecast runway availability.</p>
        </header>

        {/* Information Bubble */}
        {runwayData.length > 0 && runwayData[0].net_impact_rate_gb_per_day > 0 && (
          <motion.div
            className="p-4 mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-medium">Information</span>
              <p>Storage will reach capacity in {runwayData[0].estimated_runway_days} days.</p>
            </div>
          </motion.div>
        )}

        {warning && (
          <motion.div
            className="p-4 mb-6 text-white bg-red-500 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {warning}
          </motion.div>
        )}

        {/* Storage System Selector */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage System</h2>
          <select 
            className="p-2 border rounded w-full"
            value={selectedSystem || ''}
            onChange={(e) => setSelectedSystem(Number(e.target.value))}
          >
            {storageSystems.map(system => (
              <option key={system.id} value={system.id}>
                {system.name} ({system.used_capacity_gb}/{system.total_capacity_gb} GB)
              </option>
            ))}
          </select>
        </div>

        {/* What-if Scenarios */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">What-If Scenarios: Pipeline Failures</h2>
          <p className="text-gray-600 mb-4">Toggle pipelines to simulate failures and see the impact on storage</p>
          <div className="grid grid-cols-1 gap-4">
            {pipelines.map(pipeline => {
              const isDown = failedPipelines[pipeline.id];
              // Get the appropriate icon based on pipeline type
              const getIcon = (pipelineName) => {
                switch (pipelineName) {
                  case 'Garbage Collection Pipeline':
                    return (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    );
                  case 'Compaction Pipeline':
                    return (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    );
                  case 'Data Ingestion Pipeline':
                    return (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 5h16" />
                      </svg>
                    );
                  case 'Backup Pipeline':
                    return (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    );
                  default:
                    return null;
                }
              };

              return (
                <div 
                  key={pipeline.id} 
                  className={`p-4 rounded-lg border ${isDown ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDown ? 'bg-red-100' : 'bg-gray-100'}`}>
                      {getIcon(pipeline.name)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-gray-800">{pipeline.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isDown ? 'bg-red-500 text-white' : 'bg-green-100 text-green-800'
                        }`}>
                          {isDown ? 'Down' : 'Running'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{pipeline.description}</p>
                      <label className="flex items-center mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDown}
                          onChange={() => handlePipelineToggle(pipeline.id, !isDown)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {isDown ? 'Restore Pipeline' : 'Simulate Failure'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historical Storage Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Historical Storage Usage</h2>
            <p className="text-gray-600 mb-4">
              Storage usage over the past week
            </p>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="usedSpace" stroke="#8884d8" name="Used Space (GB)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 italic text-center p-10">Select a storage system to view historical data</p>
            )}
          </div>

          {/* Forecasted Storage Usage */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Forecasted Storage Usage</h2>
            <p className="text-gray-600 mb-4">
              Predicted storage usage for the next 30 days
            </p>
            {forecastData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="baseline" stroke="#8884d8" name="Baseline (GB)" />
                  {pipelines.map(pipeline => (
                    failedPipelines[pipeline.id] && (
                      <Line 
                        key={pipeline.id}
                        type="monotone" 
                        dataKey={pipeline.name} 
                        stroke={
                          pipeline.name === 'Garbage Collection Pipeline' ? '#82ca9d' :
                          pipeline.name === 'Compaction Pipeline' ? '#ffc658' :
                          pipeline.name === 'Data Ingestion Pipeline' ? '#ff7300' :
                          '#8dd1e1'
                        } 
                        name={`${pipeline.name} Failed (GB)`} 
                        strokeDasharray="3 3" 
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 italic text-center p-10">Select a storage system to view forecast data</p>
            )}
          </div>
        </div>

        {/* Runway Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage Metrics</h2>
          {runwayData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {runwayData.map(system => (
                <div key={system.storage_system_id} className="border rounded p-4">
                  <h3 className="font-semibold text-lg">{system.storage_system_name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Current Usage</p>
                      <p className="text-2xl font-bold text-blue-600">{system.used_capacity_gb.toFixed(2)} GB</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Net Daily Impact</p>
                      <p className="text-2xl font-bold text-green-600">{system.net_impact_rate_gb_per_day.toFixed(2)} GB/day</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Runway</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {system.net_impact_rate_gb_per_day <= 0 
                          ? "∞" 
                          : `${system.estimated_runway_days} days`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Storage Capacity</span>
                      <span className="text-gray-600">{system.used_capacity_gb.toFixed(2)} / {system.total_capacity_gb.toFixed(2)} GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(system.used_capacity_gb / system.total_capacity_gb) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {system.failed_pipelines.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded text-red-800 text-sm">
                      <strong>Failed Pipelines:</strong> {system.failed_pipelines.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-center">No runway data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;