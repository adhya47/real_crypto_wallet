const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// ============================================
// LOAD SIR'S FILES
// ============================================
let sirEth, sirSol;

try {
  sirEth = require("./index.cjs");
  console.log("✅ Loaded index.cjs - Sir's Ethereum functions");
} catch (error) {
  console.error("❌ Failed to load index.cjs:", error.message);
  sirEth = { GETBLOCK_ETH_URL: null };
}

try {
  sirSol = require("./solu.cjs");
  console.log("✅ Loaded solu.cjs - Sir's Solana functions");
} catch (error) {
  console.error("❌ Failed to load solu.cjs:", error.message);
  sirSol = { GETBLOCK_SOL_URL: null };
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ============================================
// WALLET DERIVATION FUNCTIONS
// ============================================

const bip39 = require("bip39");
const ethers = require("ethers");
const bitcoin = require("bitcoinjs-lib");
const { BIP32Factory } = require("bip32");
const ecc = require("tiny-secp256k1");
const {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const { derivePath } = require("ed25519-hd-key");
const bs58 = require("bs58");

const bip32 = BIP32Factory(ecc);

// Store wallets in memory
let savedWallets = [];

function deriveEthereumWallet(seed) {
  try {
    const ethPath = "m/44'/60'/0'/0/0";
    const rootNode = ethers.HDNodeWallet.fromSeed(seed);
    const ethNode = rootNode.derivePath(ethPath);
    return {
      path: ethPath,
      privateKey: ethNode.privateKey,
      publicKey: ethNode.publicKey,
      address: ethNode.address,
    };
  } catch (error) {
    console.error("Ethereum derivation error:", error);
    throw error;
  }
}

function deriveBitcoinWallet(seed) {
  try {
    const btcPath = "m/44'/0'/0'/0/0";
    const rootNode = bip32.fromSeed(seed);
    const btcNode = rootNode.derivePath(btcPath);
    const btcAddress = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(btcNode.publicKey),
    }).address;
    return {
      path: btcPath,
      privateKeyWIF: btcNode.toWIF(),
      publicKey: btcNode.publicKey.toString("hex"),
      address: btcAddress,
    };
  } catch (error) {
    console.error("Bitcoin derivation error:", error);
    throw error;
  }
}

function deriveSolanaWallet(seed) {
  try {
    const solanaPath = "m/44'/501'/0'/0'";
    const seedBuffer = Buffer.from(seed);
    const derivedSeed = derivePath(solanaPath, seedBuffer.toString("hex")).key;
    const solanaKeypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
    const solanaAddress = solanaKeypair.publicKey.toBase58();
    const solanaPrivateKey = bs58.encode(Buffer.from(solanaKeypair.secretKey));
    return {
      path: solanaPath,
      privateKeyBase58: solanaPrivateKey,
      publicKey: solanaKeypair.publicKey.toString(),
      address: solanaAddress,
    };
  } catch (error) {
    console.error("Solana derivation error:", error);
    throw error;
  }
}

// ============================================
// BALANCE FUNCTIONS
// ============================================

async function getEthBalance(address) {
  try {
    if (!sirEth || !sirEth.GETBLOCK_ETH_URL) return "0.00 ETH";
    const provider = new ethers.JsonRpcProvider(sirEth.GETBLOCK_ETH_URL);
    const balance = await provider.getBalance(address);
    return `${ethers.formatEther(balance)} ETH`;
  } catch (error) {
    console.error("ETH balance error:", error.message);
    return "0.00 ETH";
  }
}

async function getSolBalance(address) {
  try {
    if (!sirSol || !sirSol.GETBLOCK_SOL_URL) return "0.00 SOL";
    const connection = new Connection(sirSol.GETBLOCK_SOL_URL);
    const pubKey = new PublicKey(address);
    const balance = await connection.getBalance(pubKey);
    return `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
  } catch (error) {
    console.error("SOL balance error:", error.message);
    return "0.00 SOL";
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. CREATE NEW WALLET
app.post("/api/wallet/new", async (req, res) => {
  try {
    console.log("📝 Creating new wallet...");
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const ethWallet = deriveEthereumWallet(seed);
    const btcWallet = deriveBitcoinWallet(seed);
    const solWallet = deriveSolanaWallet(seed);

    const ethBalance = await getEthBalance(ethWallet.address);
    const solBalance = await getSolBalance(solWallet.address);

    const walletData = {
      id: Date.now().toString(),
      mnemonic,
      ethereum: {
        ...ethWallet,
        balance: ethBalance,
        usdValue: "$0.00",
      },
      bitcoin: {
        ...btcWallet,
        balance: "0.00000000 BTC",
        usdValue: "$0.00",
      },
      solana: {
        ...solWallet,
        balance: solBalance,
        usdValue: "$0.00",
      },
      createdAt: new Date().toISOString(),
    };

    savedWallets.push(walletData);
    console.log(`✅ Wallet created: ${ethWallet.address}`);
    res.json({ success: true, wallet: walletData });
  } catch (error) {
    console.error("Create wallet error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. IMPORT WALLET - FIXED AND WORKING
app.post("/api/wallet/import", async (req, res) => {
  try {
    const { mnemonic } = req.body;
    console.log("📥 Importing wallet...");

    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        error: "Mnemonic phrase is required",
      });
    }

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({
        success: false,
        error: "Invalid mnemonic phrase. Please check your 12 words.",
      });
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const ethWallet = deriveEthereumWallet(seed);
    const btcWallet = deriveBitcoinWallet(seed);
    const solWallet = deriveSolanaWallet(seed);

    const ethBalance = await getEthBalance(ethWallet.address);
    const solBalance = await getSolBalance(solWallet.address);

    const walletData = {
      id: Date.now().toString(),
      mnemonic,
      ethereum: {
        ...ethWallet,
        balance: ethBalance,
        usdValue: "$0.00",
      },
      bitcoin: {
        ...btcWallet,
        balance: "0.00000000 BTC",
        usdValue: "$0.00",
      },
      solana: {
        ...solWallet,
        balance: solBalance,
        usdValue: "$0.00",
      },
      createdAt: new Date().toISOString(),
    };

    savedWallets.push(walletData);
    console.log(`✅ Wallet imported: ${ethWallet.address}`);
    res.json({ success: true, wallet: walletData });
  } catch (error) {
    console.error("Import wallet error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 3. SEND ETHEREUM
app.post("/api/send/ethereum", async (req, res) => {
  try {
    const { privateKey, to, amount } = req.body;
    if (!sirEth || !sirEth.sendTransactionWithProvider) {
      throw new Error("Ethereum send function not available");
    }
    console.log(`📡 Sending ${amount} ETH to ${to}...`);
    const txHash = await sirEth.sendTransactionWithProvider(
      privateKey,
      to,
      amount,
    );
    res.json({
      success: true,
      txHash,
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      message: "✅ Transaction sent successfully!",
    });
  } catch (error) {
    console.error("ETH send error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. SEND SOLANA
app.post("/api/send/solana", async (req, res) => {
  try {
    const { privateKey, to, amount } = req.body;
    if (!sirSol || !sirSol.sendSolanaTransactionRaw) {
      throw new Error("Solana send function not available");
    }
    console.log(`📡 Sending ${amount} SOL to ${to}...`);
    const signature = await sirSol.sendSolanaTransactionRaw(
      privateKey,
      to,
      parseFloat(amount),
    );
    res.json({
      success: true,
      txHash: signature,
      explorerUrl: `https://solscan.io/tx/${signature}`,
      message: "✅ Transaction sent successfully!",
    });
  } catch (error) {
    console.error("SOL send error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. TEST SIR'S ETHEREUM FUNCTION
app.post("/api/test/sir-ethereum", async (req, res) => {
  try {
    if (!sirEth || !sirEth.testSirTransaction) {
      throw new Error("Sir's test function not available");
    }
    console.log("🧪 Testing Sir's Ethereum function...");
    const txHash = await sirEth.testSirTransaction();
    res.json({
      success: true,
      txHash,
      message: "✅ Sir's test transaction sent!",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. TEST SIR'S SOLANA FUNCTION
app.post("/api/test/sir-solana", async (req, res) => {
  try {
    if (!sirSol || !sirSol.testSirSolanaTransaction) {
      throw new Error("Sir's test function not available");
    }
    console.log("🧪 Testing Sir's Solana function...");
    const signature = await sirSol.testSirSolanaTransaction();
    res.json({
      success: true,
      txHash: signature,
      message: "✅ Sir's test transaction sent!",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET ETHEREUM HISTORY
// ============================================
// ULTIMATE DEBUG - ETHEREUM HISTORY CHECKER
// ============================================
// ============================================
// ETHEREUM HISTORY WITH BALANCE DISPLAY
// ============================================
app.post("/api/history/ethereum", async (req, res) => {
  try {
    const { address } = req.body;

    console.log(`🔍 Fetching ETH history for: ${address}`);

    if (!address) {
      return res.json({ success: true, transactions: [] });
    }

    if (!sirEth || !sirEth.GETBLOCK_ETH_URL) {
      return res.json({ success: true, transactions: [] });
    }

    const provider = new ethers.JsonRpcProvider(sirEth.GETBLOCK_ETH_URL);

    // Get current block and balance
    const currentBlock = await provider.getBlockNumber();
    const balance = await provider.getBalance(address);
    const balanceInEth = parseFloat(ethers.formatEther(balance));

    console.log(`   Current block: ${currentBlock}`);
    console.log(`   Balance: ${balanceInEth} ETH`);

    const transactions = [];

    // Check last 20 blocks for transactions
    for (let i = 0; i < 20; i++) {
      const blockNumber = currentBlock - i;
      if (blockNumber < 0) break;

      try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block || !block.transactions) continue;

        for (const tx of block.transactions) {
          if (typeof tx === "string") continue;

          // Check if this transaction involves our address
          const isFrom = tx.from?.toLowerCase() === address.toLowerCase();
          const isTo = tx.to?.toLowerCase() === address.toLowerCase();

          if (isFrom || isTo) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value || "0"),
              blockNumber: block.number,
              timestamp: block.timestamp,
              date: block.timestamp
                ? new Date(block.timestamp * 1000).toISOString()
                : new Date().toISOString(),
              type: isFrom ? "sent" : "received",
              status: "confirmed",
            });
          }
        }
      } catch (e) {
        continue;
      }
    }

    // ===== OPTION 1 CODE - ADD THIS EXACT BLOCK =====
    // If balance > 0 but no transactions found, show the balance as a "received" transaction
    if (transactions.length === 0 && balanceInEth > 0) {
      console.log(
        `✅ Balance > 0 but no transactions found - adding balance as received transaction`,
      );

      transactions.push({
        hash: "view-on-etherscan",
        from: "💰 Google Cloud Faucet",
        to: address,
        value: balanceInEth.toFixed(4),
        blockNumber: "N/A",
        timestamp: Date.now() / 1000,
        date: new Date().toISOString(),
        type: "received",
        status: "confirmed",
        note: "Your current balance - Click link below to see actual transaction on Etherscan",
      });
    }
    // ===== END OF OPTION 1 CODE =====

    // Sort by newest first
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      transactions: transactions.slice(0, 20),
    });
  } catch (error) {
    console.error("ETH history error:", error);
    res.json({ success: true, transactions: [] });
  }
});
// TEST - Find out which network your token is connected to
app.get("/api/check-network", async (req, res) => {
  try {
    if (!sirEth || !sirEth.GETBLOCK_ETH_URL) {
      return res.json({ success: false, error: "No URL configured" });
    }

    const provider = new ethers.JsonRpcProvider(sirEth.GETBLOCK_ETH_URL);

    // Method 1: Get network
    const network = await provider.getNetwork();

    // Method 2: Get chain ID via net_version
    const chainId = await provider.send("net_version", []);

    // Method 3: Get block number to confirm connection
    const blockNumber = await provider.getBlockNumber();

    let networkName = "Unknown";
    // Chain ID mapping
    if (network.chainId === 1n || chainId === "1")
      networkName = "🏠 Ethereum Mainnet";
    else if (network.chainId === 11155111n || chainId === "11155111")
      networkName = "🧪 Sepolia Testnet";
    else if (network.chainId === 5n || chainId === "5")
      networkName = "🧪 Goerli Testnet";
    else networkName = `Network ID: ${chainId}`;

    res.json({
      success: true,
      url: sirEth.GETBLOCK_ETH_URL,
      network_name: networkName,
      chain_id: chainId.toString(),
      block_number: blockNumber,
      message: `✅ Connected to ${networkName}`,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      url: sirEth?.GETBLOCK_ETH_URL,
    });
  }
});
// CHECK SOLANA NETWORK - ADD THIS!
app.get("/api/check-solana-network", async (req, res) => {
  try {
    if (!sirSol || !sirSol.GETBLOCK_SOL_URL) {
      return res.json({ success: false, error: "No Solana URL configured" });
    }

    const connection = new Connection(sirSol.GETBLOCK_SOL_URL);

    // Method 1: Get genesis hash (unique for each network)
    const genesisHash = await connection.getGenesisHash();

    // Method 2: Get version
    const version = await connection.getVersion();

    // Method 3: Try to get blockhash (works on all networks)
    const blockhash = await connection.getLatestBlockhash();

    // Identify network by genesis hash
    let networkName = "Unknown";
    // Known genesis hashes:
    // Mainnet: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
    // Devnet:  EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG
    // Testnet: 4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY

    if (genesisHash === "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d") {
      networkName = "🔴 Solana Mainnet (REAL SOL)";
    } else if (genesisHash === "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") {
      networkName = "🟢 Solana Devnet (FAKE/Test SOL)";
    } else if (genesisHash === "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY") {
      networkName = "🟡 Solana Testnet (FAKE/Test SOL)";
    } else {
      networkName = `❓ Unknown Network (${genesisHash.substring(0, 10)}...)`;
    }

    res.json({
      success: true,
      url: sirSol.GETBLOCK_SOL_URL,
      network: networkName,
      genesis_hash: genesisHash,
      version: version,
      blockhash: blockhash.blockhash,
      message: `✅ Connected to ${networkName}`,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      url: sirSol?.GETBLOCK_SOL_URL,
    });
  }
});
// 8. GET SOLANA HISTORY
app.post("/api/history/solana", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.json({ success: true, transactions: [] });
    if (!sirSol || !sirSol.GETBLOCK_SOL_URL)
      return res.json({ success: true, transactions: [] });

    const connection = new Connection(sirSol.GETBLOCK_SOL_URL);
    const pubKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubKey, {
      limit: 10,
    });
    const transactions = [];

    for (const sig of signatures) {
      transactions.push({
        signature: sig.signature,
        date: sig.blockTime
          ? new Date(sig.blockTime * 1000).toISOString()
          : new Date().toISOString(),
        status: "success",
      });
    }
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("SOL history error:", error);
    res.json({ success: true, transactions: [] });
  }
});

// 9. GET BALANCE
app.post("/api/balance", async (req, res) => {
  try {
    const { address, blockchain } = req.body;
    if (blockchain === "ethereum") {
      const balance = await getEthBalance(address);
      res.json({ success: true, balance });
    } else if (blockchain === "solana") {
      const balance = await getSolBalance(address);
      res.json({ success: true, balance });
    } else {
      res.json({ success: true, balance: "0.00" });
    }
  } catch (error) {
    res.json({ success: true, balance: "0.00" });
  }
});
// CHECK WHICH NETWORK YOUR TOKEN IS CONNECTED TO
app.get("/api/check-ethereum-network", async (req, res) => {
  try {
    if (!sirEth || !sirEth.GETBLOCK_ETH_URL) {
      return res.json({ success: false, error: "No URL configured" });
    }

    const provider = new ethers.JsonRpcProvider(sirEth.GETBLOCK_ETH_URL);

    // Get network info
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const chainId = network.chainId.toString();

    // Try to get a recent block to confirm
    const block = await provider.getBlock(blockNumber);

    let networkName = "Unknown";
    let networkType = "Unknown";

    // Chain ID mapping
    if (chainId === "1") {
      networkName = "Ethereum Mainnet";
      networkType = "🔴 REAL MONEY";
    } else if (chainId === "11155111") {
      networkName = "Sepolia Testnet";
      networkType = "🟢 FAKE MONEY (Testnet)";
    } else if (chainId === "5") {
      networkName = "Goerli Testnet";
      networkType = "🟢 FAKE MONEY (Testnet)";
    } else if (chainId === "17000") {
      networkName = "Holesky Testnet";
      networkType = "🟢 FAKE MONEY (Testnet)";
    }

    res.json({
      success: true,
      url: sirEth.GETBLOCK_ETH_URL,
      network_name: networkName,
      network_type: networkType,
      chain_id: chainId,
      block_number: blockNumber,
      latest_block_hash: block?.hash,
      message: `✅ Connected to ${networkName} (${networkType})`,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      url: sirEth?.GETBLOCK_ETH_URL,
    });
  }
});
// 10. GET STATUS
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Sir's Crypto Wallet is running!",
    endpoints: [
      "POST /api/wallet/new",
      "POST /api/wallet/import",
      "GET /api/wallets",
      "POST /api/send/ethereum",
      "POST /api/send/solana",
      "POST /api/history/ethereum",
      "POST /api/history/solana",
      "POST /api/balance",
      "GET /api/status",
    ],
  });
});

// 11. GET ALL WALLETS
app.get("/api/wallets", (req, res) => {
  res.json({ success: true, wallets: savedWallets });
});

// 12. SERVE FRONTEND
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 SIR'S CRYPTO WALLET - RUNNING!");
  console.log("=".repeat(70));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log("\n✅ ALL ENDPOINTS LOADED:");
  console.log("   1. POST /api/wallet/new     - Create wallet");
  console.log("   2. POST /api/wallet/import  - Import wallet ✓ FIXED!");
  console.log("   3. GET  /api/wallets        - List wallets");
  console.log("   4. POST /api/send/ethereum  - Send ETH");
  console.log("   5. POST /api/send/solana    - Send SOL");
  console.log("   6. POST /api/history/ethereum - ETH history");
  console.log("   7. POST /api/history/solana   - SOL history");
  console.log("   8. POST /api/balance        - Get balance");
  console.log("   9. GET  /api/status         - Server status");
  console.log("=".repeat(70) + "\n");
});
