// Entry point for backend runtime.
// Loads environment/config, initializes DB connection, and starts Express app.
require("dotenv").config();
require("./db");

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
