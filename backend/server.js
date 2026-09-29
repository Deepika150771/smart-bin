const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, isMongoActive } = require('./config/db');
const simulator = require('./services/simulationService');

// Load env vars
dotenv.config();

// Connect Database (or setup fallback)
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/bins', require('./routes/binRoutes'));
app.use('/api/telemetry', require('./routes/telemetryRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Simulation Control Endpoints
app.get('/api/simulation/status', (req, res) => {
  res.json({ success: true, isRunning: simulator.isRunning, isMongoActive: isMongoActive() });
});

app.post('/api/simulation/toggle', (req, res) => {
  const isRunning = simulator.toggle();
  res.json({ success: true, message: `Simulation ${isRunning ? 'started' : 'stopped'}`, isRunning });
});

// Root / Health check
app.get('/', (req, res) => {
  res.json({
    name: 'SmartBin IoT Backend API',
    status: 'Operational',
    version: '1.0.0',
    dbMode: isMongoActive() ? 'MongoDB Connected' : 'In-Memory Store (Fallback Mode)',
    simulationRunning: simulator.isRunning,
    timestamp: new Date().toISOString()
  });
});

// Start auto-simulation background worker
simulator.start();

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`=================================================`);
    console.log(` 🗑️  SmartBin IoT Backend running on port ${port}`);
    console.log(` 📊 Mode: ${isMongoActive() ? 'MongoDB' : 'In-Memory DB Preview'}`);
    console.log(` 📡 Sensor endpoint: http://localhost:${port}/api/telemetry`);
    console.log(`=================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Port Notice] Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
