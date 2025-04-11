require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const app = express();
const port = 3000;
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Load environment variables
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;


// 🛑 Ensure you have the private key
if (!PRIVATE_KEY) {
    console.error("❌ ERROR: Metamask Private Key is missing in .env");
    process.exit(1);
}

// ✅ Use Sepolia Testnet Provider
const provider = new ethers.JsonRpcProvider(RPC_URL); // Use Sepolia RPC URL from .env

// ✅ Setup wallet using the private key
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ✅ Load contract ABI
const contractABI = require('./contractABI.json');
const rewardToken = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const nftContractABI = require('./nftContractABI.json');
const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, nftContractABI, wallet);

// Middleware to parse JSON
app.use(express.json());

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

// Handle root URL (default)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ **Check user balance**
app.get('/balance/:address', async (req, res) => {
    const userAddress = req.params.address;
    
    try {
        // Get the balance from the contract
        const balance = await rewardToken.balanceOf(userAddress);
        res.json({ success: true, balance: balance.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Reward user with tokens**
app.post('/reward', async (req, res) => {
    const { userAddress, amount } = req.body;
    console.log(`Received reward request: User: ${userAddress}, Amount: ${amount}`);  // Debugging

    try {
        // Send the reward transaction (transfer tokens)
        const tx = await rewardToken.rewardUser(userAddress, amount);
        await tx.wait();  // Wait for the transaction to be mined

        console.log(`Transaction successful: ${tx.hash}`);  // Log transaction hash
        // Respond back with success
        res.json({ success: true, message: `Rewarded ${amount} tokens to ${userAddress}` });
    } catch (err) {
        console.error('Error in reward transaction:', err);  // Log error
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Redeem user tokens (burn)**
app.post('/redeem', async (req, res) => {
    const { amount } = req.body;

    try {
        // Redeem (burn) tokens
        const tx = await rewardToken.redeemTokens(amount);
        await tx.wait();  // Wait for the transaction to be mined

        res.json({ success: true, message: `Successfully redeemed ${amount} tokens` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Transfer tokens**
app.post('/transfer', async (req, res) => {
    const { toAddress, amount } = req.body;

    try {
        // Send tokens to another address
        const tx = await rewardToken.transfer(toAddress, amount);
        await tx.wait();  // Wait for the transaction to be mined

        res.json({ success: true, message: `Transferred ${amount} tokens to ${toAddress}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Get the total supply of tokens**
app.get('/totalSupply', async (req, res) => {
    try {
        // Get the total supply of tokens
        const totalSupply = await rewardToken.totalSupply();
        res.json({ success: true, totalSupply: totalSupply.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NFT Endpoints
app.post('/mint-nft', async (req, res) => {
    const { userAddress } = req.body;
  
    try {
      // List of CIDs pointing to metadata JSON files on IPFS via Pinata
      const metadataCIDs = [
        'bafkreid4et3sumfh6kau6mtsd7tgu7r7dqkccpedcz2kicprqvjl54xupq',
        'bafkreiflec4uoau7cva4syz3omgwfnvlrqb4opvctdhblwik2jtez5jxsu',
        'bafkreidlrznoqqndrlxrzxxkxszjkwlbpcoa3twkuy6cnxynm67eg5qaie',
        'bafkreighopkm5ukbesip3n6d5phynnx5lz5bb4wrdvjr6s4yogwjkap5ye',
        'bafkreieuqu7xfghoazmnyxd4le7qfkpml3fuduppqxqrllqfzqdhxfyjyy'
      ];
  
      // Pick one CID randomly
      const selectedCID = metadataCIDs[Math.floor(Math.random() * metadataCIDs.length)];
  
      // Construct tokenURI pointing to metadata JSON
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${selectedCID}`;
  
      // Call smart contract mint function
      const tx = await nftContract.mint(userAddress, tokenURI);
      await tx.wait();
  
      res.json({
        success: true,
        message: `NFT minted for ${userAddress}`,
        transactionHash: tx.hash,
        metadataURI: tokenURI
      });
    } catch (err) {
      console.error("Error minting NFT:", err);
      res.status(500).json({ error: err.message });
    }
  });

// Get User's NFTs Endpoint
app.get('/nfts/:address', async (req, res) => {
    const userAddress = req.params.address;

    try {
        const balance = await nftContract.balanceOf(userAddress);
        const tokenIds = [];

        for (let i = 0; i < balance; i++) {
            const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
            tokenIds.push(tokenId.toString());
        }

        res.json({ 
            success: true, 
            balance: balance.toString(),
            tokenIds
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Metadata of a Specific NFT
app.get('/nft-metadata/:tokenId', async (req, res) => {
    const tokenId = req.params.tokenId;

    try {
        // Since we are using a placeholder, the tokenURI will be the same for all NFTs
        const tokenURI = "https://example.com/empty-metadata";  // Placeholder URI
        res.json({ 
            success: true, 
            tokenURI
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// ✅ **Start the server**
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running at http://0.0.0.0:${port}`);
});
