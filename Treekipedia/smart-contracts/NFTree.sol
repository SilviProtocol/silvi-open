// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol"; // Import Base64 library

contract NFTree is ERC1155, Ownable, ERC1155Burnable {
    using Strings for uint256;

    // Fixed image URL for all NFTs
    string private constant _baseImageURI =
        "ipfs.io/ipfs/bafkreialkdkavmvykebueokxjtzsu3djas6y5lpxrrecw2n3k67xqcu4sm";

    // Mapping from token ID to its IPFS CID (current CID) - Now used for metadata, but kept for history
    mapping(uint256 => string) private _tokenCIDs;

    // Mapping from token ID to an array of historical IPFS CIDs
    mapping(uint256 => string[]) private _tokenCIDHistory;

    constructor(address initialOwner) ERC1155("TreeNFT") Ownable(initialOwner) {
        // Set the base URI to ensure metadata consistency. Important for marketplaces.
        _setURI("ipfs://your_base_uri/"); // Replace with your desired base URI (e.g., for JSON files)
    }

    /**
     * @dev Sets the base URI for all tokens. Consider if you REALLY need this, given the fixed image.
     * It's primarily for the JSON metadata file if you use one.
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Mints `amount` tokens of type `id` to `account` and associates it with an IPFS CID (stored for history).
     * The metadata (including image) is now standardized.
     */
    function mint(
        address account,
        uint256 id,
        uint256 amount,
        string memory ipfsCID
    ) public onlyOwner {
        // Mint the tokens
        _mint(account, id, amount, "");
        // Store the IPFS CID for the token ID (for history)
        _tokenCIDs[id] = ipfsCID; // Keep this if you want to track *why* a token was minted.
        // Add the CID to the history
        _tokenCIDHistory[id].push(ipfsCID);
    }

    /**
     * @dev Batch mints multiple token types to `to`, each with their own IPFS CID (stored for history).
     * The metadata (including image) is now standardized.
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        string[] memory ipfsCIDs
    ) public onlyOwner {
        require(
            ids.length == ipfsCIDs.length,
            "TreeNFT: ids and ipfsCIDs length mismatch"
        );
        // Mint the tokens in batch
        _mintBatch(to, ids, amounts, "");
        // Update the IPFS CIDs for each token ID (for history)
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            string memory ipfsCID = ipfsCIDs[i];
            // Store the IPFS CID for the token ID
            _tokenCIDs[id] = ipfsCID;
            // Add the CID to the history
            _tokenCIDHistory[id].push(ipfsCID);
        }
    }

    /**
     * @dev Returns the current IPFS CID associated with a given token ID (historical reason).
     */
    function getTokenCID(uint256 id) public view returns (string memory) {
        return _tokenCIDs[id];
    }

    /**
     * @dev Returns the entire history of IPFS CIDs associated with a given token ID.
     */
    function getTokenCIDHistory(uint256 id)
        public
        view
        returns (string[] memory)
    {
        return _tokenCIDHistory[id];
    }

    
}
