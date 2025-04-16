const axios = require('axios');

async function testFundResearch() {
  try {
    console.log('Testing /research/fund-research endpoint...');
    const response = await axios.post('http://localhost:3000/research/fund-research', {
      taxon_id: 'AngMaFaFb48996-00',
      wallet_address: '0x6B1f82a1d7E24A47c11655E19243F9368C893A18',
      chain: 'celo',
      transaction_hash: '0x' + '1'.repeat(64), // Dummy transaction hash
      ipfs_cid: 'QmTestCID123',
      scientific_name: 'Malpighia faginea'
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFundResearch();
