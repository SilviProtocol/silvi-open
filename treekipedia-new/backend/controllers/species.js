const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * GET /
   * Search for species by common_name or accepted_scientific_name
   * Query params: search - The search term to look for
   */
  router.get('/', async (req, res) => {
    try {
      const { search } = req.query;
      
      if (!search) {
        return res.status(400).json({ error: 'Missing required parameter: search' });
      }
      
      const query = `
        SELECT * FROM species 
        WHERE common_name ILIKE $1 
        OR accepted_scientific_name ILIKE $1
        ORDER BY common_name
        LIMIT 50
      `;
      
      const result = await pool.query(query, [`%${search}%`]);
      
      res.json(result.rows);
    } catch (error) {
      console.error(`Error searching species for term "${search}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /suggest
   * Get autocomplete suggestions for species names
   * Query params: query - The partial term to look for suggestions
   */
  router.get('/suggest', async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Missing required parameter: query' });
      }
      
      const searchQuery = `
        SELECT taxon_id, common_name, accepted_scientific_name 
        FROM species 
        WHERE common_name ILIKE $1 
        OR accepted_scientific_name ILIKE $1
        ORDER BY common_name
        LIMIT 5
      `;
      
      const result = await pool.query(searchQuery, [`${query}%`]);
      
      res.json(result.rows);
    } catch (error) {
      console.error(`Error getting suggestions for query "${req.query.query}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /:taxon_id
   * Get a specific species by its taxon_id
   * Route params: taxon_id - The unique identifier for the species
   */
  router.get('/:taxon_id', async (req, res) => {
    try {
      const { taxon_id } = req.params;
      
      const query = `
        SELECT * FROM species 
        WHERE taxon_id = $1
      `;
      
      const result = await pool.query(query, [taxon_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching species with taxon_id "${req.params.taxon_id}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};