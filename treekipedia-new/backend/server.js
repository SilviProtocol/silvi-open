const express = require('express');
const { Pool } = require('pg');
const { ethers } = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables from ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',               // Next.js dev server
    'http://localhost:8000',               // Alternative port if needed
    'http://167.172.143.162:3001',         // Current frontend deployment (HTTP)
    'https://167.172.143.162:3001',        // Current frontend deployment (HTTPS)
    'http://167.172.143.162',              // Base domain without port (HTTP)
    'https://167.172.143.162',             // Base domain without port (HTTPS)
    'https://treekipedia.silvi.earth',     // Production frontend
    'http://treekipedia.silvi.earth',      // Production frontend (HTTP)
    'https://frontend.silvi.earth',        // Alternative production frontend
    'http://frontend.silvi.earth',         // Alternative production frontend (HTTP)
    /\.vercel\.app$/                       // Vercel preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Set DEBUG_CORS in .env to 'true' to allow all origins temporarily
const ALLOW_ALL_ORIGINS = process.env.DEBUG_CORS === 'true';

// Apply CORS middleware before other middleware
if (ALLOW_ALL_ORIGINS) {
  console.log('⚠️ WARNING: CORS is configured to allow ALL origins for debugging');
  app.use(cors({ origin: true, credentials: true }));
} else {
  console.log('🔒 CORS is configured with specific allowed origins');
  app.use(cors(corsOptions));
}

// Other middleware
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test PostgreSQL Connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected');
    client.release();
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
  }
})();

// Ethers.js Connection to Base Sepolia
let provider;
(async () => {
  try {
    const baseSepoliaRpc = process.env.BASE_RPC_URL || `https://base-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
    provider = new ethers.JsonRpcProvider(baseSepoliaRpc);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`Connected to Base Sepolia (Block #${blockNumber})`);
  } catch (error) {
    console.error('Base Sepolia connection error:', error.message);
  }
})();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Treekipedia Backend is running!' });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Treekipedia API',
    version: '1.0.0',
    endpoints: [
      '/species - Species search and details',
      '/treederboard - User contributions leaderboard',
      '/research - AI research and NFT minting'
    ]
  });
});

// Import routes
const speciesRoutes = require('./controllers/species')(pool);
app.use('/species', speciesRoutes);

const treederboardRoutes = require('./controllers/treederboard')(pool);
app.use('/treederboard', treederboardRoutes);

const researchRoutes = require('./controllers/research')(pool);
app.use('/research', researchRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = { app, pool };