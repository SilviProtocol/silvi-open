const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * GET /
   * Search for species by common_name or species (scientific name)
   * Query params: search - The search term to look for
   */
  router.get('/', async (req, res) => {
    try {
      const { search } = req.query;
      
      if (!search) {
        return res.status(400).json({ error: 'Missing required parameter: search' });
      }
      
      // Debug log
      console.log(`GET /species search query: "${search}"`);
      
      const query = `
        SELECT * FROM species 
        WHERE common_name ILIKE $1 
        OR species ILIKE $1
        OR accepted_scientific_name ILIKE $1
        ORDER BY common_name
        LIMIT 50
      `;
      
      const result = await pool.query(query, [`%${search}%`]);
      console.log(`GET /species returned ${result.rowCount} results`);
      
      res.json(result.rows);
    } catch (error) {
      console.error(`Error searching species for term "${req.query.search}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /suggest
   * Get autocomplete suggestions for species names
   * Query params: 
   *   - query: The partial term to look for suggestions
   *   - field: Optional field to search in (common_name or species)
   */
  router.get('/suggest', async (req, res) => {
    try {
      const { query, field } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Missing required parameter: query' });
      }
      
      // Debug log the request parameters
      console.log(`GET /species/suggest query: "${query}", field: "${field || 'both'}"`);
      
      let searchQuery;
      let queryParams;
      
      // Difference between % position:
      // %query% = contains anywhere
      // query% = starts with
      
      // If field is specified, search only in that field
      if (field === 'common_name') {
        searchQuery = `
          SELECT taxon_id, common_name, species, accepted_scientific_name 
          FROM species 
          WHERE common_name ILIKE $1
          ORDER BY common_name
          LIMIT 10
        `;
        // For common_name, we need to search anywhere in the name as they're often formatted like "Forest Oak"
        queryParams = [`%${query}%`];
      } else if (field === 'species' || field === 'scientific_name') {
        searchQuery = `
          SELECT taxon_id, common_name, species, accepted_scientific_name 
          FROM species 
          WHERE species ILIKE $1
          ORDER BY species
          LIMIT 10
        `;
        // For scientific names, we can prioritize "starts with" but should also find partial matches
        queryParams = [`%${query}%`];
      } else {
        // Search in both fields (default behavior)
        searchQuery = `
          SELECT taxon_id, common_name, species, accepted_scientific_name 
          FROM species 
          WHERE common_name ILIKE $1 
          OR species ILIKE $1
          ORDER BY 
            CASE 
              WHEN common_name ILIKE $2 THEN 0 
              WHEN species ILIKE $2 THEN 1
              ELSE 2
            END,
            common_name
          LIMIT 10
        `;
        // Multiple parameters: first for contains anywhere, second for starts with (for ordering)
        queryParams = [`%${query}%`, `${query}%`];
      }
      
      console.log(`Executing query with params:`, queryParams);
      const result = await pool.query(searchQuery, queryParams);
      console.log(`GET /species/suggest returned ${result.rowCount} results`);
      
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