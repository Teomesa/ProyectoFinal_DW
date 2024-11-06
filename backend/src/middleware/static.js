// src/middleware/static.js
const express = require('express');
const path = require('path');

const staticMiddleware = express.static(path.join(__dirname, '../../frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
});

module.exports = staticMiddleware;

// En app.js
const staticMiddleware = require('./middleware/static');
app.use(staticMiddleware);
