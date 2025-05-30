// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ContreebutionNFT
 * @dev Implementation tailored for Treekipedia, using global_id from database as token ID
 */
contract ContreebutionNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    
    // Track the highest minted token ID for validation
    uint256 private _highestTokenId;
    
    // Event emitted when a token is minted with global_id
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor(address initialOwner)
        ERC721("Research Contreebution", "treekipediaRSRCH")
        Ownable(initialOwner)
    {}
    
    /**
     * @dev Mints a new NFT with the global_id from database as token ID
     * @param to The address that will own the minted token
     * @param tokenId The token ID to mint (from global_id sequence)
     * @param uri The token URI for metadata
     */
    function safeMint(address to, uint256 tokenId, string memory uri)
        public
        onlyOwner
    {
        // Validate token ID to prevent accidental duplicates
        require(tokenId > 0, "ContreebutionNFT: Token ID must be positive");
        
        // If this token ID already exists, revert
        require(!_exists(tokenId), "ContreebutionNFT: Token ID already exists");
        
        // Mint the token
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Update highest token ID if needed
        if (tokenId > _highestTokenId) {
            _highestTokenId = tokenId;
        }
        
        // Emit event for easier tracking
        emit TokenMinted(to, tokenId, uri);
    }
    
    /**
     * @dev Returns the highest token ID that has been minted so far
     * This can be useful for the backend to check the latest state
     */
    function getHighestTokenId() public view returns (uint256) {
        return _highestTokenId;
    }
    
    /**
     * @dev Burns a token
     */
    function burn(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ContreebutionNFT: caller is not owner nor approved"
        );
        
        // Delete the token URI before burning
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
        
        _burn(tokenId);
    }
    
    /**
     * @dev Sets the URI for a token
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ContreebutionNFT: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    /**
     * @dev Returns if the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Checks if the spender is approved or owner
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    // Override functions required by ERC721Enumerable
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via string.concat).
        if (bytes(_tokenURI).length > 0) {
            return string.concat(base, _tokenURI);
        }

        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}