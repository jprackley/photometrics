const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')

const C_HTTP = require('../utils/constants/cHTTP')

app.set('etag', false);

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.use('/api/login', require('./routers/auth/login'));
app.use('/api/logout', require('./routers/auth/logout'));
app.use('/api/clients', require('./routers/clients'));
app.use('/api/projects', require('./routers/projects'));
app.use('/api/tasks', require('./routers/tasks'));
app.use('/api/images', require('./routers/images'));
//app.use('/api/time-entries', require('./routers/time.entries'));
app.use('/api/users', require('./routers/users'));
app.use('/api/employees', require('./routers/read-only/employees'));

app.use('/api/assignments', require('./routers/assignments'));
app.use('/api/settings', require('./routers/settings'));

app.use('/api/kpi/tasks', require('./routers/dashboard/taskKPI'));
app.use('/api/kpi/images', require('./routers/dashboard/imageKPI'));
app.use('/api/kpi/employees', require('./routers/dashboard/employeeKPI'));
const projectKpiRouter = require('./routers/dashboard/projectKPI');
app.use('/api/kpi/projects', projectKpiRouter);
app.use('/kpi/projects', projectKpiRouter);

app.use('/api/dashboard/productivity', require('./routers/dashboard/productivityKPI'));
app.use('/api/dashboard/workflow', require('./routers/dashboard/workflowKPI'));
app.use('/api/dashboard/employee-activity', require('./routers/dashboard/employeeActivityKPI'));
app.use('/api/dashboard/project-progress', require('./routers/dashboard/projectProgressKPI'));

app.use('/api/reports/project_delivery', require('./routers/reports/project_delivery_report'));
app.use('/api/reports/task_time', require('./routers/reports/task_time_report'));
app.use('/api/reports/employee_productivity', require('./routers/reports/employee_productivity_report'));
app.use('/api/reports/assignment_status', require('./routers/reports/assignment_status_report'));
app.use('/api/reports/operations_summary', require('./routers/reports/operations_summary_report'));

//app.use('/api/auth/refresh', require('./routers/auth/refresh'));

// 404 handler goes after all routes
app.use((req, res) => {
    res.status(C_HTTP.STATUS.NOT_FOUND).json({
        error: {
            code: C_HTTP.CODE.NOT_FOUND,
            message: `Route not found: ${req.method} ${req.originalUrl}`
        }
    });
});

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

if (process.env.NODE_ENV === 'development') {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.warn(`[WARNING] Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
