require('dotenv').config();
const mysql = require('mysql2');

function queryAsync(sql, args, connection) {
    return new Promise((resolve, reject) => {
        if (!connection) {
            return reject(new Error('Database connection not established'));
        }
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
    try {
        const date = new Date().toISOString().slice(0, 10);
        const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date],connection);
        if (res.length === 0) {
            await queryAsync('INSERT INTO dailyCalls (date, totals) VALUES (?, ?)', [date, 1],connection);
        } else {
            await queryAsync('UPDATE dailyCalls SET totals = totals + 1 WHERE date = ?', [date],connection);
        }        
    } catch (err) {
        console.error('There was an error in UpdateRateLimitDB:', err);
        throw err;
    }

}

// Check whether current day's apiCalls is less than 200
async function checkApiCalls(connection) {
    try {
        const date = new Date().toISOString().slice(0, 10);
        const res = await queryAsync('SELECT * FROM dailyCalls WHERE date = ?', [date],connection);
        if (res.length === 0) {
            return true;
        } else {
            return res[0].totals < 500;
        }        
    } catch (err) {
        console.error('There was an error in CheckApiCalls:', err);
        throw err;
    }

}

// DB cycle function
async function rateLimitDBCycle(connection) {
    try {
        if(!connection) {
            throw new Error('Database connection not established');
        }

        const hasApiCallsLeft = await checkApiCalls(connection);
        if (hasApiCallsLeft) {
            await updateRateLimitDB(connection);
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('Error Rate Limit Exceeded:', err);
        return false;
    }
}

module.exports = {
    rateLimitDBCycle
}
