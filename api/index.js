require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'waterbrooks_media',
    resource_type: 'auto',
  },
});
const upload = multer({ storage: storage });

// Mongoose Schemas
const postSchema = new mongoose.Schema({
    id: String,
    date: String,
    title: String,
    excerpt: String,
    content: [String]
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

const mediaSchema = new mongoose.Schema({
    id: String,
    url: String, // from cloudinary
    public_id: String, // for deletion
    caption: String,
    type: String, // 'video' | 'image'
    date: String
});
const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, default: 'admin' },
    passwordHash: String,
    resetToken: String,
    resetTokenExpiry: Number
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// MongoDB connection
async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Ensure admin user exists with their actual password hash seamlessly migrated
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
        await Admin.create({
            username: 'admin',
            // Default generated from their exact latest db.json config
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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Authorization Middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Routes
app.post('/api/login', async (req, res) => {
    await connectDB();
    const { password } = req.body;
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (password && admin && bcrypt.compareSync(password, admin.passwordHash)) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/forgot-password', async (req, res) => {
    await connectDB();
    const { email } = req.body;
    if (email !== 'ajumobiayomipo@gmail.com') {
        return res.status(400).json({ error: 'Unrecognized admin email address.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    await Admin.updateOne({ username: 'admin' }, {
        resetToken: token,
        resetTokenExpiry: Date.now() + 3600000
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ajumobiayomipo@gmail.com',
            pass: process.env.EMAIL_APP_PASSWORD || ''
        }
    });

    if (!process.env.EMAIL_APP_PASSWORD) {
        return res.status(500).json({ error: 'Action Required: You must generate a Gmail App Password.' });
    }

    const mailOptions = {
        from: 'ajumobiayomipo@gmail.com',
        to: 'ajumobiayomipo@gmail.com',
        subject: 'Waterbrooks Admin Password Reset',
        text: `You requested an admin password reset.\n\nClick this link to securely reset your password:\nhttps://${req.headers.host}/reset.html?token=${token}\n\nIf you did not request this, please ignore this email.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send email. Ensure your Gmail App Password in .env is correct.' });
        }
        res.json({ success: true, message: 'Password reset link sent to ajumobiayomipo@gmail.com!' });
    });
});

app.post('/api/reset-password', async (req, res) => {
    await connectDB();
    const { token, newPassword } = req.body;
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (!token || !admin || token !== admin.resetToken || Date.now() > admin.resetTokenExpiry) {
        return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// POSTS API
app.get('/api/posts', async (req, res) => {
    await connectDB();
    const posts = await Post.find(); 
    // Manual sorting by date conceptually mirrors traditional setup
    posts.sort((a,b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
});

app.post('/api/posts', requireAuth, async (req, res) => {
    await connectDB();
    const { title, date, excerpt, content } = req.body;
    const newPost = new Post({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        title, date, excerpt, content
    });
    await newPost.save();
    res.json({ success: true, post: newPost });
});

app.put('/api/posts/:id', requireAuth, async (req, res) => {
    await connectDB();
    const post = await Post.findOne({ id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    
    const updated = req.body;
    post.title = updated.title || post.title;
    post.date = updated.date || post.date;
    post.excerpt = updated.excerpt !== undefined ? updated.excerpt : post.excerpt;
    post.content = updated.content !== undefined ? updated.content : post.content;
    
    await post.save();
    res.json({ success: true, post: post });
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    await connectDB();
    await Post.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Post deleted.' });
});

// MEDIA API
app.get('/api/media', async (req, res) => {
    await connectDB();
    const media = await Media.find();
    media.sort((a,b) => new Date(b.date) - new Date(a.date));
    res.json(media);
});

app.post('/api/media', requireAuth, upload.single('mediaFile'), async (req, res) => {
    await connectDB();
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const isVideo = req.file.mimetype.startsWith('video/');
    const newMedia = new Media({
        id: Date.now().toString(),
        url: req.file.path, // Cloudinary natively signed secure URL
        public_id: req.file.filename,
        caption: req.body.caption || '',
        type: isVideo ? 'video' : 'image',
        date: new Date().toISOString().split('T')[0]
    });
    await newMedia.save();
    res.json({ success: true, media: newMedia });
});

app.put('/api/media/:id', requireAuth, async (req, res) => {
    await connectDB();
    const media = await Media.findOne({ id: req.params.id });
    if (!media) return res.status(404).json({ error: 'Media not found.' });
    
    media.caption = req.body.caption !== undefined ? req.body.caption : media.caption;
    await media.save();
    res.json({ success: true, media: media });
});

app.delete('/api/media/:id', requireAuth, async (req, res) => {
    await connectDB();
    const media = await Media.findOne({ id: req.params.id });
    if (!media) return res.status(404).json({ error: 'Media not found.' });

    if (media.public_id) {
        try {
            await cloudinary.uploader.destroy(media.public_id, { resource_type: media.type === 'video' ? 'video' : 'image' });
        } catch(e) {
            console.error('Cloudinary delete error:', e);
        }
    }
    await Media.deleteOne({ id: req.params.id });
    res.json({ success: true });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Local Vercel-simulation server listening on port ${PORT}`));
}

module.exports = app;
