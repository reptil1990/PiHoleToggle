require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 8082;

// 🛠️ CONFIG
const PIHOLE_HOST = process.env.PIHOLE_HOST || 'localhost';
const PIHOLE_API_BASE = process.env.PIHOLE_API_BASE || '/api';
const API_KEY = process.env.PIHOLE_API_KEY;

if (!PIHOLE_HOST || !API_KEY) {
  console.error("❌ PIHOLE_HOST and PIHOLE_API_KEY must be set");
  process.exit(1);
}

const API_BASE_URL = `${PIHOLE_HOST}${PIHOLE_API_BASE}`;
console.log(`🔗 Using Pi-hole API: ${API_BASE_URL}`);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session cache to avoid repeated authentication
let sessionCache = { sid: null, expires: 0 };

async function getSessionId() {
  // Check if we have a valid cached session
  if (sessionCache.sid && Date.now() < sessionCache.expires) {
    return sessionCache.sid;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth`, {
      password: API_KEY
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Ignore SSL certificate errors for self-signed certificates
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    
    // Cache session for 5 minutes
    sessionCache.sid = response.data.session.sid;
    sessionCache.expires = Date.now() + 5 * 60 * 1000;
    
    console.log('✅ Authentication successful');
    return response.data.sid;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error('Authentication failed');
  }
}

// Get Pi-hole status
app.get('/api/status', async (req, res) => {
  try {
    const sid = await getSessionId();
    const response = await axios.get(`${API_BASE_URL}/dns/blocking`, {
      headers: {
        'X-FTL-SID': sid,
        'Content-Type': 'application/json'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    res.json({
      success: true,
      blocking: response.data.blocking,
      status: response.data.blocking === 'enabled' ? true : false,
      timer: response.data.timer || null
    });
  } catch (err) {
    console.error('❌ Status check failed:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get status: ' + err.message
    });
  }
});

// Disable blocking
app.post('/api/disable', async (req, res) => {
  const { timer } = req.body;
  const timerValue = timer ? parseInt(timer) : null;
  
  try {
    const sid = await getSessionId();

    const response = await axios.post(
      `${API_BASE_URL}/dns/blocking`,
      {
        blocking: false,
        ...(timerValue ? { timer: timerValue } : {})
      },
      {
        headers: {
          'X-FTL-SID': sid,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    res.json({
      success: true,
      message: `Blocking disabled${timerValue ? ` for ${timerValue} seconds` : ''}`,
      timer: timerValue
    });
  } catch (err) {
    console.error('❌ Disable failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to disable blocking: ' + err.message
    });
  }
});

// Enable blocking
app.post('/api/enable', async (req, res) => {
  try {
    const sid = await getSessionId();

    const response = await axios.post(
      `${API_BASE_URL}/dns/blocking`,
      {
        blocking: true
      },
      {
        headers: {
          'X-FTL-SID': sid,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    res.json({
      success: true,
      message: 'Blocking enabled'
    });
  } catch (err) {
    console.error('❌ Enable failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to enable blocking: ' + err.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pi-hole control server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Pi-hole toggle server running on port ${port}`);
  console.log(`📱 Frontend available at: http://${PIHOLE_HOST}:${port}`);
});