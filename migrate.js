require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const postSchema = new mongoose.Schema({
    id: String,
    date: String,
    title: String,
    excerpt: String,
    content: [String]
});

const mediaSchema = new mongoose.Schema({
    id: String,
    url: String,
    caption: String,
    type: String,
    date: String
});

const Post = mongoose.model('Post', postSchema);
const Media = mongoose.model('Media', mediaSchema);

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB successfully!");
        
        const dbPath = path.join(__dirname, 'data', 'db.json');
        if (!fs.existsSync(dbPath)) {
            console.log("No db.json found.");
            process.exit(0);
        }
        
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        await Post.deleteMany({});
        await Media.deleteMany({});
        console.log("Cleared existing collections");
        
        if (data.posts && data.posts.length > 0) {
            await Post.insertMany(data.posts);
            console.log(`Inserted ${data.posts.length} posts`);
        }
        
        if (data.media && data.media.length > 0) {
            await Media.insertMany(data.media);
            console.log(`Inserted ${data.media.length} media items`);
        }
        
        console.log("Migration completely flawlessly finished.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
