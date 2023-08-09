require('dotenv').config();
const express = require('express');
const getChatCompletion = require('./gptFuncs.js');
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const path = require('path');
const port = 5001;

// set up openai api access
const openAiKey = process.env.OPENAI_API_KEY; 
const configuration = new Configuration({ apiKey: openAiKey });
const openAiInstance = new OpenAIApi(configuration);

// use json for post requests
app.use(express.json());

// server static react files
app.use(express.static(path.join(__dirname, 'dist')));

// serve app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
);

// handle post requests
app.post('/getCompletion', async (req, res) => {
    const prompt = req.body.text;
    const response = await getChatCompletion(prompt,openAiInstance);
    res.send(response);
    }
);

// start server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    }
);