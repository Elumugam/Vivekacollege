const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    console.error('API Error:', error);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: error.message || JSON.stringify(error) || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
};

module.exports = { notFound, errorHandler };
