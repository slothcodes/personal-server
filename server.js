require('dotenv').config();
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const {getChatCompletion, getArticle} = require('./gptFuncs.js');
const mysql = require('mysql2');
const rateLimiter = require('express-rate-limit')
const {rateLimitDBCycle} = require('./rateLimitdbFuncs.js');
const {updateNewsDB} = require('./newsDBFuncs.js');
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
    max: 2, // limit each IP to 10 requests per windowMs
    message: {response: ['Too many requests from this IP, please try again in a few minutes']}
    }
);

// set up main rate limiter
const mainLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 2 // limit each IP to 10 requests per windowMs
});

// Set up MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS,
    database: 'portfolioDB'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
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
    // run dbCycle to check for daily api calls and update database
    updateNewsDB(connection);
    if (rateLimitDBCycle(connection)) {
        console.log('incoming request',req.body)
        const prompt = req.body;
        const response = await getChatCompletion(prompt,openAiInstance);
        res.json(response);
    } else {
        console.log('Daily Global Request Limit Reached. Try Again Tomorrow.')
    }
});

// submit outline to gpt-3.5 to generate article
app.post('/api/getArticle', async (req, res) => {
    // run dbCycle to check for daily api calls and update database
    if (rateLimitDBCycle(connection)) {
        console.log('incoming request',req.body)
        const prompt = req.body;
        const response = await getArticle(prompt,openAiInstance);
        res.json(response);
    } else {
        console.log('Daily Global Request Limit Reached. Try Again Tomorrow.')
    }
});

// get news stories from database
// submit outline to gpt-3.5 to generate article
app.post('/api/getNews', async (req, res) => {
    // run dbCycle to check for daily api calls and update database
        console.log('incoming request',req.body)

});

// start server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    }
);