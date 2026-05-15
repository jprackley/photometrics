const express = require('express')
const cors = require('cors')
const C_HTTP = require('./utils/cHTTP')
const app = express()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.use('/api/clients', require('./routers/clients'));
app.use('/api/projects', require('./routers/projects'));
app.use('/api/tasks', require('./routers/tasks'));
app.use('/api/images', require('./routers/images'));
app.use('/api/time-entries', require('./routers/timeEntries'));
app.use('/api/users', require('./routers/users'));

// Error handler MUST BE LAST
app.use((err, req, res, next) => {
    const status = err.status || C_HTTP.STATUS.INTERNAL_SERVER_ERROR;
    const code = err.code || 'internal_error';
    console.error('[error]', {
        status,
        code,
        message: err.message,
        stack: err.stack,
    });
    res.status(status).json({ error: { code, message: err.message } });
});

module.exports = app;
