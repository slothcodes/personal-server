require('dotenv').config();
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const {getChatCompletion, getArticle} = require('./gptFuncs.js');
const rateLimiter = require('express-rate-limit')
const app = express();
const path = require('path');
const port = 5001;

// set up openai api access
const openAiKey = process.env.OPENAI_API_KEY; 
const configuration = new Configuration({ apiKey: openAiKey });
const openAiInstance = new OpenAIApi(configuration);

// set up api rate limiter
const apiLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 2 // limit each IP to 10 requests per windowMs
    }
);

// set up main rate limiter
const mainLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 2 // limit each IP to 10 requests per windowMs
});

// use rate limiters on routes
app.use('/api/',apiLimiter);
app.use('/',mainLimiter);

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
app.post('/api/getCompletion', async (req, res) => {
    console.log('incoming request',req.body)
    const prompt = req.body;
    const response = await getChatCompletion(prompt,openAiInstance);
    res.json(response);
    }
);// submit outline to gpt-3.5 to generate article
app.post('/api/getArticle', async (req, res) => {
    const prompt = req.body;
    const response = await getArticle(prompt,openAiInstance);
    res.json(response);
    }
);

// start server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    }
);