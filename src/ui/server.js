
// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// Serve static files (your frontend HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html by default for any route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
async function start() {
    try {
      const PORT = process.env.UI_PORT || 8080;
      app.listen(PORT, () => {
        console.log(`Express App Listening on Port ${PORT}`);
      });
    } catch (error) {
      console.error(`An error occurred: ${JSON.stringify(error)}`);
      process.exit(1);
    }
  }
  
  start();