require('dotenv').config();
const mysql = require('mysql2');

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

function queryAsync(sql, args) {
    return new Promise((resolve, reject) => {
        connection.query(sql, args, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

// Update date
async function updateDB() {
    console.log('updating db');
    const date = new Date().toISOString().slice(0, 10);
    const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date]);
    
    if (res.length === 0) {
        await queryAsync('INSERT INTO dailyCalls (date, totals) VALUES (?, ?)', [date, 1]);
        console.log('Initialized count for the current date.');
    } else {
        await queryAsync('UPDATE dailyCalls SET totals = totals + 1 WHERE date = ?', [date]);
        console.log('Incremented count for the current date.');
    }
}

// Check whether current day's apiCalls is less than 200
async function checkApiCalls() {
    const date = new Date().toISOString().slice(0, 10);
    console.log('date', date);
    
    const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date]);
    console.log('res', res);
    
    if (res.length === 0) {
        console.log('date not found');
        return true;
    } else {
        console.log('t',res);
        return res[0].totals < 200;
    }
}

// DB cycle function
async function dbCycle() {
    console.log('checking api calls');
    
    try {
        const hasApiCallsLeft = await checkApiCalls();
        console.log('Has API Calls Left:', hasApiCallsLeft);
        
        if (hasApiCallsLeft) {
            await updateDB();
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('There was an error:', err);
    }
}

module.exports = {
    dbCycle
}
