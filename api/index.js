require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();

// Async Error Wrapper for Express 4 Serverless crash prevention
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Vercel Diagnostics Error:", err.message);
    res.status(500).json({ error: 'Serverless Crash: ' + err.message, stack: err.stack });
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'waterbrooks_media', resource_type: 'auto' },
});
const upload = multer({ storage: storage });

// Mongoose Schemas
const postSchema = new mongoose.Schema({
    id: String, date: String, title: String, excerpt: String, content: [String]
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

const mediaSchema = new mongoose.Schema({
    id: String, url: String, public_id: String, caption: String, type: String, date: String
});
const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, default: 'admin' },
    passwordHash: String, resetToken: String, resetTokenExpiry: Number
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// Stronger DB Connection with diagnostics
async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    if (!process.env.MONGODB_URI) throw new Error("CRITICAL FAILURE: MONGODB_URI environment variable is missing in Vercel!");
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
        await Admin.create({
            username: 'admin',
            passwordHash: '$2b$10$VzLKw0yY2yN46FpaxT/MBe1XGKbROy.GId9acfZIouO/F6R3m3fUC'
        });
    }
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: ['waterbrooks-secret-key-123'],
    maxAge: 24 * 60 * 60 * 1000
}));

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) next();
    else res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', asyncHandler(async (req, res) => {
    await connectDB();
    const { password } = req.body;
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (password && admin && bcrypt.compareSync(password, admin.passwordHash)) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
}));

app.post('/api/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/forgot-password', asyncHandler(async (req, res) => {
    await connectDB();
    const { email } = req.body;
    if (email !== 'ajumobiayomipo@gmail.com') return res.status(400).json({ error: 'Unrecognized admin email address.' });

    const token = crypto.randomBytes(20).toString('hex');
    await Admin.updateOne({ username: 'admin' }, {
        resetToken: token, resetTokenExpiry: Date.now() + 3600000
    });

    if (!process.env.EMAIL_APP_PASSWORD) throw new Error("CRITICAL FAILURE: EMAIL_APP_PASSWORD environment variable is missing in Vercel!");
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: 'ajumobiayomipo@gmail.com', pass: process.env.EMAIL_APP_PASSWORD }
    });

    const mailOptions = {
        from: 'ajumobiayomipo@gmail.com', to: 'ajumobiayomipo@gmail.com',
        subject: 'Waterbrooks Admin Password Reset',
        text: `You requested a password reset.\n\nClick here:\nhttps://${req.headers.host}/reset.html?token=${token}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Password reset link sent!' });
}));

app.post('/api/reset-password', asyncHandler(async (req, res) => {
    await connectDB();
    const { token, newPassword } = req.body;
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (!token || !admin || token !== admin.resetToken || Date.now() > admin.resetTokenExpiry) {
        return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }

    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password too short.' });

    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();
    res.json({ success: true, message: 'Password reset successfully.' });
}));

app.get('/api/posts', asyncHandler(async (req, res) => {
    await connectDB();
    const posts = await Post.find(); 
    posts.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    res.json(posts);
}));

app.post('/api/posts', requireAuth, asyncHandler(async (req, res) => {
    await connectDB();
    const { title, excerpt, content } = req.body;
    let { date } = req.body;
    if (!date) date = new Date().toISOString().split('T')[0];
    const newPost = new Post({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        title, date, excerpt, content
    });
    await newPost.save();
    res.json({ success: true, post: newPost });
}));

app.put('/api/posts/:id', requireAuth, asyncHandler(async (req, res) => {
    await connectDB();
    const post = await Post.findOne({ id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    
    post.title = req.body.title || post.title;
    post.date = req.body.date || post.date;
    post.excerpt = req.body.excerpt !== undefined ? req.body.excerpt : post.excerpt;
    post.content = req.body.content !== undefined ? req.body.content : post.content;
    
    await post.save();
    res.json({ success: true, post: post });
}));

app.delete('/api/posts/:id', requireAuth, asyncHandler(async (req, res) => {
    await connectDB();
    await Post.deleteOne({ id: req.params.id });
    res.json({ success: true });
}));

app.get('/api/media', asyncHandler(async (req, res) => {
    await connectDB();
    const media = await Media.find();
    media.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    res.json(media);
}));

app.post('/api/media', requireAuth, upload.single('mediaFile'), asyncHandler(async (req, res) => {
    await connectDB();
    if (!req.file && !req.body.youtubeUrl && !req.body.videoLink) {
      return res.status(400).json({ error: 'No file or video link provided.' });
    }
    
    let urlToSave = '';
    let publicIdToSave = '';
    let mediaType = '';

    // Check if it's a direct JSON link submission natively bypassing multer
    if (req.body.videoLink || req.body.youtubeUrl) {
        urlToSave = req.body.videoLink || req.body.youtubeUrl;
        mediaType = 'link'; // Generic format covering Youtube, FB, Instagram
        publicIdToSave = 'social_' + Date.now();
    } else if (req.file) {      urlToSave = req.file.path;
        publicIdToSave = req.file.filename;
        mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const newMedia = new Media({
        id: Date.now().toString(),
        url: urlToSave,
        public_id: publicIdToSave,
        caption: req.body.caption || '',
        type: mediaType,
        date: new Date().toISOString().split('T')[0]
    });
    
    await newMedia.save();
    res.json({ success: true, media: newMedia });
}));

app.put('/api/media/:id', requireAuth, asyncHandler(async (req, res) => {
    await connectDB();
    const media = await Media.findOne({ id: req.params.id });
    if (!media) return res.status(404).json({ error: 'Media not found.' });
    media.caption = req.body.caption !== undefined ? req.body.caption : media.caption;
    await media.save();
    res.json({ success: true, media: media });
}));

app.delete('/api/media/:id', requireAuth, asyncHandler(async (req, res) => {
    await connectDB();
    const media = await Media.findOne({ id: req.params.id });
    if (!media) return res.status(404).json({ error: 'Media not found.' });

    if (media.public_id) {
        try { await cloudinary.uploader.destroy(media.public_id, { resource_type: media.type === 'video' ? 'video' : 'image' }); } catch(e) {}
    }
    await Media.deleteOne({ id: req.params.id });
    res.json({ success: true });
}));

// Route to resolve shortlinks like facebook.com/share/ into canonical links
app.get('/api/resolve-link', asyncHandler(async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ url: '' });
    try {
        // We use fetch with redirect: follow to get the final URL
        const response = await fetch(url, { redirect: 'follow', method: 'HEAD' });
        res.json({ url: response.url });
    } catch(e) {
        console.error('Resolution Error:', e);
        res.json({ url });
    }
}));

// Fallback for uncaught wrapper errors
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message, stack: err.stack });
});

module.exports = app;
