const express = require('express')
const app = express()
const cors = require('cors')

const C_HTTP = require('../utils/constants/cHTTP')


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.use('/api/login', require('./routers/auth/login'));
app.use('/api/clients', require('./routers/clients'));
app.use('/api/projects', require('./routers/projects'));
app.use('/api/tasks', require('./routers/tasks'));
app.use('/api/images', require('./routers/images'));
app.use('/api/time-entries', require('./routers/time.entries'));
app.use('/api/users', require('./routers/users'));
app.use('/api/employees', require('./routers/read-only/employees'));


// Error handler MUST BE LAST
// Error handler MUST BE LAST
app.use((err, req, res, next) => {
    const status = err.status || C_HTTP.STATUS.INTERNAL_SERVER_ERROR;
    const code = err.code || C_HTTP.REASON.INTERNAL_SERVER_ERROR;

    console.error('[error]', {
        status,
        code,
        message: err.message,
        details: err.details,
        stack: err.stack,
    });

    res.status(status).json({
        error: {
            code,
            message: err.message,
            details: err.details || null,
        }
    });
});

module.exports = app;
