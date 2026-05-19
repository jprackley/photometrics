// -----------------------------------------------------------------------------
// General UI, Table, Export, and Timer Helpers
// -----------------------------------------------------------------------------
// Collects reusable constants and pure utility functions for sorting, paging,
// CSV downloads, duration formatting, due-date status, and task timer state.
// -----------------------------------------------------------------------------

const PROJECTS_PAGE_SIZE = 5;
const ASSIGNMENTS_PAGE_SIZE = 5;
const EMPLOYEES_PAGE_SIZE = 6;
const TASKS_PAGE_SIZE = 6;

const PROJECT_COLUMNS = [
    { label: "Project Name", key: "name" },
    { label: "Client", key: "client" },
    { label: "Start Date", key: "startDate" },
    { label: "Due Date", key: "dueDate" },
    { label: "Images", key: "images", align: "center" },
    { label: "Progress", key: "progress" },
    { label: "Status", key: "status", align: "center" },
];

const ASSIGNMENT_COLUMNS = [
    { label: "Assignment ID", key: "id" },
    { label: "Project", key: "project" },
    { label: "Task Type", key: "taskType" },
    { label: "Assigned To", key: "assignedTo" },
    { label: "Assigned Date", key: "assignedDate" },
    { label: "Due Date", key: "dueDate" },
    { label: "Priority", key: "priority", align: "center" },
    { label: "Status", key: "status", align: "center" },
];

const EMPLOYEE_COLUMNS = [
    { label: "Employee", key: "name" },
    { label: "Role", key: "role" },
    { label: "Current Task", key: "currentTask" },
    { label: "Active Tasks", key: "activeTasks", align: "center" },
    { label: "Completed Today", key: "completedToday", align: "center" },
    { label: "Hours Today", key: "hoursToday", align: "center" },
    { label: "Efficiency", key: "efficiency" },
    { label: "Status", key: "status", align: "center" },
];

const TASK_COLUMNS = [
    { label: "Task ID", key: "id" },
    { label: "Task Name", key: "taskName" },
    { label: "Project", key: "project" },
    { label: "Assigned To", key: "assignedTo" },
    { label: "Due Date", key: "dueDate" },
    { label: "Priority", key: "priority", align: "center" },
    { label: "Tracked Time", key: "trackedSeconds", align: "center" },
    { label: "Status", key: "status", align: "center" },
];

/**
 * Converts display-friendly numeric values into safe numbers for sorting, math, and progress calculations.
 */
function normalizeNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const numericValue = Number(String(value).replace(/,/g, ""));
    return Number.isNaN(numericValue) ? 0 : numericValue;
}

/**
 * Returns a comparable value for a table cell, handling numeric columns, date columns, and text columns consistently.
 */
function getSortableValue(row, key) {
    if (["images", "progress", "trackedSeconds", "estimatedHours", "activeTasks", "completedToday", "hoursToday", "efficiency"].includes(key)) {
        return normalizeNumber(row[key]);
    }

    if (["startDate", "dueDate", "assignedDate"].includes(key)) {
        const parsedDate = Date.parse(row[key]);
        return Number.isNaN(parsedDate) ? String(row[key] || "").toLowerCase() : parsedDate;
    }

    return String(row[key] || "").toLowerCase();
}

/**
 * Sorts table rows without mutating the original array so React state remains predictable.
 */
function sortRows(rows, sortConfig) {
    if (!sortConfig?.key) return rows;

    return [...rows].sort((leftRow, rightRow) => {
        const leftValue = getSortableValue(leftRow, sortConfig.key);
        const rightValue = getSortableValue(rightRow, sortConfig.key);

        if (leftValue < rightValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (leftValue > rightValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });
}

/**
 * Toggles a table column between ascending and descending sort order.
 */
function getNextSort(currentSort, columnKey) {
    if (currentSort.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
    }

    return {
        key: columnKey,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
    };
}

/**
 * Returns the rows that belong on the currently selected page.
 */
function paginateRows(rows, currentPage, pageSize) {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
}

/**
 * Calculates a safe page count, always returning at least one page for empty tables.
 */
function getTotalPages(totalRows, pageSize) {
    return Math.max(1, Math.ceil(totalRows / pageSize));
}

/**
 * Builds the page-number list used by table pagination controls.
 */
function buildPageNumbers(totalPages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
}

/**
 * Creates the human-readable pagination summary shown under each table.
 */
function getRangeText(currentPage, pageSize, totalRows, label) {
    if (totalRows === 0) return `Showing 0 to 0 of 0 ${label}`;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRows);
    return `Showing ${start} to ${end} of ${totalRows} ${label}`;
}

/**
 * Escapes CSV values so commas, quotes, and empty values export correctly.
 */
function csvEscape(value) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
}

/**
 * Builds a CSV string from selected row keys and display headers.
 */
function createCsv(headers, rows, keys) {
    const headerLine = headers.map(csvEscape).join(",");
    const dataLines = rows.map((row) => keys.map((key) => csvEscape(row[key])).join(","));
    return [headerLine, ...dataLines].join("\n");
}

/**
 * Triggers a browser download for generated CSV or text content.
 */
function downloadTextFile(filename, contents, mimeType = "text/csv;charset=utf-8;") {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Exports project and assignment data into a combined CSV report.
 */
function downloadProjectsReport(projectRows, assignmentRows) {
    const projectCsv = createCsv(
        ["Project ID", "Project Name", "Client", "Start Date", "Due Date", "Images", "Progress", "Status"],
        projectRows,
        ["id", "name", "client", "startDate", "dueDate", "images", "progress", "status"]
    );

    const assignmentCsv = createCsv(
        ["Assignment ID", "Project", "Task Type", "Assigned To", "Assigned Date", "Due Date", "Priority", "Status"],
        assignmentRows,
        ["id", "project", "taskType", "assignedTo", "assignedDate", "dueDate", "priority", "status"]
    );

    downloadTextFile(
        "photometrics-projects-report.csv",
        `Projects\n${projectCsv}\n\nAssignments\n${assignmentCsv}`
    );
}

/**
 * Creates sorted filter options from a row collection while preserving the default All option.
 */
function getUniqueOptions(rows, key, defaultLabel) {
    const values = [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
    return [defaultLabel, ...values];
}

/**
 * Generates the next display ID by scanning existing records for the largest numeric suffix.
 */
function generateNextId(prefix, rows) {
    const highestNumber = rows.reduce((highest, row) => {
        const numericPart = Number(String(row.id || "").replace(/\D/g, ""));
        return Number.isNaN(numericPart) ? highest : Math.max(highest, numericPart);
    }, 0);

    return `${prefix}-${highestNumber + 1}`;
}

/**
 * Formats a duration in seconds as HH:MM:SS for time-tracking displays.
 */
function formatDuration(totalSeconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
        .map((unit) => String(unit).padStart(2, "0"))
        .join(":");
}

/**
 * Chooses a stable user key for separating timer sessions by employee.
 */
function getTimerUserKey(user) {
    return user?.id || user?.email || user?.employeeId || "anonymous-user";
}

/**
 * Returns the timer state for the current user, falling back to legacy task-level timer fields when needed.
 */
function getTaskTimerSession(task, user) {
    const userKey = getTimerUserKey(user);
    const timersByUser = task?.timersByUser || {};
    const userTimer = timersByUser[userKey] || null;

    if (userTimer) {
        return {
            trackedSeconds: normalizeNumber(userTimer.trackedSeconds),
            startedAt: userTimer.startedAt || null,
            lastStoppedAt: userTimer.lastStoppedAt || task?.lastStoppedAt || "",
            userName: userTimer.userName || user?.employeeName || user?.name || "User",
        };
    }

    return {
        trackedSeconds: normalizeNumber(task?.trackedSeconds),
        startedAt: task?.timerStartedAt || null,
        lastStoppedAt: task?.lastStoppedAt || "",
        userName: user?.employeeName || user?.name || "User",
    };
}

/**
 * Calculates saved time plus any actively running timer time.
 */
function getLiveTrackedSeconds(task, currentTime, user = null) {
    if (!task) return 0;

    if (user) {
        const session = getTaskTimerSession(task, user);
        if (!session.startedAt) return session.trackedSeconds;
        return session.trackedSeconds + Math.floor((currentTime - session.startedAt) / 1000);
    }

    const timersByUser = task?.timersByUser || {};
    const timerEntries = Object.values(timersByUser);

    if (timerEntries.length === 0) {
        const savedSeconds = normalizeNumber(task?.trackedSeconds);
        if (!task?.timerStartedAt) return savedSeconds;
        return savedSeconds + Math.floor((currentTime - task.timerStartedAt) / 1000);
    }

    return timerEntries.reduce((total, timer) => {
        const savedSeconds = normalizeNumber(timer.trackedSeconds);
        if (!timer.startedAt) return total + savedSeconds;
        return total + savedSeconds + Math.floor((currentTime - timer.startedAt) / 1000);
    }, 0);
}

/**
 * Ensures each task has the timer structure required for per-user time tracking.
 */
function normalizeTaskForTimers(task) {
    return {
        ...task,
        // User-specific timer sessions live here so each logged-in employee can
        // run and stop their own timer without overwriting another user's timer.
        timersByUser: task?.timersByUser || {},
        timerStartedAt: null,
    };
}

/**
 * Exports task time-tracking data to CSV with formatted durations.
 */
function downloadTasksReport(taskRows) {
    const taskCsv = createCsv(
        ["Task ID", "Task Name", "Project", "Assigned To", "Due Date", "Priority", "Estimated Hours", "Tracked Time", "Status", "Last Stopped"],
        taskRows.map((task) => ({
            ...task,
            trackedTime: formatDuration(normalizeNumber(task.trackedSeconds)),
            lastStoppedAt: task.lastStoppedAt || "",
        })),
        ["id", "taskName", "project", "assignedTo", "dueDate", "priority", "estimatedHours", "trackedTime", "status", "lastStoppedAt"]
    );

    downloadTextFile("photometrics-task-time-report.csv", taskCsv);
}

/**
 * Exports employee status and productivity data to CSV.
 */
function downloadEmployeesReport(employeeRows) {
    const employeeCsv = createCsv(
        ["Employee ID", "Name", "Role", "Email", "Phone", "Status", "Current Task", "Active Tasks", "Completed Today", "Hours Today", "Efficiency", "Availability"],
        employeeRows,
        ["id", "name", "role", "email", "phone", "status", "currentTask", "activeTasks", "completedToday", "hoursToday", "efficiency", "availability"]
    );

    downloadTextFile("photometrics-employees-report.csv", employeeCsv);
}


/**
 * Formats a number for dashboard, report, and analytics summaries.
 */
function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Math.round(normalizeNumber(value)));
}

/**
 * Rounds percentages and keeps them in a safe 0 to 100 range.
 */
function formatPercent(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, Math.round(safeValue)));
}

/**
 * Compares a row due date against today and returns a manager-friendly status.
 */
function getDueStatus(row) {
    const status = String(row?.status || "").toLowerCase();
    if (status === "completed") return "Complete";

    const dueDate = Date.parse(row?.dueDate || "");
    if (Number.isNaN(dueDate)) return "No Date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((due - today) / 86400000);

    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue <= 3) return "Due Soon";
    if (daysUntilDue <= 7) return "Upcoming";
    return "On Track";
}

export {
    PROJECTS_PAGE_SIZE,
    ASSIGNMENTS_PAGE_SIZE,
    EMPLOYEES_PAGE_SIZE,
    TASKS_PAGE_SIZE,
    PROJECT_COLUMNS,
    ASSIGNMENT_COLUMNS,
    EMPLOYEE_COLUMNS,
    TASK_COLUMNS,
    normalizeNumber,
    getSortableValue,
    sortRows,
    getNextSort,
    paginateRows,
    getTotalPages,
    buildPageNumbers,
    getRangeText,
    csvEscape,
    createCsv,
    downloadTextFile,
    downloadProjectsReport,
    getUniqueOptions,
    generateNextId,
    formatDuration,
    getTimerUserKey,
    getTaskTimerSession,
    getLiveTrackedSeconds,
    normalizeTaskForTimers,
    downloadTasksReport,
    downloadEmployeesReport,
    formatNumber,
    formatPercent,
    getDueStatus,
};
