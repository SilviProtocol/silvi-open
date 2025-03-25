const express = require('express');
const speciesController = require('../controllers/species');
const treederboardController = require('../controllers/treederboard');
const researchController = require('../controllers/research');

module.exports = (pool) => {
  const router = express.Router();
  
  // Set up species routes (/species)
  router.use('/species', speciesController(pool));
  
  // Set up treederboard routes (/treederboard)
  router.use('/treederboard', treederboardController(pool));
  
  // Set up research routes (/research)
  router.use('/research', researchController(pool));
  
  // Default route
  router.get('/', (req, res) => {
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
  
  return router;
};