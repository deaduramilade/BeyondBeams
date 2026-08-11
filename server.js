// server.js
// Oblivion-AI Secure Enterprise Web API + Dashboard (Phase 9)
// All requests protected by A2SPA + API Key monetisation

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const oblivionAI = require('./src/OblivionAI');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve the dashboard folder statically (http://localhost:3000 shows the HTML UI)
app.use(express.static(path.join(__dirname, 'dashboard')));

// API keys are supplied at runtime as a JSON object to prevent credentials
// from being embedded in source control (for example: {"key":"enterprise"}).
let validApiKeys;
try {
  validApiKeys = JSON.parse(process.env.API_KEYS || '{}');
} catch {
  throw new Error('API_KEYS must be a valid JSON object');
}

if (!Object.keys(validApiKeys).length) {
  throw new Error('API_KEYS must define at least one API key');
}

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !validApiKeys[apiKey]) {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid or missing X-API-KEY. Enterprise access required." 
    });
  }
  req.userTier = validApiKeys[apiKey];
  next();
});

// Main execution endpoint (A2SPA enforced inside OblivionAI)
app.post('/execute', async (req, res) => {
  const { actionType, payload } = req.body;

  if (!actionType) {
    return res.status(400).json({ success: false, error: "Missing actionType" });
  }

  console.log(`\n🌐 API CALL [${req.userTier} tier]: ${actionType}`);

  try {
    const result = await oblivionAI.execute(actionType, payload || {});
    res.json({ 
      success: true, 
      tier: req.userTier,
      result 
    });
  } catch (err) {
    console.error("Execution error:", err.message);
    res.status(403).json({ success: false, error: err.message });
  }
});

// Root route shows the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Oblivion-AI Web API running on http://${HOST}:${PORT}`);
  console.log('   All requests protected by A2SPA + API Key');
});