require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Removed hardcoded ADMIN_PASSWORD_HASH for dynamic authentic database storage

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'waterbrooks-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure:true if using HTTPS
}));

// Serve static files from the root directory (excluding 'data' folder for security)
app.use(express.static(path.join(__dirname, '')));

// Database setup
const dbFile = path.join(__dirname, 'data', 'db.json');
function readDB() {
    if (!fs.existsSync(dbFile)) {
        return { posts: [], media: [] };
    }
    const data = fs.readFileSync(dbFile, 'utf8');
    try {
        return JSON.parse(data);
    } catch(e) {
        return { posts: [], media: [] };
    }
}
function writeDB(data) {
    if (!fs.existsSync(path.dirname(dbFile))) {
        fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
}

// Ensure default admin hash is in db if missing
function initAdminPassword() {
    const db = readDB();
    if (!db.adminPasswordHash) {
        db.adminPasswordHash = bcrypt.hashSync('admin123', 10);
        writeDB(db);
    }
}
initAdminPassword();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'images', 'media');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Middleware for authentication
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Routes
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    if (password && db.adminPasswordHash && bcrypt.compareSync(password, db.adminPasswordHash)) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (email !== 'ajumobiayomipo@gmail.com') {
        return res.status(400).json({ error: 'Unrecognized admin email address.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const db = readDB();
    db.resetToken = token;
    db.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    writeDB(db);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ajumobiayomipo@gmail.com',
            pass: process.env.EMAIL_APP_PASSWORD || ''
        }
    });

    if (!process.env.EMAIL_APP_PASSWORD) {
        return res.status(500).json({ error: 'Action Required: You must generate a Gmail App Password for ajumobiayomipo@gmail.com and save it in a .env file as EMAIL_APP_PASSWORD before this will work.' });
    }

    const mailOptions = {
        from: 'ajumobiayomipo@gmail.com',
        to: 'ajumobiayomipo@gmail.com',
        subject: 'Waterbrooks Admin Password Reset',
        text: `You requested an admin password reset.\n\nClick this link to securely reset your password:\nhttp://${req.headers.host}/reset.html?token=${token}\n\nIf you did not request this, please ignore this email.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send email. Ensure your Gmail App Password in .env is correct.' });
        }
        res.json({ success: true, message: 'Password reset link sent to ajumobiayomipo@gmail.com!' });
    });
});

app.post('/api/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    const db = readDB();
    if (!token || token !== db.resetToken || Date.now() > db.resetTokenExpiry) {
        return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }
    
    db.adminPasswordHash = bcrypt.hashSync(newPassword, 10);
    db.resetToken = null;
    db.resetTokenExpiry = null;
    writeDB(db);
    
    res.json({ success: true, message: 'Password has been safely reset!' });
});

// Reflections API
app.get('/api/posts', (req, res) => {
    const db = readDB();
    res.json(db.posts || []);
});

app.post('/api/posts', requireAuth, (req, res) => {
    const { title, excerpt, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const db = readDB();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];
    
    // content can be submitted as a string, let's turn it into an array of paragraphs like the front-end expects
    const contentArray = typeof content === 'string' ? content.split('\n').filter(p => p.trim() !== '') : content;

    const newPost = { id, date, title, excerpt, content: contentArray };
    db.posts.push(newPost);
    writeDB(db);

    res.json({ success: true, post: newPost });
});

app.delete('/api/posts/:id', requireAuth, (req, res) => {
    const db = readDB();
    const index = db.posts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Post not found.' });
    }
    db.posts.splice(index, 1);
    writeDB(db);
    res.json({ success: true, message: 'Post deleted.' });
});

app.put('/api/posts/:id', requireAuth, (req, res) => {
    const db = readDB();
    const index = db.posts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Post not found.' });
    }
    
    const updated = req.body;
    db.posts[index].title = updated.title || db.posts[index].title;
    db.posts[index].date = updated.date || db.posts[index].date;
    db.posts[index].excerpt = updated.excerpt !== undefined ? updated.excerpt : db.posts[index].excerpt;
    db.posts[index].content = updated.content !== undefined ? updated.content : db.posts[index].content;
    
    writeDB(db);
    res.json({ success: true, post: db.posts[index] });
});

// Media API
app.get('/api/media', (req, res) => {
    const db = readDB();
    res.json(db.media || []);
});

// Using upload.single('mediaFile') expects the form field name to be 'mediaFile'
app.post('/api/media', requireAuth, upload.single('mediaFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const db = readDB();
    const isVideo = req.file.mimetype.startsWith('video/');
    const newMedia = {
        id: Date.now().toString(),
        url: 'images/media/' + req.file.filename,
        caption: req.body.caption || '',
        type: isVideo ? 'video' : 'image',
        date: new Date().toISOString().split('T')[0]
    };
    db.media.push(newMedia);
    writeDB(db);

    res.json({ success: true, media: newMedia });
});

app.put('/api/media/:id', requireAuth, (req, res) => {
    const db = readDB();
    const index = db.media.findIndex(m => m.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Media not found.' });
    }
    
    db.media[index].caption = req.body.caption !== undefined ? req.body.caption : db.media[index].caption;
    writeDB(db);
    res.json({ success: true, media: db.media[index] });
});

app.delete('/api/media/:id', requireAuth, (req, res) => {
    const db = readDB();
    const index = db.media.findIndex(m => m.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Media not found.' });
    }
    
    // Remove the physical file safely
    const mediaItem = db.media[index];
    const filePath = path.join(__dirname, mediaItem.url);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    db.media.splice(index, 1);
    writeDB(db);
    res.json({ success: true, message: 'Media deleted.' });
});

app.put('/api/media/:id', requireAuth, (req, res) => {
    const db = readDB();
    const index = db.media.findIndex(m => m.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Media not found.' });
    }
    
    if (req.body.caption !== undefined) {
        db.media[index].caption = req.body.caption;
        writeDB(db);
        return res.json({ success: true, media: db.media[index] });
    } else {
        return res.status(400).json({ error: 'No caption provided.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
