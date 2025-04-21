const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * GET /
   * Get the Treederboard (leaderboard of top contributors)
   * Query params: limit - Maximum number of users to return (default: 20)
   */
  router.get('/', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      
      // Validate limit
      if (limit <= 0 || limit > 100) {
        return res.status(400).json({ error: 'Invalid limit. Must be between 1 and 100.' });
      }
      
      // Query users ordered by total_points (descending)
      const query = `
        SELECT 
          id, 
          wallet_address,
          display_name,
          total_points, 
          contribution_count, 
          first_contribution_at, 
          last_contribution_at 
        FROM users 
        ORDER BY total_points DESC, last_contribution_at ASC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching Treederboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /user/:wallet_address
   * Get specific user data by wallet address
   */
  router.get('/user/:wallet_address', async (req, res) => {
    try {
      const { wallet_address } = req.params;
      
      // Query user data
      const userQuery = `
        SELECT 
          id, 
          wallet_address,
          display_name,
          total_points, 
          contribution_count, 
          first_contribution_at, 
          last_contribution_at 
        FROM users 
        WHERE wallet_address = $1
      `;
      
      const userResult = await pool.query(userQuery, [wallet_address]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Query user's NFTs
      const nftsQuery = `
        SELECT 
          id, 
          global_id, 
          taxon_id, 
          points, 
          ipfs_cid, 
          transaction_hash, 
          created_at 
        FROM contreebution_nfts 
        WHERE wallet_address = $1
        ORDER BY created_at DESC
      `;
      
      const nftsResult = await pool.query(nftsQuery, [wallet_address]);
      
      // Combine user data with NFTs
      const userData = {
        ...userResult.rows[0],
        nfts: nftsResult.rows
      };
      
      res.json(userData);
    } catch (error) {
      console.error(`Error fetching user data for wallet "${req.params.wallet_address}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /user/profile
   * Update user profile data (e.g., display name)
   * Body: { wallet_address: string, display_name: string }
   */
  router.put('/user/profile', async (req, res) => {
    try {
      const { wallet_address, display_name } = req.body;
      
      // Validate required fields
      if (!wallet_address) {
        return res.status(400).json({ error: 'Missing required field: wallet_address' });
      }
      
      // Validate display_name (if provided)
      if (display_name !== undefined) {
        if (typeof display_name !== 'string') {
          return res.status(400).json({ error: 'Invalid display_name. Must be a string.' });
        }
        
        if (display_name.length > 50) {
          return res.status(400).json({ error: 'Invalid display_name. Maximum length is 50 characters.' });
        }
      }
      
      // Update user profile
      const query = `
        UPDATE users 
        SET 
          display_name = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = $2
        RETURNING id, wallet_address, display_name, total_points, contribution_count
      `;
      
      const result = await pool.query(query, [display_name, wallet_address]);
      
      // If user doesn't exist, create a new one
      if (result.rows.length === 0) {
        const insertQuery = `
          INSERT INTO users (wallet_address, display_name, total_points, contribution_count)
          VALUES ($1, $2, 0, 0)
          RETURNING id, wallet_address, display_name, total_points, contribution_count
        `;
        
        const insertResult = await pool.query(insertQuery, [wallet_address, display_name]);
        
        return res.status(201).json(insertResult.rows[0]);
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};