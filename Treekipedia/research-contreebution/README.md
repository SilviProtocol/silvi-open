# Treekipedia Research Contreebution NFT

A Solidity smart contract for minting and managing NFTs that represent research contributions on Treekipedia. Built on the ERC721 standard.

<img src="https://gpbr.infura-ipfs.io/ipfs/bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e" alt="Alt text" width="500px" height="auto">

## Deployed Contracts

### Research Contreebution v3
**CELO Mainnet:** 0x4FafD4af06622545E4BD9bf38B479Ead9dEc2C50 [see the deployed contract on blockscout](https://celo.blockscout.com/tx/0x080059254da38670e725e1eae39985cdeea331be8bbc19b3398a7f53a622597a)

**Arbitrum Mainnet:** 0x96E8B3A2908Fe626E163c3408D599938986A37af [see the deployed contract on blockscout](https://arbitrum.blockscout.com/address/0x96E8B3A2908Fe626E163c3408D599938986A37af?tab=contract)

**Optimism Minnet:** 0x98644a33b239A181389583a4AabD11c57E5585aF [see the deployed contract on blockscout](https://optimism.blockscout.com/tx/0x0875d2bffdbdb174484d75306e396c4436a672a08d23b3cbfb5191ba78306383)

**Base Mainnet:** 0x93A51eE764612F84CB6bA154Cffc6F3014e68e51 [see the deployed contract on blockscout](https://base.blockscout.com/tx/0x0aa0473895f008aed45e419fa30dc96b116423da2b21494709c08a8d0342cb82)


## Overview
ResearchContreebution is an ERC721-compliant NFT (Non-Fungible Token) smart contract designed to tokenize research contributions. The contract allows authorized users to mint unique tokens that represent research contributions, each with its own metadata stored as a URI.

## Inheritance
The contract inherits from several OpenZeppelin contracts:
- `ERC721`: The base implementation of the ERC721 standard
- `ERC721URIStorage`: Extension for storing token metadata
- `ERC721Burnable`: Extension allowing token owners to burn their tokens
- `Ownable`: Access control mechanism that provides owner-specific privileges

## License
MIT License

## Contract Details

### Name and Symbol
- **Name**: Research Contreebution
- **Symbol**: treekipediaRSRCH

### Roles
- **Owner**: The address that deployed the contract, with administrative privileges
- **Manager**: A secondary role that can also mint tokens

### State Variables
| Variable | Type | Description |
|----------|------|-------------|
| MANAGER | address | The address authorized to mint tokens alongside the owner |

### Events
| Event | Parameters | Description |
|-------|------------|-------------|
| TokenMinted | address indexed to, uint256 indexed tokenId, string uri | Emitted when a token is minted |

### Constructor
```solidity
constructor(address initialOwner)
    ERC721("Research Contreebution", "treekipediaRSRCH")
    Ownable(initialOwner)
{}
```
Initializes the contract with the specified initial owner address.

### Functions

#### safeMint
```solidity
function safeMint(address to, uint256 tokenId, string memory uri) public
```
Mints a new token with the specified ID and metadata URI to the provided address.

**Parameters:**
- `to`: The address that will own the minted token
- `tokenId`: The unique ID for the new token
- `uri`: The metadata URI for the token

**Requirements:**
- The caller must be either the owner or the manager

**Effects:**
- Mints a new token to the specified address
- Sets the token's URI
- Emits a `TokenMinted` event

#### setManager
```solidity
function setManager(address newManager) public onlyOwner
```
Updates the manager address.

**Parameters:**
- `newManager`: The address to set as the new manager

**Requirements:**
- The caller must be the contract owner
- The new manager address cannot be the zero address

**Effects:**
- Updates the MANAGER state variable

#### tokenURI (Override)
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory)
```
Returns the metadata URI for a given token ID.

**Parameters:**
- `tokenId`: The ID of the token to query

**Returns:**
- The metadata URI string

#### supportsInterface (Override)
```solidity
function supportsInterface(bytes4 interfaceId) public view override returns (bool)
```
Determines if the contract implements a specific interface.

**Parameters:**
- `interfaceId`: The interface identifier to check

**Returns:**
- Boolean indicating whether the interface is supported

## Security Considerations
- Only the owner can set a new manager address
- Minting is restricted to the owner and the manager
- The contract inherits OpenZeppelin's battle-tested implementations
- Zero-address validation is implemented for the manager role

## Usage Scenarios
1. **Research Publication**: Mint tokens to represent published research papers
2. **Research Certification**: Use tokens as proof of contribution to research projects
3. **Research Attribution**: Tokenize and track research contributions

## Integration Guide
1. Deploy the contract with the desired owner address
2. Set a manager address if needed
3. Start minting tokens to research contributors

## Extended Functionality
The contract can be extended with additional features:
- Automated royalty distribution
- Time-locked transfers
- Metadata standards for research contributions
- Integration with academic reputation systems

## Related Resources
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/contracts/)
