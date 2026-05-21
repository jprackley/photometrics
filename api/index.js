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
app.use('/api/logout', require('./routers/auth/logout'));
app.use('/api/clients', require('./routers/clients'));
app.use('/api/projects', require('./routers/projects'));
app.use('/api/tasks', require('./routers/tasks'));
app.use('/api/images', require('./routers/images'));
app.use('/api/time-entries', require('./routers/time.entries'));
app.use('/api/users', require('./routers/users'));
app.use('/api/employees', require('./routers/read-only/employees'));

app.use('/api/kpi/tasks', require('./routers/dashboard/taskKPI'));
app.use('/api/kpi/images', require('./routers/dashboard/imageKPI'));
app.use('/api/kpi/employees', require('./routers/dashboard/employeeKPI'));
const projectKpiRouter = require('./routers/dashboard/projectKPI');
app.use('/api/kpi/projects', projectKpiRouter);
app.use('/kpi/projects', projectKpiRouter);

app.use('/api/dashboard/productivity', require('./routers/dashboard/productivityKPI'));
app.use('/api/dashboard/workflow', require('./routers/dashboard/workflowKPI'));
app.use('/api/dashboard/employee-activity', require('./routers/dashboard/employeeActivityKPI'));

// Error handler MUST BE LAST
app.use((err, req, res, next) => {
    const status = err.status || C_HTTP.STATUS.INTERNAL_SERVER_ERROR;
    const code = err.code || C_HTTP.MESSAGE.INTERNAL_SERVER_ERROR;

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
