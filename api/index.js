const express = require('express')
const cors = require('cors')
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
    const status = err.status || 500;
    const code = err.code || 'internal_error';
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }
    res.status(status).json({ error: { code, message: err.message } });
});

module.exports = app;
