const newsUrlList = require('./newsURLList.js');
const Parser = require('rss-parser');

async function queryAsync(sql, params, connection) {
    //console.log('Connection Object:', connection);
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
            console.log('story', story);
            // check against database if story exists before adding it
            const res = await queryAsync('SELECT * FROM ?? WHERE title = ?', [category, story.title], connection);
            if (res.length === 0) {
                await queryAsync('INSERT INTO ?? (title, url, pubDate) VALUES (?, ?, ?)', [category, story.title, story.url, story.pubDate], connection);
                console.log('Added story to database');
            } else {
                console.log('Story already exists in database');
            }
            
            // check whether total number of stories in category is less than 500
            const [countRow] = await queryAsync(`SELECT COUNT(*) as count FROM ??`, [category], connection);
            if (countRow.count > 500) {
                // delete oldest stories in category
                await queryAsync('DELETE FROM ?? ORDER BY pubDate ASC LIMIT ?', [category, countRow.count - 500], connection);
            }

        } catch (err) {
            console.log('Error adding story to database:', err);
        }
        
    }
}


async function getStories() {
    const parser = new Parser();
    const stories = [];
    for (const category in newsUrlList) {
        for (const url of newsUrlList[category]) {
            const feed = await parser.parseURL(url);
            for (const item of feed.items) {
                //console.log('item', item);
                const pubDate = new Date('Wed, 19 Apr 2023 12:44:51 GMT');
                const formattedDate = pubDate.toISOString().slice(0, 19).replace('T', ' ');
                const truncatedTitle = item.title.slice(0, 100);
                stories.push({
                    title: truncatedTitle,
                    url: item.link,
                    category: category,
                    pubDate: formattedDate                   

                });
            }
        }
    }
    return stories;
}

async function updateNewsDB(connection){
    //console.log('Connection Object:', connection);
    const stories = await getStories(connection);
    console.log('stories');

    for (const story of stories) {
        await addToDB(story.category, [story],connection);
    }
}

module.exports = {
    updateNewsDB
}
