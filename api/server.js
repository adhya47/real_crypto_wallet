// api/server.js - This connects your Express app to Vercel
const app = require("../server.js");

// Export for Vercel serverless
module.exports = app;

console.log("✅ API serverless function loaded");
