const axios = require('axios');

const urls = [
  { name: 'Celo Mainnet', url: 'https://celo-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198' },
  { name: 'Arbitrum Mainnet', url: 'https://arbitrum-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198' },
  { name: 'Base Mainnet', url: 'https://base-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198' },
  { name: 'Optimism Mainnet', url: 'https://optimism-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198' }
];

async function testRpcUrl(name, url) {
  const data = {
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  };

  try {
    const response = await axios.post(url, data);
    if (response.data && response.data.result) {
      console.log(`✅ ${name}: Valid (Block number: ${parseInt(response.data.result, 16)})`);
      return true;
    } else {
      console.log(`❌ ${name}: Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing Infura RPC URLs...\n');

  // Test all URLs
  for (const { name, url } of urls) {
    await testRpcUrl(name, url);
  }

  // Suggest correct URLs if needed
  console.log('\nSuggested correct URLs:');
  console.log('- Celo: https://forno.celo.org');
  console.log('- Arbitrum: https://arb1.arbitrum.io/rpc');
  console.log('- Base: https://mainnet.base.org');
  console.log('- Optimism: https://mainnet.optimism.io');
}

main().catch(console.error);