const express = require('express');
const speciesController = require('../controllers/species');
const treederboardController = require('../controllers/treederboard');
const researchController = require('../controllers/research');
const sponsorshipController = require('../controllers/sponsorship');

module.exports = (pool) => {
  const router = express.Router();
  
  // Set up species routes (/species)
  router.use('/species', speciesController(pool));
  
  // Set up treederboard routes (/treederboard)
  router.use('/treederboard', treederboardController(pool));
  
  // Set up research routes (/research)
  router.use('/research', researchController(pool));
  
  // Set up sponsorship routes (/sponsorships)
  router.use('/sponsorships', sponsorshipController(pool));
  
  // Default route
  router.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Treekipedia API',
      version: '1.0.0',
      endpoints: [
        '/species - Species search and details',
        '/treederboard - User contributions leaderboard',
        '/research - AI research and NFT minting',
        '/sponsorships - Sponsorship payment tracking and webhooks'
      ]
    });
  });
  
  return router;
};