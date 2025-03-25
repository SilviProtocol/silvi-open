const { ethers } = require('ethers');

// Generate a random wallet
const wallet = ethers.Wallet.createRandom();

// Output the private key and address
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
console.log('Mnemonic Phrase:', wallet.mnemonic.phrase);