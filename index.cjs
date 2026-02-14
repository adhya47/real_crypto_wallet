// import { ethers } from "ethers";

// async function sendTransactionWithProvider(privateKey, to, amount) {
//   // Create provider using GetBlock
//   const provider = new ethers.JsonRpcProvider(GETBLOCK_ETH_URL);

//   // Create wallet connected to provider
//   const wallet = new ethers.Wallet(privateKey, provider);

//   try {
//     // Send transaction (ethers handles nonce, gas price, gas Limit, sign etc.)
//     const tx = await wallet.sendTransaction({
//       to: to,
//       value: ethers.parseEther(amount),
//     });

//     console.log("Transaction sent:", tx.hash);

//     // Wait for confirmation
//     const receipt = await tx.wait();
//     console.log("Transaction confirmed in block:", receipt.blockNumber);

//     return tx.hash;
//   } catch (error) {
//     console.error("Transaction failed:", error);
//     throw error;
//   }
// }

// sendTransactionWithProvider(
//   "0xe13e0a935240c2ac98f19ac0299ee41a1841ca6860a99c858ea55a69107ac61a",
//   "0xC81cAe7D1cf6FCe3E3ac0B2d41E871D149ab777A",
//   "0.000000177125054145",
// );
// ============================================
// INDEX.CJS - Sir's Ethereum code in CommonJS format
// ============================================

const { ethers } = require("ethers");

// Sir's GetBlock URL - REPLACE WITH YOUR ACTUAL URL FROM HIS FILE!
// const GETBLOCK_ETH_URL = `https://go.getblock.us/f45c009cd9084df5ab8de842e6e3760f`;//mainnet
const GETBLOCK_ETH_URL = `https://go.getblock.io/db1ef4618dd84f2f9e995caa685d2a5a`; //sphoria
// //testnets:-
// const GETBLOCK_ETH_URL = `https://eth-sepolia.getblock.io/f45c009cd9084df5ab8de842e6e3760f`;

async function sendTransactionWithProvider(privateKey, to, amount) {
  // Create provider using GetBlock
  const provider = new ethers.JsonRpcProvider(GETBLOCK_ETH_URL);

  // Create wallet connected to provider
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    // Send transaction (ethers handles nonce, gas price, gas Limit, sign etc.)
    const tx = await wallet.sendTransaction({
      to: to,
      value: ethers.parseEther(amount),
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    return tx.hash;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

// Sir's test function
async function testSirTransaction() {
  return sendTransactionWithProvider(
    "0xe13e0a935240c2ac98f19ac0299ee41a1841ca6860a99c858ea55a69107ac61a",
    "0xC81cAe7D1cf6FCe3E3ac0B2d41E871D149ab777A",
    "0.000000177125054145",
  );
}

module.exports = {
  sendTransactionWithProvider,
  testSirTransaction,
  GETBLOCK_ETH_URL,
  ethers,
};
