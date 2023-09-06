require('dotenv').config();
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const {getChatCompletion, getArticle} = require('./gptFuncs.js');
const mysql = require('mysql2');
const rateLimiter = require('express-rate-limit')
const {rateLimitDBCycle} = require('./rateLimitdbFuncs.js');
const {updateNewsDB, getAllStories} = require('./newsDBFuncs.js');
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
    max: 20, // limit each IP to 10 requests per windowMs
    message: {response: ['Too many requests from this IP, please try again in a few minutes']}
    }
);

// set up main rate limiter
const mainLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, 
    message: {response: ['Too many requests from this IP, please try again in a few minutes']}

});

function handleConnections() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: process.env.DB_PASS,
        database: 'portfolioDB'
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            setTimeout(handleConnections, 5000);
            return;
        }
        console.log('Connected to MySQL database');
    });

    connection.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleConnections();
        } else {
            throw err;
        }
    });
    return connection;
}

const connection = handleConnections()
setInterval( async () => {
    try{
        console.log('Updating news database')
        await updateNewsDB(connection)
    } catch (err) {
        console.log('Error updating news database:', err);
    }
}, 120000) //5400000)

// use rate limiters on routes
app.use('/api/',apiLimiter);
app.use('/getnews',mainLimiter);

// use json for post requests
app.use(express.json());

// server static react files
app.use(express.static(path.join(__dirname, 'dist')));

// serve app
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } catch (error) {
        console.error(`Error in handler: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

// handle gpt requests
app.post('/api/getCompletion', async (req, res) => {
    // run dbCycle to check for daily api calls and update database
    try {
        const apiResults = await rateLimitDBCycle(connection)
            if (apiResults) {
                const prompt = req.body;
                const response = await getChatCompletion(prompt,openAiInstance);
                res.json(response);
            } else {
                res.json({response: ['Daily Global Request Limit Reached. Try Again Tomorrow.']})
            }
    } catch (error) {
        console.error(`Error in handler: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

// submit outline to gpt-3.5 to generate article
app.post('/api/getArticle', async (req, res) => {
    // run dbCycle to check for daily api calls and update database
    try {
        const apiResults = await rateLimitDBCycle(connection)
            if (apiResults) {
                const prompt = req.body;
                const response = await getArticle(prompt,openAiInstance);
                res.json(response);
            } else {
                res.json({response: ['Daily Global Request Limit Reached. Try Again Tomorrow.']})
            }

    } catch (error) {
        console.error(`Error in handler: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

// get news stories from database
app.get('/getNews', async (req, res) => {
    try {
        const results = await getAllStories(connection);
        res.json(results);
    } catch (error) {
        console.error(`Error in handler: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

// start server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    }
);