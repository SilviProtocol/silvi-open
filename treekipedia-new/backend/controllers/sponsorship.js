const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const chains = require('../config/chains');
const { performAIResearch } = require('../services/aiResearch');

const SPONSORSHIP_AMOUNT = 3; // 3 USDC per species

// Infura webhook secret from environment variables
const WEBHOOK_SECRET = process.env.INFURA_WEBHOOK_SECRET || 'webhook-secret-placeholder';

/**
 * Verify webhook signature from Infura
 * @param {object} req Express request object
 * @returns {boolean} Whether the signature is valid
 */
function verifyWebhookSignature(req) {
  // For testing purposes, skip verification if explicitly allowed in env
  if (process.env.SKIP_WEBHOOK_VERIFICATION === 'true') {
    console.log('WARNING: Skipping webhook signature verification');
    return true;
  }

  const signature = req.headers['x-infura-signature'];
  if (!signature) {
    console.error('Missing webhook signature');
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const expectedSignature = hmac.update(payload).digest('hex');

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

module.exports = (pool) => {
  const router = express.Router();

  /**
   * POST /webhook
   * Receive webhook events from Infura about sponsorship transactions
   */
  router.post('/webhook', async (req, res) => {
    try {
      // Verify webhook signature
      if (!verifyWebhookSignature(req)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      const eventData = req.body;
      console.log('Received webhook event:', JSON.stringify(eventData, null, 2));

      // Identify the chain the event came from (base, celo, optimism, arbitrum)
      const chain = eventData.network || eventData.chainId;
      if (!chain) {
        return res.status(400).json({ error: 'Missing chain information in webhook event' });
      }

      // Process different event types
      if (eventData.event === 'SponsorshipReceived') {
        // Single species sponsorship
        await processSingleSponsorship(
          pool,
          chain,
          eventData.args.sender,
          eventData.args.taxon_id,
          eventData.args.amount,
          eventData.args.transaction_hash || eventData.transactionHash
        );
      } else if (eventData.event === 'MassSponsorshipReceived') {
        // Multiple species sponsorship
        await processMassSponsorship(
          pool,
          chain,
          eventData.args.sender,
          eventData.args.taxon_ids,
          eventData.args.totalAmount,
          eventData.args.transaction_hash || eventData.transactionHash
        );
      } else {
        console.warn(`Unknown event type: ${eventData.event}`);
        return res.status(400).json({ error: 'Unsupported event type' });
      }

      // Acknowledge receipt of webhook
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Error processing webhook', details: error.message });
    }
  });

  /**
   * GET /sponsorships/transaction/:transaction_hash
   * Get details of a sponsorship by transaction hash
   */
  router.get('/transaction/:transaction_hash', async (req, res) => {
    try {
      const { transaction_hash } = req.params;

      // Query the sponsorship status
      const query = `
        SELECT * FROM get_sponsorship_status($1)
      `;
      const result = await pool.query(query, [transaction_hash]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sponsorship not found' });
      }

      // Get the species funded in this sponsorship
      const speciesQuery = `
        SELECT si.*, s.common_name, s.species_scientific_name
        FROM sponsorship_items si
        JOIN sponsorships sp ON si.sponsorship_id = sp.id
        JOIN species s ON si.taxon_id = s.taxon_id
        WHERE sp.transaction_hash = $1
      `;
      const speciesResult = await pool.query(speciesQuery, [transaction_hash]);

      // Combine data for response
      const sponsorship = result.rows[0];
      sponsorship.species = speciesResult.rows;

      res.json(sponsorship);
    } catch (error) {
      console.error(`Error fetching sponsorship for transaction "${req.params.transaction_hash}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /sponsorships/user/:wallet_address
   * Get all sponsorships by a user
   */
  router.get('/user/:wallet_address', async (req, res) => {
    try {
      const { wallet_address } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Query sponsorships for this wallet address
      const query = `
        SELECT * FROM sponsorship_summary
        WHERE wallet_address = $1
        ORDER BY payment_timestamp DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [wallet_address, limit, offset]);

      res.json(result.rows);
    } catch (error) {
      console.error(`Error fetching sponsorships for wallet "${req.params.wallet_address}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /sponsorships/species/:taxon_id
   * Get all sponsorships for a species
   */
  router.get('/species/:taxon_id', async (req, res) => {
    try {
      const { taxon_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if species exists
      const speciesQuery = `
        SELECT taxon_id FROM species WHERE taxon_id = $1
      `;
      const speciesResult = await pool.query(speciesQuery, [taxon_id]);
      if (speciesResult.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }

      // Query sponsorships for this species
      const query = `
        SELECT 
          s.id, s.wallet_address, s.transaction_hash, s.chain, 
          s.total_amount, s.payment_timestamp, s.status,
          si.research_status, si.nft_token_id, si.ipfs_cid
        FROM sponsorship_items si
        JOIN sponsorships s ON si.sponsorship_id = s.id
        WHERE si.taxon_id = $1
        ORDER BY s.payment_timestamp DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [taxon_id, limit, offset]);

      res.json(result.rows);
    } catch (error) {
      console.error(`Error fetching sponsorships for species "${req.params.taxon_id}":`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Process a single species sponsorship
   */
  async function processSingleSponsorship(pool, chain, sender, taxon_id, amount, transaction_hash) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify the amount is correct (3 USDC per species)
      const amountInUSDC = Number(ethers.formatUnits(amount, 6)); // USDC has 6 decimals
      if (amountInUSDC !== SPONSORSHIP_AMOUNT) {
        throw new Error(`Invalid amount: expected ${SPONSORSHIP_AMOUNT} USDC, got ${amountInUSDC} USDC`);
      }

      // Check if this transaction has already been processed
      const existingCheck = `
        SELECT id FROM sponsorships WHERE transaction_hash = $1
      `;
      const existingResult = await client.query(existingCheck, [transaction_hash]);
      if (existingResult.rows.length > 0) {
        console.log(`Transaction ${transaction_hash} already processed, skipping`);
        await client.query('COMMIT');
        return;
      }

      // Validate taxon_id exists in species table
      const speciesQuery = `
        SELECT taxon_id, species_scientific_name, common_name FROM species WHERE taxon_id = $1
      `;
      const speciesResult = await client.query(speciesQuery, [taxon_id]);
      if (speciesResult.rows.length === 0) {
        throw new Error(`Species with taxon_id ${taxon_id} not found`);
      }
      
      const speciesData = speciesResult.rows[0];

      // Insert sponsorship record
      const sponsorshipInsert = `
        INSERT INTO sponsorships (
          wallet_address, chain, transaction_hash, total_amount, status, payment_timestamp
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const sponsorshipResult = await client.query(sponsorshipInsert, [
        sender,
        chain,
        transaction_hash,
        SPONSORSHIP_AMOUNT,
        'confirmed' // Payment has been confirmed on-chain
      ]);
      
      const sponsorshipId = sponsorshipResult.rows[0].id;

      // Insert sponsorship item record
      const itemInsert = `
        INSERT INTO sponsorship_items (
          sponsorship_id, taxon_id, amount, research_status
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      await client.query(itemInsert, [
        sponsorshipId,
        taxon_id,
        SPONSORSHIP_AMOUNT,
        'pending' // Research not started yet
      ]);

      await client.query('COMMIT');

      // Trigger research process in the background
      triggerResearch(
        pool,
        taxon_id,
        sender,
        chain,
        transaction_hash,
        speciesData.species_scientific_name,
        speciesData.common_name
      ).catch(error => {
        console.error(`Background research error for taxon_id ${taxon_id}:`, error);
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing single sponsorship:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a multi-species sponsorship
   */
  async function processMassSponsorship(pool, chain, sender, taxon_ids, totalAmount, transaction_hash) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify the total amount is correct (3 USDC per species)
      const totalAmountInUSDC = Number(ethers.formatUnits(totalAmount, 6)); // USDC has 6 decimals
      const expectedAmount = SPONSORSHIP_AMOUNT * taxon_ids.length;
      if (totalAmountInUSDC !== expectedAmount) {
        throw new Error(`Invalid amount: expected ${expectedAmount} USDC, got ${totalAmountInUSDC} USDC`);
      }

      // Check if this transaction has already been processed
      const existingCheck = `
        SELECT id FROM sponsorships WHERE transaction_hash = $1
      `;
      const existingResult = await client.query(existingCheck, [transaction_hash]);
      if (existingResult.rows.length > 0) {
        console.log(`Transaction ${transaction_hash} already processed, skipping`);
        await client.query('COMMIT');
        return;
      }

      // Insert sponsorship record
      const sponsorshipInsert = `
        INSERT INTO sponsorships (
          wallet_address, chain, transaction_hash, total_amount, status, payment_timestamp
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const sponsorshipResult = await client.query(sponsorshipInsert, [
        sender,
        chain,
        transaction_hash,
        totalAmountInUSDC,
        'confirmed' // Payment has been confirmed on-chain
      ]);
      
      const sponsorshipId = sponsorshipResult.rows[0].id;

      // Fetch all species data at once for efficiency
      const speciesQuery = `
        SELECT taxon_id, species_scientific_name, common_name FROM species WHERE taxon_id = ANY($1)
      `;
      const speciesResult = await client.query(speciesQuery, [taxon_ids]);
      
      // Create a map for quick lookups
      const speciesMap = {};
      for (const species of speciesResult.rows) {
        speciesMap[species.taxon_id] = species;
      }

      // Insert sponsorship items for each taxon_id
      for (const taxon_id of taxon_ids) {
        // Skip if species not found
        if (!speciesMap[taxon_id]) {
          console.warn(`Species with taxon_id ${taxon_id} not found, skipping`);
          continue;
        }

        const itemInsert = `
          INSERT INTO sponsorship_items (
            sponsorship_id, taxon_id, amount, research_status
          ) VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        await client.query(itemInsert, [
          sponsorshipId,
          taxon_id,
          SPONSORSHIP_AMOUNT,
          'pending' // Research not started yet
        ]);
      }

      await client.query('COMMIT');

      // Trigger research process for each species in the background
      for (const taxon_id of taxon_ids) {
        if (speciesMap[taxon_id]) {
          triggerResearch(
            pool,
            taxon_id,
            sender,
            chain,
            transaction_hash,
            speciesMap[taxon_id].species_scientific_name,
            speciesMap[taxon_id].common_name
          ).catch(error => {
            console.error(`Background research error for taxon_id ${taxon_id}:`, error);
          });
        }
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing mass sponsorship:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Trigger the research process for a sponsored species
   */
  async function triggerResearch(pool, taxon_id, wallet_address, chain, transaction_hash, scientific_name, common_name) {
    try {
      console.log(`Triggering research for ${taxon_id}`);
      
      // Update sponsorship item status to 'researching'
      const updateQuery = `
        UPDATE sponsorship_items si
        SET research_status = 'researching'
        FROM sponsorships s
        WHERE si.sponsorship_id = s.id
        AND s.transaction_hash = $1
        AND si.taxon_id = $2
      `;
      await pool.query(updateQuery, [transaction_hash, taxon_id]);

      // Call the existing fund-research endpoint logic
      // This is a direct call to avoid HTTP overhead
      const researchController = require('./research')(pool);
      
      // Prepare the request body
      const requestBody = {
        taxon_id,
        wallet_address,
        chain,
        transaction_hash,
        scientific_name
      };

      // Create a mock response object to capture the result
      const mockResponse = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };

      // Call the fund-research handler directly
      await researchController.fundResearch(
        { body: requestBody },
        mockResponse
      );

      // Check if research was successful
      if (mockResponse.statusCode !== 201) {
        throw new Error(`Research failed with status ${mockResponse.statusCode}: ${JSON.stringify(mockResponse.data)}`);
      }

      // Update sponsorship item with research results
      const completeQuery = `
        UPDATE sponsorship_items si
        SET 
          research_status = 'completed',
          nft_token_id = $3,
          ipfs_cid = $4
        FROM sponsorships s
        WHERE si.sponsorship_id = s.id
        AND s.transaction_hash = $1
        AND si.taxon_id = $2
      `;
      await pool.query(completeQuery, [
        transaction_hash,
        taxon_id,
        mockResponse.data.nft_details?.global_id || null,
        mockResponse.data.ipfs_cid || null
      ]);

      console.log(`Research completed for ${taxon_id}`);
      return mockResponse.data;
    } catch (error) {
      console.error(`Error triggering research for ${taxon_id}:`, error);
      
      // Update status to 'failed'
      const failureQuery = `
        UPDATE sponsorship_items si
        SET research_status = 'failed'
        FROM sponsorships s
        WHERE si.sponsorship_id = s.id
        AND s.transaction_hash = $1
        AND si.taxon_id = $2
      `;
      await pool.query(failureQuery, [transaction_hash, taxon_id]);
      
      throw error;
    }
  }

  return router;
};