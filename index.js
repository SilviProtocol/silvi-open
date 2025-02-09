// index.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use morgan for logging HTTP requests
app.use(morgan('combined'));

// Basic API key authentication middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: API key missing or invalid' });
  }
  next();
});

// Set up PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// Endpoint for AI Data Submission: POST /research/drafts
// This inserts or updates a record in the ai_research table.
app.post('/research/drafts', async (req, res) => {
  try {
    const {
      taxon_id,
      general_description,
      native_adapted_habitats,
      stewardship_best_practices,
      planting_methods,
      ecological_function,
      agroforestry_use_cases,
      elevation_ranges,
      compatible_soil_types,
      conservation_status,
    } = req.body;

    if (!taxon_id) {
      return res.status(400).json({ error: 'Missing required field: taxon_id' });
    }

    // Insert new record; on conflict, update the record and increment revision
    const query = `
      INSERT INTO ai_research 
        (taxon_id, general_description, native_adapted_habitats, stewardship_best_practices, planting_methods, ecological_function, agroforestry_use_cases, elevation_ranges, compatible_soil_types, conservation_status, research_status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'unverified')
      ON CONFLICT (taxon_id) DO UPDATE SET 
        general_description = EXCLUDED.general_description,
        native_adapted_habitats = EXCLUDED.native_adapted_habitats,
        stewardship_best_practices = EXCLUDED.stewardship_best_practices,
        planting_methods = EXCLUDED.planting_methods,
        ecological_function = EXCLUDED.ecological_function,
        agroforestry_use_cases = EXCLUDED.agroforestry_use_cases,
        elevation_ranges = EXCLUDED.elevation_ranges,
        compatible_soil_types = EXCLUDED.compatible_soil_types,
        conservation_status = EXCLUDED.conservation_status,
        research_status = 'unverified',
        updated_at = CURRENT_TIMESTAMP,
        revision = ai_research.revision + 1;
    `;

    await pool.query(query, [
      taxon_id,
      general_description,
      native_adapted_habitats,
      stewardship_best_practices,
      planting_methods,
      ecological_function,
      agroforestry_use_cases,
      elevation_ranges,
      compatible_soil_types,
      conservation_status,
    ]);

    res.status(200).json({ message: 'Research draft submitted successfully.' });
  } catch (err) {
    console.error('Error in POST /research/drafts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for Data Retrieval: GET /species/:id
// This fetches the AI research data for a given taxon_id.
app.get('/species/:id', async (req, res) => {
  try {
    const taxon_id = req.params.id;
    const query = `SELECT * FROM ai_research WHERE taxon_id = $1`;
    const result = await pool.query(query, [taxon_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /species/:id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the API server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
