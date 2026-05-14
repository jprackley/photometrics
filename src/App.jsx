import React, { useEffect, useMemo, useState } from "react";

// Icons used throughout the UI
import {
    BarChart3,
    Bell,
    Clock,
    ChevronLeft,
    ChevronRight,
    Download,
    Folder,
    LayoutDashboard,
    ListChecks,
    LogOut,
    MoreVertical,
    Pencil,
    Play,
    Square,
    Trash2,
    Plus,
    Search,
    Settings,
    Sparkles,
    Users,
} from "lucide-react";

// Recharts components for graphs/charts
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";


// -----------------------------------------------------------------------------
// API PLACEHOLDERS
// -----------------------------------------------------------------------------
// The app is currently using the mock data below so the UI can keep working while
// Jesse is building the backend database. When the backend is ready, set
// VITE_USE_API_DATA=true in your .env file and update VITE_API_BASE_URL if needed.
// Expected API response format can be either a plain array/object or { data: ... }.
const USE_API_DATA = import.meta.env.VITE_USE_API_DATA;// === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API_ENDPOINTS = {
    dashboard: {
        kpis: "/dashboard/kpis",
        productivity: "/dashboard/productivity",
        workflow: "/dashboard/workflow",
        employeeActivity: "/dashboard/employee-activity",
        projectProgress: "/dashboard/project-progress",
    },
    projects: "/projects",
    assignments: "/assignments",
    employees: "/employees",
    tasks: "/tasks",
    timeEntries: "/time-entries",
    reports: "/reports",
    analytics: "/analytics",
    settings: "/settings",
};

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function unwrapApiPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload?.data !== undefined) return payload.data;
    if (payload?.items !== undefined) return payload.items;
    return payload;
}

function useApiPlaceholder(endpoint, fallbackData) {
    const [data, setData] = useState(fallbackData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        if (!USE_API_DATA || !endpoint) {
            setData(fallbackData);
            return undefined;
        }

        async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
                const payload = await apiRequest(endpoint);
                const nextData = unwrapApiPayload(payload);

                if (isMounted && nextData !== undefined) {
                    setData(nextData);
                }
            } catch (apiError) {
                if (isMounted) {
                    setError(apiError.message);
                    setData(fallbackData);
                }

                console.warn(`Using mock data for ${endpoint}.`, apiError);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [endpoint, fallbackData]);

    return { data, isLoading, error };
}

// These functions are not wired to forms yet. They are API holders for Jesse
//  to connect later when Create, Edit, Delete, and Export are built.
const apiPlaceholders = {
    createProject: (project) => apiRequest(API_ENDPOINTS.projects, {
        method: "POST",
        body: JSON.stringify(project),
    }),
    updateProject: (projectId, project) => apiRequest(`${API_ENDPOINTS.projects}/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(project),
    }),
    deleteProject: (projectId) => apiRequest(`${API_ENDPOINTS.projects}/${projectId}`, {
        method: "DELETE",
    }),
    createAssignment: (assignment) => apiRequest(API_ENDPOINTS.assignments, {
        method: "POST",
        body: JSON.stringify(assignment),
    }),
    updateAssignment: (assignmentId, assignment) => apiRequest(`${API_ENDPOINTS.assignments}/${assignmentId}`, {
        method: "PUT",
        body: JSON.stringify(assignment),
    }),
    deleteAssignment: (assignmentId) => apiRequest(`${API_ENDPOINTS.assignments}/${assignmentId}`, {
        method: "DELETE",
    }),
    createTask: (task) => apiRequest(API_ENDPOINTS.tasks, {
        method: "POST",
        body: JSON.stringify(task),
    }),
    updateTask: (taskId, task) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(task),
    }),
    deleteTask: (taskId) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "DELETE",
    }),
    startTaskTimer: (taskId, startedAt) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/start`, {
        method: "POST",
        body: JSON.stringify({ startedAt }),
    }),
    stopTaskTimer: (taskId, timeEntry) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/stop`, {
        method: "POST",
        body: JSON.stringify(timeEntry),
    }),
};

const PROJECTS_PAGE_SIZE = 5;
const ASSIGNMENTS_PAGE_SIZE = 5;
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

function normalizeNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const numericValue = Number(String(value).replace(/,/g, ""));
    return Number.isNaN(numericValue) ? 0 : numericValue;
}

function getSortableValue(row, key) {
    if (["images", "progress", "trackedSeconds", "estimatedHours"].includes(key)) {
        return normalizeNumber(row[key]);
    }

    if (["startDate", "dueDate", "assignedDate"].includes(key)) {
        const parsedDate = Date.parse(row[key]);
        return Number.isNaN(parsedDate) ? String(row[key] || "").toLowerCase() : parsedDate;
    }

    return String(row[key] || "").toLowerCase();
}

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

function getNextSort(currentSort, columnKey) {
    if (currentSort.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
    }

    return {
        key: columnKey,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
    };
}

function paginateRows(rows, currentPage, pageSize) {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
}

function getTotalPages(totalRows, pageSize) {
    return Math.max(1, Math.ceil(totalRows / pageSize));
}

function buildPageNumbers(totalPages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
}

function getRangeText(currentPage, pageSize, totalRows, label) {
    if (totalRows === 0) return `Showing 0 to 0 of 0 ${label}`;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRows);
    return `Showing ${start} to ${end} of ${totalRows} ${label}`;
}

function csvEscape(value) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
}

function createCsv(headers, rows, keys) {
    const headerLine = headers.map(csvEscape).join(",");
    const dataLines = rows.map((row) => keys.map((key) => csvEscape(row[key])).join(","));
    return [headerLine, ...dataLines].join("\n");
}

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

function getUniqueOptions(rows, key, defaultLabel) {
    const values = [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
    return [defaultLabel, ...values];
}

function generateNextId(prefix, rows) {
    const highestNumber = rows.reduce((highest, row) => {
        const numericPart = Number(String(row.id || "").replace(/\D/g, ""));
        return Number.isNaN(numericPart) ? highest : Math.max(highest, numericPart);
    }, 0);

    return `${prefix}-${highestNumber + 1}`;
}

function formatDuration(totalSeconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
        .map((unit) => String(unit).padStart(2, "0"))
        .join(":");
}

function getLiveTrackedSeconds(task, currentTime) {
    const savedSeconds = normalizeNumber(task?.trackedSeconds);

    if (!task?.timerStartedAt) {
        return savedSeconds;
    }

    return savedSeconds + Math.floor((currentTime - task.timerStartedAt) / 1000);
}

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

// Sidebar menu items
const navItems = [
    { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { label: "Projects", page: "projects", icon: Folder },
    { label: "Employees", page: "employees", icon: Users },
    { label: "Tasks", page: "tasks", icon: ListChecks },
    { label: "Reports", page: "reports", icon: BarChart3 },
    { label: "Analytics", page: "analytics", icon: Sparkles },
    { label: "Settings", page: "settings", icon: Settings },
];

// KPI card data
const kpis = [
    ["Total Projects", "12"],
    ["Tasks Completed Today", "45"],
    ["Images Completed", "3,256"],
    ["Average Editing Time", "18m 42s"],
    ["Total Employee Hours", "128.5"],
    ["Efficiency", "87%"],
];

// Productivity chart data
const productivity = [
    { day: "May 12", value: 30, color: "#d9252a" },
    { day: "May 13", value: 45, color: "#7fb347" },
    { day: "May 14", value: 32, color: "#7e57c2" },
    { day: "May 15", value: 44, color: "#35a9d6" },
    { day: "May 16", value: 58, color: "#35a9d6" },
    { day: "May 17", value: 29, color: "#f58a2a" },
    { day: "May 18", value: 48, color: "#0b3d64" },
];

// Workflow pie chart data
const workflow = [
    { name: "Editing", value: 40, color: "#ef233c" },
    { name: "Culling", value: 25, color: "#f5c400" },
    { name: "Review", value: 15, color: "#2fb344" },
    { name: "Completed", value: 20, color: "#2563eb" },
];

// Employee activity table data
const employeeActivity = [
    ["John Doe", "Editing", "2h 15m", "In Progress"],
    ["Jane Doe", "Culling", "1h 05m", "Completed"],
    ["Terry Lee", "Review", "45m", "In Progress"],
    ["David Kim", "Editing", "3h 10m", "In Progress"],
    ["Luis Garcia", "Culling", "1h 30m", "Completed"],
];

// Project progress data
const projectProgress = [
    ["Wedding - Smith", "1200", "900", "300", 75],
    ["Event - Johnson", "800", "650", "150", 81],
    ["Portrait - Sampson", "600", "450", "150", 75],
    ["Graduation - Hathaway", "1000", "800", "200", 80],
    ["Graduation - McDougal", "1000", "100", "900", 10],
];

// Projects table data
const projects = [
    {
        id: "PRJ-1235",
        name: "Graduation - Smith",
        client: "John Smith",
        startDate: "May 01, 2026",
        dueDate: "May 27, 2026",
        images: "1200",
        progress: 50,
        status: "In Progress",
    },
    {
        id: "PRJ-1236",
        name: "Graduation - Miller",
        client: "Steve Miller",
        startDate: "May 01, 2026",
        dueDate: "May 28, 2026",
        images: "800",
        progress: 50,
        status: "In Progress",
    },
    {
        id: "PRJ-1237",
        name: "Graduation - Franklen",
        client: "Jo Franklen",
        startDate: "May 01, 2026",
        dueDate: "May 29, 2026",
        images: "450",
        progress: 50,
        status: "Review",
    },
    {
        id: "PRJ-1238",
        name: "Graduation - Mcdougal",
        client: "Joe Mcdougal",
        startDate: "May 01, 2026",
        dueDate: "May 29, 2026",
        images: "600",
        progress: 100,
        status: "Completed",
    },
    {
        id: "PRJ-1239",
        name: "Graduation - Dunkan",
        client: "Fred Dunkan",
        startDate: "May 01, 2026",
        dueDate: "May 30, 2026",
        images: "300",
        progress: 50,
        status: "In Progress",
    },
    {
        id: "PRJ-1240",
        name: "Wedding - Smith",
        client: "Amanda Smith",
        startDate: "May 03, 2026",
        dueDate: "May 22, 2026",
        images: "1200",
        progress: 75,
        status: "In Progress",
    },
    {
        id: "PRJ-1241",
        name: "Wedding - Johnson",
        client: "Beth Johnson",
        startDate: "May 04, 2026",
        dueDate: "May 24, 2026",
        images: "950",
        progress: 65,
        status: "Review",
    },
    {
        id: "PRJ-1242",
        name: "Portrait - Sampson",
        client: "Elena Sampson",
        startDate: "May 05, 2026",
        dueDate: "May 18, 2026",
        images: "600",
        progress: 75,
        status: "Completed",
    },
    {
        id: "PRJ-1243",
        name: "Event - Johnson",
        client: "Mark Johnson",
        startDate: "May 06, 2026",
        dueDate: "May 25, 2026",
        images: "800",
        progress: 81,
        status: "In Progress",
    },
    {
        id: "PRJ-1244",
        name: "Graduation - Hathaway",
        client: "Lynn Hathaway",
        startDate: "May 07, 2026",
        dueDate: "May 26, 2026",
        images: "1000",
        progress: 80,
        status: "Review",
    },
    {
        id: "PRJ-1245",
        name: "Family - Peterson",
        client: "Nora Peterson",
        startDate: "May 08, 2026",
        dueDate: "May 31, 2026",
        images: "500",
        progress: 25,
        status: "In Progress",
    },
    {
        id: "PRJ-1246",
        name: "Corporate - Acme",
        client: "Acme Co.",
        startDate: "May 09, 2026",
        dueDate: "Jun 02, 2026",
        images: "700",
        progress: 10,
        status: "In Progress",
    },
];

// Assignment table data
const assignments = [
    {
        id: "ASG-2579",
        project: "Wedding - Smith",
        taskType: "Photo Editing",
        assignedTo: "John Freeman",
        assignedDate: "May 01, 2026",
        dueDate: "May 18, 2026",
        priority: "High",
        status: "In Progress",
    },
    {
        id: "ASG-2580",
        project: "Wedding - Smith",
        taskType: "Culling",
        assignedTo: "Larry Waymer",
        assignedDate: "May 01, 2026",
        dueDate: "May 16, 2026",
        priority: "Medium",
        status: "Completed",
    },
    {
        id: "ASG-2581",
        project: "Graduation - Mcdougal",
        taskType: "Photo Editing",
        assignedTo: "John Doe",
        assignedDate: "May 01, 2026",
        dueDate: "May 20, 2026",
        priority: "High",
        status: "In Progress",
    },
    {
        id: "ASG-2582",
        project: "Graduation - Duncan",
        taskType: "Retouching",
        assignedTo: "Sarah Conner",
        assignedDate: "May 01, 2026",
        dueDate: "May 15, 2026",
        priority: "Medium",
        status: "Review",
    },
    {
        id: "ASG-2583",
        project: "Graduation - Miller",
        taskType: "Color Correction",
        assignedTo: "Susan Conner",
        assignedDate: "May 01, 2026",
        dueDate: "May 8, 2026",
        priority: "High",
        status: "Completed",
    },
    {
        id: "ASG-2584",
        project: "Graduation - Smith",
        taskType: "Review",
        assignedTo: "John Freeman",
        assignedDate: "May 02, 2026",
        dueDate: "May 19, 2026",
        priority: "Medium",
        status: "In Progress",
    },
    {
        id: "ASG-2585",
        project: "Wedding - Johnson",
        taskType: "Photo Editing",
        assignedTo: "Susan Conner",
        assignedDate: "May 02, 2026",
        dueDate: "May 21, 2026",
        priority: "High",
        status: "Review",
    },
    {
        id: "ASG-2586",
        project: "Portrait - Sampson",
        taskType: "Final Export",
        assignedTo: "Sarah Conner",
        assignedDate: "May 03, 2026",
        dueDate: "May 17, 2026",
        priority: "Low",
        status: "Completed",
    },
    {
        id: "ASG-2587",
        project: "Event - Johnson",
        taskType: "Culling",
        assignedTo: "Larry Waymer",
        assignedDate: "May 03, 2026",
        dueDate: "May 19, 2026",
        priority: "Medium",
        status: "In Progress",
    },
    {
        id: "ASG-2588",
        project: "Graduation - Hathaway",
        taskType: "Retouching",
        assignedTo: "John Doe",
        assignedDate: "May 04, 2026",
        dueDate: "May 23, 2026",
        priority: "High",
        status: "Review",
    },
    {
        id: "ASG-2589",
        project: "Family - Peterson",
        taskType: "Photo Editing",
        assignedTo: "John Freeman",
        assignedDate: "May 04, 2026",
        dueDate: "May 24, 2026",
        priority: "Medium",
        status: "In Progress",
    },
    {
        id: "ASG-2590",
        project: "Corporate - Acme",
        taskType: "Culling",
        assignedTo: "Susan Conner",
        assignedDate: "May 05, 2026",
        dueDate: "May 26, 2026",
        priority: "Low",
        status: "In Progress",
    },
    {
        id: "ASG-2591",
        project: "Graduation - Franklen",
        taskType: "Review",
        assignedTo: "Sarah Conner",
        assignedDate: "May 05, 2026",
        dueDate: "May 27, 2026",
        priority: "Medium",
        status: "Review",
    },
    {
        id: "ASG-2592",
        project: "Graduation - Dunkan",
        taskType: "Color Correction",
        assignedTo: "Larry Waymer",
        assignedDate: "May 06, 2026",
        dueDate: "May 28, 2026",
        priority: "High",
        status: "In Progress",
    },
    {
        id: "ASG-2593",
        project: "Graduation - Smith",
        taskType: "Final Export",
        assignedTo: "John Doe",
        assignedDate: "May 06, 2026",
        dueDate: "May 29, 2026",
        priority: "Low",
        status: "Completed",
    },
];

// Task management and time tracking data
const taskItems = [
    {
        id: "TSK-3001",
        taskName: "Photo Editing Batch 1",
        project: "Wedding - Smith",
        assignedTo: "John Freeman",
        dueDate: "May 18, 2026",
        priority: "High",
        estimatedHours: 8,
        trackedSeconds: 8115,
        status: "In Progress",
        timerStartedAt: null,
        lastStoppedAt: "May 13, 2026 4:15 PM",
    },
    {
        id: "TSK-3002",
        taskName: "Culling Gallery",
        project: "Wedding - Smith",
        assignedTo: "Larry Waymer",
        dueDate: "May 16, 2026",
        priority: "Medium",
        estimatedHours: 4,
        trackedSeconds: 3900,
        status: "Completed",
        timerStartedAt: null,
        lastStoppedAt: "May 13, 2026 11:30 AM",
    },
    {
        id: "TSK-3003",
        taskName: "Senior Portrait Retouching",
        project: "Graduation - Mcdougal",
        assignedTo: "John Doe",
        dueDate: "May 20, 2026",
        priority: "High",
        estimatedHours: 6,
        trackedSeconds: 5400,
        status: "In Progress",
        timerStartedAt: null,
        lastStoppedAt: "May 12, 2026 2:40 PM",
    },
    {
        id: "TSK-3004",
        taskName: "Color Correction Review",
        project: "Graduation - Miller",
        assignedTo: "Susan Conner",
        dueDate: "May 08, 2026",
        priority: "High",
        estimatedHours: 3,
        trackedSeconds: 7200,
        status: "Completed",
        timerStartedAt: null,
        lastStoppedAt: "May 08, 2026 3:10 PM",
    },
    {
        id: "TSK-3005",
        taskName: "Final Export Prep",
        project: "Portrait - Sampson",
        assignedTo: "Sarah Conner",
        dueDate: "May 17, 2026",
        priority: "Low",
        estimatedHours: 2,
        trackedSeconds: 1800,
        status: "Review",
        timerStartedAt: null,
        lastStoppedAt: "May 13, 2026 9:20 AM",
    },
    {
        id: "TSK-3006",
        taskName: "Event Gallery Culling",
        project: "Event - Johnson",
        assignedTo: "Larry Waymer",
        dueDate: "May 19, 2026",
        priority: "Medium",
        estimatedHours: 5,
        trackedSeconds: 2400,
        status: "In Progress",
        timerStartedAt: null,
        lastStoppedAt: "May 13, 2026 1:05 PM",
    },
    {
        id: "TSK-3007",
        taskName: "Graduation Review Set",
        project: "Graduation - Franklen",
        assignedTo: "Sarah Conner",
        dueDate: "May 27, 2026",
        priority: "Medium",
        estimatedHours: 4,
        trackedSeconds: 0,
        status: "Not Started",
        timerStartedAt: null,
        lastStoppedAt: "",
    },
    {
        id: "TSK-3008",
        taskName: "Corporate Image Cleanup",
        project: "Corporate - Acme",
        assignedTo: "Susan Conner",
        dueDate: "May 26, 2026",
        priority: "Low",
        estimatedHours: 6,
        trackedSeconds: 3600,
        status: "In Progress",
        timerStartedAt: null,
        lastStoppedAt: "May 11, 2026 10:45 AM",
    },
];

const placeholderPages = {
    employees: "Employees",
    reports: "Reports",
    analytics: "Analytics",
    settings: "Settings",
};

// Company logo component
function Logo() {
    return (
        <div className="flex items-center justify-center w-full">
            <img
                src="https://chambermaster.blob.core.windows.net/images/customers/2243/members/7487/logos/MEMBER_PAGE_HEADER/CM_final_logo_(2).jpg"
                alt="Company Logo"
                className="h-[70px] w-auto object-contain"
            />
        </div>
    );
}

// Left sidebar navigation
function Sidebar({ isCollapsed, activePage, onPageChange, onToggle }) {
    return (
        <aside
            className={`flex min-h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
                isCollapsed ? "w-[84px]" : "w-[260px]"
            }`}
        >

            {/* Logo section */}
            <div
                className={`flex h-[86px] items-center border-b border-slate-200 px-4 ${
                    isCollapsed ? "justify-center" : "justify-between"
                }`}
            >
                {!isCollapsed && <Logo />}

                {/* Collapse menu button */}
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-100"
                >
                    {isCollapsed
                        ? <ChevronRight size={22} />
                        : <ChevronLeft size={22} />}
                </button>
            </div>

            {/* Navigation buttons */}
            <nav className="flex-1 space-y-3 p-4 pt-6">
                {navItems.map(({ label, page, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        title={isCollapsed ? label : undefined}
                        onClick={() => onPageChange(page)}

                        // Highlight active page button
                        className={`flex w-full items-center rounded-xl py-3 text-lg transition hover:bg-slate-100 ${
                            isCollapsed ? "justify-center px-0" : "gap-4 px-4 text-left"
                        } ${
                            activePage === page
                                ? "bg-slate-100 font-semibold text-violet-700"
                                : "font-medium text-slate-800"
                        }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                        {!isCollapsed && <span>{label}</span>}
                    </button>
                ))}
            </nav>

            {/* Logout button */}
            <button
                title={isCollapsed ? "Logout" : undefined}
                className={`m-4 flex items-center rounded-xl py-3 text-lg font-semibold hover:bg-slate-100 ${
                    isCollapsed ? "justify-center px-0" : "gap-4 px-4"
                }`}
            >
                <LogOut size={24} />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </aside>
    );
}

// Top header bar
function Topbar({ onPageChange }) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);

    const notifications = [
        "3 projects are due this week",
        "2 assignments are ready for review",
        "Project export is available from the Projects tab",
    ];

    const closeMenus = () => {
        setIsNotificationsOpen(false);
        setIsManagerMenuOpen(false);
    };

    const goToPage = (nextPage) => {
        closeMenus();
        onPageChange?.(nextPage);
    };

    return (
        <header className="relative flex h-[86px] items-center justify-between border-b border-slate-200 bg-white px-8">

            {/* Search bar */}
            <div className="flex w-[380px] items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 shadow-sm">
                <Search size={20} className="text-slate-500" />
                <input className="w-full text-base outline-none" placeholder="Search" />
            </div>

            {/* User info area */}
            <div className="flex items-center gap-5 pr-2">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsNotificationsOpen((value) => !value);
                            setIsManagerMenuOpen(false);
                        }}
                        className="relative rounded-xl p-2 transition hover:bg-slate-100"
                        aria-label="Open notifications"
                        title="Notifications"
                    >
                        <Bell size={24} />
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-violet-600" />
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <div className="border-b border-slate-200 px-4 py-3 font-bold">
                                Notifications
                            </div>

                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification}
                                        type="button"
                                        onClick={() => goToPage("projects")}
                                        className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        {notification}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => goToPage("reports")}
                                className="w-full border-t border-slate-200 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                            >
                                View notification report
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsManagerMenuOpen((value) => !value);
                            setIsNotificationsOpen(false);
                        }}
                        className="flex items-center gap-4 rounded-xl px-2 py-1 transition hover:bg-slate-100"
                        aria-label="Open manager menu"
                        title="Manager menu"
                    >
                        {/* User profile image */}
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 shadow-sm">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI6QNyB22A2rTJfdHWecRsPWOH4OlbAUGIhQ&s"
                                alt="Logged in manager"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <span className="text-lg font-bold">Manager⌄</span>
                    </button>

                    {isManagerMenuOpen && (
                        <div className="absolute right-0 z-40 mt-3 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <button
                                type="button"
                                onClick={() => goToPage("employees")}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50"
                            >
                                <Users size={18} /> Manager Profile
                            </button>

                            <button
                                type="button"
                                onClick={() => goToPage("settings")}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50"
                            >
                                <Settings size={18} /> Account Settings
                            </button>

                            <button
                                type="button"
                                onClick={closeMenus}
                                className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

// Status badge component
function Badge({ value }) {

    // Set badge colors based on status
    const style =
        value === "Completed"
            ? "bg-emerald-100 text-emerald-700"
            : value === "Review"
                ? "bg-amber-100 text-amber-700"
                : "bg-violet-100 text-violet-700";

    return (
        <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>
            {value}
        </span>
    );
}

// Priority badge component
function PriorityBadge({ value }) {

    // Set badge colors based on priority
    const style =
        value === "High"
            ? "bg-red-100 text-red-700"
            : value === "Medium"
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>
            {value}
        </span>
    );
}

// Reusable progress bar component
function ProgressBar({ value }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-3 flex-1 rounded-full border border-slate-300 bg-white">
                <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${value}%` }}
                />
            </div>

            <span className="w-10 text-xs font-semibold text-slate-700">
                {value}%
            </span>
        </div>
    );
}

// Action buttons used in the Projects tab tables
function RowActions({ onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-center gap-3 text-slate-700">
            <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label="Edit row"
                title="Edit"
            >
                <Pencil size={18} />
            </button>

            <button
                type="button"
                onClick={onDelete}
                className="rounded-md p-1 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete row"
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}

// Select control used in the Projects tab filter bar
function FilterSelect({ value, onChange, options }) {
    return (
        <select
            className="h-10 min-w-[150px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}

function SortableHeader({ column, sortConfig, onSort }) {
    const isActive = sortConfig.key === column.key;
    const sortIcon = isActive
        ? sortConfig.direction === "asc" ? "↑" : "↓"
        : "↕";

    return (
        <th className="border border-slate-300 px-4 py-3 text-left font-bold">
            <button
                type="button"
                onClick={() => onSort(column.key)}
                className={`flex w-full items-center gap-2 ${column.align === "center" ? "justify-center" : "justify-start"}`}
                title={`Sort by ${column.label}`}
            >
                <span>{column.label}</span>
                <span className={`text-xs ${isActive ? "text-violet-700" : "text-slate-400"}`}>
                    {sortIcon}
                </span>
            </button>
        </th>
    );
}

// Pagination footer used by the Projects tab tables
function TableFooter({ text, currentPage, totalPages, onPageChange }) {
    const pages = buildPageNumbers(totalPages);

    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span>{text}</span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {pages.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        onClick={() => onPageChange(pageNumber)}
                        className={`h-7 w-7 rounded-md text-xs font-semibold ${
                            pageNumber === currentPage
                                ? "bg-violet-600 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        {pageNumber}
                    </button>
                ))}

                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <label className="space-y-1 text-sm font-semibold text-slate-700">
            <span>{label}</span>
            {children}
        </label>
    );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
    return (
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
    );
}

function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1 text-2xl leading-none hover:bg-slate-100"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ProjectForm({ initialProject, onCancel, onSave }) {
    const [form, setForm] = useState(initialProject);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            images: String(form.images || "0"),
            progress: Math.max(0, Math.min(100, normalizeNumber(form.progress))),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Project Name">
                    <TextInput value={form.name} onChange={(value) => updateField("name", value)} placeholder="Graduation - Smith" />
                </FormField>

                <FormField label="Client">
                    <TextInput value={form.client} onChange={(value) => updateField("client", value)} placeholder="Client name" />
                </FormField>

                <FormField label="Start Date">
                    <TextInput value={form.startDate} onChange={(value) => updateField("startDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 27, 2026" />
                </FormField>

                <FormField label="Images">
                    <TextInput value={form.images} onChange={(value) => updateField("images", value)} placeholder="1200" type="number" />
                </FormField>

                <FormField label="Progress">
                    <TextInput value={form.progress} onChange={(value) => updateField("progress", value)} placeholder="50" type="number" />
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Project
                </button>
            </div>
        </form>
    );
}

function AssignmentForm({ initialAssignment, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialAssignment);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.filter((option) => option !== "All Projects").map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Task Type">
                    <TextInput value={form.taskType} onChange={(value) => updateField("taskType", value)} placeholder="Photo Editing" />
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="employee-options">
                        {employeeOptions.filter((option) => option !== "All Employees").map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Assigned Date">
                    <TextInput value={form.assignedDate} onChange={(value) => updateField("assignedDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Assignment
                </button>
            </div>
        </form>
    );
}

// Creates colored chart line segments// Creates colored chart line segments
function ColoredLineSegment({ data, segment, index }) {

    // Skip last item
    if (index === data.length - 1) return null;

    return (
        <Line
            type="monotone"

            // Only render current + next data point
            dataKey={(row) => {
                const currentIndex = data.findIndex(
                    (item) => item.day === row.day
                );

                return currentIndex === index ||
                currentIndex === index + 1
                    ? row.value
                    : null;
            }}

            stroke={segment.color}
            strokeWidth={6}
            dot={false}
            activeDot={false}
            connectNulls={false}
            legendType="none"
        />
    );
}

// Main dashboard page
function Dashboard({ onPageChange }) {
    const { data: dashboardKpis } = useApiPlaceholder(API_ENDPOINTS.dashboard.kpis, kpis);
    const { data: productivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.productivity, productivity);
    const { data: workflowData } = useApiPlaceholder(API_ENDPOINTS.dashboard.workflow, workflow);
    const { data: employeeActivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.employeeActivity, employeeActivity);
    const { data: projectProgressData } = useApiPlaceholder(API_ENDPOINTS.dashboard.projectProgress, projectProgress);

    return (
        <section className="space-y-5 bg-slate-50 p-6">

            {/* KPI cards */}
            <div className="grid grid-cols-6 gap-4">
                {dashboardKpis.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-7 text-center shadow-sm"
                    >
                        <div className="text-sm font-bold">{label}</div>

                        {/* Highlight efficiency in green */}
                        <div
                            className={`mt-6 text-4xl ${
                                label === "Efficiency"
                                    ? "text-green-700"
                                    : "text-black"
                            }`}
                        >
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-[1.07fr_0.93fr] gap-5">

                {/* Productivity chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
                        Employee Productivity Over Time
                    </h2>

                    <ResponsiveContainer width="100%" height={230}>
                        <LineChart
                            data={productivityData}
                            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="4 4"
                                stroke="#d8dde6"
                            />

                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={12}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 60]}
                                ticks={[0, 15, 30, 45, 60]}
                            />

                            <Tooltip />

                            {/* Visible trend line with custom colored data points */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#7c3aed"
                                strokeWidth={4}
                                activeDot={{ r: 7 }}
                                label={{
                                    position: "top",
                                    fill: "#111827",
                                    fontSize: 14
                                }}
                                dot={(props) => {
                                    const item = productivityData[props.index];

                                    return (
                                        <circle
                                            cx={props.cx}
                                            cy={props.cy}
                                            r={5}
                                            fill="white"
                                            stroke={item?.color || "#7c3aed"}
                                            strokeWidth={3}
                                        />
                                    );
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Workflow pie chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
                        Workflow Distribution
                    </h2>

                    <div className="flex h-[230px] items-center justify-center gap-16">

                        {/* Pie chart */}
                        <ResponsiveContainer width="40%" height="100%">
                            <PieChart>
                                <Pie
                                    data={workflowData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={92}
                                    label={false}
                                    labelLine={false}
                                    stroke="white"
                                    strokeWidth={4}
                                >
                                    {workflowData.map((item) => (
                                        <Cell
                                            key={item.name}
                                            fill={item.color}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="w-64 space-y-5">
                            {workflowData.map((item) => (
                                <div
                                    key={item.name}
                                    className="grid grid-cols-[1fr_auto] items-center gap-8"
                                >
                                    <div
                                        className="flex items-center gap-4"
                                        style={{ color: item.color }}
                                    >
                                        <span
                                            className="h-4 w-4 rounded-full"
                                            style={{
                                                backgroundColor: item.color
                                            }}
                                        />

                                        <span className="text-base font-medium">
                                            {item.name}
                                        </span>
                                    </div>

                                    <strong className="text-base">
                                        {item.value}%
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom tables */}
            <div className="grid grid-cols-[0.95fr_1.05fr] gap-5">
                <EmployeeActivityPanel
                    rows={employeeActivityData}
                    onViewAll={() => onPageChange?.("employees")}
                />
                <ProjectProgressPanel
                    rows={projectProgressData}
                    onViewAll={() => onPageChange?.("projects")}
                />
            </div>
        </section>
    );
}

// Employee activity table
function EmployeeActivityPanel({ rows = employeeActivity, onViewAll }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Employee Activity
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Employee", "Current Task", "Time Spent", "Status"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {rows.map((row) => (
                    <tr key={row[0]}>
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            <Badge value={row[3]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button
                type="button"
                onClick={onViewAll}
                className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
            >
                View all employees →
            </button>
        </div>
    );
}

// Project progress table
function ProjectProgressPanel({ rows = projectProgress, onViewAll }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Project Progress
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Project", "Total Images", "Completed", "Remaining", "Progress"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {rows.map((row) => (
                    <tr key={row[0]}>
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[3]}
                        </td>

                        {/* Progress bar */}
                        <td className="border border-slate-300 px-3 py-2">
                            <ProgressBar value={row[4]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button
                type="button"
                onClick={onViewAll}
                className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
            >
                View all projects →
            </button>
        </div>
    );
}

// Projects + assignments page
function ProjectsAndAssignments() {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const [projectRows, setProjectRows] = useState(projects);
    const [assignmentRows, setAssignmentRows] = useState(assignments);
    const [projectSort, setProjectSort] = useState({ key: "name", direction: "asc" });
    const [assignmentSort, setAssignmentSort] = useState({ key: "id", direction: "asc" });
    const [projectPage, setProjectPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [projectModal, setProjectModal] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState(null);

    useEffect(() => {
        if (Array.isArray(loadedProjectRows)) {
            setProjectRows(loadedProjectRows);
        }
    }, [loadedProjectRows]);

    useEffect(() => {
        if (Array.isArray(loadedAssignmentRows)) {
            setAssignmentRows(loadedAssignmentRows);
        }
    }, [loadedAssignmentRows]);

    const projectOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "project", "All Projects"),
        [assignmentRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "assignedTo", "All Employees"),
        [assignmentRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "status", "All Status"),
        [assignmentRows]
    );

    const filteredAssignmentRows = useMemo(() => {
        return assignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            return matchesProject && matchesEmployee && matchesStatus;
        });
    }, [assignmentRows, projectFilter, employeeFilter, statusFilter]);

    const sortedProjectRows = useMemo(
        () => sortRows(projectRows, projectSort),
        [projectRows, projectSort]
    );

    const sortedAssignmentRows = useMemo(
        () => sortRows(filteredAssignmentRows, assignmentSort),
        [filteredAssignmentRows, assignmentSort]
    );

    const projectTotalPages = getTotalPages(sortedProjectRows.length, PROJECTS_PAGE_SIZE);
    const assignmentTotalPages = getTotalPages(sortedAssignmentRows.length, ASSIGNMENTS_PAGE_SIZE);

    const visibleProjectRows = paginateRows(sortedProjectRows, projectPage, PROJECTS_PAGE_SIZE);
    const visibleAssignmentRows = paginateRows(sortedAssignmentRows, assignmentPage, ASSIGNMENTS_PAGE_SIZE);

    useEffect(() => {
        if (projectPage > projectTotalPages) {
            setProjectPage(projectTotalPages);
        }
    }, [projectPage, projectTotalPages]);

    useEffect(() => {
        if (assignmentPage > assignmentTotalPages) {
            setAssignmentPage(assignmentTotalPages);
        }
    }, [assignmentPage, assignmentTotalPages]);

    const openNewProjectModal = () => {
        setProjectModal({
            mode: "create",
            data: {
                id: generateNextId("PRJ", projectRows),
                name: "",
                client: "",
                startDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                images: "0",
                progress: 0,
                status: "In Progress",
            },
        });
    };

    const openNewAssignmentModal = () => {
        const firstProjectName = projectRows[0]?.name || "";

        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("ASG", assignmentRows),
                project: firstProjectName,
                taskType: "",
                assignedTo: "",
                assignedDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                priority: "Medium",
                status: "In Progress",
            },
        });
    };

    const saveProject = async (project) => {
        const cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: project.name.trim() || "Untitled Project",
            client: project.client.trim() || "Unassigned Client",
        };

        if (USE_API_DATA) {
            try {
                if (projectModal.mode === "create") {
                    await apiPlaceholders.createProject(cleanProject);
                } else {
                    await apiPlaceholders.updateProject(cleanProject.id, cleanProject);
                }
            } catch (apiError) {
                console.warn("Project API holder is not connected yet. Saving locally.", apiError);
            }
        }

        setProjectRows((currentRows) => {
            if (projectModal.mode === "create") {
                return [cleanProject, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanProject.id ? cleanProject : row);
        });
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        const cleanAssignment = {
            ...assignment,
            id: assignment.id || generateNextId("ASG", assignmentRows),
            taskType: assignment.taskType.trim() || "General Task",
            assignedTo: assignment.assignedTo.trim() || "Unassigned",
        };

        if (USE_API_DATA) {
            try {
                if (assignmentModal.mode === "create") {
                    await apiPlaceholders.createAssignment(cleanAssignment);
                } else {
                    await apiPlaceholders.updateAssignment(cleanAssignment.id, cleanAssignment);
                }
            } catch (apiError) {
                console.warn("Assignment API holder is not connected yet. Saving locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => {
            if (assignmentModal.mode === "create") {
                return [cleanAssignment, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanAssignment.id ? cleanAssignment : row);
        });
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!window.confirm(`Delete ${project.name}?`)) return;

        if (USE_API_DATA) {
            try {
                await apiPlaceholders.deleteProject(project.id);
            } catch (apiError) {
                console.warn("Project delete API holder is not connected yet. Deleting locally.", apiError);
            }
        }

        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!window.confirm(`Delete ${assignment.id}?`)) return;

        if (USE_API_DATA) {
            try {
                await apiPlaceholders.deleteAssignment(assignment.id);
            } catch (apiError) {
                console.warn("Assignment delete API holder is not connected yet. Deleting locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => currentRows.filter((row) => row.id !== assignment.id));
    };

    const handleProjectSort = (columnKey) => {
        setProjectSort((currentSort) => getNextSort(currentSort, columnKey));
        setProjectPage(1);
    };

    const handleAssignmentSort = (columnKey) => {
        setAssignmentSort((currentSort) => getNextSort(currentSort, columnKey));
        setAssignmentPage(1);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-6">

            {/* Projects table */}
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="flex items-center gap-3 text-2xl font-bold">
                        <Folder size={26} /> Projects
                    </h2>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => downloadProjectsReport(projectRows, assignmentRows)}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Download size={16} /> Export Report
                        </button>

                        <button
                            type="button"
                            onClick={openNewProjectModal}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {PROJECT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={projectSort}
                                onSort={handleProjectSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleProjectRows.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3">
                                <div className="font-semibold text-slate-900">{project.name}</div>
                                <div className="text-xs text-slate-500">{project.id}</div>
                            </td>

                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">{project.images}</td>

                            <td className="border border-slate-300 px-4 py-3">
                                <ProgressBar value={project.progress} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <Badge value={project.status} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3">
                                <RowActions
                                    onEdit={() => setProjectModal({ mode: "edit", data: project })}
                                    onDelete={() => deleteProject(project)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleProjectRows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No projects found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(projectPage, PROJECTS_PAGE_SIZE, sortedProjectRows.length, "projects")}
                    currentPage={projectPage}
                    totalPages={projectTotalPages}
                    onPageChange={setProjectPage}
                />
            </div>

            {/* Assignments table */}
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="flex items-center gap-3 text-2xl font-bold">
                        <ListChecks size={26} /> Assignments
                    </h2>

                    <div className="flex items-center gap-3">
                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={statusOptions}
                        />

                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {ASSIGNMENT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={assignmentSort}
                                onSort={handleAssignmentSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                {assignment.id}
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.dueDate}</td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <PriorityBadge value={assignment.priority} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <Badge value={assignment.status} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3">
                                <RowActions
                                    onEdit={() => setAssignmentModal({ mode: "edit", data: assignment })}
                                    onDelete={() => deleteAssignment(assignment)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleAssignmentRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assignments found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assignments")}
                    currentPage={assignmentPage}
                    totalPages={assignmentTotalPages}
                    onPageChange={setAssignmentPage}
                />
            </div>

            {projectModal && (
                <Modal
                    title={projectModal.mode === "create" ? "New Project" : "Edit Project"}
                    onClose={() => setProjectModal(null)}
                >
                    <ProjectForm
                        initialProject={projectModal.data}
                        onCancel={() => setProjectModal(null)}
                        onSave={saveProject}
                    />
                </Modal>
            )}

            {assignmentModal && (
                <Modal
                    title={assignmentModal.mode === "create" ? "New Assignment" : "Edit Assignment"}
                    onClose={() => setAssignmentModal(null)}
                >
                    <AssignmentForm
                        initialAssignment={assignmentModal.data}
                        projectOptions={["All Projects", ...projectRows.map((project) => project.name)]}
                        employeeOptions={employeeOptions}
                        onCancel={() => setAssignmentModal(null)}
                        onSave={saveAssignment}
                    />
                </Modal>
            )}
        </section>
    );
}


function TaskForm({ initialTask, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialTask);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            taskName: form.taskName.trim() || "Untitled Task",
            assignedTo: form.assignedTo.trim() || "Unassigned",
            estimatedHours: normalizeNumber(form.estimatedHours),
            trackedSeconds: normalizeNumber(form.trackedSeconds),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Task Name">
                    <TextInput value={form.taskName} onChange={(value) => updateField("taskName", value)} placeholder="Photo Editing Batch 1" />
                </FormField>

                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="task-employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="task-employee-options">
                        {employeeOptions.map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Estimated Hours">
                    <TextInput value={form.estimatedHours} onChange={(value) => updateField("estimatedHours", value)} placeholder="8" type="number" />
                </FormField>

                <FormField label="Saved Time In Seconds">
                    <TextInput value={form.trackedSeconds} onChange={(value) => updateField("trackedSeconds", value)} placeholder="0" type="number" />
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Task
                </button>
            </div>
        </form>
    );
}

function TimerControl({ task, currentTime, onStart, onStop, isAnotherTimerRunning }) {
    const isRunning = Boolean(task.timerStartedAt);

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => isRunning ? onStop(task) : onStart(task)}
                disabled={!isRunning && isAnotherTimerRunning}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                title={isRunning ? "Stop timer" : "Start timer"}
            >
                {isRunning ? <Square size={14} /> : <Play size={14} />}
                {isRunning ? "Stop" : "Start"}
            </button>

            <span className={`min-w-[76px] text-xs font-bold ${isRunning ? "text-violet-700" : "text-slate-700"}`}>
                {formatDuration(getLiveTrackedSeconds(task, currentTime))}
            </span>
        </div>
    );
}

function TaskManagementPage() {
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasks, taskItems);
    const [taskRows, setTaskRows] = useState(taskItems);
    const [taskSort, setTaskSort] = useState({ key: "dueDate", direction: "asc" });
    const [taskPage, setTaskPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [taskModal, setTaskModal] = useState(null);
    const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
    const [timerTick, setTimerTick] = useState(Date.now());

    useEffect(() => {
        if (Array.isArray(loadedTaskRows)) {
            setTaskRows(loadedTaskRows.map((task) => ({ ...task, timerStartedAt: task.timerStartedAt || null })));
        }
    }, [loadedTaskRows]);

    useEffect(() => {
        if (!activeTimerTaskId) return undefined;

        const intervalId = window.setInterval(() => {
            setTimerTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [activeTimerTaskId]);

    const projectOptions = useMemo(
        () => getUniqueOptions(taskRows, "project", "All Projects"),
        [taskRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(taskRows, "assignedTo", "All Employees"),
        [taskRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(taskRows, "status", "All Status"),
        [taskRows]
    );

    const filteredTaskRows = useMemo(() => {
        return taskRows.filter((task) => {
            const matchesProject = projectFilter === "All Projects" || task.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || task.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;
            return matchesProject && matchesEmployee && matchesStatus;
        });
    }, [taskRows, projectFilter, employeeFilter, statusFilter]);

    const sortedTaskRows = useMemo(
        () => sortRows(filteredTaskRows, taskSort),
        [filteredTaskRows, taskSort]
    );

    const taskTotalPages = getTotalPages(sortedTaskRows.length, TASKS_PAGE_SIZE);
    const visibleTaskRows = paginateRows(sortedTaskRows, taskPage, TASKS_PAGE_SIZE);
    const activeTask = taskRows.find((task) => task.id === activeTimerTaskId);
    const totalTrackedSeconds = taskRows.reduce((total, task) => total + getLiveTrackedSeconds(task, timerTick), 0);
    const completedTasks = taskRows.filter((task) => task.status === "Completed").length;
    const reviewTasks = taskRows.filter((task) => task.status === "Review").length;
    const openTasks = taskRows.filter((task) => task.status !== "Completed").length;

    useEffect(() => {
        if (taskPage > taskTotalPages) {
            setTaskPage(taskTotalPages);
        }
    }, [taskPage, taskTotalPages]);

    const handleTaskSort = (columnKey) => {
        setTaskSort((currentSort) => getNextSort(currentSort, columnKey));
        setTaskPage(1);
    };

    const openNewTaskModal = () => {
        const projectNames = projectRowsForTasks();

        setTaskModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", taskRows),
                taskName: "",
                project: projectNames[0] || "Unassigned Project",
                assignedTo: "",
                dueDate: "May 30, 2026",
                priority: "Medium",
                estimatedHours: 1,
                trackedSeconds: 0,
                status: "Not Started",
                timerStartedAt: null,
                lastStoppedAt: "",
            },
        });
    };

    const projectRowsForTasks = () => {
        const taskProjects = taskRows.map((task) => task.project).filter(Boolean);
        const masterProjects = projects.map((project) => project.name).filter(Boolean);
        return [...new Set([...masterProjects, ...taskProjects])].sort();
    };

    const saveTask = async (task) => {
        const cleanTask = {
            ...task,
            id: task.id || generateNextId("TSK", taskRows),
            taskName: task.taskName.trim() || "Untitled Task",
            assignedTo: task.assignedTo.trim() || "Unassigned",
            timerStartedAt: task.timerStartedAt || null,
            trackedSeconds: normalizeNumber(task.trackedSeconds),
        };

        if (USE_API_DATA) {
            try {
                if (taskModal.mode === "create") {
                    await apiPlaceholders.createTask(cleanTask);
                } else {
                    await apiPlaceholders.updateTask(cleanTask.id, cleanTask);
                }
            } catch (apiError) {
                console.warn("Task API holder is not connected yet. Saving locally.", apiError);
            }
        }

        setTaskRows((currentRows) => {
            if (taskModal.mode === "create") {
                return [cleanTask, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanTask.id ? cleanTask : row);
        });
        setTaskPage(1);
        setTaskModal(null);
    };

    const deleteTask = async (task) => {
        if (!window.confirm(`Delete ${task.taskName}?`)) return;

        if (USE_API_DATA) {
            try {
                await apiPlaceholders.deleteTask(task.id);
            } catch (apiError) {
                console.warn("Task delete API holder is not connected yet. Deleting locally.", apiError);
            }
        }

        if (activeTimerTaskId === task.id) {
            setActiveTimerTaskId(null);
        }

        setTaskRows((currentRows) => currentRows.filter((row) => row.id !== task.id));
    };

    const startTimer = async (task) => {
        if (activeTimerTaskId && activeTimerTaskId !== task.id) {
            window.alert("Please stop the active timer before starting another task.");
            return;
        }

        const startedAt = Date.now();

        if (USE_API_DATA) {
            try {
                await apiPlaceholders.startTaskTimer(task.id, new Date(startedAt).toISOString());
            } catch (apiError) {
                console.warn("Start timer API holder is not connected yet. Starting locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            row.id === task.id
                ? { ...row, timerStartedAt: startedAt, status: row.status === "Completed" ? "In Progress" : row.status }
                : row
        )));
        setActiveTimerTaskId(task.id);
        setTimerTick(startedAt);
    };

    const stopTimer = async (task) => {
        if (!task.timerStartedAt) return;

        const stoppedAt = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((stoppedAt - task.timerStartedAt) / 1000));
        const nextTrackedSeconds = normalizeNumber(task.trackedSeconds) + elapsedSeconds;
        const lastStoppedAt = new Date(stoppedAt).toLocaleString([], {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

        if (USE_API_DATA) {
            try {
                await apiPlaceholders.stopTaskTimer(task.id, {
                    stoppedAt: new Date(stoppedAt).toISOString(),
                    elapsedSeconds,
                    totalTrackedSeconds: nextTrackedSeconds,
                });
            } catch (apiError) {
                console.warn("Stop timer API holder is not connected yet. Stopping locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            row.id === task.id
                ? { ...row, trackedSeconds: nextTrackedSeconds, timerStartedAt: null, lastStoppedAt }
                : row
        )));
        setActiveTimerTaskId(null);
        setTimerTick(stoppedAt);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-6">
            <div className="grid grid-cols-4 gap-4">
                {[
                    ["Open Tasks", openTasks],
                    ["Completed Tasks", completedTasks],
                    ["In Review", reviewTasks],
                    ["Total Tracked Time", formatDuration(totalTrackedSeconds)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-300 bg-white px-5 py-6 text-center shadow-sm">
                        <div className="text-sm font-bold">{label}</div>
                        <div className={`mt-4 text-3xl ${label === "Total Tracked Time" ? "text-violet-700" : "text-black"}`}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-[380px_1fr] items-start gap-5">
                <div className="self-start rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-3 text-2xl font-bold">
                        <Clock size={26} /> Active Time Tracker
                    </h2>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        {activeTask ? (
                            <>
                                <div className="text-sm font-semibold text-slate-500">Currently Tracking</div>
                                <div className="mt-2 text-xl font-bold text-slate-900">{activeTask.taskName}</div>
                                <div className="mt-1 text-sm text-slate-600">{activeTask.project}</div>
                                <div className="mt-5 text-5xl font-bold text-violet-700">
                                    {formatDuration(getLiveTrackedSeconds(activeTask, timerTick))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => stopTimer(activeTask)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                                >
                                    <Square size={16} /> Stop Timer
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-slate-500">No Active Timer</div>
                                <div className="mt-3 text-4xl font-bold text-slate-900">00:00:00</div>
                                <p className="mt-3 text-sm text-slate-600">
                                    Select Start on any task below to begin tracking time.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Active Task ID</span>
                            <span>{activeTask?.id || "None"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Assigned To</span>
                            <span>{activeTask?.assignedTo || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Last Stop</span>
                            <span>{activeTask?.lastStoppedAt || "Not recorded"}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <h2 className="flex items-center gap-3 text-2xl font-bold">
                            <ListChecks size={26} /> Task Management
                        </h2>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => downloadTasksReport(taskRows)}
                                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                <Download size={16} /> Export Time Report
                            </button>

                            <button
                                type="button"
                                onClick={openNewTaskModal}
                                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                            >
                                <Plus size={16} /> New Task
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setTaskPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setTaskPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setTaskPage(1);
                            }}
                            options={statusOptions}
                        />
                    </div>

                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {TASK_COLUMNS.map((column) => (
                                <SortableHeader
                                    key={column.key}
                                    column={column}
                                    sortConfig={taskSort}
                                    onSort={handleTaskSort}
                                />
                            ))}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Timer</th>
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {visibleTaskRows.map((task) => {
                            const liveTask = taskRows.find((row) => row.id === task.id) || task;
                            const isAnotherTimerRunning = Boolean(activeTimerTaskId && activeTimerTaskId !== liveTask.id);

                            return (
                                <tr key={liveTask.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                        {liveTask.id}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <div className="font-semibold text-slate-900">{liveTask.taskName}</div>
                                        <div className="text-xs text-slate-500">Est. {liveTask.estimatedHours}h</div>
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.project}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.assignedTo}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.dueDate}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <PriorityBadge value={liveTask.priority} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">
                                        {formatDuration(getLiveTrackedSeconds(liveTask, timerTick))}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <Badge value={liveTask.status} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <TimerControl
                                            task={liveTask}
                                            currentTime={timerTick}
                                            onStart={startTimer}
                                            onStop={stopTimer}
                                            isAnotherTimerRunning={isAnotherTimerRunning}
                                        />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <RowActions
                                            onEdit={() => setTaskModal({ mode: "edit", data: liveTask })}
                                            onDelete={() => deleteTask(liveTask)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}

                        {visibleTaskRows.length === 0 && (
                            <tr>
                                <td colSpan={10} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                    No tasks found for the selected filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    <TableFooter
                        text={getRangeText(taskPage, TASKS_PAGE_SIZE, sortedTaskRows.length, "tasks")}
                        currentPage={taskPage}
                        totalPages={taskTotalPages}
                        onPageChange={setTaskPage}
                    />
                </div>
            </div>

            {taskModal && (
                <Modal
                    title={taskModal.mode === "create" ? "New Task" : "Edit Task"}
                    onClose={() => setTaskModal(null)}
                >
                    <TaskForm
                        initialTask={taskModal.data}
                        projectOptions={projectRowsForTasks()}
                        employeeOptions={employeeOptions.filter((option) => option !== "All Employees")}
                        onCancel={() => setTaskModal(null)}
                        onSave={saveTask}
                    />
                </Modal>
            )}
        </section>
    );
}

// Placeholder pages for tabs that are not yet built
function PlaceholderPage({ title }) {
    return (
        <section className="bg-slate-50 p-6">
            <div className="rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="mt-3 text-slate-600">
                    This page is ready for future content.
                </p>
            </div>
        </section>
    );
}

// Root app component
export default function App() {

    // Page state controls the sidebar tabs
    const [page, setPage] = useState("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <div className="flex">

                {/* Sidebar */}
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    activePage={page}
                    onPageChange={setPage}
                    onToggle={() => setIsSidebarCollapsed((value) => !value)}
                />

                {/* Main content */}
                <main className="min-w-0 flex-1">

                    {/* Top header */}
                    <Topbar onPageChange={setPage} />

                    {/* Render selected page */}
                    {page === "dashboard" && <Dashboard onPageChange={setPage} />}
                    {page === "projects" && <ProjectsAndAssignments />}
                    {page === "tasks" && <TaskManagementPage />}
                    {placeholderPages[page] && <PlaceholderPage title={placeholderPages[page]} />}
                </main>
            </div>
        </div>
    );
}
