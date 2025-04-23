const WebSocket = require('ws');
const { Pool, Client } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// This client is used ONLY for LISTEN/NOTIFY
const pgClient = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  console.log('WebSocket server created');

  // Connect and setup LISTEN/NOTIFY
  pgClient.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to PostgreSQL for notifications');

    pgClient.query('LISTEN storage_change', (err) => {
      if (err) {
        console.error('Error setting up storage_change listener:', err);
      } else {
        console.log('Listening for storage_change notifications');
      }
    });

    pgClient.query('LISTEN pipeline_change', (err) => {
      if (err) {
        console.error('Error setting up pipeline_change listener:', err);
      } else {
        console.log('Listening for pipeline_change notifications');
      }
    });
  });

  pgClient.on('notification', async (msg) => {
    console.log('Received database notification:', msg.channel, msg.payload);
    try {
      // Parse the notification payload
      const payload = JSON.parse(msg.payload);

      // Send the notification to all clients
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            channel: msg.channel,
            payload: payload
          }));
        }
      });

      // For pipeline changes, also send updated pipeline data
      if (msg.channel === 'pipeline_change') {
        const refreshedPipelines = await pool.query('SELECT * FROM pipelines');
        wss.clients.forEach((wsClient) => {
          if (wsClient.readyState === WebSocket.OPEN) {
            wsClient.send(JSON.stringify({
              type: 'initial_pipelines',
              data: refreshedPipelines.rows
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing database notification:', error);
    }
  });

  pgClient.on('error', (err) => {
    console.error('Database connection error:', err);
  });

  wss.on('connection', (ws) => {
    console.log('New client connected');

    const sendInitialData = async () => {
      try {
        const storageResult = await pool.query('SELECT * FROM storage_systems');
        ws.send(JSON.stringify({
          type: 'initial_storage',
          data: storageResult.rows
        }));

        const pipelinesResult = await pool.query('SELECT * FROM pipelines');
        ws.send(JSON.stringify({
          type: 'initial_pipelines',
          data: pipelinesResult.rows
        }));

        const historyResult = await pool.query(
          'SELECT * FROM storage_usage_history ORDER BY recorded_at ASC'
        );
        ws.send(JSON.stringify({
          type: 'initial_history',
          data: historyResult.rows
        }));
      } catch (error) {
        console.error('Error sending initial data:', error);
      }
    };

    sendInitialData();

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return wss;
}

module.exports = setupWebSocketServer;