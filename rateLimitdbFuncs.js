require('dotenv').config();
const mysql = require('mysql2');

function queryAsync(sql, args, connection) {
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
async function updateRateLimitDB(connection) {
    console.log('updating db');
    const date = new Date().toISOString().slice(0, 10);
    const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date],connection);
    
    if (res.length === 0) {
        await queryAsync('INSERT INTO dailyCalls (date, totals) VALUES (?, ?)', [date, 1],connection);
        console.log('Initialized count for the current date.');
    } else {
        await queryAsync('UPDATE dailyCalls SET totals = totals + 1 WHERE date = ?', [date],connection);
        console.log('Incremented count for the current date.');
    }
}

// Check whether current day's apiCalls is less than 200
async function checkApiCalls(connection) {
    const date = new Date().toISOString().slice(0, 10);
    console.log('date', date);
    
    const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date],connection);
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
async function rateLimitDBCycle(connection) {
    console.log('checking api calls');
    
    try {
        const hasApiCallsLeft = await checkApiCalls(connection);
        console.log('Has API Calls Left:', hasApiCallsLeft);
        
        if (hasApiCallsLeft) {
            await updateRateLimitDB(connection);
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('There was an error:', err);
    }
}

module.exports = {
    rateLimitDBCycle
}
