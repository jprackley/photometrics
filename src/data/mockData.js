// -----------------------------------------------------------------------------
// Mock Data and Demo Defaults
// -----------------------------------------------------------------------------
// Centralizes sample records used when the application runs without a live API.
// Keeping demo data separate from page components makes the frontend easier to
// test, update, and eventually connect to database-backed records.
// -----------------------------------------------------------------------------

import { DEFAULT_USE_API_DATA } from "../services/api";

// Mock dashboard KPI values used when live API data is disabled.
const kpis = [
    ["Total Projects", "12"],
    ["Tasks Completed Today", "45"],
    ["Images Completed", "3,256"],
    ["Average Editing Time", "18m 42s"],
    ["Total Employee Hours", "128.5"],
    ["Efficiency", "87%"],
];

// Productivity chart data
// Mock productivity trend data for the dashboard line chart.
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
// Mock workflow distribution data for the dashboard pie chart.
const workflow = [
    { name: "Editing", value: 40, color: "#ef233c" },
    { name: "Culling", value: 25, color: "#f5c400" },
    { name: "Review", value: 15, color: "#2fb344" },
    { name: "Completed", value: 20, color: "#2563eb" },
];

// Employee activity table data
// Mock employee activity data for the manager dashboard table.
const employeeActivity = [
    ["John Doe", "Editing", "2h 15m", "In Progress"],
    ["Jane Doe", "Culling", "1h 05m", "Completed"],
    ["Terry Lee", "Review", "45m", "In Progress"],
    ["David Kim", "Editing", "3h 10m", "In Progress"],
    ["Luis Garcia", "Culling", "1h 30m", "Completed"],
];

// Project progress data
// Mock project progress data for the dashboard summary table.
const projectProgress = [
    ["Wedding - Smith", "1200", "900", "300", 75],
    ["Event - Johnson", "800", "650", "150", 81],
    ["Portrait - Sampson", "600", "450", "150", 75],
    ["Graduation - Hathaway", "1000", "800", "200", 80],
    ["Graduation - McDougal", "1000", "100", "900", 10],
];

// Projects table data
// Mock project records used by the Projects page while backend data is unavailable.
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
// Mock assignment records used by the Assignments page while backend data is unavailable.
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
// Mock task records, including saved timer values, used by the Tasks page.
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

// Mock employee records used by employee management, demo login creation, and employee dashboard views.
const employees = [
    {
        id: "EMP-1001",
        name: "John Freeman",
        role: "Photo Editor",
        email: "john.freeman@photometrics.com",
        phone: "(555) 210-1001",
        status: "Active",
        currentTask: "Photo Editing Batch 1",
        activeTasks: 3,
        completedToday: 12,
        hoursToday: 6.5,
        efficiency: 91,
        availability: "Available",
    },
    {
        id: "EMP-1002",
        name: "Larry Waymer",
        role: "Culling Specialist",
        email: "larry.waymer@photometrics.com",
        phone: "(555) 210-1002",
        status: "Active",
        currentTask: "Event Gallery Culling",
        activeTasks: 2,
        completedToday: 18,
        hoursToday: 5.75,
        efficiency: 88,
        availability: "Available",
    },
    {
        id: "EMP-1003",
        name: "Sarah Conner",
        role: "Retouching Specialist",
        email: "sarah.conner@photometrics.com",
        phone: "(555) 210-1003",
        status: "Review",
        currentTask: "Final Export Prep",
        activeTasks: 4,
        completedToday: 9,
        hoursToday: 6.25,
        efficiency: 84,
        availability: "In Review",
    },
    {
        id: "EMP-1004",
        name: "Susan Conner",
        role: "Color Correction",
        email: "susan.conner@photometrics.com",
        phone: "(555) 210-1004",
        status: "Active",
        currentTask: "Corporate Image Cleanup",
        activeTasks: 3,
        completedToday: 15,
        hoursToday: 7,
        efficiency: 93,
        availability: "Available",
    },
    {
        id: "EMP-1005",
        name: "John Doe",
        role: "Senior Editor",
        email: "john.doe@photometrics.com",
        phone: "(555) 210-1005",
        status: "On Break",
        currentTask: "Senior Portrait Retouching",
        activeTasks: 2,
        completedToday: 7,
        hoursToday: 4.5,
        efficiency: 79,
        availability: "Back at 2:30 PM",
    },
    {
        id: "EMP-1006",
        name: "Jane Doe",
        role: "Quality Reviewer",
        email: "jane.doe@photometrics.com",
        phone: "(555) 210-1006",
        status: "Active",
        currentTask: "Gallery Review",
        activeTasks: 5,
        completedToday: 21,
        hoursToday: 7.25,
        efficiency: 95,
        availability: "Available",
    },
    {
        id: "EMP-1007",
        name: "Terry Lee",
        role: "Review Lead",
        email: "terry.lee@photometrics.com",
        phone: "(555) 210-1007",
        status: "Offline",
        currentTask: "Review Queue",
        activeTasks: 1,
        completedToday: 4,
        hoursToday: 2.25,
        efficiency: 74,
        availability: "Offline",
    },
    {
        id: "EMP-1008",
        name: "David Kim",
        role: "Photo Editor",
        email: "david.kim@photometrics.com",
        phone: "(555) 210-1008",
        status: "Active",
        currentTask: "Graduation Review Set",
        activeTasks: 3,
        completedToday: 11,
        hoursToday: 6,
        efficiency: 86,
        availability: "Available",
    },
];



// Demo login accounts derived from the manager account and employee records.
const mockUsers = [
    {
        id: "USR-MGR-1000",
        name: "Manager",
        role: "Manager",
        accessLevel: "manager",
        email: "manager@photometrics.com",
        password: "demo123",
        employeeId: null,
        employeeName: null,
    },
    ...employees.map((employee) => ({
        id: `USR-${employee.id}`,
        name: employee.name,
        role: employee.role,
        accessLevel: "employee",
        email: employee.email,
        password: "demo123",
        employeeId: employee.id,
        employeeName: employee.name,
    })),
];

/**
 * Removes sensitive fields before storing the logged-in user in React state.
 */
function getPublicUser(user) {
    if (!user) return null;

    const { password, ...safeUser } = user;
    return safeUser;
}

/**
 * Looks up a demo user account by email for local front-end login testing.
 */
function findMockUserByEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return mockUsers.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}

// Default settings used to populate the Settings page before backend persistence is connected.
const settingsData = {
    company: {
        companyName: "PhotoMetrics Studio",
        supportEmail: "support@photometrics.com",
        phone: "(555) 210-9000",
        address: "San Diego, CA",
        timezone: "Pacific Time",
    },
    workflow: {
        defaultDueDays: 7,
        dailyImageGoal: 500,
        weeklyHourTarget: 32,
        autoAssignTasks: true,
        requireReviewBeforeComplete: true,
    },
    notifications: {
        dueDateAlerts: true,
        reviewQueueAlerts: true,
        productivityAlerts: true,
        emailDigest: "Daily",
        managerSummaryTime: "8:00 AM",
    },
    security: {
        sessionTimeout: 30,
        twoFactorRequired: false,
        roleManagementEnabled: true,
        auditLogging: true,
        dataRetentionDays: 365,
    },
    exportBackup: {
        defaultExportFormat: "CSV",
        backupFrequency: "Daily",
        allowCsvExports: true,
        lastBackup: "May 14, 2026 11:45 PM",
    },
    appearance: {
        theme: "Light",
        accentColor: "Violet",
        compactTables: false,
        showDashboardTips: true,
    },
    dataSource: {
        useDatabaseData: DEFAULT_USE_API_DATA,
    },
};

// Labels for routes that currently render informational placeholder pages.
const placeholderPages = {};

export {
    kpis,
    productivity,
    workflow,
    employeeActivity,
    projectProgress,
    projects,
    assignments,
    taskItems,
    employees,
    mockUsers,
    getPublicUser,
    findMockUserByEmail,
    settingsData,
    placeholderPages,
};
