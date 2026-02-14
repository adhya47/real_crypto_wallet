// import {
//   Connection,
//   Keypair,
//   Transaction,
//   SystemProgram,
//   LAMPORTS_PER_SOL,
//   PublicKey,
// } from "@solana/web3.js";
// import bs58 from "bs58";

// async function sendSolanaTransactionRaw(privateKey, to, amount) {
//   const connection = new Connection(GETBLOCK_SOL_URL);

//   const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
//   const toPublicKey = new PublicKey(to);

//   try {
//     // Get recent blockhash
//     const latestBlockhash = await connection.getLatestBlockhash();

//     // Create transaction
//     const transaction = new Transaction();
//     transaction.recentBlockhash = latestBlockhash.blockhash;
//     transaction.feePayer = fromKeypair.publicKey;

//     // Add the transfer instruction
//     transaction.add(
//       SystemProgram.transfer({
//         fromPubkey: fromKeypair.publicKey,
//         toPubkey: toPublicKey,
//         lamports: amount * LAMPORTS_PER_SOL,
//       }),
//     );

//     // Sign the transaction
//     transaction.sign(fromKeypair);

//     // Send raw transaction
//     const signature = await connection.sendRawTransaction(
//       transaction.serialize(),
//       {
//         skipPreflight: false,
//         preflightCommitment: "confirmed",
//       },
//     );

//     console.log("Transaction sent:", signature);

//     // Confirm transaction
//     const confirmation = await connection.confirmTransaction({
//       signature,
//       blockhash: latestBlockhash.blockhash,
//       lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
//     });

//     if (confirmation.value.err) {
//       throw new Error(`Transaction failed: ${confirmation.value.err}`);
//     }

//     console.log("Transaction confirmed:", confirmation);

//     return signature;
//   } catch (error) {
//     console.error("Transaction failed:", error);
//     throw error;
//   }
// }

// sendSolanaTransactionRaw(
//   "62Nxioza63NMNTVKBHbLbKRqtwqu96JpU7XnX31dnAK2F2TuFfuyNxtaCynsbHqouCoU6ku1asdtRBbiCFN74QvL",
//   "APz7hnkedimxjWMLMfP42epujhoHWWDGMyGV4ghYXdjc",
//   0.001,
// );

// ============================================
// SOLU.CJS - Sir's Solana code in CommonJS format
// ============================================

const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} = require("@solana/web3.js");
const bs58 = require("bs58");

// Sir's GetBlock URL - REPLACE WITH YOUR ACTUAL URL FROM HIS FILE!
const GETBLOCK_SOL_URL = `https://go.getblock.us/00d584361027426cbaa05a13e05f00ac`;
// testnets:-
// const GETBLOCK_SOL_URL =
// "https://sol-devnet.getblock.io/aec0c07cddc0495789baa61f8e1b05b9/testnet/";

async function sendSolanaTransactionRaw(privateKey, to, amount) {
  const connection = new Connection(GETBLOCK_SOL_URL);

  const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const toPublicKey = new PublicKey(to);

  try {
    // Get recent blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = fromKeypair.publicKey;

    // Add the transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );

    // Sign the transaction
    transaction.sign(fromKeypair);

    // Send raw transaction
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      },
    );

    console.log("Transaction sent:", signature);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed:", confirmation);

    return signature;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

// Sir's test function
async function testSirSolanaTransaction() {
  return sendSolanaTransactionRaw(
    "62Nxioza63NMNTVKBHbLbKRqtwqu96JpU7XnX31dnAK2F2TuFfuyNxtaCynsbHqouCoU6ku1asdtRBbiCFN74QvL",
    "APz7hnkedimxjWMLMfP42epujhoHWWDGMyGV4ghYXdjc",
    0.001,
  );
}

module.exports = {
  sendSolanaTransactionRaw,
  testSirSolanaTransaction,
  GETBLOCK_SOL_URL,
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
};
