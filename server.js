const express = require('express');
const app = express();
const port = 3000;

// server static react files
app.use(express.static.path.join(__dirname, 'dist'));