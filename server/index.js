const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// Get storage systems
app.get('/api/storage/systems', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM storage_systems ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching storage systems:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get historical storage usage for a specific system
app.get('/api/storage/history/:systemId', async (req, res) => {
  try {
    const { systemId } = req.params;
    const result = await db.query(
      'SELECT recorded_at, used_capacity_gb FROM storage_usage_history WHERE storage_system_id = $1 ORDER BY recorded_at',
      [systemId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching historical storage data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all pipelines
app.get('/api/pipelines', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pipelines ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pipeline status
app.put('/api/pipelines/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'failed', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, failed, or paused.' });
    }
    
    const result = await db.query(
      'UPDATE pipelines SET status = $1, last_run = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get runway calculations for all storage systems with pipeline impact
app.get('/api/storage/runway', async (req, res) => {
  try {
    // Get pipeline statuses for the calculation
    const failedPipelinesQuery = await db.query(
      "SELECT name FROM pipelines WHERE status = 'failed'"
    );
    const failedPipelines = failedPipelinesQuery.rows.map(row => row.name);

    // Get all systems with their current capacity
    const systemsQuery = await db.query(
      'SELECT id, name, total_capacity_gb, used_capacity_gb FROM storage_systems'
    );
    const systems = systemsQuery.rows;

    // Get all pipelines with their impact rates
    const pipelinesQuery = await db.query(
      'SELECT name, status, impact_rate_gb_per_day FROM pipelines'
    );
    const pipelines = pipelinesQuery.rows;

    // Calculate runway for each system
    const runwayData = systems.map(system => {
      // Calculate net impact rate, considering failed pipelines
      const netImpactRate = pipelines.reduce((total, pipeline) => {
        // Only active pipelines contribute to the impact rate
        if (pipeline.status === 'active') {
          return total + parseFloat(pipeline.impact_rate_gb_per_day);
        }
        return total;
      }, 0);

      // Calculate estimated runway days
      const remainingCapacity = parseFloat(system.total_capacity_gb) - parseFloat(system.used_capacity_gb);
      // If net impact is negative (storage usage decreasing), set runway to very large value
      const estimatedRunwayDays = netImpactRate <= 0 
        ? 9999 
        : Math.round(remainingCapacity / netImpactRate);

      return {
        storage_system_id: system.id,
        storage_system_name: system.name,
        total_capacity_gb: parseFloat(system.total_capacity_gb),
        used_capacity_gb: parseFloat(system.used_capacity_gb),
        remaining_capacity_gb: remainingCapacity,
        net_impact_rate_gb_per_day: netImpactRate,
        estimated_runway_days: estimatedRunwayDays,
        failed_pipelines: failedPipelines
      };
    });

    res.json(runwayData);
  } catch (error) {
    console.error('Error calculating runway data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get forecasted storage for a specific system
app.get('/api/storage/forecast/:systemId', async (req, res) => {
  try {
    const { systemId } = req.params;
    const { days = 30 } = req.query;
    
    // Get current storage usage
    const currentStorageQuery = await db.query(
      'SELECT used_capacity_gb, total_capacity_gb FROM storage_systems WHERE id = $1',
      [systemId]
    );
    
    if (currentStorageQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Storage system not found' });
    }
    
    const currentStorage = currentStorageQuery.rows[0];
    
    // Get active pipelines and their impact rates
    const pipelinesQuery = await db.query(
      "SELECT name, impact_rate_gb_per_day FROM pipelines WHERE status = 'active'"
    );
    const activePipelines = pipelinesQuery.rows;
    
    // Get all pipelines for what-if scenarios
    const allPipelinesQuery = await db.query(
      'SELECT name, impact_rate_gb_per_day FROM pipelines'
    );
    const allPipelines = allPipelinesQuery.rows;
    
    // Calculate forecast based on current usage and pipeline impacts
    const forecast = [];
    let baselineUsage = parseFloat(currentStorage.used_capacity_gb);
    const netDailyImpact = activePipelines.reduce((total, pipeline) => {
      return total + parseFloat(pipeline.impact_rate_gb_per_day);
    }, 0);
    
    // Generate what-if scenarios for each pipeline failing
    const scenarioData = {};
    allPipelines.forEach(pipeline => {
      // Calculate the impact if this pipeline fails (remove its impact from the net)
      const scenarioImpact = netDailyImpact - parseFloat(pipeline.impact_rate_gb_per_day);
      scenarioData[pipeline.name] = scenarioImpact;
    });
    
    // Generate forecast data for each day
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Update baseline usage for this day
      baselineUsage += netDailyImpact;
      baselineUsage = Math.min(baselineUsage, parseFloat(currentStorage.total_capacity_gb));
      baselineUsage = Math.max(baselineUsage, 0);
      
      // Calculate usage for each what-if scenario
      const scenarioUsage = {};
      Object.entries(scenarioData).forEach(([pipelineName, impact]) => {
        let usage = parseFloat(currentStorage.used_capacity_gb) + (i * impact);
        usage = Math.min(usage, parseFloat(currentStorage.total_capacity_gb));
        usage = Math.max(usage, 0);
        scenarioUsage[pipelineName] = usage;
      });
      
      forecast.push({
        date: forecastDate.toISOString().substring(0, 10),
        baseline: baselineUsage,
        ...scenarioUsage
      });
    }
    
    res.json(forecast);
  } catch (error) {
    console.error('Error calculating storage forecast:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 