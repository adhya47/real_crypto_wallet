// // api/server.js - MINIMAL TEST VERSION
// console.log("🚀 Starting minimal test function...");

// try {
//   const express = require("express");
//   const app = express();

//   // Simple test endpoint
//   app.get("/api/test", (req, res) => {
//     res.json({
//       success: true,
//       message: "Minimal test is working!",
//       time: new Date().toISOString(),
//     });
//   });

//   // Health check
//   app.get("/api/health", (req, res) => {
//     res.json({ status: "ok" });
//   });

//   console.log("✅ Express app created");
//   module.exports = app;
// } catch (error) {
//   console.error("❌ Crash error:", error);
//   // Export a fallback function
//   module.exports = (req, res) => {
//     res.status(500).json({
//       error: "Function crashed during startup",
//       details: error.message,
//     });
//   };
// }
// api/server.js
const app = require("../server.js");
module.exports = app;
