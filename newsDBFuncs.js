const newsUrlList = require('./newsURLList.js');
const Parser = require('rss-parser');
const mysql = require('mysql2/promise');

async function queryAsync(sql, params, connection) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

async function addToDB(category, stories, connection) {
    for (let story of stories) {
        try {
            // check against database if story exists before adding it
            const sanitizedTitle = story.title.trim();
            const res = await queryAsync('SELECT * FROM ?? WHERE title = ?', [category, sanitizedTitle], connection);
            if (res.length === 0) {
                await queryAsync('INSERT INTO ?? (title, url, pubDate) VALUES (?, ?, ?)', [category, story.title, story.url, story.pubDate], connection);
            } else {
                console.log('Story already exists in database');
            }
            // check whether total number of stories in category is less than 500
            const [countRow] = await queryAsync(`SELECT COUNT(*) as count FROM ??`, [category], connection);
            if (countRow.count > 500) {
                // delete oldest stories in category
                await queryAsync('DELETE FROM ?? ORDER BY pubDate ASC LIMIT ?', [category, countRow.count - 100], connection);
            }

        } catch (err) {
            console.log('Error adding story to database:', err);
            throw new Error(`Error adding story to database: ${err.message}`);
        }
        
    }
}

// delay function for rate limiting
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStories() {
    const parser = new Parser();
    const stories = [];
    for (const category in newsUrlList) {
        for (const url of newsUrlList[category]) {
            try {
                const feed = await parser.parseURL(url);
                // await delay(1000);
                for (const item of feed.items) {
                    if (item.pubDate) {
                        const pubDate = new Date(item.pubDate);
                        const formattedDate = pubDate.toISOString().slice(0, 19).replace('T', ' ');
                        const truncatedTitle = item.title.slice(0, 100);
                        stories.push({
                            title: truncatedTitle,
                            url: item.link,
                            category: category,
                            pubDate: formattedDate                   

                        })
                    }
                }
            } catch (err) {
                console.log('Error delaying:', err);
                throw new Error(`Error parsing URL or delaying: ${err.message}`);
            }
        }
    }
    return stories;
}

async function updateNewsDB(connection){
    const stories = await getStories(connection);
    for (const story of stories) {
        try {
            await addToDB(story.category, [story],connection);
        }
        catch (err) {
            console.log('Error adding story to database:', err);
            throw new Error(`Error in updateNewsDB: ${err.message}`);
        }
    }
}

async function getAllStories(connection) {  
    try {
        const categories = ['news', 'tech', 'gaming', 'sports'];
        let returnJSON = {};
        // Use Promise.all to run all the queries in parallel
        const newsJSON = await Promise.all(categories.map(async (category) => {
            const rows = await queryAsync('SELECT * FROM ?? ORDER BY pubDate DESC', [category], connection);
            returnJSON[category] = rows
        }));
        return {results: returnJSON};
    } catch (err) {
        console.log('Error getting all stories:', err);
        throw new Error(`Error in getAllStories: ${err.message}`);
    }

  } 
  

module.exports = {
    updateNewsDB,
    getAllStories
}
