// -----------------------------------------------------------------------------
// Reporting and Analytics Utilities
// -----------------------------------------------------------------------------
// Builds normalized report models from projects, assignments, tasks, and employee
// records. The Reports and Analytics pages use these helpers for summaries, CSV
// exports, risk views, and chart-ready datasets.
// -----------------------------------------------------------------------------

import {
    createCsv,
    downloadTextFile,
    formatDuration,
    formatNumber,
    formatPercent,
    getDueStatus,
    normalizeNumber,
} from "./helpers";

/**
 * Creates a normalized reporting model shared by the Reports and Analytics pages.
 */
function buildOperationsReportData(projectRows = [], assignmentRows = [], taskRows = [], employeeRows = []) {
    const safeProjects = Array.isArray(projectRows) ? projectRows : [];
    const safeAssignments = Array.isArray(assignmentRows) ? assignmentRows : [];
    const safeTasks = Array.isArray(taskRows) ? taskRows : [];
    const safeEmployees = Array.isArray(employeeRows) ? employeeRows : [];

    const totalImages = safeProjects.reduce((total, project) => total + normalizeNumber(project.images), 0);
    const completedImages = safeProjects.reduce((total, project) => {
        const imageCount = normalizeNumber(project.images);
        const progress = normalizeNumber(project.progress);
        return total + Math.round(imageCount * (progress / 100));
    }, 0);
    const remainingImages = Math.max(0, totalImages - completedImages);
    const completedProjects = safeProjects.filter((project) => project.status === "Completed").length;
    const completedTasks = safeTasks.filter((task) => task.status === "Completed").length;
    const openTasks = safeTasks.filter((task) => task.status !== "Completed").length;
    const reviewQueue = safeTasks.filter((task) => task.status === "Review").length + safeAssignments.filter((assignment) => assignment.status === "Review").length;
    const totalTrackedSeconds = safeTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0);
    const estimatedSeconds = safeTasks.reduce((total, task) => total + normalizeNumber(task.estimatedHours) * 3600, 0);
    const averageEfficiency = safeEmployees.length
        ? safeEmployees.reduce((total, employee) => total + normalizeNumber(employee.efficiency), 0) / safeEmployees.length
        : 0;

    const projectReportRows = safeProjects.map((project) => {
        const projectTasks = safeTasks.filter((task) => task.project === project.name);
        const projectAssignments = safeAssignments.filter((assignment) => assignment.project === project.name);
        const imageCount = normalizeNumber(project.images);
        const progress = formatPercent(normalizeNumber(project.progress));
        const projectCompletedImages = Math.round(imageCount * (progress / 100));
        const assignedNames = [...new Set([...projectTasks, ...projectAssignments].map((row) => row.assignedTo).filter(Boolean))];

        return {
            id: project.id,
            name: project.name,
            client: project.client,
            dueDate: project.dueDate,
            images: formatNumber(imageCount),
            completedImages: formatNumber(projectCompletedImages),
            remainingImages: formatNumber(Math.max(0, imageCount - projectCompletedImages)),
            progress,
            status: project.status,
            dueStatus: getDueStatus(project),
            openTasks: projectTasks.filter((task) => task.status !== "Completed").length,
            reviewItems: projectTasks.filter((task) => task.status === "Review").length + projectAssignments.filter((assignment) => assignment.status === "Review").length,
            assignedTo: assignedNames.length ? assignedNames.join(", ") : "Unassigned",
        };
    });

    const timeReportRows = safeTasks.map((task) => {
        const trackedSeconds = normalizeNumber(task.trackedSeconds);
        const estimatedHours = normalizeNumber(task.estimatedHours);
        const utilization = estimatedHours > 0 ? formatPercent((trackedSeconds / (estimatedHours * 3600)) * 100) : 0;

        return {
            id: task.id,
            taskName: task.taskName,
            project: task.project,
            assignedTo: task.assignedTo,
            dueDate: task.dueDate,
            priority: task.priority,
            estimatedHours,
            trackedTime: formatDuration(trackedSeconds),
            utilization,
            status: task.status,
            dueStatus: getDueStatus(task),
        };
    });

    const employeeReportRows = safeEmployees.map((employee) => {
        const employeeTasks = safeTasks.filter((task) => task.assignedTo === employee.name);
        const employeeAssignments = safeAssignments.filter((assignment) => assignment.assignedTo === employee.name);
        const employeeTrackedSeconds = employeeTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0);

        return {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            status: employee.status,
            activeTasks: employee.activeTasks,
            assignedTasks: employeeTasks.length + employeeAssignments.length,
            completedTasks: employeeTasks.filter((task) => task.status === "Completed").length + employeeAssignments.filter((assignment) => assignment.status === "Completed").length,
            reviewItems: employeeTasks.filter((task) => task.status === "Review").length + employeeAssignments.filter((assignment) => assignment.status === "Review").length,
            trackedTime: formatDuration(employeeTrackedSeconds),
            hoursToday: employee.hoursToday,
            efficiency: normalizeNumber(employee.efficiency),
            availability: employee.availability,
        };
    });

    const assignmentReportRows = safeAssignments.map((assignment) => ({
        id: assignment.id,
        project: assignment.project,
        taskType: assignment.taskType,
        assignedTo: assignment.assignedTo,
        assignedDate: assignment.assignedDate,
        dueDate: assignment.dueDate,
        priority: assignment.priority,
        status: assignment.status,
        dueStatus: getDueStatus(assignment),
    }));

    const taskStatusData = ["Completed", "Review", "In Progress", "Not Started"].map((status) => ({
        name: status,
        value: safeTasks.filter((task) => task.status === status).length,
    })).filter((item) => item.value > 0);

    const priorityData = ["High", "Medium", "Low"].map((priority) => ({
        name: priority,
        value: safeTasks.filter((task) => task.priority === priority).length + safeAssignments.filter((assignment) => assignment.priority === priority).length,
    })).filter((item) => item.value > 0);

    const projectAnalyticsRows = safeProjects.map((project) => ({
        name: project.name,
        progress: normalizeNumber(project.progress),
        images: normalizeNumber(project.images),
        status: project.status,
        dueStatus: getDueStatus(project),
    }));

    const employeeWorkloadData = employeeReportRows.map((employee) => ({
        name: employee.name,
        assignedTasks: employee.assignedTasks,
        completedTasks: employee.completedTasks,
        efficiency: employee.efficiency,
    }));

    const riskProjectRows = projectReportRows.filter((project) => (
        project.status !== "Completed" && ["Overdue", "Due Soon"].includes(project.dueStatus)
    )).sort((left, right) => normalizeNumber(left.progress) - normalizeNumber(right.progress));

    return {
        summary: {
            totalProjects: safeProjects.length,
            completedProjects,
            totalImages,
            completedImages,
            remainingImages,
            completionRate: totalImages > 0 ? formatPercent((completedImages / totalImages) * 100) : 0,
            totalTasks: safeTasks.length,
            completedTasks,
            openTasks,
            reviewQueue,
            totalTrackedSeconds,
            estimatedSeconds,
            utilizationRate: estimatedSeconds > 0 ? formatPercent((totalTrackedSeconds / estimatedSeconds) * 100) : 0,
            totalEmployeeHours: safeEmployees.reduce((total, employee) => total + normalizeNumber(employee.hoursToday), 0),
            averageEfficiency: formatPercent(averageEfficiency),
        },
        projectReportRows,
        timeReportRows,
        employeeReportRows,
        assignmentReportRows,
        taskStatusData,
        priorityData,
        projectAnalyticsRows,
        employeeWorkloadData,
        riskProjectRows,
    };
}

/**
 * Exports the selected report table to CSV.
 */
function downloadReportTable(filename, title, columns, rows) {
    const csv = createCsv(
        columns.map((column) => column.label),
        rows,
        columns.map((column) => column.key)
    );

    downloadTextFile(filename, `${title}\n${csv}`);
}

/**
 * Exports a complete operations report with project, assignment, time, and employee sections.
 */
function downloadFullOperationsReport(reportData) {
    const sections = [
        {
            title: "Project Delivery Report",
            columns: REPORT_PROJECT_COLUMNS,
            rows: reportData.projectReportRows,
        },
        {
            title: "Assignment Status Report",
            columns: REPORT_ASSIGNMENT_COLUMNS,
            rows: reportData.assignmentReportRows,
        },
        {
            title: "Task Time Report",
            columns: REPORT_TIME_COLUMNS,
            rows: reportData.timeReportRows,
        },
        {
            title: "Employee Productivity Report",
            columns: REPORT_EMPLOYEE_COLUMNS,
            rows: reportData.employeeReportRows,
        },
    ];

    const contents = sections.map((section) => createCsv(
        section.columns.map((column) => column.label),
        section.rows,
        section.columns.map((column) => column.key)
    )).map((csv, index) => `${sections[index].title}\n${csv}`).join("\n\n");

    downloadTextFile("photometrics-full-operations-report.csv", contents);
}

const REPORT_PROJECT_COLUMNS = [
    { label: "Project", key: "name" },
    { label: "Client", key: "client" },
    { label: "Due Date", key: "dueDate" },
    { label: "Images", key: "images", align: "center" },
    { label: "Completed", key: "completedImages", align: "center" },
    { label: "Remaining", key: "remainingImages", align: "center" },
    { label: "Progress", key: "progress", align: "center" },
    { label: "Status", key: "status", align: "center" },
    { label: "Due Status", key: "dueStatus", align: "center" },
];

const REPORT_TIME_COLUMNS = [
    { label: "Task", key: "taskName" },
    { label: "Project", key: "project" },
    { label: "Assigned To", key: "assignedTo" },
    { label: "Due Date", key: "dueDate" },
    { label: "Priority", key: "priority", align: "center" },
    { label: "Est. Hours", key: "estimatedHours", align: "center" },
    { label: "Tracked Time", key: "trackedTime", align: "center" },
    { label: "Utilization", key: "utilization", align: "center" },
    { label: "Status", key: "status", align: "center" },
];

const REPORT_EMPLOYEE_COLUMNS = [
    { label: "Employee", key: "name" },
    { label: "Role", key: "role" },
    { label: "Assigned Items", key: "assignedTasks", align: "center" },
    { label: "Completed", key: "completedTasks", align: "center" },
    { label: "Review Items", key: "reviewItems", align: "center" },
    { label: "Tracked Time", key: "trackedTime", align: "center" },
    { label: "Hours Today", key: "hoursToday", align: "center" },
    { label: "Efficiency", key: "efficiency", align: "center" },
    { label: "Status", key: "status", align: "center" },
];

const REPORT_ASSIGNMENT_COLUMNS = [
    { label: "Assignment", key: "id" },
    { label: "Project", key: "project" },
    { label: "Task Type", key: "taskType" },
    { label: "Assigned To", key: "assignedTo" },
    { label: "Assigned Date", key: "assignedDate" },
    { label: "Due Date", key: "dueDate" },
    { label: "Priority", key: "priority", align: "center" },
    { label: "Status", key: "status", align: "center" },
    { label: "Due Status", key: "dueStatus", align: "center" },
];

const ANALYTICS_COLORS = ["#7c3aed", "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#14b8a6"];

export {
    buildOperationsReportData,
    downloadReportTable,
    downloadFullOperationsReport,
    REPORT_PROJECT_COLUMNS,
    REPORT_TIME_COLUMNS,
    REPORT_EMPLOYEE_COLUMNS,
    REPORT_ASSIGNMENT_COLUMNS,
    ANALYTICS_COLORS,
};
