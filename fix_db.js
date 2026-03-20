const fs = require('fs');
const jsPath = require('path').join(__dirname, 'js/pastor-posts.js');
const dbPath = require('path').join(__dirname, 'data/db.json');

const jsCode = fs.readFileSync(jsPath, 'utf8');
const arrayStr = jsCode.split('window.PASTOR_POSTS = ')[1].replace(/;\s*$/, '');
const posts = eval('(' + arrayStr + ')');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.posts = posts;
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Restored fully expanded text into db.json successfully!');
