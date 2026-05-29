// -----------------------------------------------------------------------------
// Dashboard Page.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Bell,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    EyeOff,
    Folder,
    ListChecks,
    Lock,
    Mail,
    MoreVertical,
    Pencil,
    Play,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Square,
    Trash2,
    Users,
} from "lucide-react";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip as ChartTooltip,
} from "chart.js";
import { Bar as ChartBar, Doughnut, Line as ChartLine } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    ChartTooltip,
);

import { Logo } from "../components/Layout";
import {
    API_ENDPOINTS,
    DEFAULT_USE_API_DATA,
    apiPlaceholders,
    getUseApiDataSetting,
    normalizeBackendUser,
    normalizeDashboardKpis,
    normalizeProjectRows,
    normalizeProductivityKpiRows,
    normalizeTaskRows,
    normalizeWorkflowKpiRows,
    normalizeEmployeeActivityKpiRows,
    normalizeProjectProgressKpiRows,
    saveUseApiDataSetting,
    unwrapApiPayload,
    useApiPlaceholder,
} from "../services/api";
import {
    assignments,
    employees,
    employeeActivity,
    findMockUserByEmail,
    getPublicUser,
    kpis,
    mockUsers,
    placeholderPages,
    productivity,
    projectProgress,
    projects,
    settingsData,
    taskItems,
    workflow,
} from "../data/mockData";
import {
    ASSIGNMENTS_PAGE_SIZE,
    ASSIGNMENT_COLUMNS,
    EMPLOYEES_PAGE_SIZE,
    EMPLOYEE_COLUMNS,
    PROJECTS_PAGE_SIZE,
    PROJECT_COLUMNS,
    TASKS_PAGE_SIZE,
    TASK_COLUMNS,
    buildPageNumbers,
    downloadEmployeesReport,
    downloadTextFile,
    downloadProjectsReport,
    downloadTasksReport,
    formatDuration,
    formatNumber,
    formatPercent,
    generateNextId,
    getLiveTrackedSeconds,
    getNextSort,
    getSortableValue,
    getRangeText,
    getTimerUserKey,
    getTaskTimerSession,
    getTotalPages,
    getUniqueOptions,
    normalizeNumber,
    normalizeTaskForTimers,
    paginateRows,
    sortRows,
} from "../utils/helpers";
import {
    ANALYTICS_COLORS,
    REPORT_ASSIGNMENT_COLUMNS,
    REPORT_EMPLOYEE_COLUMNS,
    REPORT_PROJECT_COLUMNS,
    REPORT_TIME_COLUMNS,
    buildOperationsReportData,
    downloadFullOperationsReport,
    downloadReportTable,
} from "../utils/reporting";
import {
    canManageContent,
    filterRowsByAccess,
    isAssignedToUser,
    rowMatchesSearch,
} from "../utils/accessControl";
import {
    Badge,
    PriorityBadge,
    ProgressBar,
    RowActions,
    FilterSelect,
    SortableHeader,
    TableFooter,
    FormField,
    TextInput,
    Modal,
} from "./sharedComponents";

// Default shape used when the active-projects KPI endpoint does not return
// a populated payload. Keeping the card shape consistent prevents the dashboard
// from rendering differently between mock data, empty API responses, and live API data.
const ACTIVE_PROJECTS_KPI = {
    key: "activeProjects",
    label: "Active Projects",
    value: 0,
    objects: [],
};


// Canonical workflow steps used by the dashboard chart. API and task records can
// use slightly different labels, so all incoming values are normalized to this list
// before the workflow distribution chart is rendered.
const WORKFLOW_STEPS = [
    "Import",
    "Cull",
    "Edit",
    "Quality Review",
    "Export",
    "Delivery",
    "Other",
];

// Common backend/mock-data variations mapped to the canonical workflow labels.
// This keeps the chart stable even if task categories are entered with different
// wording such as "editing", "review", or "delivered".
const WORKFLOW_STEP_ALIASES = {
    import: "Import",
    imported: "Import",
    cull: "Cull",
    culling: "Cull",
    edit: "Edit",
    editing: "Edit",
    "photo editing": "Edit",
    review: "Quality Review",
    "quality review": "Quality Review",
    export: "Export",
    exported: "Export",
    delivery: "Delivery",
    delivered: "Delivery",
    other: "Other",
};

/**
 * Normalizes a raw task/category/status value into one of the dashboard's
 * supported workflow stages.
 */
function getWorkflowStep(value) {
    const text = String(value || "").trim();
    if (!text) return "Other";

    const normalized = text.toLowerCase();
    return WORKFLOW_STEP_ALIASES[normalized]
        || WORKFLOW_STEPS.find((step) => step.toLowerCase() === normalized)
        || "Other";
}

/**
 * Builds workflow chart rows from the live task list so the dashboard can show
 * actual task distribution even when the dedicated workflow KPI endpoint is
 * unavailable or returns no data.
 */
function buildWorkflowRowsFromTasks(tasks = []) {
    const counts = WORKFLOW_STEPS.reduce((acc, step) => ({ ...acc, [step]: 0 }), {});

    tasks.forEach((task) => {
        const category = task.category && task.category !== "Other" ? task.category : null;
        const step = getWorkflowStep(
            category
            || task.taskType
            || task.taskName
            || task.type
            || task.workflowStep
            || task.status
        );
        counts[step] += 1;
    });

    return WORKFLOW_STEPS
        .map((step, index) => ({
            name: step,
            status: step,
            value: counts[step],
            count: counts[step],
            displayValue: String(counts[step]),
            color: ["#2563eb", "#f5c400", "#ef233c", "#2fb344", "#7c3aed", "#14b8a6", "#64748b"][index],
        }))
        .filter((row) => row.value > 0);
}

/**
 * Returns display labels for the current Monday-through-Sunday week used by the
 * productivity chart.
 */
function getCurrentWeekLabels() {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(today.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });
}

/**
 * Converts productivity KPI rows into a fixed seven-day chart series. Missing
 * values are normalized to zero so Chart.js always receives a complete dataset.
 */
function buildCurrentWeekProductivityRows(rows = []) {
    const labels = getCurrentWeekLabels();
    const values = labels.map((label, index) => {
        const source = rows[index];
        return normalizeNumber(source?.value ?? source?.productivity ?? source?.percent);
    });

    return labels.map((label, index) => ({
        day: label,
        name: label,
        value: values[index],
        color: rows[index]?.color || "#7c3aed",
    }));
}

/**
 * Removes common API wrapper objects while preserving direct KPI payloads. This
 * lets summary KPI cards support both simple values and structured API responses.
 */
function unwrapKpiPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;

    const wrapperKeys = new Set(["data", "success", "message", "meta", "metadata"]);
    const isWrappedPayload = payload.data !== undefined
        && Object.keys(payload).every((key) => wrapperKeys.has(key));

    if (isWrappedPayload) return payload.data;

    return payload;
}


/**
 * Converts a single KPI API response into the normalized card structure expected
 * by the dashboard KPI grid.
 */
function summaryKpiFromApi(payload, template, valueKeys = []) {
    const source = unwrapKpiPayload(payload);
    const keys = [...valueKeys, "active", "completed", "remaining", "total", "count", "value"];

    if (typeof source === "number" || typeof source === "string") {
        return [{ ...template, value: Number(source) || 0 }];
    }

    if (source && typeof source === "object" && !Array.isArray(source)) {
        const valueKey = keys.find((key) => source[key] !== undefined);
        const detailKey = ["projects", "tasks", "images", "employees", "objects", "items", "data"].find((key) => source[key] !== undefined);
        const details = Array.isArray(source[detailKey]) ? source[detailKey] : [];
        const rawValue = valueKey ? source[valueKey] : template.value;

        return [{
            ...template,
            key: source.key || template.key,
            label: source.label || source.name || source.title || template.label,
            value: Number(rawValue) || 0,
            rawValue,
            objects: details,
        }];
    }

    return [template];
}

/**
 * Legacy active-projects adapter retained for compatibility with older KPI
 * response shapes.
 */
function activeProjectsKpiFromApi(payload) {
    const source = unwrapKpiPayload(payload);

    if (typeof source === "number") {
        return [{ ...ACTIVE_PROJECTS_KPI, value: source }];
    }

    if (source && typeof source === "object" && !Array.isArray(source)) {
        return [{
            ...ACTIVE_PROJECTS_KPI,
            ...source,
            key: source.key || ACTIVE_PROJECTS_KPI.key,
            label: source.label || source.name || source.title || ACTIVE_PROJECTS_KPI.label,
        }];
    }

    return [ACTIVE_PROJECTS_KPI];
}

// Creates colored chart line segments
/**
 * Optional chart helper for rendering individually colored line segments.
 */
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
/**
 * Main dashboard view. Managers see team metrics; employees see only their own work queue and progress.
 */
function Dashboard({ onPageChange, currentUser, appSettings }) {
    // Access level controls whether the user sees manager-wide analytics or an
    // employee-safe view limited to their own tasks and project progress.
    const hasManagerAccess = canManageContent(currentUser);
    const currentUserId = currentUser?.userId || currentUser?.user_id || currentUser?.id || currentUser?.employeeId;
    const currentUserPathId = currentUserId ? encodeURIComponent(currentUserId) : "";
    // Employees request scoped dashboard data when possible, while managers use
    // the unscoped endpoints so they can review team-wide activity.
    const workflowEndpoint = currentUserPathId ? `${API_ENDPOINTS.dashboard.workflow}/${currentUserPathId}` : null;
    const employeeActivityEndpoint = !hasManagerAccess && currentUserPathId
        ? `${API_ENDPOINTS.dashboard.employeeActivity}/${currentUserPathId}`
        : API_ENDPOINTS.dashboard.employeeActivity;

    // KPI hooks share the same API/mock-data bridge so the dashboard can run in
    // demo mode or live API mode without changing component code.
    const { data: activeProjectsKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.projects.active, kpis.slice(0, 1), {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "activeProjects", label: "Active Projects", value: 0, objects: [] }, ["active"]),
    });
    const { data: completedProjectsKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.projects.completed, [], {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "completedProjects", label: "Completed Projects", value: 0, objects: [] }, ["completed"]),
    });
    const { data: remainingTasksKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.tasks.remaining, [], {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "remainingTasks", label: "Remaining Tasks", value: 0, objects: [] }, ["remaining"]),
    });
    const { data: completedImagesKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.images.completed, [], {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "completedImages", label: "Completed Images", value: 0, objects: [] }, ["completed"]),
    });
    const { data: totalEmployeesKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.employees.total, [], {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "totalEmployees", label: "Total Employees", value: 0, objects: [] }, ["total"]),
    });
    const { data: activeEmployeesKpi } = useApiPlaceholder(API_ENDPOINTS.kpi.employees.active, [], {
        unwrap: false,
        transformPayload: (payload) => summaryKpiFromApi(payload, { key: "activeEmployees", label: "Active Employees", value: 0, objects: [] }, ["active"]),
    });
    const { data: productivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.productivity, productivity, {
        transformPayload: normalizeProductivityKpiRows,
    });
    const { data: workflowData } = useApiPlaceholder(workflowEndpoint, workflow, {
        transformPayload: normalizeWorkflowKpiRows,
    });
    const { data: employeeActivityData } = useApiPlaceholder(employeeActivityEndpoint, employeeActivity, {
        transformPayload: normalizeEmployeeActivityKpiRows,
    });
    const { data: projectProgressData } = useApiPlaceholder(API_ENDPOINTS.dashboard.projectProgress, projectProgress, {
        transformPayload: normalizeProjectProgressKpiRows,
    });
    const { data: liveTaskData } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });
    const { data: liveProjectData } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const showDashboardTips = appSettings?.appearance?.showDashboardTips !== false;
    const employeeName = currentUser?.employeeName || currentUser?.name;
    const employeeActivityRows = Array.isArray(employeeActivityData) ? employeeActivityData : [];
    const projectProgressRows = Array.isArray(projectProgressData) ? projectProgressData : [];
    const rawWorkflowRows = Array.isArray(workflowData) ? workflowData : [];
    const rawProductivityRows = Array.isArray(productivityData) ? productivityData : [];
    // Memoized chart inputs prevent unnecessary Chart.js re-renders while users
    // navigate or update filters elsewhere in the application.
    const productivityRows = useMemo(() => buildCurrentWeekProductivityRows(rawProductivityRows), [rawProductivityRows]);
    const productivityChartData = useMemo(() => ({
        labels: productivityRows.map((row) => row.day || row.label || row.name || "Metric"),
        datasets: [
            {
                label: "Productivity %",
                data: productivityRows.map((row) => normalizeNumber(row.value ?? row.productivity ?? row.percent)),
                borderColor: "#7c3aed",
                backgroundColor: "rgba(124, 58, 237, 0.14)",
                pointBackgroundColor: productivityRows.map((row) => row.color || "#7c3aed"),
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.35,
            },
        ],
    }), [productivityRows]);
    const productivityChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (context) => `${context.parsed.y}% productivity` } },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 25, callback: (value) => `${value}%` },
                grid: { color: "#e2e8f0", borderDash: [4, 4] },
            },
            x: { grid: { display: false } },
        },
    }), []);
    // Normalize task rows before deriving employee assignments, workflow counts,
    // tracked-time totals, and employee-only dashboard summaries.
    const taskRows = Array.isArray(liveTaskData) ? liveTaskData.map(normalizeTaskForTimers) : taskItems.map(normalizeTaskForTimers);
    const workflowRows = useMemo(() => {
        const rowsFromTasks = buildWorkflowRowsFromTasks(taskRows);
        return rowsFromTasks.length > 0 ? rowsFromTasks : rawWorkflowRows;
    }, [rawWorkflowRows, taskRows]);
    const workflowChartData = useMemo(() => ({
        labels: workflowRows.map((row) => row.name || "Workflow"),
        datasets: [
            {
                data: workflowRows.map((row) => normalizeNumber(row.value)),
                backgroundColor: workflowRows.map((row) => row.color || "#7c3aed"),
                borderColor: "#ffffff",
                borderWidth: 4,
            },
        ],
    }), [workflowRows]);
    const workflowChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed}%` } },
        },
    }), []);
    // Managers can see the full team activity feed. Employees are restricted to
    // rows matching their own display name to avoid exposing other users' work.
    const visibleEmployeeActivityData = hasManagerAccess
        ? employeeActivityRows
        : employeeActivityRows.filter((row) => row[0] === employeeName);
    const projectRows = Array.isArray(liveProjectData) ? liveProjectData : projects;
    // Employee dashboard panels are derived from assigned tasks so the private
    // view remains consistent with the Tasks page and timer logic.
    const assignedTasks = taskRows.filter((task) => isAssignedToUser(task, currentUser));
    const assignedProjectNames = Array.from(new Set(
        assignedTasks
            .map((task) => task.project)
            .filter(Boolean)
    ));
    const visibleProjectProgressData = hasManagerAccess
        ? projectProgressRows
        : projectProgressRows.filter((row) => assignedProjectNames.includes(row[0]));
    const assignedAssignments = assignedTasks.map((task) => ({
        id: task.id,
        project: task.project,
        taskType: task.taskName || task.category,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
    }));
    // Manager KPI cards come from backend summary endpoints. Employee KPI cards
    // are calculated locally from the user's assigned tasks to enforce data scope.
    const managerKpiCards = normalizeDashboardKpis([
        ...(Array.isArray(activeProjectsKpi) ? activeProjectsKpi : []),
        ...(Array.isArray(completedProjectsKpi) ? completedProjectsKpi : []),
        ...(Array.isArray(remainingTasksKpi) ? remainingTasksKpi : []),
        ...(Array.isArray(completedImagesKpi) ? completedImagesKpi : []),
        ...(Array.isArray(totalEmployeesKpi) ? totalEmployeesKpi : []),
        ...(Array.isArray(activeEmployeesKpi) ? activeEmployeesKpi : []),
    ], kpis);
    const employeeKpiCards = normalizeDashboardKpis([
        { key: "myAssignedTasks", label: "My Assigned Tasks", value: assignedTasks.length, objects: assignedTasks },
        { key: "myOpenTasks", label: "My Open Tasks", value: assignedTasks.filter((task) => task.status !== "Completed").length, objects: assignedTasks.filter((task) => task.status !== "Completed") },
        { key: "myCompletedTasks", label: "My Completed Tasks", value: assignedTasks.filter((task) => task.status === "Completed").length, objects: assignedTasks.filter((task) => task.status === "Completed") },
        { key: "myReviewTasks", label: "My Review Tasks", value: assignedTasks.filter((task) => task.category === "Quality Review").length, objects: assignedTasks.filter((task) => task.category === "Quality Review") },
        { key: "myTrackedTime", label: "My Tracked Time", value: assignedTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0), displayValue: formatDuration(assignedTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0)), objects: assignedTasks },
        { key: "accessLevel", label: "Access Level", value: "Employee" },
    ]);
    const visibleKpis = hasManagerAccess ? managerKpiCards : employeeKpiCards;

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">

            {/* Summary KPI cards for the current role-specific dashboard view. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {visibleKpis.map((card) => (
                    <div
                        key={card.id || card.label}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-5 text-center shadow-sm sm:px-5 sm:py-7"
                    >
                        <div className="text-sm font-bold">{card.label}</div>

                        {/* Highlight efficiency in green */}
                        <div
                            className={`mt-6 text-4xl ${
                                card.label === "Efficiency"
                                    ? "text-green-700"
                                    : "text-black"
                            }`}
                        >
                            {card.value}
                        </div>

                        {card.objects?.length > 0 && (
                            <div className="mt-3 text-xs font-semibold text-slate-500">
                                {card.objects.length} detail {card.objects.length === 1 ? "record" : "records"}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showDashboardTips && (
                <div className="pm-dashboard-tip rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 shadow-sm">
                    Dashboard tip: use the page search and sidebar sections to quickly narrow projects, employees, tasks, reports, and analytics.
                </div>
            )}

            {hasManagerAccess ? (
                <>
            {/* Manager analytics charts. Employee users receive a private work-queue view instead. */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.07fr_0.93fr]">

                {/* Productivity chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                        Employee Productivity
                    </h2>

                    <div className="h-[230px]">
                        <ChartLine data={productivityChartData} options={productivityChartOptions} />
                    </div>
                </div>

                {/* Workflow pie chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                        Workflow Distribution
                    </h2>

                    <div className="flex h-[230px] items-center justify-center gap-16">

                        {/* Chart.js doughnut chart */}
                        <div className="h-full w-2/5 min-w-[180px]">
                            <Doughnut data={workflowChartData} options={workflowChartOptions} />
                        </div>

                        {/* Legend */}
                        <div className="w-64 space-y-5">
                            {workflowRows.map((item) => (
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
                                        {item.displayValue ?? `${item.value}%`}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
                </>
            ) : (
                <EmployeeDashboardInsights
                    assignedTasks={assignedTasks}
                    assignedAssignments={assignedAssignments}
                    onPageChange={onPageChange}
                />
            )}

            {hasManagerAccess ? (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <EmployeeActivityPanel
                        rows={visibleEmployeeActivityData}
                        onViewAll={() => onPageChange?.("employees")}
                    />
                    <ProjectProgressPanel
                        rows={visibleProjectProgressData}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <EmployeeAssignmentsPanel
                        rows={assignedAssignments}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                    <ProjectProgressPanel
                        rows={visibleProjectProgressData}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                </div>
            )}
        </section>
    );
}


// Employee-only dashboard cards that do not reveal other employees' productivity data
/**
 * Employee-only dashboard section that avoids exposing other employees' productivity data.
 */
function EmployeeDashboardInsights({ assignedTasks = [], assignedAssignments = [], onPageChange }) {
    // All metrics in this section are calculated from the current user's assigned
    // tasks only, preventing employee users from seeing team-wide productivity data.
    const openTasks = assignedTasks.filter((task) => task.status !== "Completed");
    const completedTasks = assignedTasks.filter((task) => task.status === "Completed");
    const reviewTasks = assignedTasks.filter((task) => task.category === "Quality Review");
    const highPriorityTasks = assignedTasks.filter((task) => task.priority === "High");
    const completionRate = assignedTasks.length
        ? Math.round((completedTasks.length / assignedTasks.length) * 100)
        : 0;
    const totalEstimatedHours = assignedTasks.reduce((total, task) => total + normalizeNumber(task.estimatedHours), 0);
    const totalTrackedSeconds = assignedTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0);
    const nextTasks = [...openTasks]
        .sort((leftTask, rightTask) => getSortableValue(leftTask, "dueDate") - getSortableValue(rightTask, "dueDate"))
        .slice(0, 4);
    const statusCounts = ["Assigned", "To-Do", "In Progress", "Paused", "Completed", "Cancelled"].map((status) => ({
        status,
        count: assignedTasks.filter((task) => task.status === status).length,
    }));

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.07fr_0.93fr]">
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold sm:text-2xl">My Work Queue</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your next assigned tasks only. Other employees' assignments are hidden.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onPageChange?.("tasks")}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                        Open My Tasks
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Open</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">{openTasks.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">High Priority</div>
                        <div className="mt-2 text-3xl font-bold text-red-700">{highPriorityTasks.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Ready For Review</div>
                        <div className="mt-2 text-3xl font-bold text-amber-700">{reviewTasks.length}</div>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[620px] w-full border-collapse text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="border border-slate-200 px-3 py-2 text-left">Task</th>
                            <th className="border border-slate-200 px-3 py-2 text-left">Project</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Due</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Priority</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {nextTasks.length > 0 ? nextTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50">
                                <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">{task.taskName}</td>
                                <td className="border border-slate-200 px-3 py-2">{task.project}</td>
                                <td className="border border-slate-200 px-3 py-2 text-center">{task.dueDate}</td>
                                <td className="border border-slate-200 px-3 py-2 text-center"><PriorityBadge value={task.priority} /></td>
                                <td className="border border-slate-200 px-3 py-2 text-center"><Badge value={task.status} /></td>
                            </tr>
                        )) : (
                            <tr>
                                <td className="border border-slate-200 px-3 py-6 text-center text-slate-500" colSpan={5}>
                                    No open tasks assigned to you right now.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold sm:text-2xl">My Progress Snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Private view of your workload, completion rate, and tracked time.
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                            <span>Completion Rate</span>
                            <span>{completionRate}%</span>
                        </div>
                        <ProgressBar value={completionRate} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Tracked Time</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{formatDuration(totalTrackedSeconds)}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Estimated Hours</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{totalEstimatedHours}</div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200">
                        {statusCounts.map((item) => (
                            <div key={item.status} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                                <span className="font-semibold text-slate-700">{item.status}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                        You have {assignedAssignments.length} assignment records connected to your login.
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Shows the current employee's most recent assignment records.
 */
function EmployeeAssignmentsPanel({ rows = [], onViewAll }) {
    // Show a concise snapshot on the dashboard while keeping the full assignment
    // workflow available through the linked project/task pages.
    const visibleRows = rows.slice(0, 5);

    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">My Assignments</h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[620px] w-full border-collapse text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                    <tr>
                        {[
                            "Assignment",
                            "Project",
                            "Task Type",
                            "Due Date",
                            "Priority",
                            "Status",
                        ].map((heading) => (
                            <th key={heading} className="border border-slate-200 px-3 py-2 text-left font-bold">
                                {heading}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleRows.length > 0 ? visibleRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-200 px-3 py-2 font-semibold">{assignment.id}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.project}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.taskType}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.dueDate}</td>
                            <td className="border border-slate-200 px-3 py-2"><PriorityBadge value={assignment.priority} /></td>
                            <td className="border border-slate-200 px-3 py-2"><Badge value={assignment.status} /></td>
                        </tr>
                    )) : (
                        <tr>
                            <td className="border border-slate-200 px-3 py-6 text-center text-slate-500" colSpan={6}>
                                No assignments are currently assigned to your login.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View my assignments →
                </button>
            )}
        </div>
    );
}

// Employee activity table
/**
 * Displays manager-facing employee activity in a compact table.
 */
function EmployeeActivityPanel({ rows = employeeActivity, onViewAll }) {
    // Keep the activity table paginated so large teams do not make the dashboard
    // page excessively long or slow to scan.
    const pageSize = 8;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = getTotalPages(rows.length, pageSize);
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const visibleRows = paginateRows(rows, safeCurrentPage, pageSize);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">
                Employee Activity
            </h2>

            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Employee", "Activity", "Updated", "Status"]
                        .map((h) => (
                            <th
                                key={h}
                                className="break-words border border-slate-300 bg-white px-1.5 py-2 font-bold sm:px-2"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {visibleRows.map((row, index) => (
                    <tr key={`${row[0]}-${row[1]}-${row[2]}-${index}`}>
                        <td className="break-words border border-slate-300 px-1.5 py-2 sm:px-3">
                            {row[0]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[1]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[2]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            <Badge value={row[3]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View all employees →
                </button>
            )}

            <TableFooter
                text={getRangeText(safeCurrentPage, pageSize, rows.length, "activity records")}
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

// Project progress table
/**
 * Displays project completion metrics with progress bars.
 */
function ProjectProgressPanel({ rows = projectProgress, onViewAll }) {
    // Project progress is shown as both a stacked chart and a detail table so
    // managers can quickly compare completion and remaining workload.
    const pageSize = 6;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = getTotalPages(rows.length, pageSize);
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const visibleRows = paginateRows(rows, safeCurrentPage, pageSize);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const projectChartData = useMemo(() => ({
        labels: visibleRows.map((row) => row[0]),
        datasets: [
            {
                label: "Completed Tasks",
                data: visibleRows.map((row) => normalizeNumber(row[2])),
                backgroundColor: "rgba(34, 197, 94, 0.72)",
                borderColor: "#16a34a",
                borderWidth: 1,
            },
            {
                label: "Remaining Tasks",
                data: visibleRows.map((row) => normalizeNumber(row[3])),
                backgroundColor: "rgba(124, 58, 237, 0.68)",
                borderColor: "#7c3aed",
                borderWidth: 1,
            },
        ],
    }), [visibleRows]);
    const projectChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    afterBody: (items) => {
                        const index = items?.[0]?.dataIndex ?? 0;
                        const progress = normalizeNumber(visibleRows[index]?.[4]);
                        return `Progress: ${progress}%`;
                    },
                },
            },
        },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
        },
    }), [visibleRows]);

    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">
                Project Progress
            </h2>

            <div className="mb-5 h-[260px]">
                <ChartBar data={projectChartData} options={projectChartOptions} />
            </div>

            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Project", "Total Tasks", "Completed", "Remaining", "Progress"]
                        .map((h) => (
                            <th
                                key={h}
                                className="break-words border border-slate-300 bg-white px-1.5 py-2 font-bold sm:px-2"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {visibleRows.map((row) => (
                    <tr key={row[0]}>
                        <td className="break-words border border-slate-300 px-1.5 py-2 sm:px-3">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[3]}
                        </td>

                        {/* Progress bar */}
                        <td className="border border-slate-300 px-1.5 py-2 sm:px-3">
                            <ProgressBar value={row[4]} compact />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View all projects →
                </button>
            )}

            <TableFooter
                text={getRangeText(safeCurrentPage, pageSize, rows.length, "projects")}
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}


// Reports page
/**
 * Small metric card used by the Reports and Analytics sections.
 */
function InsightCard({ label, value, note, icon: Icon = BarChart3 }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-bold text-slate-600">{label}</div>
                    <div className="mt-3 text-3xl font-bold text-slate-950">{value}</div>
                </div>
                <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                    <Icon size={24} />
                </div>
            </div>
            {note && <p className="mt-3 text-sm text-slate-500">{note}</p>}
        </div>
    );
}

/**
 * Displays deadline risk in report tables.
 */
function DueStatusBadge({ value }) {
    const style =
        value === "Overdue"
            ? "bg-red-100 text-red-700"
            : value === "Due Soon"
                ? "bg-orange-100 text-orange-700"
                : value === "Upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : value === "Complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700";

    return <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>{value}</span>;
}

export {
    Dashboard,
};
