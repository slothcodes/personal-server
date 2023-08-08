const express = require('express');
const getChatCompletion = require('./gptFuncs.js');
const app = express();
const path = require('path');
const port = 5001;

// server static react files
app.use(express.static(path.join(__dirname, 'dist')));

// serve app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
);

// handle post requests
app.post('/getCompletion', async (req, res) => {
    console.log(req.body);
    const prompt = req.body;
    const response = await getChatCompletion(prompt);
    console.log(response);
    res.send(response);
    }
);

// start server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    }
);