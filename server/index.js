const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL && process.env.CLIENT_URL !== '*' ? process.env.CLIENT_URL : null;

app.use(helmet());
app.use(cors(clientUrl ? { origin: clientUrl, credentials: true } : { origin: true }));
app.use((req, res, next) => {
    // Give upload routes more time
    const isUpload = req.path.startsWith('/api/upload');
    const timeoutMs = isUpload ? 60000 : 8000;
    req.setTimeout(timeoutMs, () => {
        const err = new Error('Request Timeout');
        err.status = 408;
        next(err);
    });
    res.setTimeout(timeoutMs, () => {
        const err = new Error('Service Unavailable');
        err.status = 503;
        next(err);
    });
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/enquiry', require('./src/routes/enquiryRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/gallery', require('./src/routes/galleryRoutes'));
app.use('/api/applications', require('./src/routes/applicationRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/content', require('./src/routes/contentRoutes'));
app.use('/api/page-sections', require('./src/routes/pageSectionsRoutes'));
app.use('/api/popup-poster', require('./src/routes/popupPosterRoutes'));
app.use('/api/announcement', require('./src/routes/announcementRoutes'));
app.use('/api/hero-settings', require('./src/routes/heroSettingsRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/media', require('./src/routes/mediaRoutes'));

app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to Viveka College API' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('Supabase environment variables are missing; API routes will fail gracefully until configured.');
    }
    console.log(`Server running on port ${PORT}`);
    });

