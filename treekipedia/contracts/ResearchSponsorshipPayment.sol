// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ResearchSponsorshipPayment
 * @dev Contract for sponsoring tree species research by paying USDC
 * Each chain (Base, Celo, Optimism, Arbitrum) will have its own deployed instance
 * with the appropriate USDC address for that chain
 */
contract ResearchSponsorshipPayment is Ownable, ReentrancyGuard {
    // Fixed amount to sponsor a single species (3 USDC with 6 decimals)
    uint256 public constant SPONSORSHIP_AMOUNT = 3 * 10**6;
    
    // USDC token contract address (different on each chain)
    address public immutable usdcToken;
    
    // Events
    event SponsorshipReceived(
        address indexed sender,
        string taxon_id,
        uint256 amount,
        string transaction_hash
    );
    
    event MassSponsorshipReceived(
        address indexed sender,
        string[] taxon_ids,
        uint256 totalAmount,
        string transaction_hash
    );
    
    event FundsWithdrawn(address to, uint256 amount);

    /**
     * @dev Constructor sets the USDC token address, which varies by chain
     * @param _usdcToken The USDC token address on the deployed chain
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        usdcToken = _usdcToken;
    }
    
    /**
     * @dev Sponsor research for a single species by paying 3 USDC
     * @param taxon_id The unique identifier of the tree species to sponsor
     */
    function sponsorSpecies(string calldata taxon_id) external nonReentrant {
        require(bytes(taxon_id).length > 0, "Empty taxon_id provided");
        
        // Transfer USDC from user to contract
        bool success = IERC20(usdcToken).transferFrom(
            msg.sender,
            address(this),
            SPONSORSHIP_AMOUNT
        );
        require(success, "USDC transfer failed");
        
        // Create a transaction hash string from the real tx hash
        string memory txHash = _bytes32ToString(blockhash(block.number - 1));
        
        // Emit event with transaction details
        emit SponsorshipReceived(
            msg.sender,
            taxon_id,
            SPONSORSHIP_AMOUNT,
            txHash
        );
    }
    
    /**
     * @dev Sponsor research for multiple species at once
     * @param taxon_ids Array of unique identifiers for the tree species to sponsor
     */
    function sponsorMultipleSpecies(string[] calldata taxon_ids) external nonReentrant {
        require(taxon_ids.length > 0, "Empty taxon_ids provided");
        require(taxon_ids.length <= 100, "Too many species at once");
        
        // Calculate total amount (3 USDC per species)
        uint256 totalAmount = SPONSORSHIP_AMOUNT * taxon_ids.length;
        
        // Transfer total USDC amount from user to contract
        bool success = IERC20(usdcToken).transferFrom(
            msg.sender,
            address(this),
            totalAmount
        );
        require(success, "USDC transfer failed");
        
        // Create a transaction hash string from the real tx hash
        string memory txHash = _bytes32ToString(blockhash(block.number - 1));
        
        // Emit event with all taxon_ids
        emit MassSponsorshipReceived(
            msg.sender,
            taxon_ids,
            totalAmount,
            txHash
        );
    }
    
    /**
     * @dev Convert bytes32 to string for transaction hash representation
     * @param _bytes32 The bytes32 value to convert
     * @return result String representation of the bytes32 value
     */
    function _bytes32ToString(bytes32 _bytes32) private pure returns (string memory) {
        bytes memory bytesArray = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            bytesArray[i*2] = _nibbleToChar(uint8(_bytes32[i] >> 4));
            bytesArray[i*2+1] = _nibbleToChar(uint8(_bytes32[i] & 0x0F));
        }
        return string(abi.encodePacked("0x", bytesArray));
    }
    
    /**
     * @dev Convert a nibble to its hex character representation
     */
    function _nibbleToChar(uint8 _nibble) private pure returns (bytes1) {
        if (_nibble < 10) {
            return bytes1(uint8(bytes1('0')) + _nibble);
        } else {
            return bytes1(uint8(bytes1('a')) + (_nibble - 10));
        }
    }
    
    /**
     * @dev Withdraw USDC from the contract (only owner)
     * @param to Address to send USDC to
     * @param amount Amount of USDC to withdraw
     */
    function withdrawFunds(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount > 0, "Withdrawal amount must be greater than 0");
        
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));
        require(balance >= amount, "Insufficient contract balance");
        
        bool success = IERC20(usdcToken).transfer(to, amount);
        require(success, "USDC transfer failed");
        
        emit FundsWithdrawn(to, amount);
    }
    
    /**
     * @dev Check contract's USDC balance
     * @return Contract's USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
}