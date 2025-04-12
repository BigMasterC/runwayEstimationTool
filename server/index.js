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
// Get historical storage usage
app.get('/api/storage/history', async (req, res) => {
  try {
    const result = await db.query('SELECT date, usage_tb FROM storage_history ORDER BY date');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching historical storage data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get forecasted storage usage
app.get('/api/storage/forecast', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT date, baseline_tb, pipeline_a_down_tb, pipeline_b_down_tb FROM storage_forecast ORDER BY date'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching storage forecast data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate storage capacity and runway
app.get('/api/storage/metrics', async (req, res) => {
  try {
    // Get current storage usage
    const currentUsageResult = await db.query(
      'SELECT usage_tb FROM storage_history ORDER BY date DESC LIMIT 1'
    );
    
    // Get average daily growth rate (using last 7 days)
    const growthRateResult = await db.query(`
      SELECT (MAX(usage_tb) - MIN(usage_tb)) / (COUNT(*) - 1) AS daily_growth
      FROM (
        SELECT usage_tb FROM storage_history 
        ORDER BY date DESC LIMIT 7
      ) AS recent_usage
    `);
    
    const currentUsage = currentUsageResult.rows[0].usage_tb;
    const dailyGrowth = growthRateResult.rows[0].daily_growth;
    
    // Assuming a total capacity of 500 TB
    const totalCapacity = 500;
    const remainingCapacity = totalCapacity - currentUsage;
    const runwayDays = Math.floor(remainingCapacity / dailyGrowth);
    
    res.json({
      currentUsage,
      dailyGrowth,
      totalCapacity,
      remainingCapacity,
      runwayDays
    });
  } catch (error) {
    console.error('Error calculating storage metrics:', error);
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