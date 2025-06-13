const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("ContreebutionNFT", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployNFTFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, recipient] = await ethers.getSigners();

    const ContreebutionNFT = await ethers.getContractFactory("ContreebutionNFT");
    const nft = await ContreebutionNFT.deploy(owner.address);

    return { nft, owner, otherAccount, recipient };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nft, owner } = await loadFixture(deployNFTFixture);
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.name()).to.equal("Research Contreebution");
      expect(await nft.symbol()).to.equal("treekipediaRSRCH");
    });
  });

  describe("Minting", function () {
    it("Should mint NFTs with specified token IDs", async function () {
      const { nft, owner, recipient } = await loadFixture(deployNFTFixture);
      
      // Mint NFT with global_id from database
      const globalId1 = 123;
      const uri1 = "ipfs://Qmxyz123";
      await nft.safeMint(recipient.address, globalId1, uri1);
      
      // Mint another NFT with a different global_id
      const globalId2 = 456;
      const uri2 = "ipfs://Qmabc456";
      await nft.safeMint(recipient.address, globalId2, uri2);
      
      // Check token ownership
      expect(await nft.balanceOf(recipient.address)).to.equal(2);
      expect(await nft.ownerOf(globalId1)).to.equal(recipient.address);
      expect(await nft.ownerOf(globalId2)).to.equal(recipient.address);
      
      // Check token URIs
      expect(await nft.tokenURI(globalId1)).to.equal(uri1);
      expect(await nft.tokenURI(globalId2)).to.equal(uri2);
      
      // Verify TokenMinted event was emitted
      await expect(nft.safeMint(recipient.address, 789, "ipfs://Qm789"))
        .to.emit(nft, "TokenMinted")
        .withArgs(recipient.address, 789, "ipfs://Qm789");
    });

    it("Should support non-sequential token IDs", async function () {
      const { nft, owner, recipient } = await loadFixture(deployNFTFixture);
      
      // Mint tokens with non-sequential IDs (simulating database global_ids)
      await nft.safeMint(recipient.address, 1000, "ipfs://Qm1000");
      await nft.safeMint(recipient.address, 500, "ipfs://Qm500");
      await nft.safeMint(recipient.address, 2000, "ipfs://Qm2000");
      
      // Check token ownership
      expect(await nft.balanceOf(recipient.address)).to.equal(3);
      expect(await nft.ownerOf(1000)).to.equal(recipient.address);
      expect(await nft.ownerOf(500)).to.equal(recipient.address);
      expect(await nft.ownerOf(2000)).to.equal(recipient.address);
      
      // Check totalSupply from ERC721Enumerable
      expect(await nft.totalSupply()).to.equal(3);
    });

    it("Should track and return highest token ID", async function () {
      const { nft, recipient } = await loadFixture(deployNFTFixture);
      
      // No tokens minted yet
      expect(await nft.getHighestTokenId()).to.equal(0);
      
      // Mint with ID 50
      await nft.safeMint(recipient.address, 50, "ipfs://Qm50");
      expect(await nft.getHighestTokenId()).to.equal(50);
      
      // Mint with lower ID - highest should remain
      await nft.safeMint(recipient.address, 25, "ipfs://Qm25");
      expect(await nft.getHighestTokenId()).to.equal(50);
      
      // Mint with higher ID - highest should update
      await nft.safeMint(recipient.address, 100, "ipfs://Qm100");
      expect(await nft.getHighestTokenId()).to.equal(100);
    });
    
    it("Should prevent minting with duplicate token IDs", async function () {
      const { nft, recipient } = await loadFixture(deployNFTFixture);
      
      // Mint first token
      await nft.safeMint(recipient.address, 42, "ipfs://Qm42");
      
      // Attempt to mint with the same ID
      await expect(
        nft.safeMint(recipient.address, 42, "ipfs://Qm42-duplicate")
      ).to.be.revertedWith("ContreebutionNFT: Token ID already exists");
    });
    
    it("Should validate token ID is positive", async function () {
      const { nft, recipient } = await loadFixture(deployNFTFixture);
      
      // Attempt to mint with zero token ID
      await expect(
        nft.safeMint(recipient.address, 0, "ipfs://Qm0")
      ).to.be.revertedWith("ContreebutionNFT: Token ID must be positive");
    });

    it("Should only allow owner to mint NFTs", async function () {
      const { nft, otherAccount, recipient } = await loadFixture(deployNFTFixture);
      
      // Try to mint from non-owner account
      await expect(
        nft.connect(otherAccount).safeMint(recipient.address, 789, "ipfs://Qm789")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Enumeration", function () {
    it("Should properly implement ERC721Enumerable", async function () {
      const { nft, recipient } = await loadFixture(deployNFTFixture);
      
      // Mint several tokens
      await nft.safeMint(recipient.address, 101, "ipfs://Qm101");
      await nft.safeMint(recipient.address, 102, "ipfs://Qm102");
      await nft.safeMint(recipient.address, 103, "ipfs://Qm103");
      
      // Check tokenByIndex
      expect(await nft.tokenByIndex(0)).to.equal(101);
      expect(await nft.tokenByIndex(1)).to.equal(102);
      expect(await nft.tokenByIndex(2)).to.equal(103);
      
      // Check tokenOfOwnerByIndex
      expect(await nft.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(101);
      expect(await nft.tokenOfOwnerByIndex(recipient.address, 1)).to.equal(102);
      expect(await nft.tokenOfOwnerByIndex(recipient.address, 2)).to.equal(103);
    });
  });
});